import { redirectToLatestProject } from "@/lib/latest-project";

export default function VaultShortcut() {
  return redirectToLatestProject("vault", { icon: "padlock", title: "Environment vault", text: "Each project has its own encrypted vault with Development, Staging and Production variables." });
}
