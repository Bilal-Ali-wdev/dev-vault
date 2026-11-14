import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadProject } from "@/lib/data";
import { WorkSession, type IWorkSession } from "@/lib/models";
import { SessionList, type SessionDTO } from "./session-list";

export const metadata: Metadata = { title: "Sessions" };

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const [sessions, running] = await Promise.all([
    WorkSession.find({ projectId: p._id }).sort({ startedAt: -1 }).limit(100).lean<IWorkSession[]>(),
    WorkSession.findOne({ userId: user._id, endedAt: null }).select("projectId").lean<IWorkSession>(),
  ]);
  const dto: SessionDTO[] = sessions.map((s) => ({
    id: String(s._id),
    number: s.number,
    startedAt: new Date(s.startedAt).toISOString(),
    endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : null,
    summary: s.summary,
    files: s.files,
    blockers: s.blockers,
    nextStep: s.nextStep,
  }));
  return <SessionList projectId={id} sessions={dto} otherRunning={!!running && String(running.projectId) !== id} />;
}
