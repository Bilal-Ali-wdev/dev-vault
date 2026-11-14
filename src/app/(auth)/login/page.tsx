import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding-shell";
import { guestOnly } from "@/lib/guards";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  await guestOnly();
  return (
    <OnboardingShell current={-1}>
      <LoginForm />
    </OnboardingShell>
  );
}
