import { z } from "zod";
import { apiUser, body, handler, HttpError, oid, ok, ownedProject } from "@/lib/api";
import { Project, WorkSession, type IWorkSession } from "@/lib/models";

type Ctx = { params: Promise<{ id: string; sessionId: string }> };

const Patch = z.object({
  end: z.boolean().optional(),
  summary: z.string().max(4000).optional(),
  files: z.array(z.string().trim().max(300)).max(50).optional(),
  blockers: z.string().max(2000).optional(),
  nextStep: z.string().max(2000).optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

export const PATCH = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const { id, sessionId } = await ctx.params;
  const p = await ownedProject(a, id);
  const input = await body(req, Patch);
  const s = await WorkSession.findOne({ _id: oid(sessionId), projectId: p._id }).lean<IWorkSession>();
  if (!s) throw new HttpError(404, "Session not found");
  const { end, startedAt, endedAt, ...rest } = input;
  const set: Record<string, unknown> = { ...rest };
  if (rest.files) set.files = rest.files.filter(Boolean);
  if (startedAt) set.startedAt = new Date(startedAt);
  if (endedAt) set.endedAt = new Date(endedAt);
  if (end && !s.endedAt) set.endedAt = new Date();
  await WorkSession.updateOne({ _id: s._id }, { $set: set });
  await Project.updateOne({ _id: p._id }, { $set: { lastWorkedAt: new Date() } });
  return ok({ ok: true });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const { id, sessionId } = await ctx.params;
  const p = await ownedProject(a, id);
  await WorkSession.deleteOne({ _id: oid(sessionId), projectId: p._id });
  return ok({ ok: true });
});
