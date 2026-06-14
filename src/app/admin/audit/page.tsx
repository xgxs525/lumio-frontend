import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminAuditPage() {
  return (
    <AdminListPage
      kind="audit"
      title="审计日志"
      subtitle="查看团队和系统关键操作记录。"
      columns={[
        { key: "action", label: "动作" },
        { key: "resourceType", label: "资源类型" },
        { key: "resourceId", label: "资源 ID" },
        { key: "metadata", label: "详情" },
        { key: "createdAt", label: "时间" },
      ]}
    />
  );
}
