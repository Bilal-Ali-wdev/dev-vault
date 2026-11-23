import Image from "next/image";
import Link from "next/link";
import { Boxes, Fingerprint, LockKeyhole, ShieldCheck, type LucideIcon } from "lucide-react";
import { BrandLogo, type BrandName } from "@/components/brand-logos";
import { FeatureArt, type FeatureArtName } from "@/components/feature-art";
import { Logo } from "@/components/logo";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Icon, type IconName } from "@/components/icons";

/* ---------------------------------------------------------------- Content */

// Pricing shown on the landing page — change these to your real prices.
const PRICE_PRO = "$9";
const PRICE_BUSINESS = "$29";

const FEATURES: { title: string; body: string; art: FeatureArtName; bg: string; tag: [string, string, string]; rows: [string, string][] }[] = [
  { title: "Resume My Work", art: "resume", body: "Open a project and see your last session, last finished task, blockers and the best next step.", bg: "#EEF5F3", tag: ["#E7F4F2", "#077264", "RESUME"], rows: [["Last session", "2h 14m"], ["Last done", "SF-112"], ["Blocker", "refunds"]] },
  { title: "AI Project Assistant", art: "ai", body: "Ask about architecture, APIs or yesterday’s work. Answers cite your docs, sessions, tasks and commits.", bg: "#FFF5EA", tag: ["#FEF1E2", "#9A4F00", "AI · 3 SOURCES"], rows: [["Doc · Auth flow.md", "[1]"], ["Task · SF-104", "[2]"], ["Commit", "a3f9c1e"]] },
  { title: "Encrypted Env Vault", art: "vault", body: "Dev, staging and production variables with history, rotation reminders and audit logs.", bg: "#EEF3FC", tag: ["#EAF0FC", "#2B56B0", "PRODUCTION"], rows: [["DATABASE_URL", "••••••"], ["JWT_SECRET", "••••••"], ["STRIPE_SECRET_KEY", "••••••"]] },
  { title: "Tasks & Milestones", art: "tasks", body: "A developer-first board. Progress comes from finished tasks, never from commit counts.", bg: "#EEF7F1", tag: ["#E6F5EC", "#1F7A4D", "V1.0 LAUNCH · 58%"], rows: [["Dedupe webhook refunds", "Urgent"], ["Rate-limit /auth/token", "Normal"], ["JWT refresh rotation", "Done"]] },
  { title: "GitHub, Read-Only", art: "github", body: "See commits next to your tasks. Public repos need nothing; private repos use a read-only token.", bg: "#F3F0FC", tag: ["#EFEBFB", "#5B44B8", "ACME/STOREFRONT-API"], rows: [["feat: idempotency", "a3f9c1e"], ["fix: null charge id", "7be20d4"], ["PR #58 merged", "c91f0aa"]] },
  { title: "Services & Accounts", art: "services", body: "Record which login owns every third-party service, so you never wonder which Gmail you used.", bg: "#F2F4F5", tag: ["#EEF0F3", "#334155", "3 ACCOUNTS"], rows: [["Supabase", "ada.dev@…"], ["Stripe", "billing@…"], ["Google Cloud", "ops.acme@…"]] },
];

const STEPS = [
  ["Create your account", "Sign up and verify your email with a one-time 6-digit code."],
  ["Secure it with MFA", "Scan a QR code with any authenticator app and save your recovery codes."],
  ["Bring in your projects", "Add services, env variables, docs and tasks. Link GitHub if you like."],
  ["Ask where you left off", "Log sessions as you work. Resume My Work and the AI handle the remembering."],
];

const AI_POINTS = [
  "Answers cite the sessions, tasks, docs and commits they came from",
  "Facts from your records are labelled apart from AI suggestions",
  "Retrieval never crosses projects or workspaces",
  "Secrets and connection strings are never part of any prompt",
];

const AUDIT = [
  ["Revealed", "STRIPE_SECRET_KEY", "MFA · 8:02 PM", "#F6921E"],
  ["Updated", "DATABASE_URL", "v4 → v5", "#8FE3D6"],
  ["Copied", "REDIS_URL", "Chrome · Windows", "#7FA6F0"],
  ["Exported", "Development", "Confirmed", "#B7A6F7"],
  ["Blocked", "AI context: secrets", "Always", "#F08A84"],
];

const SECURITY: [LucideIcon, string, string][] = [
  [LockKeyhole, "Authenticated encryption", "AES-256-GCM for vault values, database URLs and MFA secrets."],
  [ShieldCheck, "MFA for everyone", "TOTP plus hashed, single-use recovery codes."],
  [Boxes, "Tenant isolation", "Every API, search and AI query is scoped to your account."],
  [Fingerprint, "Re-auth on reveal", "Every reveal, copy and export needs fresh MFA and is logged."],
];

const COMPARE = [
  ["Where you left off", "Scroll Slack, old commits and your browser history to piece it together.", "See the last session, last finished task, blockers and next step the moment you open the project.", "Resume My Work"],
  ["Environment secrets", "Hunt for the right .env in a notes app, a DM or an old laptop.", "Every environment in one encrypted, versioned vault — reveal with MFA.", "Environment Vault"],
  ["Architecture", "Rebuild the system in your head before you dare touch the code.", "Architecture records and docs are one search away, and the AI can explain them.", "Docs + AI Assistant"],
  ["Known blockers", "Forget last week’s bug and walk straight into it again.", "Issues are logged with each session and surfaced before you start.", "Work Sessions"],
  ["Repo activity", "Open GitHub in another tab and skim commits to guess what changed.", "Commits sit next to your tasks, synced read-only.", "GitHub Integration"],
];

