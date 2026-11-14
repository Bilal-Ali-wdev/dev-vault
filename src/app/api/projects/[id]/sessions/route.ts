import { apiUser, handler, HttpError, ok, ownedProject } from "@/lib/api";
import { Project, WorkSession, type IProject, type IWorkSession } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const sessions = await WorkSession.find({ projectId: p._id }).sort({ startedAt: -1 }).limit(100).lean<IWorkSession[]>();
  return ok({ sessions });
});

/** Start a session. Only one active session per user at a time. */
export const POST = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const active = await WorkSession.findOne({ userId: a.user._id, endedAt: null }).lean<IWorkSession>();
  if (active) throw new HttpError(409, "You already have a session running. End it first.");
  const up = await Project.findOneAndUpdate({ _id: p._id }, { $inc: { sessionCounter: 1 }, $set: { lastWorkedAt: new Date() } }, { new: true }).lean<IProject>();
  const s = await WorkSession.create({ userId: a.user._id, projectId: p._id, number: up!.sessionCounter, startedAt: new Date() });
  return ok({ session: s.toObject() }, { status: 201 });
});
