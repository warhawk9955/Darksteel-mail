import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/login?next=/setup");
  return <div className="min-h-screen">{children}</div>;
}
