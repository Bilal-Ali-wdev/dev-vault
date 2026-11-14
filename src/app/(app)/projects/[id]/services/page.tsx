import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadProject } from "@/lib/data";
import { Secret, Service, type IService } from "@/lib/models";
import { Services, type ServiceDTO } from "./services";

export const metadata: Metadata = { title: "Services & accounts" };

export default async function ServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const [services, linked] = await Promise.all([Service.find({ projectId: p._id }).sort({ category: 1, name: 1 }).lean<IService[]>(), Secret.countDocuments({ projectId: p._id, service: { $ne: "" } })]);
  const dto: ServiceDTO[] = services.map((s) => ({
    id: String(s._id),
    catalogId: s.catalogId,
    name: s.name,
    category: s.category,
    usedFor: s.usedFor,
    accountEmail: s.accountEmail,
    signInWith: s.signInWith,
    plan: s.plan,
    region: s.region,
    dashboardUrl: s.dashboardUrl,
    envVars: s.envVars,
    environments: s.environments,
    notes: s.notes,
  }));
  return <Services projectId={id} services={dto} linkedVars={linked} />;
}
