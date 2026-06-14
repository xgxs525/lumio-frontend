"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, DatabaseZap, Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatDate(value: unknown) {
  const raw = text(value);
  if (!raw) return "-";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString("zh-CN");
}

export default function KnowledgeSourcesPage() {
  const params = useParams<{ knowledgeBaseId: string }>();
  const knowledgeBaseId = params.knowledgeBaseId;
  const [knowledge, setKnowledge] = useState<RecordMap>({});
  const [sources, setSources] = useState<RecordMap[]>([]);
  const [form, setForm] = useState({ source_type: "file", source_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
    setError("");
    setLoading(true);
    try {
      const [kbResult, sourceResult] = await Promise.all([
        api.getKnowledgeBase(knowledgeBaseId),
        api.listKnowledgeSources(knowledgeBaseId),
      ]);
      setKnowledge(kbResult.data);
      setSources(sourceResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库来源加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [knowledgeBaseId]);

  async function addSource() {
    if (!form.source_id.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.addKnowledgeSource(knowledgeBaseId, {
        source_type: form.source_type,
        source_id: form.source_id.trim(),
      });
      setForm((old) => ({ ...old, source_id: "" }));
      setNotice("来源已加入知识库。");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "加入来源失败");
    } finally {
      setSaving(false);
    }
  }

  async function syncSources() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.syncKnowledgeBase(knowledgeBaseId);
      setNotice(`同步完成：成功 ${String(result.data.synced ?? 0)}，失败 ${String(result.data.failed ?? 0)}。`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "同步知识库失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="知识库"
      title="知识库来源"
      subtitle="管理文件、文档等资料来源，并触发解析、切片和索引。"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href={`/knowledge/${knowledgeBaseId}`}>
              <ArrowLeft className="h-4 w-4" />
              返回知识库
            </Link>
          </Button>
          <Button disabled={saving} onClick={() => void syncSources()}>
            <RefreshCw className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
            同步索引
          </Button>
        </>
      }
      rightPanel={
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <DatabaseZap className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="break-words text-xl font-black text-white">{text(knowledge.name, "当前知识库")}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">来源进入知识库后，可用于知识库问答、引用来源和团队资料沉淀。</p>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <h2 className="text-xl font-black text-white">添加来源</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
          <select
            className="h-11 rounded-lg border border-white/15 bg-slate-950/35 px-3 text-white outline-none"
            value={form.source_type}
            onChange={(event) => setForm((old) => ({ ...old, source_type: event.target.value }))}
          >
            <option className="bg-slate-950" value="file">文件</option>
            <option className="bg-slate-950" value="document">文档</option>
            <option className="bg-slate-950" value="manual">手动资料</option>
          </select>
          <Input
            value={form.source_id}
            onChange={(event) => setForm((old) => ({ ...old, source_id: event.target.value }))}
            placeholder="输入文件 ID、文档 ID 或外部资料标识"
          />
          <Button disabled={!form.source_id.trim() || saving} onClick={() => void addSource()}>
            <Plus className="h-4 w-4" />
            加入
          </Button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-black text-white">来源列表</h2>
          <p className="mt-1 text-sm text-slate-400">共 {sources.length} 个来源。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[120px_minmax(220px,1fr)_140px_180px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-bold text-slate-500">
              <span>类型</span>
              <span>来源 ID</span>
              <span>状态</span>
              <span>创建时间</span>
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  正在加载...
                </div>
              ) : sources.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">暂无来源。</div>
              ) : (
                sources.map((source, index) => (
                  <div key={text(source.id, String(index))} className="grid grid-cols-[120px_minmax(220px,1fr)_140px_180px] gap-4 px-5 py-4 text-sm text-slate-300">
                    <span className="font-bold text-white">{text(source.sourceType, text(source.source_type, "file"))}</span>
                    <span className="break-all">{text(source.sourceId, text(source.source_id, "-"))}</span>
                    <span>{text(source.status, "indexed")}</span>
                    <span>{formatDate(source.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
