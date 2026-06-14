"use client";

import { useEffect, useState } from "react";
import { Building2, CreditCard, Database, Globe2, RefreshCw, ShieldCheck, Users } from "lucide-react";

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

function money(value: number) {
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

export default function EnterprisePage() {
  const [overview, setOverview] = useState<RecordMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const result = await api.enterpriseBillingOverview();
      setOverview(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "企业后台数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const plans = Array.isArray(overview.plans) ? (overview.plans as RecordMap[]) : [];
  const providers = Array.isArray(overview.providers) ? (overview.providers as RecordMap[]) : [];

  return (
    <WorkspaceShell
      active="企业后台"
      title="企业版后台"
      subtitle="面向商业化运营、企业客户交付和规模化管理的后台入口。"
      actions={
        <Button variant="secondary" onClick={() => void loadOverview()}>
          <RefreshCw className="h-4 w-4" />
          刷新数据
        </Button>
      }
      rightPanel={
        <div className="space-y-4 2xl:sticky 2xl:top-24">
          <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
            <ShieldCheck className="mb-4 h-6 w-6 text-cyan-200" />
            <h2 className="text-xl font-black text-white">企业能力</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">私有化部署、API 接入、审计日志、权限策略和专属服务是企业版重点能力。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <Globe2 className="mb-4 h-5 w-5 text-cyan-200" />
            <h3 className="font-bold text-white">国际化支付</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">国内渠道用于人民币结算，Stripe/PayPal 用于海外客户，订单模型已统一。</p>
          </div>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Building2, label: "工作区", value: asNumber(overview.workspaceCount) },
          { icon: Users, label: "活跃订阅", value: asNumber(overview.activeSubscriptions) },
          { icon: CreditCard, label: "已支付订单", value: asNumber(overview.paidOrders) },
          { icon: Database, label: "人民币收入", value: money(asNumber(overview.revenueCny)) },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <Icon className="mb-4 h-5 w-5 text-cyan-200" />
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 break-words text-3xl font-black text-white">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-2xl font-black text-white">套餐系统</h2>
            <p className="mt-1 text-sm text-slate-400">查看各套餐订阅分布，为定价和转化分析提供基础。</p>
          </div>
          <div className="divide-y divide-white/10">
            {loading ? (
              <div className="p-6 text-sm text-slate-400">正在加载...</div>
            ) : plans.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">暂无套餐数据。</div>
            ) : (
              plans.map((plan) => (
                <div key={asText(plan.code)} className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{asText(plan.name)}</p>
                    <p className="mt-1 text-xs text-slate-500">{asText(plan.code)}</p>
                  </div>
                  <p className="text-right text-xl font-black text-cyan-100">{asNumber(plan.subscriptions)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-2xl font-black text-white">支付系统</h2>
            <p className="mt-1 text-sm text-slate-400">按渠道和状态统计支付记录。</p>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1fr_110px_100px_120px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-bold text-slate-500">
                <span>渠道</span>
                <span>状态</span>
                <span>笔数</span>
                <span>金额</span>
              </div>
              {providers.length === 0 ? (
                <div className="p-6 text-sm text-slate-400">暂无支付记录。</div>
              ) : (
                providers.map((item, index) => (
                  <div key={`${asText(item.provider)}-${asText(item.status)}-${index}`} className="grid grid-cols-[1fr_110px_100px_120px] gap-4 border-b border-white/10 px-5 py-4 text-sm">
                    <span className="truncate font-bold text-white">{asText(item.provider)}</span>
                    <span className="text-cyan-100">{asText(item.status)}</span>
                    <span className="text-slate-300">{asNumber(item.count)}</span>
                    <span className="text-slate-300">{money(asNumber(item.amount))}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        <h2 className="text-2xl font-black text-white">商业化限制策略</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["存储额度", "上传和新建文件前检查剩余额度，超额返回升级提示。"],
            ["AI 调用额度", "聊天、文件问答、知识库问答和文档 AI 写作统一记录 token。"],
            ["团队成员限制", "邀请成员前检查当前套餐成员上限。"],
            ["高级模型限制", "高级模型仅团队版和企业版开放。"],
            ["国际化语言", "套餐接口支持 locale，前端预留中英文展示。"],
            ["国际化支付", "渠道按币种和地区筛选，支持后续接真实支付商。"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="font-bold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceShell>
  );
}
