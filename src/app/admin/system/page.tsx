import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminSystemPage() {
  return (
    <AdminListPage
      kind="system"
      title="系统配置"
      subtitle="查看环境、版本、运行模式和关键开关。"
      columns={[
        { key: "key", label: "配置项" },
        { key: "value", label: "值" },
        { key: "detail", label: "详情" },
      ]}
    />
  );
}
