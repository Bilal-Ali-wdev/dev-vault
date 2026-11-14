import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding-shell";
import { onboardingGuard } from "@/lib/guards";
import { MfaChallenge } from "./mfa-challenge";

export const metadata: Metadata = { title: "Two-factor check" };

export default async function LoginMfaPage() {
  const a = await onboardingGuard("mfa-login");
  return (
    <OnboardingShell current={-1}>
      <MfaChallenge email={a.user.email} />
    </OnboardingShell>
  );
}
