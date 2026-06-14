import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminUsersPage() {
  return (
    <AdminListPage
      kind="users"
      title="用户管理"
      subtitle="查看当前空间内用户和成员状态。"
      columns={[
        { key: "name", label: "姓名" },
        { key: "email", label: "邮箱" },
        { key: "phone", label: "手机号" },
        { key: "status", label: "状态" },
        { key: "createdAt", label: "创建时间" },
      ]}
    />
  );
}
