"use client";

import { useEffect, useMemo, useState } from "react";
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

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [baseResult, fileResult, documentResult] = await Promise.all([
        api.listKnowledgeBases(),
        api.listDriveFiles(),
        api.listDocuments(),
      ]);
      const nextBases = Array.isArray(baseResult.data) ? baseResult.data : [];
      setBases(nextBases);
      setFiles(Array.isArray(fileResult.data) ? fileResult.data : []);
      setDocuments(Array.isArray(documentResult.data) ? documentResult.data : []);
      if (!activeBaseId && nextBases[0]) setActiveBaseId(asText(nextBases[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadSources() {
      if (!activeBase) {
        setSources([]);
        return;
      }
      try {
        const result = await api.listKnowledgeSources(asText(activeBase.id));
        setSources(Array.isArray(result.data) ? result.data : []);
      } catch {
        setSources([]);
      }
    }
    loadSources();
  }, [activeBase]);

  async function createBase() {
    if (!form.name.trim()) {
      setError("请输入知识库名称");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await api.createKnowledgeBase({
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
      });
      setBases((current) => [result.data, ...current]);
      setActiveBaseId(asText(result.data.id));
      setCreateOpen(false);
      setForm({ name: "", description: "", visibility: "private" });
      setNotice("知识库已创建。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建知识库失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    if (!settingsBase) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.updateKnowledgeBase(asText(settingsBase.id), {
        name: asText(settingsBase.name),
        description: asText(settingsBase.description),
        visibility: asText(settingsBase.visibility, "private"),
      });
      setBases((current) => current.map((item) => (asText(item.id) === asText(result.data.id) ? result.data : item)));
      setSettingsBase(null);
      setNotice("知识库设置已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存知识库设置失败");
    } finally {
      setSaving(false);
    }
  }

  async function addSource() {
    if (!activeBase) return;
    if (!sourceId.trim()) {
      setError("请选择或填写要加入知识库的资料来源。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.addKnowledgeSource(asText(activeBase.id), {
        source_type: sourceType,
        source_id: sourceId.trim(),
        title: sourceType === "manual" ? sourceId.trim() : undefined,
      });
      const result = await api.listKnowledgeSources(asText(activeBase.id));
      setSources(Array.isArray(result.data) ? result.data : []);
      setSourceOpen(false);
      setSourceId("");
      setNotice("资料来源已登记，并将用于知识切片与索引。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登记资料来源失败");
    } finally {
      setSaving(false);
    }
  }

  async function askBase() {
    if (!activeBase || !question.trim()) return;
    setSaving(true);
    setError("");
    setAnswer(null);
    try {
      const result = await api.askKnowledgeBase(asText(activeBase.id), { question: question.trim() });
      setAnswer(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库问答失败");
    } finally {
      setSaving(false);
    }
  }

  const sourceChoices = sourceType === "file" ? files : sourceType === "document" ? documents : [];

  return (
    <WorkspaceShell
      active="知识库"
      title="知识库"
      subtitle="新建知识库、登记文件和文档来源，让序光自动切片、向量化，并支持带引用来源的知识问答。"
      actions={
        <>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            新建知识库
          </Button>
          <Button variant="secondary" onClick={() => setSourceOpen(true)} disabled={!activeBase}>
            <Upload className="h-4 w-4" />
            登记来源
          </Button>
        </>
      }
      rightPanel={
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <DatabaseZap className="h-6 w-6 text-cyan-500" />
            <h2 className="text-xl font-black">知识问答预览</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            当前知识库：{asText(activeBase?.name, "未选择")}。问答结果会记录引用来源，后续可进入独立问答页。
          </p>
          <textarea
            className="mt-5 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="围绕知识库提问"
          />
          <Button className="mt-3 w-full" disabled={saving || !activeBase} onClick={askBase}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            提问
          </Button>
          {answer ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {asText(answer.answer, asText(answer.content, "已生成回答。"))}
              {Array.isArray(answer.citations) && answer.citations.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                  {(answer.citations as RecordMap[]).slice(0, 3).map((citation, index) => (
                    <div key={index} className="rounded-xl bg-white px-3 py-2 text-xs text-slate-500">
                      引用 {index + 1}：{asText(citation.title, "知识片段")}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        {(error || notice) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || notice}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["知识库", String(bases.length), "沉淀团队资料、制度和项目经验"],
            ["资料来源", String(sources.length), "文件、文档和手动来源可统一索引"],
            ["知识片段", String(bases.reduce((sum, item) => sum + asNumber(item.chunkCount), 0)), "切片后支持语义检索和问答"],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
              <p className="mt-2 text-sm text-slate-500">{helper}</p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-black">全部知识库</h2>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:w-80">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索知识库"
              />
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-sm text-slate-500">正在加载知识库...</div>
          ) : filteredBases.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-sm text-slate-500">还没有知识库，点击“新建知识库”开始创建。</div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBases.map((base, index) => {
                const selected = asText(activeBase?.id) === asText(base.id);
                return (
                  <article
                    key={asText(base.id, String(index))}
                    className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
                      selected ? "border-blue-300 ring-4 ring-blue-100" : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <button className="block w-full text-left" onClick={() => setActiveBaseId(asText(base.id))} type="button">
                      <div className={`min-h-40 bg-gradient-to-br ${coverColors[index % coverColors.length]} p-6 text-white`}>
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                          {visibilityLabel(base.visibility)}
                        </span>
                        <h3 className="mt-12 text-2xl font-black">{asText(base.name, "未命名知识库")}</h3>
                      </div>
                    </button>
                    <div className="p-5">
                      <p className="min-h-12 text-sm leading-6 text-slate-600">{asText(base.description, "用于沉淀文档、文件和团队经验。")}</p>
                      <p className="mt-4 text-xs text-slate-500">
                        {asNumber(base.sourceCount)} 个资料来源 · {asNumber(base.chunkCount)} 个知识片段
                      </p>
                      <div className="mt-5 flex gap-3">
                        <Button size="sm" variant="secondary" onClick={() => setSourceOpen(true)}>
                          登记来源
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSettingsBase(base)}>
                          <Settings className="h-4 w-4" />
                          设置
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-cyan-500" />
            <div>
              <h2 className="text-2xl font-black">资料来源</h2>
              <p className="mt-1 text-sm text-slate-500">展示当前选中知识库的文件、文档和手动来源。</p>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            {sources.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">当前知识库还没有资料来源。</div>
            ) : (
              sources.map((source, index) => (
                <div key={index} className="grid gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0 md:grid-cols-[140px_minmax(0,1fr)_180px]">
                  <span className="font-semibold text-slate-950">{sourceLabel(source)}</span>
                  <span className="min-w-0 truncate text-slate-600">{asText(source.title, asText(source.sourceId, "手动登记"))}</span>
                  <span className="text-slate-400">{asText(source.status, "indexed")}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <AppModal
        open={createOpen}
        title="完善知识库信息"
        description="创建前先填写名称、简介和可见范围，避免默认生成一堆“新知识库”。"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={createBase} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </div>
        }
      >
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-white">
            名称 *
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：AI 技术资料库" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white">
            简介
            <textarea
              className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white outline-none focus:border-cyan-300"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="说明这个知识库保存什么资料"
            />
          </label>
          <div className="grid gap-3 text-sm font-semibold text-white">
            可见范围 *
            {visibilityOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <input
                  type="radio"
                  value={option.value}
                  checked={form.visibility === option.value}
                  onChange={() => setForm({ ...form, visibility: option.value })}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </AppModal>

      <AppModal
        open={sourceOpen}
        title="登记资料来源"
        description="把云盘文件、在线文档或手动来源加入当前知识库。"
        onClose={() => setSourceOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSourceOpen(false)}>
              取消
            </Button>
            <Button onClick={addSource} disabled={saving || !activeBase}>
              登记来源
            </Button>
          </div>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["file", "文件", "把云盘文件解析后加入知识库"],
              ["document", "文档", "把在线文档加入知识库"],
              ["manual", "手动来源", "登记外部资料名称或链接"],
            ].map(([value, label, helper]) => (
              <button
                key={value}
                className={`rounded-2xl border p-4 text-left transition ${
                  sourceType === value ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
                onClick={() => {
                  setSourceType(value as "file" | "document" | "manual");
                  setSourceId("");
                }}
                type="button"
              >
                <p className="font-bold text-white">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{helper}</p>
              </button>
            ))}
          </div>
          {sourceType === "manual" ? (
            <Input value={sourceId} onChange={(event) => setSourceId(event.target.value)} placeholder="输入资料名称或链接" />
          ) : (
            <select
              className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none"
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
            >
              <option value="">请选择</option>
              {sourceChoices.map((item) => (
                <option key={asText(item.id)} value={asText(item.id)}>
                  {asText(item.name, asText(item.title, "未命名资料"))}
                </option>
              ))}
            </select>
          )}
        </div>
      </AppModal>

      <AppModal
        open={Boolean(settingsBase)}
        title="知识库设置"
        description="调整基础信息、可见范围和后续成员权限入口。"
        onClose={() => setSettingsBase(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSettingsBase(null)}>
              取消
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              保存设置
            </Button>
          </div>
        }
      >
        {settingsBase ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-semibold text-white">
                名称
                <Input
                  value={asText(settingsBase.name)}
                  onChange={(event) => setSettingsBase({ ...settingsBase, name: event.target.value })}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-white">
                简介
                <textarea
                  className="min-h-40 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white outline-none focus:border-cyan-300"
                  value={asText(settingsBase.description)}
                  onChange={(event) => setSettingsBase({ ...settingsBase, description: event.target.value })}
                />
              </label>
              <div className="grid gap-3 text-sm font-semibold text-white">
                可见范围
                {visibilityOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <input
                      type="radio"
                      value={option.value}
                      checked={asText(settingsBase.visibility, "private") === option.value}
                      onChange={() => setSettingsBase({ ...settingsBase, visibility: option.value })}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="font-black text-white">成员与权限</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                当前一期保留入口，后续接入团队成员、角色权限和资料来源审批。
              </p>
              <Button className="mt-6 w-full" variant="secondary" onClick={() => setSourceOpen(true)}>
                登记资料来源
              </Button>
            </div>
          </div>
        ) : null}
      </AppModal>
    </WorkspaceShell>
  );
}
