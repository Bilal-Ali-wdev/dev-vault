import "server-only";
import type { Types } from "mongoose";
import { AuditLog, type IAuditLog, type ISecret } from "./models";
import { daysSince, shortDate } from "./format";

export async function audit(userId: Types.ObjectId, projectId: Types.ObjectId | null, action: IAuditLog["action"], target: string, meta = "") {
  await AuditLog.create({ userId, projectId, action, target, meta });
}

export type SecretRow = {
  id: string;
  key: string;
  description: string;
  service: string;
  environment: string;
  hasValue: boolean;
  version: number;
  updated: string;
  rotation: { label: string; tone: "ok" | "due" | "none" };
  history: { version: number; at: string }[];
  rotationDays: number | null;
};

export function rotationState(s: Pick<ISecret, "rotationDays" | "rotatedAt" | "createdAt">) {
  if (!s.rotationDays) return { label: "Manual", tone: "none" as const, overdueBy: 0, age: 0 };
  const age = daysSince(s.rotatedAt || s.createdAt);
  const left = s.rotationDays - age;
  if (left < 0) return { label: "Overdue", tone: "due" as const, overdueBy: -left, age };
  return { label: left === 0 ? "Due today" : `In ${left} days`, tone: (left <= 7 ? "due" : "ok") as "due" | "ok", overdueBy: 0, age };
}

export function toRow(s: ISecret): SecretRow {
  const r = rotationState(s);
  return {
    id: String(s._id),
    key: s.key,
    description: s.description,
    service: s.service,
    environment: s.environment,
    hasValue: !!s.valueEnc,
    version: s.version,
    updated: shortDate(s.updatedAt),
    rotation: { label: r.label, tone: r.tone },
    history: [...(s.history || []).map((h) => ({ version: h.version, at: shortDate(h.at) })), ...(s.valueEnc ? [{ version: s.version, at: shortDate(s.rotatedAt || s.updatedAt) }] : [])].reverse(),
    rotationDays: s.rotationDays ?? null,
  };
}
