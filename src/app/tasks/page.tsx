"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, Plus, RefreshCw, Workflow, XCircle } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type JobRecord = Record<string, unknown>;

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

function jobTitle(job: JobRecord) {
  const input = job.input && typeof job.input === "object" ? (job.input as Record<string, unknown>) : {};
  return asText(input.title, asText(job.type, "未命名任务"));
}

function jobDetail(job: JobRecord) {
  const input = job.input && typeof job.input === "object" ? (job.input as Record<string, unknown>) : {};
  const output = job.output && typeof job.output === "object" ? (job.output as Record<string, unknown>) : {};
  return asText(output.summary, asText(input.description, "等待执行"));
}

function statusLabel(status: string) {
  return (
    {
      pending: "排队中",
      running: "处理中",
      success: "已完成",
      failed: "失败",
      cancelled: "已取消",
    }[status] ?? status
  );
}

function statusIcon(status: string) {
  if (status === "success") return CheckCircle2;
  if (status === "failed" || status === "cancelled") return XCircle;
  if (status === "running") return Loader2;
  return Clock3;
}

export default function TasksPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "总结最近上传文件",
    type: "ai_summary",
    description: "读取最近文件并生成摘要、行动项和风险提示。",
  });

  const stats = useMemo(() => {
    const running = jobs.filter((item) => asText(item.status) === "running").length;
    const pending = jobs.filter((item) => asText(item.status) === "pending").length;
    const done = jobs.filter((item) => asText(item.status) === "success").length;
    return { running, pending, done };
  }, [jobs]);

  async function loadJobs() {
    setLoading(true);
    try {
      const result = await api.listJobs();
      setJobs(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "任务加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createTask() {
    if (!taskForm.title.trim()) return;
    setBusy(true);
    try {
      await api.createJob({
        type: taskForm.type,
        input: {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
        },
      });
      setCreateOpen(false);
      toast.success("任务已创建，后续可由 Celery/队列持续执行。");
      await loadJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建任务失败");
    } finally {
      setBusy(false);
    }
  }

  async function markRunning(job: JobRecord) {
    setBusy(true);
    try {
      await api.updateJob(asText(job.id), { status: "running", progress: 35 });
      await loadJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新任务失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell
      active="任务中心"
      title="任务中心"
      subtitle="集中查看文件解析、AI 处理、自动化流程和导出任务的执行状态。"
      actions={
        <>
          <Button onClick={() => setCreateOpen(true)} disabled={busy}>
            <Plus className="h-4 w-4" />
            新建任务
          </Button>
          <Button variant="secondary" onClick={() => void loadJobs()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新任务
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["运行中", String(stats.running)],
          ["等待处理", String(stats.pending)],
          ["已完成", String(stats.done)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-black text-white">任务列表</h2>
          <p className="mt-1 text-sm text-slate-400">来自后端 jobs 表，文件解析、知识库索引和 AI 处理都会进入这里。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(220px,1fr)_120px_minmax(260px,1.2fr)_160px_110px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>任务</span>
              <span>状态</span>
              <span>说明</span>
              <span>进度</span>
              <span className="text-right">操作</span>
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">正在加载任务...</div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">暂无任务，点击“新建任务”创建一条。</div>
              ) : (
                jobs.map((job) => {
                  const status = asText(job.status);
                  const Icon = statusIcon(status);
                  const progress = asNumber(job.progress);
                  return (
                    <div key={asText(job.id)} className="grid grid-cols-[minmax(220px,1fr)_120px_minmax(260px,1.2fr)_160px_110px] items-center gap-4 px-5 py-4 text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                          <Icon className={`h-5 w-5 ${status === "running" ? "animate-spin" : ""}`} />
                        </span>
                        <span className="min-w-0 truncate font-semibold text-white" title={jobTitle(job)}>{jobTitle(job)}</span>
                      </div>
                      <span className="text-slate-300">{statusLabel(status)}</span>
                      <span className="min-w-0 truncate text-slate-400" title={jobDetail(job)}>{jobDetail(job)}</span>
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{progress}% · {formatDate(job.createdAt)}</p>
                      </div>
                      <span className="flex justify-end">
                        <Button variant="ghost" size="sm" disabled={status === "running" || status === "success" || busy} onClick={() => void markRunning(job)}>
                          开始
                        </Button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-cyan-200/20 bg-gradient-to-r from-cyan-300/12 to-blue-500/12 p-6">
        <Workflow className="mb-4 h-6 w-6 text-cyan-200" />
        <h2 className="text-2xl font-black text-white">自动化流程</h2>
        <p className="mt-2 max-w-3xl leading-7 text-slate-300/78">
          二期先完成任务表、状态流转和前端闭环；后续可把上传解析、摘要生成、知识库索引和团队通知串成可配置流程。
        </p>
      </section>

      <AppModal
        description="配置任务名称、处理类型和执行说明，创建后进入任务列表等待执行。"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button disabled={!taskForm.title.trim() || busy} onClick={() => void createTask()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              创建任务
            </Button>
          </div>
        }
        open={createOpen}
        size="md"
        title="新建任务"
        onClose={() => setCreateOpen(false)}
      >
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-white">
            任务名称
            <Input
              value={taskForm.title}
              onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="例如：总结最近上传文件"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white">
            任务类型
            <select
              className="h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
              value={taskForm.type}
              onChange={(event) => setTaskForm((current) => ({ ...current, type: event.target.value }))}
            >
              <option className="bg-slate-950" value="ai_summary">AI 摘要</option>
              <option className="bg-slate-950" value="file_parse">文件解析</option>
              <option className="bg-slate-950" value="knowledge_index">知识库索引</option>
              <option className="bg-slate-950" value="export_report">导出报告</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white">
            执行说明
            <textarea
              className="min-h-28 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-cyan-300"
              value={taskForm.description}
              onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="描述任务要处理的文件、目标结果或交付格式"
            />
          </label>
        </div>
      </AppModal>
    </WorkspaceShell>
  );
}
