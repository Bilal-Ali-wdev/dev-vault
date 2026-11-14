import "server-only";
import { promises as dns } from "dns";
import net from "net";
import mongoose from "mongoose";
import { Client } from "pg";
import type { DbProvider } from "./models";

const TIMEOUT = 5000;

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

async function assertPublicHost(host: string, srv: boolean) {
  const targets: string[] = [];
  if (srv) {
    const recs = await dns.resolveSrv(`_mongodb._tcp.${host}`);
    targets.push(...recs.map((r) => r.name));
  } else targets.push(host);
  for (const t of targets) {
    const addrs = net.isIP(t) ? [{ address: t }] : await dns.lookup(t, { all: true });
    for (const a of addrs) {
      if (isPrivateIp(a.address)) throw new Error("Private and internal network addresses can't be tested from DevVault.");
    }
  }
}

function hint(url: string) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username ? u.username + ":••••@" : ""}${u.host}${u.pathname !== "/" ? u.pathname : ""}`;
  } catch {
    return "";
  }
}

export function urlHint(url: string) {
  return hint(url);
}

export async function testDatabase(provider: DbProvider, url: string): Promise<{ ok: true; ms: number; meta: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid connection URL." };
  }
  const isMongo = provider === "mongodb";
  const okProto = isMongo ? ["mongodb:", "mongodb+srv:"] : ["postgres:", "postgresql:"];
  if (!okProto.includes(parsed.protocol)) {
    return { ok: false, error: isMongo ? "MongoDB URLs start with mongodb:// or mongodb+srv://" : "Postgres URLs start with postgresql://" };
  }
  try {
    const host = parsed.hostname.split(",")[0];
    await assertPublicHost(host, parsed.protocol === "mongodb+srv:");
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message.includes("Private") ? e.message : "Couldn't resolve the database host." };
  }

  const started = Date.now();
  if (isMongo) {
    const conn = mongoose.createConnection(url, { serverSelectionTimeoutMS: TIMEOUT, connectTimeoutMS: TIMEOUT });
    try {
      await conn.asPromise();
      const info = await conn.db!.admin().command({ buildInfo: 1 }).catch(() => null);
      return { ok: true, ms: Date.now() - started, meta: info?.version ? `MongoDB ${String(info.version).split(".").slice(0, 2).join(".")}` : "MongoDB" };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    } finally {
      await conn.close().catch(() => {});
    }
  }

  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: TIMEOUT,
    query_timeout: TIMEOUT,
    ssl: parsed.searchParams.get("sslmode") === "disable" ? false : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const r = await client.query("show server_version");
    const v = String(r.rows[0]?.server_version || "").split(".")[0];
    return { ok: true, ms: Date.now() - started, meta: v ? `Postgres ${v}` : "Postgres" };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  } finally {
    await client.end().catch(() => {});
  }
}

function friendly(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/auth|password/i.test(m)) return "Authentication failed — check the username and password.";
  if (/timed? ?out|ETIMEDOUT|Server selection/i.test(m)) return "Connection timed out after 5 seconds. Check the host and your IP allowlist.";
  if (/ENOTFOUND|getaddrinfo/i.test(m)) return "Couldn't resolve the database host.";
  if (/ECONNREFUSED/i.test(m)) return "Connection refused by the server.";
  return "Couldn't connect to the database.";
}
