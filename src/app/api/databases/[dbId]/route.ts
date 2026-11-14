import { apiUser, handler, HttpError, oid, ok } from "@/lib/api";
import { decrypt } from "@/lib/crypto";
import { testDatabase } from "@/lib/dbtest";
import { DatabaseConnection, type IDatabaseConnection } from "@/lib/models";

type Ctx = { params: Promise<{ dbId: string }> };

/** Re-test a saved connection. The URL is decrypted server-side only. */
export const POST = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const { dbId } = await ctx.params;
  const c = await DatabaseConnection.findOne({ _id: oid(dbId), userId: a.user._id }).lean<IDatabaseConnection>();
  if (!c) throw new HttpError(404, "Not found");
  const r = await testDatabase(c.provider, decrypt(c.urlEnc));
  await DatabaseConnection.updateOne(
    { _id: c._id },
    { $set: { lastTest: r.ok ? { ok: true, ms: r.ms, meta: r.meta, at: new Date() } : { ok: false, ms: 0, meta: r.error, at: new Date() } } }
  );
  return ok(r);
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const { dbId } = await ctx.params;
  await DatabaseConnection.deleteOne({ _id: oid(dbId), userId: a.user._id });
  return ok({ ok: true });
});
