import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminWorkspacesPage() {
  return (
    <AdminListPage
      kind="workspaces"
      title="工作空间管理"
      subtitle="查看工作空间、套餐和额度概况。"
      columns={[
        { key: "name", label: "名称" },
        { key: "slug", label: "标识" },
        { key: "plan", label: "套餐" },
        { key: "storageQuota", label: "存储额度" },
        { key: "aiQuota", label: "AI 额度" },
      ]}
    />
  );
}
