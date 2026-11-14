import { apiUser, handler, ok, ownedProject } from "@/lib/api";
import { AuditLog, type IAuditLog } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const logs = await AuditLog.find({ projectId: p._id }).sort({ createdAt: -1 }).limit(50).lean<IAuditLog[]>();
  return ok({ logs: logs.map((l) => ({ id: String(l._id), action: l.action, target: l.target, meta: l.meta, at: l.createdAt })) });
});