// Photos: Unsplash (free licence), stored in /public/personas.
const PERSONAS = [
  {
    title: "Solo developers",
    body: "Juggle side projects without losing the thread. Pick any one back up after weeks away.",
    img: "/personas/solo.jpg",
    alt: "Developer working alone at a desk with code on two monitors",
    pos: "70% 35%",
    plan: "Free plan",
    planStyle: "bg-brand-50 text-brand",
    tags: ["Side projects", "Resume My Work"],
  },
  {
    title: "Freelancers & agencies",
    body: "Keep every client’s repos, credentials and decisions separated and audit-ready.",
    img: "/personas/freelance.jpg",
    alt: "Freelancer and client high-fiving across a desk after shipping a project",
    pos: "50% 30%",
    plan: "Pro",
    planStyle: "bg-warn-50 text-warn",
    tags: ["Client vaults", "Audit log"],
  },
  {
    title: "Small teams",
    body: "Share project context and environments with role-based access as your team grows.",
    img: "/personas/team.jpg",
    alt: "Small team working together on laptops around a wooden table",
    pos: "50% 40%",
    plan: "Business",
    planStyle: "bg-info-50 text-info",
    tags: ["Shared workspace", "Roles"],
  },
];

const PLANS = [
  { name: "Free", price: "$0", per: "forever", blurb: "For side projects and trying DevVault.", hi: false, cta: "Start free", items: ["Up to 5 projects", "50 AI questions a month", "1 GitHub repo per project", "25 vault secrets", "30 days of session history"] },
  { name: "Pro", price: PRICE_PRO, per: "/ month", blurb: "For developers juggling several active projects.", hi: true, cta: "Start Pro trial", items: ["Unlimited projects", "Higher AI usage limits", "Unlimited GitHub repositories", "Unlimited secrets with history", "Full session history"] },
  { name: "Business", price: PRICE_BUSINESS, per: "/ month", blurb: "For teams that need shared workspaces and controls.", hi: false, cta: "Contact sales", items: ["Everything in Pro", "Team members and roles", "Workspace audit exports", "Custom rotation policies", "Priority support"] },
];

const FAQ = [
  ["Can DevVault staff see my secrets?", "Secret values are encrypted with AES-256-GCM before they're stored, using a key kept outside the database. They're only decrypted for you, after a fresh MFA check."],
  ["Does the AI read my environment variables?", "Never. Secret values and database connection strings are excluded from every AI prompt — the assistant only sees sessions, tasks, docs, service names and commits."],
  ["Do I need a Google account for MFA?", "No. Any TOTP authenticator works, including Google Authenticator, Microsoft Authenticator, 1Password and Authy."],
  ["Can I change plans later?", "Yes. Upgrade or downgrade at any time; limits adjust at the start of the next cycle."],
  ["Which databases can I connect?", "Supabase, MongoDB (including Atlas) and any reachable PostgreSQL server. Connections are tested server-side and stored encrypted."],
];

const INTEGRATIONS: [BrandName, string][] = [
  ["github", "GitHub"],
  ["supabase", "Supabase"],
  ["postgresql", "PostgreSQL"],
  ["mongodb", "MongoDB"],
  ["gemini", "Gemini"],
  ["openai", "OpenAI"],
  ["claude", "Claude"],
];

const NAV = [
  ["Features", "#features"],
  ["Security", "#security"],
  ["How It Works", "#how"],
  ["Pricing", "#pricing"],
  ["FAQs", "#faq"],
];

const jak = "font-display";

/* ------------------------------------------------------------- Pieces */

function SectionHeading({ eyebrow, title, accent, sub, dark }: { eyebrow?: string; title: string; accent: string; sub?: string; dark?: boolean }) {
  return (
    <div className="mx-auto flex max-w-[860px] flex-col items-center gap-4 text-center">
      {eyebrow && <span className={`rounded-full px-3 py-[5px] text-xs font-bold tracking-[.1em] uppercase ${dark ? "bg-white/10 text-mint" : "bg-brand-50 text-brand"}`}>{eyebrow}</span>}
      <h2 className={`${jak} m-0 text-[clamp(32px,4.4vw,50px)] leading-[1.08] font-extrabold tracking-[-0.04em] text-balance`}>
        {title} <span className={dark ? "text-mint" : "text-brand"}>{accent}</span>
      </h2>
      {sub && <p className={`m-0 text-lg leading-relaxed text-pretty ${dark ? "text-[#C6DEDA]" : "text-copy"}`}>{sub}</p>}
    </div>
  );
}

