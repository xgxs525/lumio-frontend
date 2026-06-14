import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminOrdersPage() {
  return (
    <AdminListPage
      kind="orders"
      title="订单管理"
      subtitle="查看套餐订单、支付状态和订单金额。"
      columns={[
        { key: "orderNo", label: "订单号" },
        { key: "planName", label: "套餐" },
        { key: "amount", label: "金额" },
        { key: "currency", label: "币种" },
        { key: "status", label: "状态" },
        { key: "createdAt", label: "创建时间" },
      ]}
    />
  );
}
