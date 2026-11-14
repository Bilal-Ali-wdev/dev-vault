import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, TopBar } from "@/components/page-header";
import type { IconName } from "@/components/icons";
import { requireUser } from "./auth";
import { Project, type IProject } from "./models";

/** Sends top-level shortcuts (AI assistant, Vault) to the most recently worked project. */
export async function redirectToLatestProject(sub: string, empty: { icon: IconName; title: string; text: string }) {
  const { user } = await requireUser();
  const p = await Project.findOne({ userId: user._id }).sort({ lastWorkedAt: -1, updatedAt: -1 }).select("_id").lean<IProject>();
  if (p) redirect(`/projects/${p._id}/${sub}`);
  return (
    <>
      <TopBar icon={empty.icon} title={<span className="font-semibold">{empty.title}</span>} />
      <main className="mx-auto w-full max-w-[720px] px-6 pt-10">
        <EmptyState
          icon={empty.icon}
          title="Create a project first"
          action={
            <Link href="/projects/new" className="btn-primary">
              New project
            </Link>
          }
        >
          {empty.text}
        </EmptyState>
      </main>
    </>
  );
}
