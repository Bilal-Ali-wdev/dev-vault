import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding-shell";
import { onboardingGuard } from "@/lib/guards";
import { DatabaseForm } from "./database-form";

export const metadata: Metadata = { title: "Connect a database" };

export default async function OnboardingDatabasePage() {
  await onboardingGuard("database");
  return (
    <OnboardingShell current={2} maxWidth={520}>
      <DatabaseForm />
    </OnboardingShell>
  );
}
