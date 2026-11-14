import { aiConfigured, resumeSuggestion } from "@/lib/ai";
import { apiUser, handler, ok, ownedProject } from "@/lib/api";
import { Project, Task, WorkSession, type ITask, type IWorkSession } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

/** AI "recommended next step" for Resume My Work. Cached until the underlying records change. */
export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  if (!aiConfigured()) return ok({ suggestion: null, reason: "AI not configured" });
  const [last, open] = await Promise.all([
    WorkSession.findOne({ projectId: p._id, endedAt: { $ne: null } }).sort({ startedAt: -1 }).lean<IWorkSession>(),
    Task.find({ projectId: p._id, status: { $ne: "completed" } }).sort({ updatedAt: -1 }).limit(12).lean<ITask[]>(),
  ]);
  if (!last && !open.length) return ok({ suggestion: null, reason: "Log a session or add tasks to get suggestions." });
  try {
    const r = await resumeSuggestion(p, last, open);
    if (!r.cached) await Project.updateOne({ _id: p._id }, { $set: { resume: { text: r.text, basedOn: r.basedOn, sourceHash: r.hash, at: new Date() } } });
    return ok({ suggestion: { text: r.text, basedOn: r.basedOn } });
  } catch (e) {
    console.error("[resume]", e);
    return ok({ suggestion: p.resume ? { text: p.resume.text, basedOn: p.resume.basedOn } : null, reason: "AI is busy right now." });
  }
});
