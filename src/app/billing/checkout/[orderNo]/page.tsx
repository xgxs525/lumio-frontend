"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function formatMoney(value: unknown, currency: unknown) {
  return `${text(currency, "CNY")} ${num(value).toFixed(2)}`;
}

export default function CheckoutPage() {
  const params = useParams<{ orderNo: string }>();
  const router = useRouter();
  const orderNo = decodeURIComponent(params.orderNo);
  const [detail, setDetail] = useState<RecordMap>({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const order = useMemo(() => (detail.order && typeof detail.order === "object" ? (detail.order as RecordMap) : {}), [detail]);
  const payment = useMemo(() => (detail.payment && typeof detail.payment === "object" ? (detail.payment as RecordMap) : {}), [detail]);
  const isPaid = text(order.status) === "paid";
  const provider = text(order.paymentProvider, text(payment.provider, "mock_cn"));

  async function loadOrder() {
    setError("");
    setLoading(true);
    try {
      const result = await api.getBillingOrder(orderNo);
      setDetail(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "订单加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [orderNo]);

  async function completePayment() {
    setPaying(true);
    setError("");
    try {
      if (!provider.startsWith("mock")) {
        setNotice("当前支付方式需要接入真实商户密钥和回调域名后完成支付。");
        return;
      }
      await api.completeMockPayment(orderNo);
      setNotice("支付已完成，套餐权益已更新。");
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "支付失败");
    } finally {
      setPaying(false);
    }
  }

  return (
    <WorkspaceShell
      active="账单与额度"
      title="支付确认"
      subtitle="确认套餐订单、支付方式和金额。真实支付接入前，本地可使用模拟支付完成闭环。"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href="/billing">
              <ArrowLeft className="h-4 w-4" />
              返回账单
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => void loadOrder()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </>
      }
      rightPanel={
        <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
          <CreditCard className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="text-xl font-black text-white">支付说明</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            微信、支付宝、Stripe 等真实支付需要商户号、证书、Webhook 验签和公网回调域名。未配置前只开放模拟支付。
          </p>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            正在加载订单...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">订单号</p>
                  <h2 className="mt-2 break-all text-3xl font-black text-white">{text(order.orderNo, orderNo)}</h2>
                </div>
                <span className={`w-fit rounded-full px-4 py-2 text-sm font-black ${isPaid ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-400/15 text-amber-100"}`}>
                  {isPaid ? "已支付" : "待支付"}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["金额", formatMoney(order.amount, order.currency)],
                  ["支付方式", provider],
                  ["账期", text(order.billingCycle, "monthly")],
                  ["地区", text(order.region, "CN")],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-2 break-words text-lg font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
              <h3 className="text-xl font-black text-white">下一步</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                支付完成后会自动更新当前工作空间的存储额度、AI 调用额度和团队成员上限。
              </p>
              <Button className="mt-6 w-full" onClick={() => void completePayment()} disabled={paying || isPaid}>
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isPaid ? "已完成" : provider.startsWith("mock") ? "模拟支付" : "等待真实支付接入"}
              </Button>
              {isPaid && (
                <Button className="mt-3 w-full" variant="secondary" onClick={() => router.push("/billing")}>
                  查看账单
                </Button>
              )}
            </div>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
