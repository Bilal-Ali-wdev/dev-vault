import { apiUser, handler, ok } from "@/lib/api";
import { Project, WorkSession, type IProject, type IWorkSession } from "@/lib/models";

export const GET = handler(async () => {
  const a = await apiUser();
  const s = await WorkSession.findOne({ userId: a.user._id, endedAt: null }).lean<IWorkSession>();
  if (!s) return ok({ session: null });
  const p = await Project.findById(s.projectId).select("name color").lean<IProject>();
  return ok({ session: { id: String(s._id), projectId: String(s.projectId), projectName: p?.name ?? "Project", color: p?.color ?? "#0A8D7C", startedAt: s.startedAt, number: s.number } });
});
