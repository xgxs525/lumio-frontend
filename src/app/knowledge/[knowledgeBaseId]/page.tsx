"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Database, FileText, Loader2, MessageCircle, Plus, Search, Settings, Sparkles, Upload, X } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type Rec = Record<string, unknown>;
function asText(v: unknown, fallback = "") { return typeof v === "string" ? v : fallback; }
function asNum(v: unknown, fallback = 0) { return typeof v === "number" ? v : fallback; }

const df = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
function distanceToNow(s: string) {
  const d = new Date(s); const ms = Date.now() - d.getTime(); const min = Math.floor(ms / 60000);
  if (min < 1) return "刚刚"; if (min < 60) return `${min} 分钟前`;
  const hrs = Math.floor(min / 60); if (hrs < 24) return `${hrs} 小时前`;
  return df.format(d);
}
function fmt(s: string) { return df.format(new Date(s)); }

const typeLabel: Record<string, string> = {
  file: "文件", pdf: "PDF", word: "Word", excel: "Excel", ppt: "PPT",
  document: "文档", manual: "手动录入", link: "网页链接", text: "文本", drive: "云盘文件",
};
const statusLabel: Record<string, string> = {
  uploading: "上传中", pending: "等待处理", processing: "处理中", synced: "已处理", completed: "已处理", failed: "处理失败", error: "处理失败",
};
const statusColor: Record<string, string> = {
  uploading: "bg-amber-50 text-amber-700", pending: "bg-slate-50 text-slate-600", processing: "bg-blue-50 text-blue-700",
  synced: "bg-emerald-50 text-emerald-700", completed: "bg-emerald-50 text-emerald-700", failed: "bg-red-50 text-red-700", error: "bg-red-50 text-red-700",
};
const visibilityLabel: Record<string, string> = { private: "私有", workspace: "成员可见", public: "公开" };

type Tab = "sources" | "chunks" | "qa" | "settings";

