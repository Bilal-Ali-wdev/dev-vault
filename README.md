# DevVault

Developer workspace and project memory: tasks, work sessions, an encrypted env vault, third-party service accounts, read-only GitHub activity, and an AI assistant (LangChain + Gemini) that answers "where did I stop?" from your own records.

**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · MongoDB (Mongoose) · LangChain + Google Gemini · JWT sessions (jose) · TOTP MFA (otplib).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Config lives in `.env.local` (git-ignored; see `.env.example`). Required: `MONGODB_URI`, `GOOGLE_API_KEY`, `ENCRYPTION_KEY`, `JWT_SECRET`.

- **Email:** with `SMTP_HOST/USER/PASS` set, verification codes are emailed. Without them, codes are printed in the terminal running the server.
- **Gemini:** `GEMINI_MODEL` is tried first, then each of `GEMINI_FALLBACK_MODELS` (handles 503 "high demand").
- **GitHub:** public repos work without a token; set a read-only `GITHUB_TOKEN` for private repos or higher rate limits.
- **`ENCRYPTION_KEY` must never change** once data exists — vault values, DB URLs and MFA secrets are encrypted with it.

## Flow

1. Sign up → 2. verify email (6-digit OTP, 10 min, 5 attempts) → 3. connect a database (optional; Supabase / MongoDB / Postgres, tested server-side) → 4. authenticator MFA + 10 recovery codes → dashboard.

Logging in always requires the TOTP code (or a single-use recovery code).

## Security model

- Vault values, DB connection URLs and TOTP secrets: AES-256-GCM (`src/lib/crypto.ts`).
- Secret list endpoints never return values. Reveal / copy / `.env` export need an MFA check within 15 minutes and are audit-logged.
- Every project route checks ownership (`ownedProject` in `src/lib/api.ts`).
- The AI only receives sessions, tasks, docs, service metadata and commits (`projectRecords` in `src/lib/ai.ts`) — never vault values or DB URLs.
- DB connection tests block private / loopback addresses and time out after 5 s.

## Layout

```
src/lib/          db, models, auth, crypto, ai (LangChain), github, dbtest, vault helpers
src/app/api/      REST API (auth, onboarding, projects, tasks, sessions, secrets, services, docs, assistant)
src/app/(auth)/   sign up, log in, MFA challenge, verify email, onboarding steps
src/app/(app)/    dashboard, my tasks, settings, new-project wizard, project workspace tabs
src/app/page.tsx  landing page
```
