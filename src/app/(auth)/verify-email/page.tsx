import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding-shell";
import { onboardingGuard } from "@/lib/guards";
import { mailConfigured } from "@/lib/mail";
import { OTP_RESEND_MS } from "@/lib/otp";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage() {
  const a = await onboardingGuard("verify-email");
  const sentAt = a.user.emailOtp?.sentAt ? new Date(a.user.emailOtp.sentAt).getTime() : 0;
  return (
    <OnboardingShell current={1}>
      <VerifyForm email={a.user.email} resendAt={sentAt + OTP_RESEND_MS} devMode={!mailConfigured()} />
    </OnboardingShell>
  );
}