export default function KnowledgeDetailPage() {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("sources");
  const [base, setBase] = useState<Rec | null>(null);
  const [sources, setSources] = useState<Rec[]>([]);
  const [chunks, setChunks] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // QA
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Rec | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  // Delete source confirm
  const [deleteSource, setDeleteSource] = useState<Rec | null>(null);

  // Chunk search
  const [chunkSearch, setChunkSearch] = useState("");

  // Settings
  const [settingsForm, setSettingsForm] = useState({ name: "", description: "", visibility: "private" });
  const [deleteBaseOpen, setDeleteBaseOpen] = useState(false);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");
  const [deleteInput, setDeleteInput] = useState("");

  function openDeleteModal() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setDeleteConfirmCode(code);
    setDeleteInput("");
    setDeleteBaseOpen(true);
  }

  const expectedDeleteInput = base ? deleteConfirmCode + asText(base.name) : "";

  async function loadBase() {
    setLoading(true);
    try {
      const r = await api.getKnowledgeBase(knowledgeBaseId);
      const data = r.data as Rec;
      setBase(data);
      setSettingsForm({ name: asText(data.name), description: asText(data.description), visibility: asText(data.visibility, "private") });
    } catch (e) { toast.error("知识库加载失败"); setBase(null); }
    finally { setLoading(false); }
  }

  async function loadSources() {
    try {
      const r = await api.listKnowledgeSources(knowledgeBaseId);
      setSources(Array.isArray(r.data) ? r.data : []);
    } catch { setSources([]); }
  }

  useEffect(() => { loadBase(); }, [knowledgeBaseId]);
  useEffect(() => { if (base) loadSources(); }, [base, knowledgeBaseId]);

  function handleTabChange(t: Tab) { setTab(t); router.replace(`/knowledge/${knowledgeBaseId}?tab=${t}`, { scroll: false }); }

  async function removeSource() {
    if (!deleteSource) return;
    setSaving(true);
    try {
      await api.deleteKnowledgeSource(knowledgeBaseId, asText(deleteSource.id));
      setSources((prev) => prev.filter((s) => asText(s.id) !== asText(deleteSource.id)));
      setDeleteSource(null);
      toast.success("资料来源已删除。");
    } catch (e) { toast.error(e instanceof Error ? e.message : "删除失败"); }
    finally { setSaving(false); }
  }

  async function askBase() {
    if (!question.trim()) return;
    setQaLoading(true); setAnswer(null);
    try {
      const r = await api.askKnowledgeBase(knowledgeBaseId, { question: question.trim() });
      setAnswer(r.data);
    } catch (e) { toast.error(e instanceof Error ? e.message : "问答失败"); }
    finally { setQaLoading(false); }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await api.updateKnowledgeBase(knowledgeBaseId, settingsForm);
      setBase((prev) => prev ? { ...prev, ...settingsForm } : prev);
      toast.success("设置已保存。");
    } catch (e) { toast.error(e instanceof Error ? e.message : "保存失败"); }
    finally { setSaving(false); }
  }

  async function deleteBase() {
    setSaving(true);
    try {
      await api.deleteKnowledgeBase(knowledgeBaseId);
      router.push("/knowledge");
    } catch (e) { toast.error(e instanceof Error ? e.message : "删除失败"); }
    finally { setSaving(false); }
  }

  const filteredChunks = useMemo(() => {
    if (!chunkSearch.trim()) return chunks;
    const q = chunkSearch.toLowerCase();
    return chunks.filter((c) => asText(c.content).toLowerCase().includes(q) || asText(c.sourceTitle).toLowerCase().includes(q));
  }, [chunks, chunkSearch]);

  if (loading) return <WorkspaceShell active="知识库" title=""><div className="flex flex-col items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">加载知识库...</p></div></WorkspaceShell>;
  if (!base) return <WorkspaceShell active="知识库" title=""><div className="flex flex-col items-center py-16"><p className="text-slate-500">知识库未找到</p><Button className="mt-4" asChild><Link href="/knowledge">返回</Link></Button></div></WorkspaceShell>;

  return (
    <WorkspaceShell active="知识库" title="">
      {/* Header */}
      <div className="mb-6">
        <Link href="/knowledge" className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 hover:shadow">
          <ArrowLeft className="h-3.5 w-3.5" />返回
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">{asText(base.name)}</h1>
            <p className="mt-1 text-sm text-slate-500">{asText(base.description, "整理资料，让 AI 基于内容回答。")}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              <span>{visibilityLabel[asText(base.visibility, "private")] || "私有"}</span>
              <span>·</span>
              <span>{asText(base.updatedAt) ? fmt(asText(base.updatedAt)) : "—"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/knowledge/${knowledgeBaseId}/add-source`)}><Upload className="h-4 w-4" />添加资料</Button>
            <Button variant="secondary" onClick={() => handleTabChange("qa")}><MessageCircle className="h-4 w-4" />测试问答</Button>
            <Button variant="ghost" onClick={() => handleTabChange("settings")}><Settings className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {([
          ["sources", "资料来源", asNum(base.sourceCount)],
          ["chunks", "知识片段", asNum(base.chunkCount)],
          ["qa", "问答测试", undefined],
          ["settings", "设置", undefined],
        ] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => handleTabChange(key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${tab === key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {label}{count !== undefined && ` (${count})`}
          </button>
        ))}
      </div>

      {/* Tab: Sources */}
      {tab === "sources" && (
        sources.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <h3 className="mt-4 font-bold text-slate-500">还没有资料来源</h3>
            <p className="mt-1 text-sm text-slate-400">添加文件、文档、文本或链接，让 AI 基于这些资料回答问题。</p>
            <Button className="mt-4" onClick={() => router.push(`/knowledge/${knowledgeBaseId}/add-source`)}><Plus className="h-4 w-4" />添加资料</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.5fr_80px_100px_70px_120px_100px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>来源名称</span><span>类型</span><span>状态</span><span>片段数</span><span>添加时间</span><span>操作</span>
            </div>
            {sources.map((s) => {
              const tp = asText(s.sourceType, "manual");
              const st = asText(s.syncStatus, "pending");
              const title = asText(s.sourceId) ? `${typeLabel[tp] || tp} · ${asText(s.sourceId).slice(0, 24)}` : (typeLabel[tp] || tp);
              const meta = (s.metadata || {}) as Rec;
              return (
                <div key={asText(s.id)} className="flex flex-col gap-2 border-b border-slate-50 px-5 py-4 md:grid md:grid-cols-[1.5fr_80px_100px_70px_120px_100px] md:items-center md:gap-4">
                  <span className="text-sm font-medium text-slate-800 truncate">{title}</span>
                  <span className="text-xs text-slate-500">{typeLabel[tp] || tp}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium w-fit ${statusColor[st] || "bg-slate-50 text-slate-600"}`}>{statusLabel[st] || st}</span>
                  <span className="text-xs text-slate-500">{st === "processing" || st === "pending" ? "—" : asNum(meta.chunkCount)}</span>
                  <span className="text-xs text-slate-400">{asText(s.createdAt) ? distanceToNow(asText(s.createdAt)) : "—"}</span>
                  <div className="flex gap-1">
                    <button className="rounded p-1 text-xs text-slate-400 hover:text-slate-600">查看</button>
                    <button onClick={() => setDeleteSource(s)} className="rounded p-1 text-xs text-slate-400 hover:text-red-500">删除</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab: Chunks */}
      {tab === "chunks" && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="搜索片段" value={chunkSearch} onChange={(e) => setChunkSearch(e.target.value)} className="h-9 border-slate-200 bg-white pl-9 text-sm" />
            </div>
          </div>
          <div className="flex flex-col items-center py-16 text-center">
            <Database className="h-10 w-10 text-slate-300" />
            <h3 className="mt-4 font-bold text-slate-500">知识片段功能开发中</h3>
            <p className="mt-1 text-sm text-slate-400">添加资料并处理完成后，知识片段将在此展示。</p>
          </div>
        </>
      )}

      {/* Tab: QA */}
      {tab === "qa" && (
        sources.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MessageCircle className="h-10 w-10 text-slate-300" />
            <h3 className="mt-4 font-bold text-slate-500">先添加资料</h3>
            <p className="mt-1 text-sm text-slate-400">当前知识库还没有可用于回答的资料。</p>
            <Button className="mt-4" onClick={() => router.push(`/knowledge/${knowledgeBaseId}/add-source`)}>添加资料</Button>
          </div>
        ) : (
          <div className="max-w-2xl">
            <p className="text-sm text-slate-500 mb-4">输入问题，测试当前知识库能否给出基于资料的回答。</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="向当前知识库提问，例如：这个知识库里有哪些关键结论？"
                rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300" />
              <Button className="mt-3 w-full" onClick={askBase} disabled={qaLoading || !question.trim()}>
                {qaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}提问
              </Button>
            </div>
            {answer && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm leading-7 text-slate-700">{asText(answer.answer, asText(answer.content, "已生成回答。"))}</div>
                {Array.isArray(answer.citations) && (answer.citations as Rec[]).length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">引用来源</p>
                    {(answer.citations as Rec[]).map((c, i) => (
                      <div key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 mb-1">
                        {i + 1}. {asText(c.title, "知识片段")}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* Tab: Settings */}
      {tab === "settings" && (
        <div className="max-w-lg space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">名称</label>
              <Input value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">简介</label>
              <Input value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">可见范围</label>
              <select value={settingsForm.visibility} onChange={(e) => setSettingsForm({ ...settingsForm, visibility: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                {Object.entries(visibilityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Button onClick={saveSettings} disabled={saving}>{saving ? "保存中..." : "保存设置"}</Button>
          </div>
          <div className="rounded-2xl border border-red-100 bg-white p-6">
            <h4 className="text-sm font-bold text-red-700">删除知识库</h4>
            <p className="mt-1 text-xs text-slate-500">删除后，资料来源、知识片段和问答记录将无法恢复。</p>
            <Button className="mt-3" variant="secondary" onClick={openDeleteModal}>删除知识库</Button>
          </div>
        </div>
      )}

      {/* Delete source confirm */}
      <AppModal open={!!deleteSource} onClose={() => setDeleteSource(null)} title="删除资料来源">
        <p className="text-sm text-slate-600">确定删除此资料来源吗？</p>
        <p className="mt-2 text-xs text-slate-400">删除后，相关知识片段也会从当前知识库中移除。</p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteSource(null)}>取消</Button>
          <Button onClick={removeSource} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "删除中..." : "确认删除"}</Button>
        </div>
      </AppModal>

      {/* Delete base confirm */}
      <AppModal open={deleteBaseOpen} onClose={() => setDeleteBaseOpen(false)} title="确认删除知识库">
        <p className="text-sm text-slate-600">
          确定要删除 <strong className="text-red-600">{asText(base.name)}</strong> 吗？此操作不可撤销。
        </p>
        <p className="mt-2 text-xs text-slate-400">删除后，知识库中的资料来源、知识片段和问答记录将无法恢复。</p>
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50/50 p-4">
          <p className="text-xs font-semibold text-red-700 mb-3">请输入以下文字以确认删除：</p>
          <div className="mb-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-center">
            <code className="text-base font-bold tracking-wider text-red-600 select-all">{deleteConfirmCode}{asText(base?.name)}</code>
          </div>
          <input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={`输入上面的确认文字`}
            className="w-full h-[44px] rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
          />
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteBaseOpen(false)}>取消</Button>
          <Button
            onClick={deleteBase}
            disabled={saving || deleteInput !== expectedDeleteInput}
            className={deleteInput === expectedDeleteInput ? "bg-red-600 hover:bg-red-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}
          >
            {saving ? "删除中..." : "确认删除"}
          </Button>
        </div>
      </AppModal>
    </WorkspaceShell>
  );
}
