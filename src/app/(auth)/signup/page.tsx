import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding-shell";
import { guestOnly } from "@/lib/guards";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  await guestOnly();
  return (
    <OnboardingShell current={0}>
      <SignupForm />
    </OnboardingShell>
  );
}
