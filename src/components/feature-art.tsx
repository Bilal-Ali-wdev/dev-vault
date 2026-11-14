// Illustrated feature icons for the landing page (hand-built SVG: gradients, highlights, corner badges).
// Each icon = a main object + a small badge, on a 64×64 grid. Decorative (the title next to it carries the meaning).
import { brandPath } from "./brand-logos";

export type FeatureArtName = "resume" | "ai" | "vault" | "tasks" | "github" | "services";

const SPARKLE = "M0 -9 C1.2 -2.4 2.4 -1.2 9 0 C2.4 1.2 1.2 2.4 0 9 C-1.2 2.4 -2.4 1.2 -9 0 C-2.4 -1.2 -1.2 -2.4 0 -9Z";

function Grad({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  );
}

const shadow = (cx: number, rx = 20) => <ellipse cx={cx} cy="60" rx={rx} ry="2.6" fill="#043530" opacity="0.13" />;

function Resume() {
  return (
    <>
      <defs>
        <Grad id="fa-r-body" from="#2DD4BF" to="#06685C" />
        <Grad id="fa-r-play" from="#FFC27A" to="#EE7A06" />
      </defs>
      {shadow(30)}
      <circle cx="29" cy="30" r="23" fill="url(#fa-r-body)" />
      <circle cx="29" cy="30" r="17" fill="#FFFFFF" />
      <path d="M29 15.5v3M29 41.5v3M14.5 30h3M40.5 30h3" stroke="#0A8D7C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M29 30V20.5M29 30l7 4.2" stroke="#0B3B36" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="29" cy="30" r="2.8" fill="#F6921E" />
      <ellipse cx="18" cy="15" rx="8" ry="3.6" fill="#FFFFFF" opacity="0.3" transform="rotate(-32 18 15)" />
      <circle cx="47" cy="46" r="12" fill="url(#fa-r-play)" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M44.2 40.6v10.8l8.6-5.4z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round" />
    </>
  );
}

function Ai() {
  return (
    <>
      <defs>
        <Grad id="fa-a-bubble" from="#FFD08F" to="#F07F0A" />
        <Grad id="fa-a-spark" from="#B7F5EA" to="#0A8D7C" />
      </defs>
      {shadow(28)}
      <path d="M14 10h28a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10H26l-9.5 8.5V46H14A10 10 0 0 1 4 36V20a10 10 0 0 1 10-10z" fill="url(#fa-a-bubble)" />
      <ellipse cx="15" cy="14.5" rx="7" ry="2.6" fill="#FFFFFF" opacity="0.35" />
      <rect x="12" y="20" width="24" height="4.4" rx="2.2" fill="#FFFFFF" />
      <rect x="12" y="28" width="30" height="4.4" rx="2.2" fill="#FFFFFF" opacity="0.85" />
      <rect x="12" y="36" width="15" height="4.4" rx="2.2" fill="#FFFFFF" opacity="0.7" />
      <rect x="31" y="35.2" width="12" height="6" rx="3" fill="#FFF4E5" />
      <circle cx="37" cy="38.2" r="1.6" fill="#EE7A06" />
      <path d={SPARKLE} transform="translate(50.5 14) scale(1.25)" fill="url(#fa-a-spark)" stroke="#FFFFFF" strokeWidth="1.6" />
      <path d={SPARKLE} transform="translate(59 29) scale(0.42)" fill="#0A8D7C" />
    </>
  );
}

