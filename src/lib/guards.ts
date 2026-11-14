import "server-only";
import { redirect } from "next/navigation";
import { getAuth, nextStep, type AuthState } from "./auth";

type Page = "verify-email" | "database" | "mfa-setup" | "mfa-login";

/** Gate an onboarding page: only reachable in the right account state, otherwise sent where they belong. */
export async function onboardingGuard(page: Page): Promise<AuthState> {
  const a = await getAuth();
  if (!a) redirect("/login");
  const { user, session } = a;
  const mfaPending = user.mfa.enabled && !session.mfaPassed;
  const allowed =
    page === "mfa-login"
      ? mfaPending
      : page === "verify-email"
        ? !mfaPending && !user.emailVerified
        : !mfaPending && user.emailVerified && !user.mfa.enabled;
  if (!allowed) redirect(nextStep(a) ?? "/dashboard");
  return a;
}

/** Sign-up / log-in pages: bounce signed-in users onward. */
export async function guestOnly() {
  const a = await getAuth();
  if (a) redirect(nextStep(a) ?? "/dashboard");
}
