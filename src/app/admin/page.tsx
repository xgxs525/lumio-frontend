"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CreditCard, Database, Loader2, RefreshCw, ShieldCheck, Users, Workflow, Zap } from "lucide-react";

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

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function integrationStatus(item: unknown) {
  const value = item && typeof item === "object" ? (item as RecordMap) : {};
  return asText(value.mode, asText(value.provider, "未配置"));
}

export default function AdminPage() {
  const [overview, setOverview] = useState<RecordMap>({});
  const [users, setUsers] = useState<RecordMap[]>([]);
  const [workspaces, setWorkspaces] = useState<RecordMap[]>([]);
  const [jobs, setJobs] = useState<RecordMap[]>([]);
  const [commerce, setCommerce] = useState<RecordMap>({});
  const [logs, setLogs] = useState<RecordMap[]>([]);
  const [integrations, setIntegrations] = useState<RecordMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const metrics = useMemo(() => {
    const raw = overview.metrics && typeof overview.metrics === "object" ? (overview.metrics as RecordMap) : {};
    return raw;
  }, [overview]);

  async function loadAdmin() {
    setError("");
    setLoading(true);
    try {
      const [overviewResult, userResult, workspaceResult, jobResult, commerceResult, logResult, integrationResult] =
        await Promise.all([
          api.adminOverview(),
          api.adminUsers(),
          api.adminWorkspaces(),
          api.adminJobs(),
          api.adminCommerce(),
          api.adminAuditLogs(),
          api.integrationsStatus(),
        ]);
      setOverview(overviewResult.data);
      setUsers(userResult.data);
      setWorkspaces(workspaceResult.data);
      setJobs(jobResult.data);
      setCommerce(commerceResult.data);
      setLogs(logResult.data);
      setIntegrations(integrationResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "后台数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdmin();
  }, []);

  const workspace = overview.workspace && typeof overview.workspace === "object" ? (overview.workspace as RecordMap) : {};
  const orders = Array.isArray(commerce.orders) ? (commerce.orders as RecordMap[]) : [];

  return (
    <WorkspaceShell
      active="后台管理"
      title="后台管理"
      subtitle="集中查看工作空间、成员、任务、订单、集成状态和审计日志。"
      actions={
        <Button variant="secondary" onClick={() => void loadAdmin()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新后台
        </Button>
      }
      rightPanel={
        <div className="space-y-4">
          <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
            <ShieldCheck className="mb-4 h-7 w-7 text-cyan-200" />
            <h2 className="text-xl font-black text-white">企业版后台</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              当前先面向工作空间所有者开放。后续可扩展为平台总后台、企业租户后台和运营管理后台。
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-black text-white">外部服务</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {["ai", "embedding", "storage", "payment", "sms", "email"].map((key) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.06] px-4 py-3">
                  <span className="font-bold text-white">{key.toUpperCase()}</span>
                  <span className="max-w-[160px] truncate text-slate-400">{integrationStatus(integrations[key])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "文件", value: metrics.files, icon: Database },
          { label: "任务", value: metrics.jobs, icon: Workflow },
          { label: "成员", value: metrics.members, icon: Users },
          { label: "用量记录", value: metrics.usageRecords, icon: Zap },
          { label: "订单", value: metrics.orders, icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <Icon className="h-6 w-6 text-cyan-200" />
              <p className="mt-5 text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{asNumber(item.value).toLocaleString()}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{asText(workspace.name, "当前工作空间")}</h2>
            <p className="mt-2 text-sm text-slate-400">
              套餐：{asText(workspace.plan, "free")} · Slug：{asText(workspace.slug, "-")}
            </p>
          </div>
          <BriefcaseBusiness className="h-10 w-10 text-cyan-200" />
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-black text-white">成员概览</h2>
            <p className="mt-1 text-sm text-slate-400">这里只展示姓名、角色和状态，详细成员管理后续放到独立团队页面。</p>
          </div>
          <div className="divide-y divide-white/10">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                正在加载成员...
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">暂无成员。</div>
            ) : (
              users.slice(0, 6).map((item) => (
                <div key={asText(item.memberId)} className="flex min-w-0 items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{asText(item.name, "未命名成员")}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{asText(item.status, "active")}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">成员</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-black text-white">最近任务</h2>
            <p className="mt-1 text-sm text-slate-400">文件 AI、知识库索引和导出任务会进入这里。</p>
          </div>
          <div className="divide-y divide-white/10">
            {jobs.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">暂无任务。</div>
            ) : (
              jobs.slice(0, 6).map((item) => (
                <div key={asText(item.id)} className="grid grid-cols-[minmax(0,1fr)_100px_120px] gap-4 p-5 text-sm">
                  <span className="truncate font-bold text-white">{asText(item.type, "任务")}</span>
                  <span className="text-slate-300">{asText(item.status, "pending")}</span>
                  <span className="text-right text-slate-500">{formatDate(item.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-black text-white">工作空间</h2>
          </div>
          <div className="divide-y divide-white/10">
            {workspaces.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">暂无工作空间。</div>
            ) : (
              workspaces.slice(0, 6).map((item) => (
                <div key={asText(item.id)} className="grid grid-cols-[minmax(0,1fr)_120px] gap-4 p-5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{asText(item.name)}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{asText(item.slug)}</p>
                  </div>
                  <span className="text-right text-slate-300">{asText(item.plan, "free")}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-black text-white">订单与审计</h2>
          </div>
          <div className="grid gap-4 p-5">
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <p className="text-sm font-bold text-white">最近订单</p>
              <p className="mt-2 text-sm text-slate-400">{orders.length ? `${orders.length} 条订单记录` : "暂无订单，支付通道当前可先使用 mock 模式。"}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <p className="text-sm font-bold text-white">审计日志</p>
              <p className="mt-2 text-sm text-slate-400">{logs.length ? `${logs.length} 条最近操作` : "暂无审计日志。"}</p>
            </div>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
