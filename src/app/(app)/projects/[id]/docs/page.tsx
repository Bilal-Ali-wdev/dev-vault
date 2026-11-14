import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadProject } from "@/lib/data";
import { Doc, type IDoc } from "@/lib/models";
import { Docs } from "./docs";

export const metadata: Metadata = { title: "Docs" };

export default async function DocsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const p = await loadProject(user._id, id);
  const docs = await Doc.find({ projectId: p._id }).sort({ updatedAt: -1 }).lean<IDoc[]>();
  return <Docs projectId={id} docs={docs.map((d) => ({ id: String(d._id), title: d.title, kind: d.kind, content: d.content, updatedAt: new Date(d.updatedAt).toISOString() }))} />;
}
