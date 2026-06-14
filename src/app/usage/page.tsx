"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, Cloud, Database, Loader2, RefreshCw } from "lucide-react";

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

function formatBytes(value: unknown) {
  const bytes = asNumber(value);
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function usageLabel(type: unknown) {
  return (
    {
      ai_tokens: "AI 调用",
      embedding_tokens: "向量化",
      storage_bytes: "存储",
      file_parse: "文件解析",
      export: "导出",
    }[asText(type)] ?? asText(type, "未知用量")
  );
}

export default function UsagePage() {
  const [summary, setSummary] = useState<RecordMap>({});
  const [records, setRecords] = useState<RecordMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const aiPercent = Math.min(100, asNumber(summary.aiPercent));
  const storagePercent = Math.min(100, asNumber(summary.storagePercent));

  const totals = useMemo(() => {
    const tokenRecords = records.filter((item) => ["ai_tokens", "embedding_tokens"].includes(asText(item.usageType)));
    return {
      tokenEvents: tokenRecords.length,
      cost: records.reduce((sum, item) => sum + asNumber(item.cost), 0),
    };
  }, [records]);

  async function loadUsage() {
    setError("");
    setLoading(true);
    try {
      const [summaryResult, recordResult] = await Promise.all([
        api.usageSummary(),
        api.listUsageRecords({ limit: 120 }),
      ]);
      setSummary(summaryResult.data);
      setRecords(recordResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "用量数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsage();
  }, []);

  return (
    <WorkspaceShell
      active="用量统计"
      title="用量统计"
      subtitle="查看存储空间、AI token、embedding、文件解析和后续商业化额度消耗。"
      actions={
        <Button variant="secondary" onClick={() => void loadUsage()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新用量
        </Button>
      }
      rightPanel={
        <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
          <BarChart3 className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="text-xl font-black text-white">额度说明</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            当前页面已经接入真实用量接口。外部 AI、embedding、OSS、短信、邮件和支付接入后，会继续把消耗写入用量记录。
          </p>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "当前套餐", value: asText(summary.plan, "free"), desc: "工作空间订阅档位", icon: Database },
          { label: "文件数量", value: String(asNumber(summary.fileCount)), desc: "当前空间有效文件", icon: Cloud },
          { label: "AI 事件", value: String(totals.tokenEvents), desc: "调用与向量化记录", icon: Brain },
          { label: "预估成本", value: `¥${totals.cost.toFixed(2)}`, desc: "后续可接真实计费", icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <Icon className="h-6 w-6 text-cyan-200" />
              <p className="mt-5 text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 truncate text-3xl font-black text-white">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {[
          { title: "存储额度", used: formatBytes(summary.storageUsed), quota: formatBytes(summary.storageQuota), percent: storagePercent },
          { title: "AI 调用额度", used: `${Math.round(asNumber(summary.aiTokensUsed)).toLocaleString()} tokens`, quota: `${asNumber(summary.aiQuota).toLocaleString()} tokens`, percent: aiPercent },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-white">{item.title}</h2>
              <span className="text-sm font-bold text-cyan-100">{item.percent.toFixed(1)}%</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${item.percent}%` }} />
            </div>
            <p className="mt-4 text-sm text-slate-400">
              已用 {item.used} / 总额 {item.quota}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-black text-white">用量明细</h2>
          <p className="mt-1 text-sm text-slate-400">记录 AI 调用、embedding、文件解析、导出和后续商业化事件。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[180px_140px_120px_120px_minmax(160px,1fr)] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>类型</span>
              <span>数量</span>
              <span>单位</span>
              <span>成本</span>
              <span>时间</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                正在加载用量...
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">暂无用量记录。完成文件 AI、embedding 或导出后会显示在这里。</div>
            ) : (
              <div className="divide-y divide-white/10">
                {records.map((item) => (
                  <div key={asText(item.id)} className="grid grid-cols-[180px_140px_120px_120px_minmax(160px,1fr)] gap-4 px-5 py-4 text-sm text-slate-300">
                    <span className="font-bold text-white">{usageLabel(item.usageType)}</span>
                    <span>{asNumber(item.quantity).toLocaleString()}</span>
                    <span>{asText(item.unit, "-")}</span>
                    <span>¥{asNumber(item.cost).toFixed(4)}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
