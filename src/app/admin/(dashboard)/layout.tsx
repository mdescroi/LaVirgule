import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AdminNav />
      <main className="flex-1 p-5 sm:p-8">{children}</main>
    </div>
  );
}
