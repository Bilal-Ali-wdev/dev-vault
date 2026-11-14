import "server-only";
import mongoose, { Schema as MSchema, Types, type Model } from "mongoose";
// Schema definitions are passed untyped on purpose: Mongoose 9 infers deep types from the definition object,
// which makes tsc run for minutes. Document shapes are declared by the I* interfaces and Model<T> instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Schema = MSchema as unknown as new <T>(def: any, opts?: any) => MSchema<T> & { index: MSchema["index"] };
type Schema = MSchema;

const ObjectId = MSchema.Types.ObjectId;

function model<T>(name: string, schema: MSchema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

/* ------------------------------------------------------------------ User */
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  emailOtp?: { hash: string; expiresAt: Date; attempts: number; sentAt: Date } | null;
  mfa: {
    enabled: boolean;
    secretEnc?: string | null;
    pendingSecretEnc?: string | null;
    recoveryHashes: string[];
    enabledAt?: Date | null;
    lastStep?: number | null;
  };
  onboarding: { databaseDone: boolean };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    emailOtp: { type: { hash: String, expiresAt: Date, attempts: Number, sentAt: Date }, default: null },
    mfa: {
      enabled: { type: Boolean, default: false },
      secretEnc: { type: String, default: null },
      pendingSecretEnc: { type: String, default: null },
      recoveryHashes: { type: [String], default: [] },
      enabledAt: { type: Date, default: null },
      lastStep: { type: Number, default: null },
    },
    onboarding: { databaseDone: { type: Boolean, default: false } },
  },
  { timestamps: true }
);
export const User = model<IUser>("User", UserSchema);

/* ------------------------------------------------------- Database connection */
export type DbProvider = "supabase" | "mongodb" | "postgres";
export interface IDatabaseConnection {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId | null;
  provider: DbProvider;
  label: string;
  environment: "development" | "staging" | "production";
  urlEnc: string;
  urlHint: string;
  isDefault: boolean;
  lastTest?: { ok: boolean; ms: number; meta: string; at: Date } | null;
  createdAt: Date;
}
const DatabaseConnectionSchema = new Schema<IDatabaseConnection>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", default: null },
    provider: { type: String, enum: ["supabase", "mongodb", "postgres"], required: true },
    label: { type: String, default: "Default" },
    environment: { type: String, enum: ["development", "staging", "production"], default: "development" },
    urlEnc: { type: String, required: true },
    urlHint: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
    lastTest: { type: { ok: Boolean, ms: Number, meta: String, at: Date }, default: null },
  },
  { timestamps: true }
);
export const DatabaseConnection = model<IDatabaseConnection>("DatabaseConnection", DatabaseConnectionSchema);

/* ----------------------------------------------------------------- Project */
export const PROJECT_STATUSES = ["Planning", "Active", "On Hold", "Paused", "Completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface IProject {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  key: string;
  description: string;
  type: string;
  status: ProjectStatus;
  color: string;
  stack: string[];
  startDate?: Date | null;
  repoUrl: string;
  liveUrl: string;
  taskCounter: number;
  sessionCounter: number;
  milestone?: { name: string; dueDate?: Date | null } | null;
  lastWorkedAt?: Date | null;
  resume?: { text: string; basedOn: string[]; sourceHash: string; at: Date } | null;
  createdAt: Date;
  updatedAt: Date;
}
const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    key: { type: String, required: true },
    description: { type: String, default: "", maxlength: 2000 },
    type: { type: String, default: "Web app / API" },
    status: { type: String, enum: PROJECT_STATUSES, default: "Planning" },
    color: { type: String, default: "#0A8D7C" },
    stack: { type: [String], default: [] },
    startDate: { type: Date, default: null },
    repoUrl: { type: String, default: "" },
    liveUrl: { type: String, default: "" },
    taskCounter: { type: Number, default: 100 },
    sessionCounter: { type: Number, default: 0 },
    milestone: { type: { name: String, dueDate: Date }, default: null },
    lastWorkedAt: { type: Date, default: null },
    resume: { type: { text: String, basedOn: [String], sourceHash: String, at: Date }, default: null },
  },
  { timestamps: true }
);
export const Project = model<IProject>("Project", ProjectSchema);

