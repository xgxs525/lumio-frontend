import { AdminListPage } from "@/components/admin/admin-list-page";

export default function AdminPaymentsPage() {
  return (
    <AdminListPage
      kind="payments"
      title="支付记录"
      subtitle="查看支付流水、支付渠道和回调状态。"
      columns={[
        { key: "provider", label: "渠道" },
        { key: "providerTradeNo", label: "交易号" },
        { key: "amount", label: "金额" },
        { key: "currency", label: "币种" },
        { key: "status", label: "状态" },
        { key: "createdAt", label: "创建时间" },
      ]}
    />
  );
}
