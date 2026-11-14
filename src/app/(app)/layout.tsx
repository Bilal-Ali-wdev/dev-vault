import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { navData } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const a = await requireUser();
  const nav = await navData(a.user._id);
  return (
    <div className="flex min-h-screen bg-canvas text-sm text-ink max-md:flex-col">
      <Sidebar nav={{ ...nav, user: { name: a.user.name.split(" ")[0], email: a.user.email } }} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
