import AdminSuperPanelClient from "@/components/admin-super/admin-super-panel-client";
import { requireRoleForDashboard } from "@/modules/dashboard/service";

export default async function AdminSuperPanelPage() {
  await requireRoleForDashboard("admin");
  return <AdminSuperPanelClient />;
}

