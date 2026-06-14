"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Download, FileText, Loader2, Plus, Save, Share2, Sparkles, Upload } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type DocumentRecord = Record<string, unknown>;
type KnowledgeBaseRecord = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function DocsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseRecord[]>([]);
  const [activeId, setActiveId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [instruction, setInstruction] = useState("请把当前内容整理成结构清晰的项目方案。");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareResult, setShareResult] = useState<DocumentRecord | null>(null);

  const activeDocument = useMemo(
    () => documents.find((item) => asText(item.id) === activeId),
    [activeId, documents],
  );

  async function loadDocuments(nextActiveId?: string) {
    setError("");
    setLoading(true);
    try {
      const [documentResult, kbResult] = await Promise.all([api.listDocuments(), api.listKnowledgeBases()]);
      setDocuments(documentResult.data);
      setKnowledgeBases(kbResult.data);
      const selected = nextActiveId || asText(documentResult.data[0]?.id);
      setActiveId(selected);
      const doc = documentResult.data.find((item) => asText(item.id) === selected) || documentResult.data[0];
      setTitle(asText(doc?.title, ""));
      setContent(asText(doc?.contentText, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "文档加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocuments();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function selectDocument(doc: DocumentRecord) {
    setActiveId(asText(doc.id));
    setTitle(asText(doc.title));
    setContent(asText(doc.contentText));
  }

  async function createDocument() {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.createDocument({
        title: newTitle.trim(),
        content: { blocks: [] },
        content_text: "",
      });
      setCreateOpen(false);
      setNewTitle("");
      setNotice("文档已创建，可以开始在线写作。");
      await loadDocuments(asText(result.data.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "新建文档失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveDocument() {
    if (!activeId) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.updateDocument(activeId, {
        title: title.trim() || "未命名文档",
        content: { type: "plain_text", updatedAt: new Date().toISOString() },
        content_text: content,
        status: "published",
      });
      setDocuments((items) => items.map((item) => (asText(item.id) === activeId ? result.data : item)));
      setNotice("文档已保存，并生成了版本记录。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存文档失败");
    } finally {
      setSaving(false);
    }
  }

  async function runAiWrite(mode: "draft" | "summary" | "rewrite" | "continue") {
    if (!activeId || !instruction.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.aiWriteDocument(activeId, { instruction, mode, apply: false });
      const generated = asText(result.data.generated);
      setContent(mode === "rewrite" ? generated : `${content}${content ? "\n\n" : ""}${generated}`);
      setDocuments((items) => items.map((item) => (asText(item.id) === activeId ? result.data.document as DocumentRecord : item)));
      setAiOpen(false);
      setNotice("AI 写作结果已写入当前文档。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 写作失败");
    } finally {
      setSaving(false);
    }
  }

  async function exportDoc(format: "md" | "txt" | "json") {
    if (!activeId) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.exportDocument(activeId, format);
      downloadBlob(result.blob, result.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败");
    } finally {
      setSaving(false);
    }
  }

  async function addToKnowledge() {
    if (!activeId) return;
    const firstBase = knowledgeBases[0];
    if (!firstBase) {
      setError("请先创建一个知识库，再把文档加入知识库。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.addDocumentToKnowledge(activeId, { knowledge_base_id: asText(firstBase.id), title });
      setNotice(`已加入知识库：${asText(firstBase.name, "默认知识库")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加入知识库失败");
    } finally {
      setSaving(false);
    }
  }

  async function createShareLink() {
    if (!activeId) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.createDocumentShare(activeId, {
        share_type: "link",
        permission: "view",
      });
      setShareResult(result.data);
      setNotice("文档分享链接已生成。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建分享链接失败");
    } finally {
      setSaving(false);
    }
  }

  async function copyShareLink() {
    const raw = asText(shareResult?.shareUrl);
    if (!raw) return;
    const url = raw.startsWith("http") ? raw : `${window.location.origin}${raw}`;
    await navigator.clipboard.writeText(url);
    setNotice("分享链接已复制。");
  }

  return (
    <WorkspaceShell
      active="文档"
      title="文档"
      subtitle="创建在线文档，让 AI 帮你写作、总结、改写、保存版本，并沉淀到团队知识库。"
      actions={
        <>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            新建文档
          </Button>
          <Button variant="secondary" disabled={!activeDocument || saving} onClick={() => setAiOpen(true)}>
            <Sparkles className="h-4 w-4" />
            AI 写作
          </Button>
        </>
      }
      rightPanel={
        <div className="space-y-4 2xl:sticky 2xl:top-24">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <Bot className="mb-4 h-6 w-6 text-cyan-200" />
            <h2 className="text-xl font-black text-white">AI 写作助手</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              可根据当前文档内容生成摘要、继续写作、重写段落，后续也可以接入文件和知识库作为上下文。
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <h3 className="font-bold text-white">知识库沉淀</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              当前共有 {knowledgeBases.length} 个知识库。文档加入知识库后会切片、向量化，并可在知识库问答中引用来源。
            </p>
          </div>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black text-white">最近文档</h2>
              <p className="text-sm text-slate-400">来自真实文档接口</p>
            </div>
          </div>
          <div className="grid max-h-[620px] gap-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-400">正在加载文档...</div>
            ) : documents.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-400">还没有文档，先新建一个。</div>
            ) : (
              documents.map((doc) => {
                const isActive = asText(doc.id) === activeId;
                return (
                  <button
                    key={asText(doc.id)}
                    className={`min-w-0 rounded-2xl border p-4 text-left transition ${
                      isActive ? "border-cyan-200/45 bg-cyan-300/12" : "border-white/10 bg-slate-950/45 hover:border-cyan-200/30"
                    }`}
                    onClick={() => selectDocument(doc)}
                    type="button"
                  >
                    <p className="truncate font-bold text-white">{asText(doc.title, "未命名文档")}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{asText(doc.contentText, "空白文档")}</p>
                    <p className="mt-3 text-xs text-cyan-100/75">{formatDate(doc.updatedAt)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-3xl border border-cyan-200/20 bg-slate-950/68 p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white">在线编辑器</h2>
              <p className="mt-1 text-sm text-slate-400">
                {activeDocument ? "保存时后端会自动生成文档版本。" : "选择或新建文档后开始编辑。"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" disabled={!activeDocument || saving} onClick={() => void exportDoc("md")}>
                <Download className="h-4 w-4" />
                导出 MD
              </Button>
              <Button variant="secondary" size="sm" disabled={!activeDocument || saving} onClick={() => void addToKnowledge()}>
                <Upload className="h-4 w-4" />
                加入知识库
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!activeDocument || saving}
                onClick={() => {
                  setShareResult(null);
                  setShareOpen(true);
                }}
              >
                <Share2 className="h-4 w-4" />
                分享
              </Button>
              <Button size="sm" onClick={() => void saveDocument()} disabled={!activeDocument || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="文档标题"
              disabled={!activeDocument}
            />
            <textarea
              className="min-h-[520px] resize-y rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-cyan-300"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="在这里输入文档内容..."
              disabled={!activeDocument}
            />
          </div>
        </div>
      </section>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button disabled={!newTitle.trim() || saving} onClick={() => void createDocument()}>
              创建
            </Button>
          </div>
        }
        open={createOpen}
        size="sm"
        title="新建文档"
        onClose={() => setCreateOpen(false)}
      >
        <label className="grid gap-2 text-sm font-semibold text-white">
          文档名称
          <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="例如：项目启动方案" />
        </label>
      </AppModal>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setShareOpen(false)}>
              关闭
            </Button>
            {shareResult ? (
              <Button onClick={() => void copyShareLink()}>
                复制链接
              </Button>
            ) : (
              <Button disabled={!activeDocument || saving} onClick={() => void createShareLink()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                创建分享链接
              </Button>
            )}
          </div>
        }
        open={shareOpen}
        size="md"
        title="文档分享"
        description={title || asText(activeDocument?.title, "未命名文档")}
        onClose={() => setShareOpen(false)}
      >
        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
            <p className="font-bold text-white">分享权限</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              当前创建的是只读链接，适合把方案、会议纪要或知识文档发给团队成员查看。
            </p>
          </div>
          {shareResult ? (
            <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
              <p className="font-bold text-white">分享链接</p>
              <p className="mt-3 break-all rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm leading-6 text-cyan-50">
                {asText(shareResult.shareUrl).startsWith("http")
                  ? asText(shareResult.shareUrl)
                  : `${typeof window !== "undefined" ? window.location.origin : ""}${asText(shareResult.shareUrl)}`}
              </p>
            </div>
          ) : null}
        </div>
      </AppModal>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>
              取消
            </Button>
            <Button variant="secondary" disabled={!activeDocument || saving} onClick={() => void runAiWrite("summary")}>
              生成摘要
            </Button>
            <Button variant="secondary" disabled={!activeDocument || saving} onClick={() => void runAiWrite("continue")}>
              继续写作
            </Button>
            <Button disabled={!activeDocument || !instruction.trim() || saving} onClick={() => void runAiWrite("draft")}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              生成内容
            </Button>
          </div>
        }
        open={aiOpen}
        size="lg"
        title="文档 AI 写作"
        description="AI 结果会保存为当前文档的新版本。"
        onClose={() => setAiOpen(false)}
      >
        <label className="grid gap-2 text-sm font-semibold text-white">
          写作要求
          <textarea
            className="min-h-32 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-cyan-300"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="例如：把当前内容改写成正式汇报稿，并列出行动项。"
          />
        </label>
      </AppModal>
    </WorkspaceShell>
  );
}
