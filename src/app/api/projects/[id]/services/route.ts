import { z } from "zod";
import { apiUser, body, handler, ok, ownedProject } from "@/lib/api";
import { SERVICE_CATALOG } from "@/lib/catalog";
import { ENVIRONMENTS, Secret, Service, type IService } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

const Input = z.object({
  catalogId: z.string().max(40).default("custom"),
  name: z.string().trim().max(120).optional(),
  usedFor: z.string().max(300).default(""),
  accountEmail: z.string().trim().max(200).default(""),
  signInWith: z.string().max(40).default("Google account"),
  plan: z.string().max(80).default(""),
  region: z.string().max(200).default(""),
  dashboardUrl: z.string().max(500).default(""),
  environments: z.array(z.enum(ENVIRONMENTS)).default(["development"]),
  notes: z.string().max(2000).default(""),
  createVaultKeys: z.boolean().default(true),
});

export const GET = handler<Ctx>(async (_req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const services = await Service.find({ projectId: p._id }).sort({ category: 1, name: 1 }).lean<IService[]>();
  return ok({ services });
});

export const POST = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const input = await body(req, Input);
  const cat = SERVICE_CATALOG.find((c) => c.id === input.catalogId);
  const name = cat?.name ?? (input.name || "Custom service");
  const svc = await Service.create({
    userId: a.user._id,
    projectId: p._id,
    catalogId: input.catalogId,
    name,
    category: cat?.cat ?? "Other",
    usedFor: input.usedFor,
    accountEmail: input.accountEmail,
    signInWith: input.signInWith,
    plan: input.plan,
    region: input.region,
    dashboardUrl: input.dashboardUrl || cat?.url || "",
    envVars: cat?.env ?? [],
    environments: input.environments,
    notes: input.notes,
  });
  if (input.createVaultKeys && cat?.env.length) {
    const docs = input.environments.flatMap((environment) => cat.env.map((key) => ({ userId: a.user._id, projectId: p._id, environment, key, service: name, valueEnc: null, version: 0 })));
    // Skip keys that already exist (unique index on project+env+key).
    await Secret.insertMany(docs, { ordered: false }).catch(() => {});
  }
  return ok({ service: svc.toObject() }, { status: 201 });
});
