import type { Metadata } from "next";
import { mfaMinutesAgo, requireUser } from "@/lib/auth";
import { loadProject } from "@/lib/data";
import { AuditLog, Secret, Service, type IAuditLog, type ISecret, type IService } from "@/lib/models";
import { rotationState, toRow } from "@/lib/vault";
import { Vault } from "./vault";

export const metadata: Metadata = { title: "Environment vault" };

export default async function VaultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, session } = await requireUser();
  const p = await loadProject(user._id, id);
  const [secrets, logs, services] = await Promise.all([
    Secret.find({ projectId: p._id }).sort({ key: 1 }).lean<ISecret[]>(),
    AuditLog.find({ projectId: p._id }).sort({ createdAt: -1 }).limit(8).lean<IAuditLog[]>(),
    Service.find({ projectId: p._id }).select("name").lean<IService[]>(),
  ]);
  const overdue = secrets
    .map((s) => ({ s, r: rotationState(s) }))
    .filter((x) => x.r.tone === "due")
    .map((x) => ({ id: String(x.s._id), key: x.s.key, environment: x.s.environment, age: x.r.age, policy: x.s.rotationDays! }));
  return (
    <Vault
      projectId={id}
      projectName={p.name}
      secrets={secrets.map(toRow)}
      audit={logs.map((l) => ({ id: String(l._id), action: l.action, target: l.target, meta: l.meta, at: new Date(l.createdAt).toISOString() }))}
      overdue={overdue}
      services={services.map((s) => s.name)}
      mfaAgoMin={mfaMinutesAgo(session)}
    />
  );
}