function Vault() {
  return (
    <>
      <defs>
        <Grad id="fa-v-body" from="#7BA2F5" to="#2447A0" />
        <linearGradient id="fa-v-shackle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#8A99AE" />
        </linearGradient>
        <Grad id="fa-v-badge" from="#5EE4C4" to="#0A8D7C" />
      </defs>
      {shadow(30)}
      <path d="M19 30v-9a12 12 0 0 1 24 0v9" stroke="url(#fa-v-shackle)" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <rect x="9" y="27" width="42" height="30" rx="9" fill="url(#fa-v-body)" />
      <rect x="13" y="30" width="34" height="5.5" rx="2.75" fill="#FFFFFF" opacity="0.22" />
      <circle cx="30" cy="40" r="4.6" fill="#FFFFFF" />
      <path d="M28 42h4l1.2 7.5h-6.4z" fill="#FFFFFF" />
      <circle cx="50" cy="49" r="10.5" fill="url(#fa-v-badge)" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M45.5 49.2l3 3 6-6.2" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

function Tasks() {
  const rows = [
    { y: 24, done: true },
    { y: 33, done: true },
    { y: 42, done: false },
  ];
  return (
    <>
      <defs>
        <Grad id="fa-t-board" from="#5BD08F" to="#1A6E44" />
        <Grad id="fa-t-flag" from="#FFC27A" to="#EE7A06" />
      </defs>
      {shadow(30)}
      <rect x="9" y="10" width="38" height="47" rx="8" fill="url(#fa-t-board)" />
      <rect x="14" y="16" width="28" height="35.5" rx="4.5" fill="#FFFFFF" />
      <rect x="20.5" y="6.5" width="15" height="8.5" rx="3.2" fill="#E2E8F0" stroke="#FFFFFF" strokeWidth="2" />
      {rows.map((r) => (
        <g key={r.y}>
          {r.done ? (
            <>
              <circle cx="20" cy={r.y} r="3.4" fill="#39AA70" />
              <path d={`M18.4 ${r.y}l1.2 1.2 2.2-2.4`} stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          ) : (
            <circle cx="20" cy={r.y} r="3" fill="none" stroke="#CBD5E1" strokeWidth="1.8" />
          )}
          <rect x="26" y={r.y - 1.6} width={r.done ? 12 : 10} height="3.2" rx="1.6" fill={r.done ? "#A7B4C6" : "#CBD5E1"} />
        </g>
      ))}
      <path d="M50 59V35" stroke="#475569" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M50 35h11l-3.6 4.8L61 44.6H50z" fill="url(#fa-t-flag)" stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round" />
    </>
  );
}

function Github() {
  return (
    <>
      <defs>
        <Grad id="fa-g-body" from="#4B5563" to="#0F1115" />
        <Grad id="fa-g-badge" from="#B4A2FA" to="#5B44B8" />
      </defs>
      {shadow(29)}
      <circle cx="29" cy="29" r="23" fill="url(#fa-g-body)" />
      <ellipse cx="19" cy="15" rx="8" ry="3.4" fill="#FFFFFF" opacity="0.18" transform="rotate(-32 19 15)" />
      <path d={brandPath("github")} fill="#FFFFFF" transform="translate(16.4 16.4) scale(1.05)" />
      <circle cx="48" cy="47" r="12" fill="url(#fa-g-badge)" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M40.6 47s2.9-4.8 7.4-4.8 7.4 4.8 7.4 4.8-2.9 4.8-7.4 4.8-7.4-4.8-7.4-4.8z" fill="#FFFFFF" />
      <circle cx="48" cy="47" r="2.4" fill="#5B44B8" />
    </>
  );
}

function Services() {
  return (
    <>
      <defs>
        <Grad id="fa-s-avatar" from="#FFC27A" to="#EE7A06" />
        <linearGradient id="fa-s-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EEF2F6" />
        </linearGradient>
        <Grad id="fa-s-link" from="#6B95F0" to="#2447A0" />
      </defs>
      {shadow(30)}
      <rect x="27" y="5" width="17" height="17" rx="5" fill="#3ECF8E" transform="rotate(-10 35.5 13.5)" />
      <rect x="38.5" y="9.5" width="17" height="17" rx="5" fill="#635BFF" transform="rotate(12 47 18)" />
      <circle cx="35.5" cy="13.5" r="2.6" fill="#FFFFFF" opacity="0.9" />
      <circle cx="47" cy="18" r="2.6" fill="#FFFFFF" opacity="0.9" />
      <rect x="5" y="22" width="44" height="33" rx="8" fill="url(#fa-s-card)" stroke="#D8E0EA" strokeWidth="1.5" />
      <circle cx="17.5" cy="33.5" r="5.5" fill="url(#fa-s-avatar)" />
      <path d="M9.5 48.5a8 6.5 0 0 1 16 0z" fill="url(#fa-s-avatar)" />
      <rect x="29" y="30" width="15" height="3.8" rx="1.9" fill="#334155" />
      <rect x="29" y="37" width="11" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="29" y="43" width="14" height="3" rx="1.5" fill="#CBD5E1" />
      <circle cx="51" cy="50" r="10.5" fill="url(#fa-s-link)" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M48.6 52.4l4.8-4.8M47.2 49.6l-1.2 1.2a2.4 2.4 0 0 0 3.4 3.4l1.2-1.2M54.8 50.4l1.2-1.2a2.4 2.4 0 0 0-3.4-3.4l-1.2 1.2" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" fill="none" />
    </>
  );
}

const ART: Record<FeatureArtName, () => React.ReactElement> = { resume: Resume, ai: Ai, vault: Vault, tasks: Tasks, github: Github, services: Services };

export function FeatureArt({ name, size = 44, className }: { name: FeatureArtName; size?: number; className?: string }) {
  const Art = ART[name];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true" className={className} style={{ flex: "none", overflow: "visible" }}>
      <Art />
    </svg>
  );
}