function HomeLogo({ variant, height = 36 }: { variant: "dark" | "light"; height?: number }) {
  return (
    <Link href="/" aria-label="DevVault home" className="inline-flex">
      <Logo variant={variant} height={height} />
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 h-[68px] border-b border-white/10 bg-[#021E1B]/75 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1320px] items-center gap-6 px-8 max-sm:px-4">
        <div className="flex-1">
          <HomeLogo variant="light" height={34} />
        </div>
        <nav aria-label="Site" className="flex gap-8 text-[15px] font-medium max-lg:hidden">
          {NAV.map(([t, href]) => (
            <a key={t} href={href} className="text-[#C6DEDA] transition-colors hover:text-white">
              {t}
            </a>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Link href="/login" className="inline-flex h-10 items-center rounded-[9px] px-3.5 text-[15px] font-medium text-[#E2F3EF] hover:bg-white/10 hover:text-white max-sm:hidden">
            Log in
          </Link>
          <Link href="/signup" className="inline-flex h-10 items-center gap-1.5 rounded-[9px] bg-mint px-4 text-[15px] font-semibold whitespace-nowrap text-deep shadow-[0_6px_20px_rgba(143,227,214,.25)] transition hover:bg-white hover:text-deep max-sm:px-3 max-sm:text-sm">
            Start free
            <Icon name="arrowRight" size={15} strokeWidth={2.4} className="max-sm:hidden" />
          </Link>
          <details className="group relative lg:hidden">
            <summary aria-label="Menu" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-[9px] border border-white/20 text-white [&::-webkit-details-marker]:hidden">
              <Icon name="menu" className="group-open:hidden" />
              <Icon name="x" className="hidden group-open:block" />
            </summary>
            <nav aria-label="Site" className="absolute top-12 right-0 flex w-56 flex-col rounded-xl border border-sea-line bg-white p-2 shadow-[0_18px_40px_rgba(4,53,48,.15)]">
              {NAV.map(([t, href]) => (
                <a key={t} href={href} className="rounded-lg px-3 py-2.5 font-medium text-copy hover:bg-sea">
                  {t}
                </a>
              ))}
              <Link href="/login" className="rounded-lg px-3 py-2.5 font-medium text-copy hover:bg-sea">
                Log in
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function DashboardPreview() {
  return (
    <div className="flex h-[520px] overflow-hidden rounded-t-2xl border border-b-0 border-[#D3E1DE] bg-white text-xs text-ink shadow-[0_-12px_60px_rgba(4,53,48,.14)]">
      <div className="flex w-[176px] flex-none flex-col gap-1 border-r border-[#EEF2F1] px-3 py-4 max-sm:hidden">
        <div className="px-1.5 pb-3.5">
          <Logo height={22} />
        </div>
        {(
          [
            ["home", "Dashboard"],
            ["folder", "Projects"],
            ["checkbox", "Tasks"],
            ["clock", "Sessions"],
            ["sparkles", "AI Assistant"],
            ["padlock", "Vault"],
            ["commit", "GitHub"],
          ] as [IconName, string][]
        ).map(([ic, t], i) => (
          <div key={t} className={`flex h-[30px] items-center gap-[9px] rounded-[7px] px-2.5 ${i === 0 ? "bg-brand font-semibold text-white" : "text-[#5A6B69]"}`}>
            <Icon name={ic} size={13} />
            {t}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[50px] items-center gap-3 border-b border-[#EEF2F1] px-[18px]">
          <span className="flex h-7 flex-[0_1_300px] items-center gap-2 rounded-[7px] border border-sea-line bg-[#F7FAF9] px-2.5 text-[#8A9997]">
            <Icon name="search" size={12} />
            Search projects, docs, tasks…
          </span>
          <span className="flex-1" />
          <span className="rounded-[5px] bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success">Synced</span>
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-orange text-[11px] font-bold">A</span>
        </div>
        <div className="flex flex-col gap-3.5 bg-[#FAFCFB] p-[18px]">
          <div className="flex items-end justify-between">
            <div>
              <div className={`${jak} text-xl font-extrabold tracking-[-0.02em]`}>Good evening, Ada</div>
              <div className="mt-0.5 text-[#6B7C7A]">Here&apos;s where you left off this week.</div>
            </div>
            <span className="inline-flex h-[30px] items-center rounded-[7px] bg-brand px-3 font-semibold text-white">+ New project</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 max-sm:grid-cols-2">
            {[
              ["Active projects", "5", "#E7F4F2", "#077264", "folder"],
              ["Open tasks", "14", "#E6F5EC", "#1F7A4D", "checkbox"],
              ["Next milestone", "Dec 1", "#FEF1E2", "#9A4F00", "flag"],
              ["Rotation due", "1", "#EFEBFB", "#5B44B8", "clock"],
            ].map(([l, v, bg, c, ic]) => (
              <div key={l} className="flex items-center gap-2.5 rounded-[10px] border border-sea-line bg-white p-3">
                <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg" style={{ background: bg, color: c }}>
                  <Icon name={ic as IconName} size={14} />
                </span>
                <div>
                  <div className="text-[11px] text-[#6B7C7A]">{l}</div>
                  <div className="text-[15px] font-extrabold" style={{ color: c }}>
                    {v}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="flex flex-[2] flex-col gap-2.5 rounded-[10px] border border-sea-line bg-white p-3.5">
              <div className="flex justify-between">
                <div>
                  <div className="text-[13px] font-bold">Work sessions</div>
                  <div className="text-[11px] text-[#8A9997]">Last 12 weeks</div>
                </div>
                <span className="self-start rounded-[7px] border border-sea-line px-2 py-1 text-[11px]">
                  <strong>31h</strong> this month <span className="text-success">+12%</span>
                </span>
              </div>
              <div className="flex h-[150px] items-end gap-2.5 border-b border-[#EEF2F1]">
                {[38, 52, 70, 64, 48, 82, 60, 92, 58, 66, 74, 88].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i === 7 ? "#077264" : "#E3EEEB" }} />
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 rounded-[10px] border border-sea-line bg-white p-3.5 max-md:hidden">
              <div className="text-[13px] font-bold">Quick actions</div>
              {(
                [
                  ["clock", "Start session", "Log what you work on"],
                  ["padlock", "Add secret", "Encrypted in the vault"],
                  ["sparkle", "Ask AI", "Where did I stop?"],
                ] as [IconName, string, string][]
              ).map(([ic, t, d]) => (
                <div key={t} className="flex items-center gap-2.5 border-t border-[#EEF2F1] pt-2.5">
                  <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] bg-brand-50 text-brand">
                    <Icon name={ic} size={13} />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">{t}</div>
                    <div className="text-[11px] text-[#8A9997]">{d}</div>
                  </div>
                  <span className="text-[#8A9997]">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Page */

export default function Landing() {
  return (
    <div className="bg-white text-base text-copy-dark">
      <SmoothScroll />
      <SiteHeader />

      {/* HERO — full-bleed background image filling the whole first screen (the glass header sits on top of it) */}
      <section className="relative -mt-[68px] flex h-svh min-h-[640px] flex-col overflow-hidden bg-deep bg-[url(/hero-bg.svg)] bg-cover bg-center">
        <div className="relative z-10 flex flex-col items-center gap-[clamp(14px,2.3vh,22px)] px-6 pt-[calc(68px+clamp(28px,6vh,64px))] text-center">
          <a href="#features" className="inline-flex animate-rise items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pr-3 pl-1 text-[13px] font-medium text-[#D5EAE6] backdrop-blur hover:text-white motion-reduce:animate-none">
            <span className="rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold text-deep">New</span>
            AI assistant that cites your own records
            <Icon name="arrowRight" size={13} strokeWidth={2.4} />
          </a>
          <h1 className={`${jak} m-0 animate-rise text-[clamp(38px,min(6vw,8.2vh),80px)] leading-[1.04] font-extrabold tracking-[-0.045em] text-balance text-white motion-reduce:animate-none`} style={{ animationDelay: "60ms" }}>
            Every project you build
            <br className="max-sm:hidden" /> <span className="text-mint">remembered and secured.</span>
          </h1>
          <p className="m-0 max-w-[640px] animate-rise text-[clamp(15px,min(1.5vw,2.2vh),19px)] leading-[1.6] text-pretty text-[#CFE6E1] motion-reduce:animate-none" style={{ animationDelay: "120ms" }}>
            Track tasks and work sessions, keep env secrets in an encrypted vault, connect GitHub and ask AI where you left off — all from one developer dashboard.
          </p>
          <div className="flex animate-rise flex-wrap justify-center gap-3 motion-reduce:animate-none" style={{ animationDelay: "180ms" }}>
            <Link href="/signup" className={`${jak} inline-flex h-[52px] items-center gap-2.5 rounded-xl bg-mint px-6 font-bold text-deep shadow-[0_10px_30px_rgba(143,227,214,.28)] transition hover:-translate-y-px hover:bg-white hover:text-deep`}>
              Start Your Workspace
              <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </Link>
            <a href="#how" className={`${jak} inline-flex h-[52px] items-center gap-2.5 rounded-xl border border-white/25 bg-white/5 px-6 font-semibold text-white backdrop-blur transition hover:bg-white/10 hover:text-white`}>
              <Icon name="play" size={14} />
              See how it works
            </a>
          </div>
          <ul className="m-0 flex animate-rise list-none flex-wrap justify-center gap-x-5 gap-y-1.5 p-0 text-[13px] text-[#A9C8C3] motion-reduce:animate-none" style={{ animationDelay: "240ms" }}>
            {["Free forever plan", "No credit card", "MFA on every account"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Icon name="check" size={14} strokeWidth={2.6} className="text-mint" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Dashboard preview rising from the bottom edge, fading out */}
        <div className="relative z-10 mt-[clamp(22px,4.5vh,48px)] flex min-h-0 flex-1 justify-center px-6 max-sm:px-3">
          <div className="relative w-full max-w-[940px] animate-rise motion-reduce:animate-none" style={{ animationDelay: "300ms" }}>
            <div aria-hidden="true" className="absolute top-2 left-[-180px] z-20 flex w-[196px] animate-float flex-col gap-3 rounded-2xl border border-sea-line bg-white p-4 shadow-[0_20px_44px_rgba(4,53,48,.14)] motion-reduce:animate-none max-xl:hidden [@media(max-height:720px)]:hidden">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-copy">Projects</span>
                  <span className={`${jak} text-[26px] font-extrabold text-brand`}>12</span>
                </div>
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] bg-brand-50 text-brand">
                  <Icon name="folder" size={17} />
                </span>
              </div>
              <div className="h-px bg-[#EEF2F1]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-copy">Secrets encrypted</span>
                <span className={`${jak} text-xl font-extrabold text-brand`}>38 / 38</span>
              </div>
            </div>
            <div aria-hidden="true" className="absolute top-[-14px] right-[-200px] z-20 flex w-[220px] animate-float flex-col gap-2 rounded-2xl bg-brand p-[18px] ring-1 ring-mint/40 text-white shadow-[0_20px_44px_rgba(4,53,48,.25)] [animation-delay:-3s] motion-reduce:animate-none max-xl:hidden [@media(max-height:720px)]:hidden">
              <span className="text-[13px] text-[#D2EEEA]">Resume my work</span>
              <span className={`${jak} text-[30px] leading-none font-extrabold tracking-[-0.03em]`}>2h 14m</span>
              <span className="text-[13px] font-semibold">Last session · Storefront API</span>
              <span className="mt-1 rounded-lg bg-white/12 px-2.5 py-2 text-xs leading-snug text-[#E3F5F2]">Next: store processed webhook IDs before refunds</span>
            </div>
            <div aria-hidden="true" className="h-full [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
              <DashboardPreview />
            </div>
          </div>
        </div>

        {/* Integrations — last row of the first screen, an endless left→right marquee */}
        <div className="relative z-20 border-t border-sea-line bg-white">
          <div className="group mx-auto max-w-[1240px] overflow-hidden py-[clamp(14px,2.6vh,24px)] [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
            <ul aria-label="Integrations" className="sr-only">
              {INTEGRATIONS.map(([key, name]) => (
                <li key={key}>{name}</li>
              ))}
            </ul>
            {/* Two identical halves; shifting by -50% → 0 loops seamlessly */}
            <div aria-hidden className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[0, 1].map((half) => (
                <div key={half} className="flex shrink-0 items-center gap-14 pr-14 max-sm:gap-9 max-sm:pr-9">
                  {[...INTEGRATIONS, ...INTEGRATIONS].map(([key, name], i) => (
                    <span key={`${key}-${i}`} className={`${jak} inline-flex items-center gap-2.5 text-[17px] font-bold whitespace-nowrap text-[#2C3E3C]`}>
                      <BrandLogo name={key} size={26} decorative />
                      {name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Everything below the hero sits on grid paper */}
      <div className="grid-bg">
      {/* FEATURES */}
      <section id="features" className="mx-auto flex max-w-[1240px] flex-col gap-14 px-6 py-24 max-sm:py-16">
        <SectionHeading eyebrow="Features" title="Everything You Need To" accent="Ship Again" sub="One workspace for the context that usually lives in ten different tabs." />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-6">
          {FEATURES.map((f) => (
            <article key={f.title} className="group flex flex-col overflow-hidden rounded-[20px] border border-sea-line bg-white transition duration-300 hover:-translate-y-1 hover:border-[#CFE3DE] hover:shadow-[0_22px_48px_rgba(4,53,48,.10)]">
              <div aria-hidden="true" className="flex h-[200px] items-center justify-center p-6" style={{ background: f.bg }}>
                <div className="flex w-full max-w-[290px] flex-col gap-2 rounded-xl bg-white p-3.5 text-xs shadow-[0_12px_30px_rgba(4,53,48,.12)] transition duration-300 group-hover:scale-[1.03]">
                  <span className="self-start rounded-[5px] px-2 py-[3px] text-[10px] font-extrabold tracking-[.06em]" style={{ background: f.tag[0], color: f.tag[1] }}>
                    {f.tag[2]}
                  </span>
                  {f.rows.map(([a, b]) => (
                    <div key={a} className="flex justify-between gap-2.5 border-t border-[#F0F4F3] pt-2">
                      <span className="truncate font-semibold text-ink">{a}</span>
                      <span className="font-mono text-[11px] whitespace-nowrap text-[#6B7C7A]">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-6 pt-5 pb-6">
                <h3 className={`${jak} m-0 flex items-center gap-3 text-xl font-bold tracking-[-0.02em]`}>
                  <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl transition duration-300 group-hover:-rotate-6 group-hover:scale-110" style={{ background: f.bg }}>
                    <FeatureArt name={f.art} size={40} />
                  </span>
                  {f.title}
                </h3>
                <p className="m-0 text-[15px] leading-relaxed text-copy">{f.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* AI SPOTLIGHT */}
      <section className="grid-bg border-y border-sea-line bg-[#F7FAF9]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-16 px-6 py-24 max-lg:gap-12 max-sm:py-16">
          <div className="flex flex-[1_1_420px] flex-col gap-5">
            <span className="self-start rounded-full bg-warn-50 px-3 py-[5px] text-xs font-bold tracking-[.1em] text-warn uppercase">AI project assistant</span>
            <h2 className={`${jak} m-0 text-[clamp(32px,4vw,46px)] leading-[1.08] font-extrabold tracking-[-0.04em] text-balance`}>
              Ask “where did I stop?” <span className="text-brand">and get a real answer.</span>
            </h2>
            <p className="m-0 text-lg leading-[1.65] text-copy">DevVault retrieves only what&apos;s relevant from one project — sessions, tasks, docs and commits — and shows you exactly where each fact came from.</p>
            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
              {AI_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[#2C3E3C]">
                  <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand text-white">
                    <Icon name="check" size={13} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div aria-hidden="true" className="relative flex flex-[1_1_480px] flex-col gap-4 rounded-[22px] border border-sea-line bg-white p-[26px] text-sm shadow-[0_30px_70px_rgba(4,53,48,.12)] max-sm:p-4">
            <div className="flex items-center gap-2.5 border-b border-[#EEF2F1] pb-3.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[11px] font-extrabold text-white">SF</span>
              <span className="font-bold">Storefront API</span>
              <span className="ml-auto rounded-md bg-success-50 px-2 py-[3px] text-xs font-semibold text-success">Scoped to this project</span>
            </div>
            <div className="max-w-[80%] self-end rounded-[14px_14px_4px_14px] bg-brand px-[15px] py-[11px] text-white">Which APIs are done, and what&apos;s next?</div>
            <div className="flex flex-col gap-2.5 rounded-[14px] border border-sea-line bg-[#F7FAF9] p-4">
              <span className="self-start rounded-[5px] bg-line-soft px-2 py-[3px] text-[11px] font-bold tracking-[.05em] text-ink-2">FROM YOUR RECORDS</span>
              <span className="leading-relaxed">
                Completed: <strong>/auth</strong>, <strong>/products</strong>, <strong>/orders</strong> (idempotency in review). <span className="text-xs font-bold text-brand">[1] [2]</span>
              </span>
            </div>
            <div className="flex flex-col gap-2.5 rounded-[14px] border border-warn-line bg-warn-25 p-4">
              <span className="self-start rounded-[5px] bg-warn-50 px-2 py-[3px] text-[11px] font-bold tracking-[.05em] text-warn">SUGGESTION · NOT YET VERIFIED</span>
              <span className="leading-relaxed">
                Finish <strong>/refunds</strong> next — it&apos;s blocking QA for the v1.0 milestone.
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-sea-line px-2.5 py-1">
                <b className="text-brand">1</b> Doc · API.md
              </span>
              <span className="rounded-full border border-sea-line px-2.5 py-1">
                <b className="text-brand">2</b> Task · SF-112
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#D5E0DE] py-2 pr-2 pl-3.5 text-[#8A9997]">
              <span className="flex-1">Ask about this project…</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                <Icon name="send" size={14} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="mx-auto flex max-w-[1240px] flex-wrap items-stretch gap-16 px-6 py-24 max-lg:gap-12 max-sm:py-16">
        <div aria-hidden="true" className="flex flex-[1_1_440px] flex-col gap-2.5 rounded-[22px] bg-[#0B2A27] p-[26px] text-[13px] text-[#E2E8F0] shadow-[0_30px_70px_rgba(4,53,48,.25)] max-sm:p-4">
          <div className="flex items-center justify-between pb-2">
            <span className={`${jak} text-base font-bold text-white`}>Vault audit log</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-mint">
              <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-mint" />
              Live
            </span>
          </div>
          {AUDIT.map(([a, k, w, c]) => (
            <div key={k} className="flex flex-1 items-center gap-3 rounded-xl border border-deep-line bg-[#0F3631] px-3.5 py-3">
              <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: c }} />
              <span className="min-w-0 flex-1 truncate">
                <strong className="font-semibold text-white">{a}</strong> <span className="font-mono text-xs text-[#C6DEDA]">{k}</span>
              </span>
              <span className="text-xs whitespace-nowrap text-[#A9C8C3]">{w}</span>
            </div>
          ))}
        </div>
        <div className="@container flex flex-[1.2_1_480px] flex-col justify-center gap-6">
          <span className="self-start rounded-full bg-brand-50 px-3 py-[5px] text-xs font-bold tracking-[.1em] text-brand uppercase">Security by default</span>
          {/* Font scales with the column width (cqi) so the first line always fits on one line. */}
          <h2 className={`${jak} m-0 text-[clamp(28px,7cqi,46px)] leading-[1.08] font-extrabold tracking-[-0.04em]`}>
            Built like a password manager,
            <br />
            <span className="text-brand">not a to-do app.</span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3">
            {SECURITY.map(([Ic, t, d]) => (
              <div key={t} className="flex flex-col gap-2 rounded-2xl border border-sea-line bg-white p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
                  <Ic size={20} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className={`${jak} text-base font-bold`}>{t}</span>
                <span className="text-sm leading-normal text-copy">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-sea-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-14 px-6 py-24 max-sm:py-16">
          <SectionHeading eyebrow="How it works" title="Up And Running In" accent="Four Steps" sub="From sign-up to your first “where did I stop?” in a few minutes." />
          <div className="flex flex-wrap items-center gap-12">
            <div aria-hidden="true" className="flex flex-[1_1_460px] justify-center rounded-3xl bg-sea p-10 max-sm:p-5">
              <div className="flex w-full max-w-[400px] flex-col gap-3.5 rounded-2xl bg-white p-[22px] text-[13px] shadow-[0_20px_48px_rgba(4,53,48,.12)]">
                <div className="flex items-center gap-3">
                  <span className={`${jak} flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-brand font-extrabold text-white`}>SF</span>
                  <div>
                    <div className="text-[15px] font-bold">Storefront API</div>
                    <div className="text-[#6B7C7A]">Next.js · Mongoose · MongoDB</div>
                  </div>
                  <span className="ml-auto rounded-md bg-brand-50 px-2 py-[3px] text-[11px] font-bold text-brand">Active</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["Progress", "68%"], ["Open tasks", "7"], ["Secrets", "6"]].map(([l, v]) => (
                    <div key={l} className="rounded-[9px] bg-[#F7FAF9] p-2.5">
                      <div className="text-[11px] text-[#6B7C7A]">{l}</div>
                      <div className="text-[17px] font-extrabold">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F1]">
                  <div className="h-2 w-[68%] rounded-full bg-success-500" />
                </div>
                <div className="rounded-[10px] border border-warn-line bg-warn-25 p-3 leading-normal">
                  <strong className="text-warn">Next step:</strong> store processed webhook IDs before issuing refunds.
                </div>
              </div>
            </div>
            <ol className="m-0 flex flex-[1_1_420px] list-none flex-col p-0">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="relative flex items-start gap-[18px] pb-8 last:pb-0">
                  {i < STEPS.length - 1 && <span aria-hidden="true" className="absolute top-[52px] bottom-1 left-[22px] w-0.5 rounded bg-[#D7E7E3]" />}
                  <span className={`${jak} relative flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl bg-brand-50 text-lg font-extrabold text-brand ring-4 ring-white`}>{i + 1}</span>
                  <div className="flex flex-col gap-1 pt-1">
                    <h3 className={`${jak} m-0 text-xl font-bold`}>{t}</h3>
                    <p className="m-0 text-[15px] leading-relaxed text-copy">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="grid-bg border-y border-sea-line bg-[#F7FAF9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 py-16 max-sm:py-12">
          <SectionHeading eyebrow="The project switch" title="Your Day," accent="Before And After" sub="Same project, same developer. Very different first hour." />
          <div className="overflow-x-auto rounded-3xl shadow-[0_24px_56px_rgba(4,53,48,.09)]">
            <div className="grid min-w-[860px] grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)] overflow-hidden rounded-3xl border border-sea-line bg-white">
              <div className="flex items-center border-b border-[#EEF2F1] px-6 py-4">
                <span className="text-xs font-bold tracking-[.08em] text-[#5A6B69] uppercase">When you switch back</span>
              </div>
              <div className="flex items-center gap-3 border-b border-l border-[#EEF2F1] px-6 py-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-[#F2F4F5] text-[#64748B]">
                  <Icon name="board" size={17} />
                </span>
                <div className="flex flex-col">
                  <span className={`${jak} text-[17px] font-bold text-copy`}>Without DevVault</span>
                  <span className="text-[13px] text-[#5A6B69]">Ten tabs and a fuzzy memory</span>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b border-[#0A6E62] bg-brand px-6 py-4 text-white">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-white text-brand">
                  <Icon name="lock" size={17} strokeWidth={2.2} />
                </span>
                <div className="flex flex-col">
                  <span className={`${jak} text-[17px] font-bold`}>With DevVault</span>
                  <span className="text-[13px] text-[#D2EEEA]">One workspace that remembers</span>
                </div>
              </div>
              {COMPARE.map(([topic, before, after, feature], i) => (
                <div key={topic} className="contents">
                  <div className="flex items-center gap-2.5 border-b border-[#EEF2F1] px-6 py-3.5">
                    <span className="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg bg-brand-50 font-mono text-[11px] font-semibold text-brand">0{i + 1}</span>
                    <span className={`${jak} text-[15px] font-bold`}>{topic}</span>
                  </div>
                  <div className="flex items-start gap-2.5 border-b border-l border-[#EEF2F1] px-6 py-3.5">
                    <span className="mt-0.5 flex h-4.5 w-4.5 flex-none items-center justify-center rounded-full bg-danger-50 text-danger">
                      <Icon name="x" size={9} strokeWidth={3.2} />
                    </span>
                    <span className="text-sm leading-normal text-ink-3">{before}</span>
                  </div>
                  <div className="flex items-start gap-2.5 border-b border-[#DCEBE8] bg-brand-25 px-6 py-3.5">
                    <span className="mt-0.5 flex h-4.5 w-4.5 flex-none items-center justify-center rounded-full bg-brand text-white">
                      <Icon name="check" size={10} strokeWidth={3.2} />
                    </span>
                    <span className="text-sm leading-normal font-medium">
                      {after}{" "}
                      <span className="ml-0.5 inline-block rounded-md border border-[#CDE6E1] bg-white px-1.5 align-[1px] text-[11px] leading-4.5 font-semibold whitespace-nowrap text-brand">{feature}</span>
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center bg-[#FAFBFB] px-6 py-4">
                <span className={`${jak} text-base font-extrabold`}>The result</span>
              </div>
              <div className="flex flex-col gap-2 border-l border-[#EEF2F1] bg-[#FAFBFB] px-6 py-4">
                <span className={`${jak} text-lg font-extrabold tracking-[-0.02em] text-danger`}>The first hour, gone</span>
                <div className="flex flex-wrap gap-1.5">
                  {["slack", "notes.txt", ".env.local", "git log", "your memory"].map((t) => (
                    <span key={t} className="rounded-md border border-dashed border-[#CBD5E1] bg-white px-2 py-0.5 font-mono text-[11px] text-[#5A6B69]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-deep px-6 py-4 text-white">
                <span className={`${jak} text-lg font-extrabold tracking-[-0.02em] text-mint`}>Back to coding in minutes</span>
                <Link href="/signup" className="inline-flex h-9 items-center gap-2 rounded-[9px] bg-white px-3.5 text-[13px] font-bold text-brand transition hover:bg-[#E7F4F2]">
                  Try it on your next switch
                  <Icon name="arrowRight" size={14} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-14 px-6 py-24 max-sm:py-16">
        <SectionHeading eyebrow="Who it's for" title="Made For" accent="How You Build" sub="Whether it's one side project or a dozen client repos." />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
          {PERSONAS.map((p) => (
            <article key={p.title} className="group flex flex-col overflow-hidden rounded-[22px] border border-sea-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(4,53,48,.12)]">
              <div className="relative h-[210px] overflow-hidden bg-sea">
                <Image
                  src={p.img}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px"
                  className="object-cover transition duration-700 group-hover:scale-105"
                  style={{ objectPosition: p.pos }}
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#021E1B]/45 via-transparent to-transparent" />
                <span className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${p.planStyle}`}>{p.plan}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-7 max-sm:p-6">
                <h3 className={`${jak} m-0 text-[22px] font-bold tracking-[-0.02em]`}>{p.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-copy">{p.body}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                {p.tags.map((g) => (
                  <span key={g} className="rounded-full bg-[#F2F6F5] px-[11px] py-[5px] text-[13px] font-medium text-[#2C3E3C]">
                    {g}
                  </span>
                ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="grid-bg grid-bg-dark bg-deep text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-14 px-6 py-24 max-sm:py-16">
          <SectionHeading dark eyebrow="Pricing" title="Simple, Flat" accent="Monthly Pricing" sub="Start free. Upgrade when your projects do." />
          <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-stretch gap-[22px]">
            {PLANS.map((p) => (
              <article
                key={p.name}
                className={`relative flex flex-col gap-5 rounded-[22px] p-8 max-sm:p-6 ${p.hi ? "bg-white text-copy-dark shadow-[0_30px_70px_rgba(0,0,0,.3)] ring-2 ring-mint lg:-my-3 lg:py-11" : "border border-deep-line bg-deep-2 text-white"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`${jak} m-0 text-xl font-bold`}>{p.name}</h3>
                  {p.hi && <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-bold text-copy-dark">Most popular</span>}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`${jak} text-[52px] leading-none font-extrabold tracking-[-0.04em]`}>{p.price}</span>
                  <span className={`text-sm ${p.hi ? "text-[#5A6B69]" : "text-[#A9C8C3]"}`}>{p.per}</span>
                </div>
                <p className={`m-0 text-[15px] leading-normal ${p.hi ? "text-copy" : "text-[#C6DEDA]"}`}>{p.blurb}</p>
                <div className={`h-px ${p.hi ? "bg-sea-line" : "bg-deep-line"}`} />
                <ul className="m-0 flex flex-1 list-none flex-col gap-3 p-0 text-sm">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full ${p.hi ? "bg-brand-50 text-brand" : "bg-white/10 text-mint"}`}>
                        <Icon name="check" size={12} strokeWidth={3} />
                      </span>
                      {i}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`flex h-12 items-center justify-center rounded-xl text-[15px] transition ${p.hi ? "bg-brand font-bold text-white shadow-[0_10px_24px_rgba(7,114,100,.3)] hover:bg-brand-700 hover:text-white" : "border border-[#2D6C64] font-semibold text-white hover:bg-white/5 hover:text-white"}`}
                >
                  {p.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto flex max-w-[860px] flex-col gap-12 px-6 py-24 max-sm:py-16">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked" accent="Questions" sub="Everything you want to know before trusting us with your projects." />
        <div className="flex flex-col gap-3">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group rounded-2xl border border-sea-line bg-white transition open:border-[#CFE3DE] open:shadow-[0_12px_30px_rgba(4,53,48,.07)]">
              <summary className={`${jak} flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[17px] font-bold [&::-webkit-details-marker]:hidden`}>
                {q}
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sea text-brand transition-transform duration-300 group-open:rotate-45">
                  <Icon name="plus" size={16} strokeWidth={2.4} />
                </span>
              </summary>
              <p className="m-0 px-6 pb-6 text-[15px] leading-[1.65] text-copy">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-sm:pb-16">
        <div className="relative mx-auto flex max-w-[1192px] flex-col items-center gap-5 overflow-hidden rounded-[28px] bg-brand px-10 py-20 text-center text-white max-sm:px-5 max-sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,#000_10%,transparent_75%)]" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand shadow-[0_12px_30px_rgba(0,0,0,.18)]">
            <Icon name="lock" size={26} strokeWidth={2.2} />
          </span>
          <h2 className={`${jak} relative m-0 text-[clamp(32px,4.4vw,50px)] leading-[1.1] font-extrabold tracking-[-0.04em] text-balance`}>
            Ready To Stop <span className="text-mint">Losing Context?</span>
          </h2>
          <p className="relative m-0 text-lg text-[#D2EEEA]">Free plan forever. No credit card required.</p>
          <div className="relative flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={`${jak} inline-flex h-[54px] items-center gap-2.5 rounded-xl bg-white px-7 font-bold text-brand shadow-[0_12px_30px_rgba(0,0,0,.18)] transition hover:-translate-y-px hover:bg-[#F1F9F7]`}>
              Start Your Workspace
              <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </Link>
            <Link href="/login" className={`${jak} inline-flex h-[54px] items-center rounded-xl border border-white/30 px-7 font-semibold text-white hover:bg-white/10 hover:text-white`}>
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="grid-bg grid-bg-dark overflow-hidden bg-deep text-[#C6DEDA]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-6 pt-16">
          <div className="flex flex-wrap gap-12">
            <div className="flex flex-[2_1_300px] flex-col gap-3.5">
              <HomeLogo variant="light" />
              <p className="m-0 max-w-[320px] text-[15px] leading-relaxed">AI-powered developer workspace and project memory.</p>
            </div>
            {[
              ["Product", [["Features", "#features"], ["How It Works", "#how"], ["Pricing", "#pricing"]]],
              ["Resources", [["FAQ", "#faq"], ["Security", "#security"]]],
              ["Account", [["Create account", "/signup"], ["Log in", "/login"]]],
            ].map(([h, links]) => (
              <div key={h as string} className="flex flex-[1_1_150px] flex-col gap-3 text-[15px]">
                <span className="font-bold text-white">{h as string}</span>
                {(links as string[][]).map(([t, href]) => (
                  <a key={t} href={href} className="text-[#C6DEDA] hover:text-white">
                    {t}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-deep-line pt-6 text-sm">
            <span>© {new Date().getFullYear()} DevVault. All rights reserved.</span>
            <span>Built for developers who switch projects often.</span>
          </div>
          <div aria-hidden="true" className={`${jak} -mb-[0.2em] text-center text-[clamp(96px,19vw,260px)] leading-[0.8] font-extrabold tracking-[-0.06em] text-[#0A4A43] select-none`}>
            devvault
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
