import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadProject } from "@/lib/data";
import { ProjectSettings } from "./project-settings";

export const metadata: Metadata = { title: "Project settings" };

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  return (
    <ProjectSettings
      project={{
        id,
        name: p.name,
        description: p.description,
        type: p.type,
        status: p.status,
        repoUrl: p.repoUrl,
        liveUrl: p.liveUrl,
        stack: p.stack.join(", "),
        milestoneName: p.milestone?.name ?? "",
        milestoneDue: p.milestone?.dueDate ? new Date(p.milestone.dueDate).toISOString().slice(0, 10) : "",
      }}
    />
  );
}
