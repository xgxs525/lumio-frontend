import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminStoragePage() {
  return (
    <AdminListPage
      kind="storage"
      title="存储配置"
      subtitle="查看本地存储或对象存储配置状态。"
      columns={[
        { key: "key", label: "配置项" },
        { key: "value", label: "值" },
        { key: "detail", label: "详情" },
      ]}
    />
  );
}
