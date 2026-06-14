"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DatabaseZap, FileText, Loader2, Plus, Search, Settings, Sparkles, Upload } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

const coverColors = [
  "from-slate-700 to-slate-950",
  "from-orange-400 to-amber-500",
  "from-cyan-400 to-teal-400",
  "from-blue-500 to-cyan-300",
  "from-fuchsia-500 to-pink-500",
  "from-emerald-500 to-lime-500",
];

const visibilityOptions = [
  { value: "private", label: "仅当前知识库成员可见" },
  { value: "workspace", label: "当前工作空间可见" },
  { value: "public", label: "公开可见" },
];

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function visibilityLabel(value: unknown) {
  return visibilityOptions.find((item) => item.value === value)?.label ?? "仅成员可见";
}

function sourceLabel(source: RecordMap) {
  const type = asText(source.sourceType, asText(source.source_type, "manual"));
  if (type === "file") return "文件";
  if (type === "document") return "文档";
  return "手动来源";
}

export default function KnowledgePage() {
  const [bases, setBases] = useState<RecordMap[]>([]);
  const [files, setFiles] = useState<RecordMap[]>([]);
  const [documents, setDocuments] = useState<RecordMap[]>([]);
  const [sources, setSources] = useState<RecordMap[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [settingsBase, setSettingsBase] = useState<RecordMap | null>(null);
  const [activeBaseId, setActiveBaseId] = useState("");
  const [sourceType, setSourceType] = useState<"file" | "document" | "manual">("file");
  const [sourceId, setSourceId] = useState("");
  const [question, setQuestion] = useState("这个知识库里有哪些关键结论？");
  const [answer, setAnswer] = useState<RecordMap | null>(null);
  const [form, setForm] = useState({ name: "", description: "", visibility: "private" });

  const activeBase = useMemo(
    () => bases.find((item) => asText(item.id) === activeBaseId) ?? bases[0],
    [activeBaseId, bases],
  );

  const filteredBases = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return bases;
    return bases.filter((item) => {
      const name = asText(item.name).toLowerCase();
      const description = asText(item.description).toLowerCase();
      return name.includes(keyword) || description.includes(keyword);
    });
  }, [bases, query]);

  async function loadKnowledgeBases(nextActiveId?: string) {
    setError("");
    setLoading(true);
    try {
      const [kbResult, fileResult, docResult] = await Promise.all([
        api.listKnowledgeBases(),
        api.listDriveFiles(),
        api.listDocuments(),
      ]);
      setBases(kbResult.data);
      setFiles(fileResult.data);
      setDocuments(docResult.data);
      const selectedId = nextActiveId || activeBaseId || asText(kbResult.data[0]?.id);
      setActiveBaseId(selectedId);
      if (selectedId) {
        const sourceResult = await api.listKnowledgeSources(selectedId);
        setSources(sourceResult.data);
      } else {
        setSources([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadKnowledgeBases();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshSources(baseId = activeBaseId) {
    if (!baseId) {
      setSources([]);
      return;
    }
    const result = await api.listKnowledgeSources(baseId);
    setSources(result.data);
  }

  async function createBase() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.createKnowledgeBase({
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
      });
      setForm({ name: "", description: "", visibility: "private" });
      setCreateOpen(false);
      setNotice("知识库已创建。");
      await loadKnowledgeBases(asText(result.data.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建知识库失败");
    } finally {
      setSaving(false);
    }
  }

  function openSettings(base: RecordMap) {
    setSettingsBase(base);
    setForm({
      name: asText(base.name),
      description: asText(base.description),
      visibility: asText(base.visibility, "private"),
    });
  }

  async function saveSettings() {
    if (!settingsBase || !form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.updateKnowledgeBase(asText(settingsBase.id), {
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
      });
      setBases((items) => items.map((item) => (asText(item.id) === asText(result.data.id) ? result.data : item)));
      setSettingsBase(null);
      setNotice("知识库设置已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存知识库设置失败");
    } finally {
      setSaving(false);
    }
  }

  async function addSource() {
    const baseId = activeBaseId || asText(activeBase?.id);
    if (!baseId) return;
    if (sourceType !== "manual" && !sourceId) {
      setError("请选择要加入知识库的文件或文档。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.addKnowledgeSource(baseId, {
        source_type: sourceType,
        source_id: sourceType === "manual" ? undefined : sourceId,
      });
      setSourceOpen(false);
      setSourceId("");
      setNotice("资料来源已登记，并完成知识切片与索引。");
      await loadKnowledgeBases(baseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加资料来源失败");
    } finally {
      setSaving(false);
    }
  }

  async function askKnowledge() {
    const baseId = activeBaseId || asText(activeBase?.id);
    if (!baseId || !question.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.askKnowledgeBase(baseId, { question });
      setAnswer(result.data);
      await refreshSources(baseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库问答失败");
    } finally {
      setSaving(false);
    }
  }

  function selectBase(base: RecordMap) {
    const id = asText(base.id);
    setActiveBaseId(id);
    setAnswer(null);
    void refreshSources(id);
  }

  return (
    <WorkspaceShell
      active="知识库"
      title="知识库"
      subtitle="新建知识库、登记文件和文档来源，让 Lumio 自动切片、向量化，并支持带引用来源的知识问答。"
      actions={
        <>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            新建知识库
          </Button>
          <Button variant="secondary" disabled={!activeBase || saving} onClick={() => setSourceOpen(true)}>
            <Upload className="h-4 w-4" />
            添加资料来源
          </Button>
        </>
      }
      rightPanel={
        <div className="space-y-4 2xl:sticky 2xl:top-24">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <DatabaseZap className="mb-4 h-6 w-6 text-cyan-200" />
            <h2 className="text-xl font-black text-white">知识问答</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              当前知识库：{asText(activeBase?.name, "未选择")}。问答结果会保存到 AI 会话，并记录 token/用量。
            </p>
            <textarea
              className="mt-4 min-h-24 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-cyan-300"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="围绕知识库提问"
            />
            <Button className="mt-3 w-full" disabled={!activeBase || !question.trim() || saving} onClick={() => void askKnowledge()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              提问
            </Button>
          </div>
          {answer && (
            <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
              <h3 className="font-black text-white">回答</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-cyan-50">{asText(answer.answer)}</p>
              <div className="mt-4 grid gap-2">
                {(Array.isArray(answer.citations) ? answer.citations : []).slice(0, 4).map((item, index) => {
                  const citation = item as RecordMap;
                  return (
                    <div key={`${asText(citation.sourceId)}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-xs text-slate-300">
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

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          ["知识库", String(bases.length), "沉淀团队资料、制度和项目经验"],
          ["资料来源", String(sources.length), "文件、文档和手动来源可统一索引"],
          ["知识片段", String(bases.reduce((sum, item) => sum + asNumber(item.chunkCount), 0)), "切片后支持语义检索和问答"],
        ].map(([label, value, description]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-white">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
        ))}
      </section>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-2xl font-black text-white">全部知识库</h2>
        <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-400 lg:w-96">
          <Search className="h-4 w-4 shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索知识库"
          />
        </label>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-sm text-slate-400">正在加载知识库...</div>
        ) : filteredBases.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-sm text-slate-400">还没有知识库，点击“新建知识库”创建。</div>
        ) : (
          filteredBases.map((base, index) => {
            const isActive = asText(base.id) === asText(activeBase?.id);
            return (
              <div key={asText(base.id)} className={`group min-w-0 overflow-hidden rounded-3xl border bg-white/[0.06] ${isActive ? "border-cyan-200/50" : "border-white/10"}`}>
                <button className="block w-full text-left" onClick={() => selectBase(base)} type="button">
                  <div className={`h-44 bg-gradient-to-br ${coverColors[index % coverColors.length]} p-5`}>
                    <div className="flex justify-between gap-3">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">{visibilityLabel(base.visibility)}</span>
                      <span className="text-xs font-semibold text-white/80">{asNumber(base.chunkCount)} 片段</span>
                    </div>
                    <h3 className="mt-12 break-words text-2xl font-black text-white drop-shadow">{asText(base.name, "未命名知识库")}</h3>
                  </div>
                </button>
                <div className="p-5">
                  <p className="min-h-12 text-sm leading-6 text-slate-300">{asText(base.description, "暂无简介")}</p>
                  <p className="mt-4 text-xs text-slate-500">
                    {asNumber(base.sourceCount)} 个资料来源 · {asNumber(base.chunkCount)} 个知识片段
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <Button className="w-full" size="sm" asChild>
                      <Link href={`/knowledge/${asText(base.id)}`}>详情</Link>
                    </Button>
                    <Button className="w-full" variant="secondary" size="sm" onClick={() => { selectBase(base); setSourceOpen(true); }}>
                      登记来源
                    </Button>
                    <Button className="w-full" variant="ghost" size="sm" onClick={() => openSettings(base)}>
                      <Settings className="h-4 w-4" />
                      设置
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-black text-white">资料来源</h2>
          <p className="mt-1 text-sm text-slate-400">展示当前选中知识库的文件、文档和手动来源。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[160px_minmax(220px,1fr)_140px_160px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>类型</span>
              <span>来源 ID</span>
              <span>同步状态</span>
              <span>时间</span>
            </div>
            <div className="divide-y divide-white/10">
              {sources.length === 0 ? (
                <div className="p-6 text-sm text-slate-400">当前知识库还没有资料来源。</div>
              ) : (
                sources.map((source) => (
                  <div key={asText(source.id)} className="grid grid-cols-[160px_minmax(220px,1fr)_140px_160px] gap-4 px-5 py-4 text-sm">
                    <span className="font-semibold text-white">{sourceLabel(source)}</span>
                    <span className="min-w-0 truncate text-slate-300">{asText(source.sourceId, "手动登记")}</span>
                    <span className="text-cyan-100">{asText(source.syncStatus, "pending")}</span>
                    <span className="text-slate-400">{asText(source.createdAt).slice(0, 16) || "刚刚"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button disabled={!form.name.trim() || saving} onClick={() => void createBase()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </div>
        }
        open={createOpen}
        size="md"
        title="完善知识库信息"
        onClose={() => setCreateOpen(false)}
      >
        <label className="grid gap-2 text-sm font-semibold text-white">
          名称 *
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="请输入名称" />
        </label>
        <label className="mt-5 grid gap-2 text-sm font-semibold text-white">
          简介
          <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="请输入简介" />
        </label>
        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold text-white">可见范围 *</p>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            {visibilityOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300">
                <input
                  checked={form.visibility === option.value}
                  onChange={() => setForm({ ...form, visibility: option.value })}
                  name="visibility"
                  type="radio"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </AppModal>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setSourceOpen(false)}>
              取消
            </Button>
            <Button disabled={!activeBase || saving || (sourceType !== "manual" && !sourceId)} onClick={() => void addSource()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              添加来源
            </Button>
          </div>
        }
        open={sourceOpen}
        size="lg"
        title="添加资料来源"
        description={activeBase ? asText(activeBase.name) : undefined}
        onClose={() => setSourceOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["file", "文件", "把云盘文件解析后加入知识库"],
            ["document", "文档", "把在线文档加入知识库"],
            ["manual", "手动来源", "先登记来源，后续再补内容"],
          ].map(([value, label, description]) => (
            <button
              key={value}
              className={`rounded-2xl border p-4 text-left transition ${sourceType === value ? "border-cyan-200/60 bg-cyan-300/12" : "border-white/10 bg-white/[0.05]"}`}
              onClick={() => {
                setSourceType(value as "file" | "document" | "manual");
                setSourceId("");
              }}
              type="button"
            >
              <FileText className="mb-3 h-5 w-5 text-cyan-200" />
              <p className="font-bold text-white">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </button>
          ))}
        </div>
        {sourceType !== "manual" && (
          <label className="mt-5 grid gap-2 text-sm font-semibold text-white">
            选择{sourceType === "file" ? "文件" : "文档"}
            <select
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
            >
              <option className="bg-slate-950" value="">
                请选择
              </option>
              {(sourceType === "file" ? files : documents).map((item) => (
                <option className="bg-slate-950" key={asText(item.id)} value={asText(item.id)}>
                  {asText(item.originalName, asText(item.title, asText(item.name, "未命名")))}
                </option>
              ))}
            </select>
          </label>
        )}
      </AppModal>

      <AppModal
        description={settingsBase ? asText(settingsBase.name) : undefined}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setSettingsBase(null)}>
              取消
            </Button>
            <Button disabled={!form.name.trim() || saving} onClick={() => void saveSettings()}>
              保存设置
            </Button>
          </div>
        }
        open={Boolean(settingsBase)}
        size="lg"
        title="知识库设置"
        onClose={() => setSettingsBase(null)}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-white">
              名称
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white">
              简介
              <textarea
                className="min-h-32 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-cyan-300"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              {visibilityOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300">
                  <input
                    checked={form.visibility === option.value}
                    onChange={() => setForm({ ...form, visibility: option.value })}
                    name="settings-visibility"
                    type="radio"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
            <h3 className="font-black text-white">成员与权限</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              当前一期先保留入口，后续接入团队成员、角色权限和资料来源审批。
            </p>
            <Button className="mt-5 w-full" variant="secondary" onClick={() => setSourceOpen(true)}>
              登记资料来源
            </Button>
          </div>
        </div>
      </AppModal>
    </WorkspaceShell>
  );
}
