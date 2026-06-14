import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminModelsPage() {
  return (
    <AdminListPage
      kind="models"
      title="模型配置"
      subtitle="查看 AI 模型、embedding 模型和高级模型限制。"
      columns={[
        { key: "name", label: "名称" },
        { key: "provider", label: "服务商" },
        { key: "model", label: "模型" },
        { key: "type", label: "类型" },
        { key: "enabled", label: "启用" },
        { key: "isPremium", label: "高级模型" },
      ]}
    />
  );
}
