"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Globe2, Loader2, RefreshCw, ShieldCheck, Sparkles, Users } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function nested(record: RecordMap | null | undefined, key: string): RecordMap {
  const value = record?.[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordMap) : {};
}

function formatBytes(value: number) {
  if (!value) return "不限";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`;
}

function percent(used: number, total: number) {
  if (!total) return 18;
  return Math.min(100, Math.round((used / total) * 100));
}

function money(amount: number, currency: string) {
  if (!amount) return "免费";
  const symbol: Record<string, string> = { CNY: "¥", USD: "$", EUR: "€", HKD: "HK$", JPY: "¥" };
  return `${symbol[currency] ?? `${currency} `}${amount.toLocaleString("zh-CN", { maximumFractionDigits: currency === "JPY" ? 0 : 2 })}`;
}

function StatBar({ label, used, total, unit }: { label: string; used: number; total: number; unit?: string }) {
  const value = percent(used, total);
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-bold text-white">{label}</p>
        <p className="text-sm text-slate-400">{total ? `${value}%` : "不限"}</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-3 break-words text-sm text-slate-400">
        {unit === "bytes" ? `${formatBytes(used)} / ${formatBytes(total)}` : `${used.toLocaleString("zh-CN")} / ${total ? total.toLocaleString("zh-CN") : "不限"}`}
      </p>
    </div>
  );
}

export default function BillingPage() {
  const [current, setCurrent] = useState<RecordMap | null>(null);
  const [plans, setPlans] = useState<RecordMap[]>([]);
  const [orders, setOrders] = useState<RecordMap[]>([]);
  const [providers, setProviders] = useState<RecordMap[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState("CNY");
  const [provider, setProvider] = useState("mock_cn");
  const [checkout, setCheckout] = useState<RecordMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const plan = nested(current, "plan");
  const usage = nested(current, "usage");
  const limits = nested(current, "limits");
  const subscription = nested(current, "subscription");
  const currentPlanCode = asText(plan.code, "free");

  const providerOptions = useMemo(() => (providers.length ? providers : [{ code: "mock_cn", name: "序光模拟支付" }]), [providers]);

  async function loadBilling() {
    setLoading(true);
    setError("");
    try {
      const [currentResult, planResult, orderResult, providerResult] = await Promise.all([
        api.billingCurrent(),
        api.listBillingPlans({ billingCycle, currency, locale: "zh-CN" }),
        api.listBillingOrders(),
        api.listPaymentProviders({ currency, region: currency === "CNY" ? "CN" : "US" }),
      ]);
      setCurrent(currentResult.data);
      setPlans(planResult.data);
      setOrders(orderResult.data);
      setProviders(providerResult.data);
      setProvider((old) => (providerResult.data.some((item) => asText(item.code) === old) ? old : asText(providerResult.data[0]?.code, "mock_cn")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "账单数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBilling();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [billingCycle, currency]);

  async function upgrade(planCode: string) {
    setSaving(true);
    setError("");
    try {
      const result = await api.createBillingCheckout({
        plan_code: planCode,
        billing_cycle: billingCycle,
        currency,
        provider,
        locale: "zh-CN",
        region: currency === "CNY" ? "CN" : "US",
      });
      setCheckout(result.data);
      await loadBilling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建订单失败");
    } finally {
      setSaving(false);
    }
  }

  async function completePayment() {
    const orderNo = asText((checkout?.order as RecordMap | undefined)?.orderNo);
    if (!orderNo) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.completeMockPayment(orderNo);
      setCheckout({ ...checkout, ...result.data });
      await loadBilling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "支付确认失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="账单与额度"
      title="账单与额度"
      subtitle="管理套餐、订单、支付方式、存储额度、AI 调用额度、团队成员上限和高级模型权限。"
      actions={
        <Button variant="secondary" onClick={() => void loadBilling()}>
          <RefreshCw className="h-4 w-4" />
          刷新
        </Button>
      }
      rightPanel={
        <div className="space-y-4 2xl:sticky 2xl:top-24">
          <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
            <Globe2 className="mb-4 h-6 w-6 text-cyan-200" />
            <h2 className="text-xl font-black text-white">国际支付</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">已预留国内钱包、Stripe 和 PayPal 渠道。当前开发环境使用本地模拟支付。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <h3 className="font-bold text-white">支付渠道</h3>
            <div className="mt-4 grid gap-2">
              {providerOptions.map((item) => (
                <button
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                    provider === asText(item.code)
                      ? "border-cyan-200 bg-cyan-200 text-slate-950"
                      : "border-white/10 bg-white/[0.05] text-slate-300"
                  }`}
                  key={asText(item.code)}
                  onClick={() => setProvider(asText(item.code))}
                  type="button"
                >
                  {asText(item.name)}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-100">当前套餐</p>
              <h2 className="mt-2 break-words text-4xl font-black text-white">{asText(plan.displayName, asText(plan.name, "免费版"))}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{asText(plan.description, "当前工作区套餐信息。")}</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-300">
              状态：<span className="font-bold text-cyan-100">{asText(subscription.status, "active")}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/[0.05] p-4">
              <CreditCard className="mb-3 h-5 w-5 text-cyan-200" />
              <p className="text-xs text-slate-500">账期</p>
              <p className="mt-1 font-bold text-white">{asText(subscription.billingCycle, "monthly")}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] p-4">
              <Users className="mb-3 h-5 w-5 text-cyan-200" />
              <p className="text-xs text-slate-500">团队上限</p>
              <p className="mt-1 font-bold text-white">{asNumber(limits.memberLimit) ? `${asNumber(limits.memberLimit)} 人` : "不限"}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] p-4">
              <Sparkles className="mb-3 h-5 w-5 text-cyan-200" />
              <p className="text-xs text-slate-500">高级模型</p>
              <p className="mt-1 font-bold text-white">{limits.advancedModelEnabled ? "已开启" : "未开启"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-black text-white">账单偏好</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-white">
              账期
              <select className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-4" value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as "monthly" | "yearly")}>
                <option value="monthly">月付</option>
                <option value="yearly">年付</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white">
              币种
              <select className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-4" value={currency} onChange={(event) => setCurrency(event.target.value)}>
                {["CNY", "USD", "EUR", "HKD", "JPY"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-4">
        <StatBar label="存储额度" used={asNumber(usage.storageUsed)} total={asNumber(limits.storageQuota)} unit="bytes" />
        <StatBar label="AI Token" used={asNumber(usage.aiTokensUsed)} total={asNumber(limits.aiTokenQuota)} />
        <StatBar label="AI 请求" used={asNumber(usage.aiRequestsUsed)} total={asNumber(limits.aiRequestQuota)} />
        <StatBar label="团队成员" used={asNumber(usage.memberCount)} total={asNumber(limits.memberLimit)} />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center text-slate-400">正在加载套餐...</div>
        ) : (
          plans.map((item) => {
            const code = asText(item.code);
            const selected = code === currentPlanCode;
            const amount = billingCycle === "yearly" ? asNumber(item.priceYearly) : asNumber(item.priceMonthly);
            return (
              <div key={code} className={`rounded-3xl border p-5 ${selected ? "border-cyan-200 bg-cyan-200/10" : "border-white/10 bg-white/[0.06]"}`}>
                <h3 className="text-xl font-black text-white">{asText(item.displayName, asText(item.name))}</h3>
                <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-400">{asText(item.description)}</p>
                <p className="mt-5 text-3xl font-black text-white">{code === "enterprise" ? "联系销售" : money(amount, currency)}</p>
                <Button className="mt-5 w-full" disabled={selected || saving || code === "enterprise"} variant={selected ? "secondary" : "default"} onClick={() => void upgrade(code)}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {selected ? "当前套餐" : "升级"}
                </Button>
              </div>
            );
          })
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-2xl font-black text-white">订单系统</h2>
          <p className="mt-1 text-sm text-slate-400">记录套餐购买、支付状态、币种和渠道。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[190px_1fr_120px_120px_120px_150px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-bold text-slate-500">
              <span>订单号</span>
              <span>内容</span>
              <span>金额</span>
              <span>状态</span>
              <span>支付方式</span>
              <span>创建时间</span>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">暂无订单。</div>
            ) : (
              orders.map((order) => (
                <div key={asText(order.id)} className="grid grid-cols-[190px_1fr_120px_120px_120px_150px] gap-4 border-b border-white/10 px-5 py-4 text-sm">
                  <span className="truncate font-bold text-white">{asText(order.orderNo)}</span>
                  <span className="min-w-0 truncate text-slate-300">{asText(order.description, "套餐订单")}</span>
                  <span className="text-slate-300">{money(asNumber(order.amount), asText(order.currency, currency))}</span>
                  <span className="text-cyan-100">{asText(order.status)}</span>
                  <span className="text-slate-400">{asText(order.paymentProvider)}</span>
                  <span className="text-slate-500">{asText(order.createdAt).slice(0, 10)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-cyan-200" />
          <div>
            <h2 className="text-2xl font-black text-white">高级模型限制</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              免费版和专业版默认使用标准模型；团队版与企业版开启高级模型。后端会在 AI 请求前检查套餐权限，避免低套餐调用高成本模型。
            </p>
          </div>
        </div>
      </section>

      <AppModal
        open={Boolean(checkout)}
        title="订单支付"
        description="本地开发环境使用模拟支付完成套餐升级。"
        onClose={() => setCheckout(null)}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setCheckout(null)}>关闭</Button>
            <Button disabled={saving || asText((checkout?.order as RecordMap | undefined)?.status) === "paid"} onClick={() => void completePayment()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              模拟支付完成
            </Button>
          </div>
        }
      >
        {checkout && (
          <div className="grid gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-xs text-slate-500">订单号</p>
              <p className="mt-2 break-all font-bold text-white">{asText((checkout.order as RecordMap | undefined)?.orderNo)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-xs text-slate-500">支付状态</p>
              <p className="mt-2 font-bold text-cyan-100">{asText((checkout.order as RecordMap | undefined)?.status)}</p>
            </div>
          </div>
        )}
      </AppModal>
    </WorkspaceShell>
  );
}
