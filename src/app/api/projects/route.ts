import { z } from "zod";
import { apiUser, body, handler, ok } from "@/lib/api";
import { PROJECT_COLORS, SERVICE_CATALOG } from "@/lib/catalog";
import { projectKey } from "@/lib/format";
import { Project, PROJECT_STATUSES, Secret, Service, type IProject } from "@/lib/models";

const url = z.union([z.literal(""), z.url("Enter a full URL including https://").max(500)]);

const ServiceInput = z.object({
  catalogId: z.string().max(40),
  name: z.string().max(120).optional(),
  accountEmail: z.string().max(200).default(""),
  signInWith: z.string().max(40).default("Google account"),
  plan: z.string().max(80).default(""),
  region: z.string().max(200).default(""),
  dashboardUrl: z.string().max(500).default(""),
  notes: z.string().max(2000).default(""),
});

const ProjectInput = z.object({
  name: z.string().trim().min(1, "Give the project a name").max(120),
  description: z.string().max(2000).default(""),
  type: z.string().max(60).default("Web app / API"),
  status: z.enum(PROJECT_STATUSES).default("Planning"),
  startDate: z.string().optional().nullable(),
  repoUrl: url.default(""),
  liveUrl: url.default(""),
  stack: z.array(z.string().max(40)).max(40).default([]),
  services: z.array(ServiceInput).max(40).default([]),
  createVaultKeys: z.boolean().default(true),
});

export const GET = handler(async () => {
  const a = await apiUser();
  const projects = await Project.find({ userId: a.user._id }).sort({ lastWorkedAt: -1, updatedAt: -1 }).lean<IProject[]>();
  return ok({ projects: projects.map((p) => ({ id: String(p._id), name: p.name, color: p.color, status: p.status, key: p.key })) });
});

export const POST = handler(async (req) => {
  const a = await apiUser();
  const input = await body(req, ProjectInput);
  const count = await Project.countDocuments({ userId: a.user._id });
  const project = await Project.create({
    userId: a.user._id,
    name: input.name,
    key: projectKey(input.name),
    description: input.description,
    type: input.type,
    status: input.status,
    color: PROJECT_COLORS[count % PROJECT_COLORS.length],
    stack: input.stack,
    startDate: input.startDate ? new Date(input.startDate) : null,
    repoUrl: input.repoUrl,
    liveUrl: input.liveUrl,
  });

  const secretKeys = new Map<string, string>();
  for (const s of input.services) {
    const cat = SERVICE_CATALOG.find((c) => c.id === s.catalogId);
    const name = cat?.name ?? s.name ?? "Custom service";
    await Service.create({
      userId: a.user._id,
      projectId: project._id,
      catalogId: s.catalogId,
      name,
      category: cat?.cat ?? "Other",
      usedFor: s.notes,
      accountEmail: s.accountEmail,
      signInWith: s.signInWith,
      plan: s.plan,
      region: s.region,
      dashboardUrl: s.dashboardUrl || cat?.url || "",
      envVars: cat?.env ?? [],
      notes: s.notes,
    });
    for (const k of cat?.env ?? []) secretKeys.set(k, name);
  }
  if (input.createVaultKeys && secretKeys.size) {
    await Secret.insertMany(
      [...secretKeys].map(([key, service]) => ({ userId: a.user._id, projectId: project._id, environment: "development", key, service, valueEnc: null, version: 0 })),
      { ordered: false }
    ).catch(() => {});
  }
  return ok({ id: String(project._id) }, { status: 201 });
});
