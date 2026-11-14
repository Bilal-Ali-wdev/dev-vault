import { z } from "zod";
import { apiUser, body, clientInfo, handler, HttpError, oid, ok, ownedProject, requireRecentMfa } from "@/lib/api";
import { decrypt } from "@/lib/crypto";
import { Secret, type ISecret } from "@/lib/models";
import { audit } from "@/lib/vault";

type Ctx = { params: Promise<{ id: string; secretId: string }> };

/** Returns a decrypted value. Requires an MFA check within the last 15 minutes. Audit-logged. */
export const POST = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  requireRecentMfa(a);
  const { id, secretId } = await ctx.params;
  const p = await ownedProject(a, id);
  const { purpose } = await body(req, z.object({ purpose: z.enum(["reveal", "copy"]) }));
  const s = await Secret.findOne({ _id: oid(secretId), projectId: p._id }).lean<ISecret>();
  if (!s) throw new HttpError(404, "Secret not found");
  if (!s.valueEnc) throw new HttpError(400, "No value stored yet.");
  await audit(a.user._id, p._id, purpose === "copy" ? "Copied" : "Revealed", s.key, clientInfo(req));
  return ok({ value: decrypt(s.valueEnc) }, { headers: { "Cache-Control": "no-store" } });
});
