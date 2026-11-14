import { z } from "zod";
import { apiUser, body, handler, ok, ownedProject, requireRecentMfa } from "@/lib/api";
import { decrypt } from "@/lib/crypto";
import { ENVIRONMENTS, Secret, type ISecret } from "@/lib/models";
import { audit } from "@/lib/vault";

type Ctx = { params: Promise<{ id: string }> };

function quote(v: string) {
  return /^[A-Za-z0-9_./:@-]*$/.test(v) ? v : `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

export const POST = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  requireRecentMfa(a);
  const p = await ownedProject(a, (await ctx.params).id);
  const { environment } = await body(req, z.object({ environment: z.enum(ENVIRONMENTS) }));
  const secrets = await Secret.find({ projectId: p._id, environment }).sort({ key: 1 }).lean<ISecret[]>();
  const lines = [`# ${p.name} · ${environment} · exported ${new Date().toISOString()}`];
  for (const s of secrets) lines.push(`${s.key}=${s.valueEnc ? quote(decrypt(s.valueEnc)) : ""}`);
  await audit(a.user._id, p._id, "Exported", environment[0].toUpperCase() + environment.slice(1), "confirmed with MFA");
  return ok({ filename: `.env.${environment}`, content: lines.join("\n") + "\n" }, { headers: { "Cache-Control": "no-store" } });
});