/* -------------------------------------------------------------------- Task */
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "blocked", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_PRIORITIES = ["Urgent", "High", "Normal", "Low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface ITask {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  number: number;
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tag: string;
  dueDate?: Date | null;
  aiSuggested: boolean;
  hasDoc: boolean;
  completedAt?: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const TaskSchema = new Schema<ITask>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", required: true, index: true },
    number: { type: Number, required: true },
    key: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", maxlength: 5000 },
    status: { type: String, enum: TASK_STATUSES, default: "todo" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Normal" },
    tag: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    aiSuggested: { type: Boolean, default: false },
    hasDoc: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export const Task = model<ITask>("Task", TaskSchema);

/* ------------------------------------------------------------ Work session */
export interface IWorkSession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  number: number;
  startedAt: Date;
  endedAt?: Date | null;
  summary: string;
  files: string[];
  blockers: string;
  nextStep: string;
  createdAt: Date;
}
const WorkSessionSchema = new Schema<IWorkSession>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", required: true, index: true },
    number: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    summary: { type: String, default: "", maxlength: 4000 },
    files: { type: [String], default: [] },
    blockers: { type: String, default: "", maxlength: 2000 },
    nextStep: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);
export const WorkSession = model<IWorkSession>("WorkSession", WorkSessionSchema);

/* ------------------------------------------------------------------ Secret */
export const ENVIRONMENTS = ["development", "staging", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export interface ISecret {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  environment: Environment;
  key: string;
  description: string;
  service: string;
  valueEnc?: string | null;
  version: number;
  history: { version: number; valueEnc: string | null; at: Date }[];
  rotationDays?: number | null;
  rotatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
const SecretSchema = new Schema<ISecret>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", required: true, index: true },
    environment: { type: String, enum: ENVIRONMENTS, required: true },
    key: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 300 },
    service: { type: String, default: "" },
    valueEnc: { type: String, default: null },
    version: { type: Number, default: 1 },
    history: { type: [{ version: Number, valueEnc: String, at: Date }], default: [] },
    rotationDays: { type: Number, default: null },
    rotatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
SecretSchema.index({ projectId: 1, environment: 1, key: 1 }, { unique: true });
export const Secret = model<ISecret>("Secret", SecretSchema);

/* --------------------------------------------------------------- Audit log */
export interface IAuditLog {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId | null;
  action: "Created" | "Updated" | "Revealed" | "Copied" | "Exported" | "Deleted";
  target: string;
  meta: string;
  createdAt: Date;
}
const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", default: null, index: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    meta: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
export const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);

/* ----------------------------------------------------------------- Service */
export interface IService {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  catalogId: string;
  name: string;
  category: string;
  usedFor: string;
  accountEmail: string;
  signInWith: string;
  plan: string;
  region: string;
  dashboardUrl: string;
  envVars: string[];
  environments: Environment[];
  notes: string;
  createdAt: Date;
}
const ServiceSchema = new Schema<IService>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", required: true, index: true },
    catalogId: { type: String, default: "custom" },
    name: { type: String, required: true, maxlength: 120 },
    category: { type: String, default: "Other" },
    usedFor: { type: String, default: "", maxlength: 300 },
    accountEmail: { type: String, default: "", maxlength: 200 },
    signInWith: { type: String, default: "Google account" },
    plan: { type: String, default: "" },
    region: { type: String, default: "" },
    dashboardUrl: { type: String, default: "" },
    envVars: { type: [String], default: [] },
    environments: { type: [String], default: ["development"] },
    notes: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);
export const Service = model<IService>("Service", ServiceSchema);

/* --------------------------------------------------------------------- Doc */
export interface IDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  kind: "doc" | "architecture";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
const DocSchema = new Schema<IDoc>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    kind: { type: String, enum: ["doc", "architecture"], default: "doc" },
    content: { type: String, default: "", maxlength: 100_000 },
  },
  { timestamps: true }
);
export const Doc = model<IDoc>("Doc", DocSchema);

/* ------------------------------------------------------------ Conversation */
export interface ISource {
  n: number;
  kind: string;
  label: string;
  href: string;
}
export interface IMessage {
  role: "user" | "assistant";
  content: string;
  suggestion?: string | null;
  suggestedTask?: { title: string; priority: TaskPriority } | null;
  sources?: ISource[];
  context?: { label: string; count: string }[];
  at: Date;
}
export interface IConversation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}
const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    projectId: { type: ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, default: "New conversation" },
    messages: {
      type: [
        {
          role: String,
          content: String,
          suggestion: String,
          suggestedTask: { type: { title: String, priority: String }, default: null },
          sources: [{ n: Number, kind: String, label: String, href: String }],
          context: [{ label: String, count: String }],
          at: Date,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);
export const Conversation = model<IConversation>("Conversation", ConversationSchema);
