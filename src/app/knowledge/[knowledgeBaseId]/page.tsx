"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, DatabaseZap, FilePlus2, Loader2, RefreshCw, Save, Search, Settings, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function sourceLabel(source: RecordMap) {
  const type = asText(source.sourceType, asText(source.source_type, "manual"));
  if (type === "file") return "文件";
  if (type === "document") return "文档";
  return "手动来源";
}

export default function KnowledgeDetailPage() {
  const params = useParams<{ knowledgeBaseId: string }>();
  const knowledgeBaseId = params.knowledgeBaseId;
  const [base, setBase] = useState<RecordMap>({});
  const [sources, setSources] = useState<RecordMap[]>([]);
  const [files, setFiles] = useState<RecordMap[]>([]);
  const [documents, setDocuments] = useState<RecordMap[]>([]);
  const [sourceType, setSourceType] = useState<"file" | "document" | "manual">("file");
  const [sourceId, setSourceId] = useState("");
  const [question, setQuestion] = useState("这个知识库里有哪些关键结论？");
  const [answer, setAnswer] = useState<RecordMap | null>(null);
  const [form, setForm] = useState({ name: "", description: "", visibility: "private" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const stats = useMemo(
    () => [
      ["资料来源", String(sources.length)],
      ["知识片段", String(asNumber(base.chunkCount))],
      ["可见范围", asText(base.visibility, "private")],
      ["更新时间", formatDate(base.updatedAt)],
    ],
    [base, sources.length],
  );

  const loadBase = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [baseResult, sourceResult, fileResult, docResult] = await Promise.all([
        api.getKnowledgeBase(knowledgeBaseId),
        api.listKnowledgeSources(knowledgeBaseId),
        api.listDriveFiles(),
        api.listDocuments(),
      ]);
      setBase(baseResult.data);
      setSources(sourceResult.data);
      setFiles(fileResult.data);
      setDocuments(docResult.data);
      setForm({
        name: asText(baseResult.data.name),
        description: asText(baseResult.data.description),
        visibility: asText(baseResult.data.visibility, "private"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库详情加载失败");
    } finally {
      setLoading(false);
    }
  }, [knowledgeBaseId]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  async function saveSettings() {
    if (!form.name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.updateKnowledgeBase(knowledgeBaseId, {
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
      });
      setBase(result.data);
      setNotice("知识库设置已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存设置失败");
    } finally {
      setBusy(false);
    }
  }

  async function addSource() {
    if (sourceType !== "manual" && !sourceId) {
      setError("请选择要加入知识库的文件或文档。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.addKnowledgeSource(knowledgeBaseId, {
        source_type: sourceType,
        source_id: sourceType === "manual" ? knowledgeBaseId : sourceId,
      });
      setSourceId("");
      setNotice("资料来源已加入，并完成切片与向量索引。");
      await loadBase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "加入资料来源失败");
    } finally {
      setBusy(false);
    }
  }

  async function syncBase() {
    setBusy(true);
    setError("");
    try {
      const result = await api.syncKnowledgeBase(knowledgeBaseId);
      setNotice(`知识库同步完成：${asNumber(result.data.syncedSources)} 个来源已更新。`);
      await loadBase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "同步知识库失败");
    } finally {
      setBusy(false);
    }
  }

  async function askBase() {
    if (!question.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.askKnowledgeBase(knowledgeBaseId, { question });
      setAnswer(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库问答失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell
      active="知识库"
      title={asText(base.name, "知识库详情")}
      subtitle="独立知识库详情页，支持设置、登记来源、同步索引、问答和引用来源查看。"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href="/knowledge">
              <ArrowLeft className="h-4 w-4" />
              返回知识库
            </Link>
          </Button>
          <Button onClick={() => void syncBase()} disabled={busy || loading}>
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            同步索引
          </Button>
        </>
      }
      rightPanel={
        <div className="space-y-4">
          <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
            <DatabaseZap className="mb-4 h-7 w-7 text-cyan-200" />
            <h2 className="text-xl font-black text-white">知识问答</h2>
            <textarea
              className="mt-4 min-h-28 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-300"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <Button className="mt-3 w-full" disabled={busy || !question.trim()} onClick={() => void askBase()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              提问
            </Button>
          </div>
          {answer && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <h2 className="text-xl font-black text-white">回答</h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{asText(answer.answer)}</p>
              <div className="mt-4 grid gap-2">
                {(Array.isArray(answer.citations) ? answer.citations : []).slice(0, 5).map((item, index) => {
                  const citation = item as RecordMap;
                  return (
                    <div key={`${asText(citation.sourceId)}-${index}`} className="rounded-2xl bg-slate-950/45 p-3 text-xs text-slate-300">
                      引用 {index + 1}：{asText(citation.title, "知识片段")}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 truncate text-sm font-bold text-white" title={value}>{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-cyan-200" />
            <h2 className="text-2xl font-black text-white">基础信息</h2>
          </div>
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-white">
              名称
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white">
              简介
              <textarea
                className="min-h-28 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none focus:ring-2 focus:ring-cyan-300"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white">
              可见范围
              <select
                className="h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
                value={form.visibility}
                onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
              >
                <option className="bg-slate-950" value="private">仅当前知识库成员可见</option>
                <option className="bg-slate-950" value="workspace">当前工作空间可见</option>
                <option className="bg-slate-950" value="public">公开可见</option>
              </select>
            </label>
            <Button className="w-fit" onClick={() => void saveSettings()} disabled={busy || !form.name.trim()}>
              <Save className="h-4 w-4" />
              保存设置
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="flex items-center gap-3">
            <FilePlus2 className="h-6 w-6 text-cyan-200" />
            <h2 className="text-2xl font-black text-white">加入资料来源</h2>
          </div>
          <div className="mt-6 grid gap-4">
            <select
              className="h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
              value={sourceType}
              onChange={(event) => {
                setSourceType(event.target.value as "file" | "document" | "manual");
                setSourceId("");
              }}
            >
              <option className="bg-slate-950" value="file">云盘文件</option>
              <option className="bg-slate-950" value="document">在线文档</option>
              <option className="bg-slate-950" value="manual">手动来源</option>
            </select>
            {sourceType !== "manual" && (
              <select
                className="h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
              >
                <option className="bg-slate-950" value="">请选择来源</option>
                {(sourceType === "file" ? files : documents).map((item) => (
                  <option className="bg-slate-950" key={asText(item.id)} value={asText(item.id)}>
                    {asText(item.name, asText(item.title, "未命名资料"))}
                  </option>
                ))}
              </select>
            )}
            <Button onClick={() => void addSource()} disabled={busy || (sourceType !== "manual" && !sourceId)}>
              <Upload className="h-4 w-4" />
              登记并索引
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="text-xl font-black text-white">资料来源</h2>
            <p className="mt-1 text-sm text-slate-400">文件和文档加入知识库后，会在这里显示索引状态。</p>
          </div>
          <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-400">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">可在右侧直接问答</span>
          </label>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[160px_minmax(220px,1fr)_160px_160px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>类型</span>
              <span>来源 ID</span>
              <span>同步状态</span>
              <span>登记时间</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">正在加载来源...</div>
            ) : sources.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">暂无资料来源。先加入云盘文件或在线文档。</div>
            ) : (
              <div className="divide-y divide-white/10">
                {sources.map((source) => (
                  <div key={asText(source.id)} className="grid grid-cols-[160px_minmax(220px,1fr)_160px_160px] gap-4 px-5 py-4 text-sm text-slate-300">
                    <span className="font-bold text-white">{sourceLabel(source)}</span>
                    <span className="truncate">{asText(source.sourceId, "-")}</span>
                    <span>{asText(source.syncStatus, "indexed")}</span>
                    <span>{formatDate(source.createdAt)}</span>
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
