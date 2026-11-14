import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Wizard } from "./wizard";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const { user } = await requireUser();
  return <Wizard defaultEmail={user.email} />;
}
