// Shared between client and server — no secrets here.

export type CatalogService = { id: string; name: string; cat: string; short: string; c: string; env: string[]; url: string };

export const SERVICE_CATALOG: CatalogService[] = [
  { id: "upstash", name: "Upstash Redis", cat: "Cache & queues", short: "UP", c: "#00A86B", env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"], url: "https://console.upstash.com" },
  { id: "supabase", name: "Supabase", cat: "Databases", short: "SB", c: "#1F7A4D", env: ["DATABASE_URL", "SUPABASE_ANON_KEY"], url: "https://supabase.com/dashboard" },
  { id: "neon", name: "Neon Postgres", cat: "Databases", short: "NE", c: "#0E7C6B", env: ["DATABASE_URL"], url: "https://console.neon.tech" },
  { id: "mongo", name: "MongoDB Atlas", cat: "Databases", short: "MG", c: "#13814A", env: ["MONGODB_URI"], url: "https://cloud.mongodb.com" },
  { id: "stripe", name: "Stripe", cat: "Payments", short: "ST", c: "#5B4FD6", env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"], url: "https://dashboard.stripe.com" },
  { id: "resend", name: "Resend", cat: "Email", short: "RS", c: "#111827", env: ["RESEND_API_KEY"], url: "https://resend.com/overview" },
  { id: "sendgrid", name: "SendGrid", cat: "Email", short: "SG", c: "#1A73C8", env: ["SENDGRID_API_KEY"], url: "https://app.sendgrid.com" },
  { id: "google", name: "Google Cloud / Gmail", cat: "Auth", short: "G", c: "#C5372C", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], url: "https://console.cloud.google.com" },
  { id: "clerk", name: "Clerk", cat: "Auth", short: "CL", c: "#6C47FF", env: ["CLERK_SECRET_KEY"], url: "https://dashboard.clerk.com" },
  { id: "vercel", name: "Vercel", cat: "Hosting", short: "VC", c: "#111827", env: ["VERCEL_TOKEN"], url: "https://vercel.com/dashboard" },
  { id: "aws", name: "AWS", cat: "Hosting", short: "AW", c: "#B15D00", env: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"], url: "https://console.aws.amazon.com" },
  { id: "cloudinary", name: "Cloudinary", cat: "Storage", short: "CD", c: "#2E5BBA", env: ["CLOUDINARY_URL"], url: "https://console.cloudinary.com" },
  { id: "openai", name: "OpenAI", cat: "AI", short: "AI", c: "#1E293B", env: ["OPENAI_API_KEY"], url: "https://platform.openai.com" },
  { id: "gemini", name: "Google Gemini", cat: "AI", short: "GM", c: "#2B56B0", env: ["GOOGLE_API_KEY"], url: "https://aistudio.google.com" },
  { id: "sentry", name: "Sentry", cat: "Monitoring", short: "SE", c: "#5E3A87", env: ["SENTRY_DSN"], url: "https://sentry.io" },
  { id: "posthog", name: "PostHog", cat: "Monitoring", short: "PH", c: "#C2410C", env: ["POSTHOG_KEY"], url: "https://app.posthog.com" },
];

export const SERVICE_CATEGORIES = ["All", "Databases", "Cache & queues", "Auth", "Email", "Payments", "Hosting", "Storage", "AI", "Monitoring"];

export const SIGN_IN_OPTIONS = ["Google account", "GitHub account", "Email & password", "SSO"];

export const STACK_GROUPS = [
  { label: "Frontend", items: ["Next.js", "React", "Vue", "Svelte", "React Native", "Expo", "Astro"] },
  { label: "Backend", items: ["Node.js", "NestJS", "Express", "Django", "FastAPI", "Go", "Laravel"] },
  { label: "Data", items: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Prisma", "Drizzle", "Mongoose"] },
];

export const PROJECT_TYPES = ["Web app / API", "Mobile app", "Library / package", "CLI tool", "Data pipeline"];

export const PROJECT_COLORS = ["#0A8D7C", "#3B6FD8", "#7A5AF8", "#F6921E", "#D6457A", "#1F7A4D", "#C2410C", "#2E5BBA"];

export const STATUS_PILL: Record<string, string> = {
  Active: "bg-brand-50 text-brand",
  Planning: "bg-info-50 text-info",
  Paused: "bg-[#FEF5E0] text-[#8A5207]",
  "On Hold": "bg-[#F1F3F5] text-ink-3",
  Completed: "bg-success-50 text-success",
};

export const STATUS_BAR: Record<string, string> = {
  Active: "#0A8D7C",
  Planning: "#3B6FD8",
  Paused: "#F6921E",
  "On Hold": "#94A3B8",
  Completed: "#39AA70",
};

export const TASK_COLUMNS = [
  { id: "todo", name: "To do", chip: "bg-[#E5E7EB] text-ink-2" },
  { id: "in_progress", name: "In progress", chip: "bg-brand-50 text-brand" },
  { id: "in_review", name: "In review", chip: "bg-violet-50 text-violet" },
  { id: "blocked", name: "Blocked", chip: "bg-danger-50 text-danger" },
  { id: "completed", name: "Completed", chip: "bg-success-50 text-success" },
] as const;

export const PRIORITY_TEXT: Record<string, string> = {
  Urgent: "text-danger",
  High: "text-warn",
  Normal: "text-ink-3",
  Low: "text-muted",
};
export const PRIORITY_PILL: Record<string, string> = {
  Urgent: "bg-danger-50 text-danger",
  High: "bg-warn-50 text-warn",
  Normal: "bg-[#F1F3F5] text-ink-3",
  Low: "bg-[#F1F3F5] text-muted",
};

export const ENV_META = [
  { id: "development", name: "Development", dot: "#39AA70" },
  { id: "staging", name: "Staging", dot: "#F6921E" },
  { id: "production", name: "Production", dot: "#D93F3F" },
] as const;
