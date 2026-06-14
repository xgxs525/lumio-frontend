"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Globe2, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";

type RecordMap = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function asBool(value: unknown) {
  return value === true;
}

function formatBytes(value: number) {
  if (!value) return "不限";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`;
}

function money(amount: number, currency: string) {
  if (!amount) return "免费";
  const symbol: Record<string, string> = { CNY: "¥", USD: "$", EUR: "€", HKD: "HK$", JPY: "¥" };
  return `${symbol[currency] ?? `${currency} `}${amount.toLocaleString("zh-CN", { maximumFractionDigits: currency === "JPY" ? 0 : 2 })}`;
}

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState("CNY");
  const [region, setRegion] = useState("CN");
  const [plans, setPlans] = useState<RecordMap[]>([]);
  const [providers, setProviders] = useState<RecordMap[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("mock_cn");
  const [checkout, setCheckout] = useState<RecordMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const providerOptions = useMemo(() => providers.length ? providers : [{ code: "mock_cn", name: "序光模拟支付" }], [providers]);

  async function loadCatalog() {
    setLoading(true);
    setError("");
    try {
      const [planResult, providerResult] = await Promise.all([
        api.listBillingPlans({ billingCycle, currency, locale: "zh-CN" }),
        api.listPaymentProviders({ currency, region }),
      ]);
      setPlans(planResult.data);
      setProviders(providerResult.data);
      const firstProvider = asText(providerResult.data[0]?.code, "mock_cn");
      setSelectedProvider((current) => (providerResult.data.some((item) => asText(item.code) === current) ? current : firstProvider));
    } catch (err) {
      setError(err instanceof Error ? err.message : "价格数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalog();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [billingCycle, currency, region]);

  async function startCheckout(plan: RecordMap) {
    if (asText(plan.code) === "enterprise") {
      router.push("/enterprise");
      return;
    }
    if (!getStoredAuth()?.token) {
      router.push(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    setPaying(true);
    setError("");
    try {
      const result = await api.createBillingCheckout({
        plan_code: asText(plan.code),
        billing_cycle: billingCycle,
        currency,
        provider: selectedProvider,
        locale: "zh-CN",
        region,
      });
      setCheckout(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建订单失败");
    } finally {
      setPaying(false);
    }
  }

  async function completePayment() {
    const order = checkout?.order as RecordMap | undefined;
    const orderNo = asText(order?.orderNo);
    if (!orderNo) return;
    setPaying(true);
    setError("");
    try {
      const result = await api.completeMockPayment(orderNo);
      setCheckout({ ...checkout, ...result.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "支付确认失败");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)] lg:items-end">
        <div className="min-w-0">
          <Badge>商业化与规模化</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
            从个人试用到企业规模化，按团队真实用量购买 Lumio
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300/82 md:text-lg">
            套餐统一管理存储额度、AI 调用额度、团队成员上限、高级模型能力和企业版后台。国内支付与国际支付渠道已预留，后续可接入真实支付网关。
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <label className="grid gap-2 text-sm font-semibold text-white">
              账期
              <select
                className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                value={billingCycle}
                onChange={(event) => setBillingCycle(event.target.value as "monthly" | "yearly")}
              >
                <option value="monthly">月付</option>
                <option value="yearly">年付</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white">
              币种
              <select
                className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {["CNY", "USD", "EUR", "HKD", "JPY"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white">
              地区
              <select
                className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                {[
                  ["CN", "中国大陆"],
                  ["US", "美国"],
                  ["EU", "欧洲"],
                  ["HK", "中国香港"],
                  ["JP", "日本"],
                  ["SG", "新加坡"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-50">
              <Globe2 className="h-4 w-4" />
              国际化支付渠道
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {providerOptions.map((provider) => (
                <button
                  key={asText(provider.code)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    selectedProvider === asText(provider.code)
                      ? "border-cyan-200 bg-cyan-200 text-slate-950"
                      : "border-white/10 bg-white/[0.06] text-slate-300 hover:text-white"
                  }`}
                  onClick={() => setSelectedProvider(asText(provider.code))}
                  type="button"
                >
                  {asText(provider.name)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <div className="mt-8 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center text-slate-300">
            正在加载套餐...
          </div>
        ) : (
          plans.map((plan) => {
            const code = asText(plan.code);
            const featured = code === "team";
            const amount = billingCycle === "yearly" ? asNumber(plan.priceYearly) : asNumber(plan.priceMonthly);
            return (
              <article
                key={code}
                className={`flex min-w-0 flex-col rounded-3xl border p-5 ${
                  featured
                    ? "border-cyan-200/50 bg-cyan-200/10 shadow-[0_0_70px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black text-white">{asText(plan.displayName, asText(plan.name))}</h2>
                    <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-400">{asText(plan.description)}</p>
                  </div>
                  {featured && <span className="shrink-0 rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">推荐</span>}
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-black text-white">{code === "enterprise" ? "联系销售" : money(amount, currency)}</span>
                  {code !== "enterprise" && amount > 0 && <span className="ml-1 text-sm text-slate-400">/{billingCycle === "yearly" ? "年" : "月"}</span>}
                </div>
                <div className="mt-6 grid gap-3 text-sm text-slate-300">
                  {[
                    `存储额度：${formatBytes(asNumber(plan.storageQuota))}`,
                    `AI Token：${asNumber(plan.aiTokenQuota) ? asNumber(plan.aiTokenQuota).toLocaleString("zh-CN") : "不限"}`,
                    `AI 请求：${asNumber(plan.aiRequestQuota) ? asNumber(plan.aiRequestQuota).toLocaleString("zh-CN") : "不限"}`,
                    `团队成员：${asNumber(plan.memberLimit) ? `${asNumber(plan.memberLimit)} 人` : "不限"}`,
                    asBool(plan.advancedModelEnabled) ? "支持高级模型" : "标准模型能力",
                  ].map((item) => (
                    <p key={item} className="flex gap-2 leading-6">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                      <span className="min-w-0 break-words">{item}</span>
                    </p>
                  ))}
                </div>
                <Button
                  className="mt-7 w-full"
                  disabled={paying}
                  variant={featured ? "default" : "secondary"}
                  onClick={() => void startCheckout(plan)}
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {code === "free" ? "启用免费版" : code === "enterprise" ? "进入企业后台" : "购买升级"}
                </Button>
              </article>
            );
          })
        )}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        {[
          { icon: CreditCard, title: "订单系统", desc: "生成订单号、记录支付状态、账期和支付渠道。" },
          { icon: Sparkles, title: "AI 调用额度", desc: "聊天、文件问答、文档写作和知识库问答统一计量。" },
          { icon: ShieldCheck, title: "企业版后台", desc: "查看收入、套餐分布、国际支付渠道和企业级限制。" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <Icon className="mb-4 h-6 w-6 text-cyan-200" />
              <h3 className="text-xl font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
            </div>
          );
        })}
      </section>

      <AppModal
        open={Boolean(checkout)}
        title="确认订单"
        description="当前为本地开发环境的模拟支付。后续接入真实支付时，订单与支付记录结构保持不变。"
        onClose={() => setCheckout(null)}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setCheckout(null)}>关闭</Button>
            <Button disabled={paying || asText((checkout?.order as RecordMap | undefined)?.status) === "paid"} onClick={() => void completePayment()}>
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              模拟支付完成
            </Button>
          </div>
        }
      >
        {checkout && (
          <div className="grid gap-4 text-sm">
            {[
              ["订单号", asText((checkout.order as RecordMap | undefined)?.orderNo)],
              ["金额", money(asNumber((checkout.order as RecordMap | undefined)?.amount), asText((checkout.order as RecordMap | undefined)?.currency, currency))],
              ["状态", asText((checkout.order as RecordMap | undefined)?.status)],
              ["支付方式", asText((checkout.payment as RecordMap | undefined)?.provider, selectedProvider)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 break-all font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}
      </AppModal>
    </div>
  );
}
