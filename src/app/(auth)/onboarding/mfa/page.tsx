import type { Metadata } from "next";
import { onboardingGuard } from "@/lib/guards";
import { MfaSetup } from "./mfa-setup";

export const metadata: Metadata = { title: "Set up authenticator" };

export default async function OnboardingMfaPage() {
  await onboardingGuard("mfa-setup");
  return <MfaSetup />;
}
