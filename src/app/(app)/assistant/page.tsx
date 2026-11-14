import { redirectToLatestProject } from "@/lib/latest-project";

export default function AssistantShortcut() {
  return redirectToLatestProject("assistant", { icon: "sparkles", title: "AI assistant", text: "The assistant answers questions about one project at a time, using its sessions, tasks, docs and commits." });
}
