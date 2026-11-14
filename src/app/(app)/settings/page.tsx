import type { Metadata } from "next";
import { TopBar } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { fullDate } from "@/lib/format";
import { DatabaseConnection, type IDatabaseConnection } from "@/lib/models";
import { AccountSettings } from "./account-settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user } = await requireUser();
  const dbs = await DatabaseConnection.find({ userId: user._id }).sort({ createdAt: -1 }).lean<IDatabaseConnection[]>();
  return (
    <>
      <TopBar icon="settings" title={<span className="font-semibold">Settings</span>} />
      <AccountSettings
        user={{ name: user.name, email: user.email, mfaSince: user.mfa.enabledAt ? fullDate(user.mfa.enabledAt) : "—", recoveryLeft: user.mfa.recoveryHashes.length }}
        databases={dbs.map((d) => ({
          id: String(d._id),
          provider: d.provider,
          label: d.label,
          hint: d.urlHint,
          isDefault: d.isDefault,
          lastTest: d.lastTest ? { ok: d.lastTest.ok, meta: d.lastTest.meta, ms: d.lastTest.ms, at: fullDate(d.lastTest.at) } : null,
        }))}
      />
    </>
  );
}
