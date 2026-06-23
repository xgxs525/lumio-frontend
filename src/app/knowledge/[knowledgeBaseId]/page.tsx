"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Link2,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import KnowledgeEditor from "@/components/knowledge/knowledge-editor";
import SourceContentView from "@/components/knowledge/source-content-view";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type Rec = Record<string, unknown>;
type SettingsForm = {
  name: string;
  description: string;
  visibility: string;
  defaultModel: string;
  processMode: string;
  generateSummary: boolean;
  extractKeywords: boolean;
};

function asText(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function asNum(v: unknown, fallback = 0) {
  return typeof v === "number" ? v : fallback;
}

const df = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function distanceToNow(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return df.format(d);
}

function fmt(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "—" : df.format(d);
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bytesLabel(value: unknown) {
  const size = asNum(value);
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

const typeLabel: Record<string, string> = {
  file: "上传文件",
  pdf: "PDF",
  word: "Word 文档",
  excel: "表格",
  ppt: "PPT",
  document: "在线文档",
  manual: "手动录入",
  link: "网页链接",
  text: "粘贴文本",
  drive: "云盘文件",
};

const visibilityLabel: Record<string, string> = {
  private: "私有",
  workspace: "成员可见",
  public: "公开",
};

const contentTypeOptions = [
  ["all", "全部类型"],
  ["file", "上传文件"],
  ["drive", "云盘文件"],
  ["document", "在线文档"],
  ["link", "网页链接"],
  ["text", "粘贴文本"],
  ["manual", "手动录入"],
] as const;

const contentStatusOptions = [
  ["all", "全部状态"],
  ["pending", "等待处理"],
  ["processing", "处理中"],
  ["processed", "已处理"],
  ["failed", "处理失败"],
  ["disabled", "已停用"],
] as const;

const contentSortOptions = [
  ["updated", "最近更新"],
  ["created", "添加时间"],
  ["title", "内容名称"],
] as const;

function normalizedStatus(value: unknown) {
  const status = asText(value, "pending");
  if (["active", "synced", "completed", "ready"].includes(status)) return "processed";
  if (["uploading", "pending"].includes(status)) return "pending";
  if (status === "processing") return "processing";
  if (["failed", "error"].includes(status)) return "failed";
  if (["disabled", "skipped"].includes(status)) return "disabled";
  return status;
}

const statusText: Record<string, string> = {
  pending: "等待处理",
  processing: "处理中",
  processed: "已处理",
  failed: "处理失败",
  disabled: "已停用",
  active: "已处理",
};

function statusLabel(status: unknown) {
  const normalized = normalizedStatus(status);
  return statusText[normalized] || normalized;
}

function sourceTitle(source: Rec) {
  const meta = (source.metadata || {}) as Rec;
  return asText(source.title) || asText(meta.title) || asText(source.originalFilename) || typeLabel[asText(source.sourceType, "manual")] || "知识内容";
}

function sourceTypeLabel(source: Rec) {
  const sourceType = asText(source.sourceType, "manual");
  if (sourceType !== "file") return typeLabel[sourceType] || sourceType;
  const name = asText(source.originalFilename) || sourceTitle(source);
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "Word 文档";
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) return "表格";
  if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "PPT";
  return "上传文件";
}

function sourceUpdatedAt(source: Rec) {
  return asText(source.updatedAt) || asText(source.createdAt);
}

function chunkUpdatedAt(chunk: Rec) {
  return asText(chunk.updatedAt) || asText(chunk.createdAt);
}

function chunkLocation(chunk: Rec) {
  const pageNumber = asNum(chunk.pageNumber);
  const sectionTitle = asText(chunk.sectionTitle);
  if (pageNumber > 0 && sectionTitle) return `第 ${pageNumber} 页 · ${sectionTitle}`;
  if (pageNumber > 0) return `第 ${pageNumber} 页`;
  if (sectionTitle) return sectionTitle;
  return `第 ${asNum(chunk.chunkIndex) + 1} 段`;
}

function sourcePlainText(source: Rec, sourceChunks: Rec[] = []) {
  const raw = asText(source.rawText);
  if (raw) return stripHtml(raw) || raw;
  return sourceChunks.map((chunk) => asText(chunk.content)).filter(Boolean).join("\n\n");
}

function sourceIcon(sourceType: string) {
  if (sourceType === "link") return <Link2 className="h-4 w-4" />;
  if (sourceType === "manual" || sourceType === "text") return <Pencil className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function contentMetaLine(source: Rec) {
  const parts = [
    sourceTypeLabel(source),
    statusLabel(source.syncStatus),
    `${asNum(source.chunkCount)} 个片段`,
    sourceUpdatedAt(source) ? `更新于 ${distanceToNow(sourceUpdatedAt(source))}` : "",
    bytesLabel(source.fileSize),
  ].filter(Boolean);
  return parts.join(" · ");
}

function isTextLikeSource(source: Rec) {
  const sourceType = asText(source.sourceType);
  const filename = (asText(source.originalFilename) || sourceTitle(source)).toLowerCase();
  const mime = asText(source.fileMimeType).toLowerCase();
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  return sourceType === "manual"
    || sourceType === "text"
    || sourceType === "link"
    || filename.endsWith(".txt") || filename.endsWith(".md") || filename.endsWith(".markdown")
    || mime.startsWith("text/") || mime.includes("markdown");
}

// Can be directly edited in the rich text editor (all text-based + spreadsheet types)
function canEditDirectly(source: Rec) {
  if (isTextLikeSource(source)) return true;
  const filename = (asText(source.originalFilename) || sourceTitle(source)).toLowerCase();
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const mime = asText(source.fileMimeType).toLowerCase();
  return ext === ".xlsx" || ext === ".xls" || ext === ".csv" || ext === ".tsv"
    || mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv"
    || ext === ".pptx" || ext === ".ppt" || mime.includes("presentation");
}

// Is image type
function isImageSource(source: Rec) {
  const filename = (asText(source.originalFilename) || sourceTitle(source)).toLowerCase();
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const mime = asText(source.fileMimeType).toLowerCase();
  return mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp"].includes(ext);
}

function editableRawHtml(source: Rec, fallbackChunks: Rec[] = []) {
  const raw = asText(source.rawText);
  if (raw) return raw;
  const text = fallbackChunks.map((chunk) => asText(chunk.content)).filter(Boolean).join("\n\n");
  return text ? `<p>${text.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />")}</p>` : "";
}

export default function KnowledgeDetailPage() {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const router = useRouter();

  const [base, setBase] = useState<Rec | null>(null);
  const [sources, setSources] = useState<Rec[]>([]);
  const [chunks, setChunks] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingSourceId, setProcessingSourceId] = useState("");

  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all");
  const [sourceStatusFilter, setSourceStatusFilter] = useState("all");
  const [sourceSort, setSourceSort] = useState("updated");
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [savingSource, setSavingSource] = useState(false);

  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Rec | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    description: "",
    visibility: "private",
    defaultModel: "自动选择",
    processMode: "智能处理",
    generateSummary: true,
    extractKeywords: true,
  });

  const [processingDetailSource, setProcessingDetailSource] = useState<Rec | null>(null);
  const [chunkListSource, setChunkListSource] = useState<Rec | null>(null);
  const [deleteSource, setDeleteSource] = useState<Rec | null>(null);
  const [deleteChunk, setDeleteChunk] = useState<Rec | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<Rec | null>(null);
  const [deleteBaseOpen, setDeleteBaseOpen] = useState(false);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");
  const [deleteInput, setDeleteInput] = useState("");

  const expectedDeleteInput = base ? deleteConfirmCode + asText(base.name) : "";

  function openDeleteModal() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setDeleteConfirmCode(code);
    setDeleteInput("");
    setDeleteBaseOpen(true);
  }

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getKnowledgeBase(knowledgeBaseId);
      const data = r.data as Rec;
      setBase(data);
      setSettingsForm((prev) => ({
        ...prev,
        name: asText(data.name),
        description: asText(data.description),
        visibility: asText(data.visibility, "private"),
      }));
    } catch {
      toast.error("知识库加载失败");
      setBase(null);
    } finally {
      setLoading(false);
    }
  }, [knowledgeBaseId]);

  const loadSources = useCallback(async () => {
    try {
      const r = await api.listKnowledgeSources(knowledgeBaseId);
      setSources(Array.isArray(r.data) ? r.data : []);
    } catch {
      setSources([]);
    }
  }, [knowledgeBaseId]);

  const loadChunks = useCallback(async () => {
    setChunksLoading(true);
    try {
      const r = await api.listKnowledgeChunks(knowledgeBaseId);
      setChunks(Array.isArray(r.data) ? r.data : []);
    } catch {
      setChunks([]);
    } finally {
      setChunksLoading(false);
    }
  }, [knowledgeBaseId]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { if (base) loadSources(); }, [base, loadSources]);
  useEffect(() => { if (base) loadChunks(); }, [base, loadChunks]);

  useEffect(() => {
    if (sources.length === 0) {
      setSelectedSourceId("");
      return;
    }
    if (!selectedSourceId || !sources.some((source) => asText(source.id) === selectedSourceId)) {
      setSelectedSourceId(asText(sources[0].id));
    }
  }, [sources, selectedSourceId]);

  const filteredSources = useMemo(() => {
    const q = sourceSearch.trim().toLowerCase();
    const next = sources.filter((source) => {
      const title = sourceTitle(source).toLowerCase();
      const raw = stripHtml(asText(source.rawText)).toLowerCase();
      const url = asText(source.url).toLowerCase();
      const sourceType = asText(source.sourceType);
      const status = normalizedStatus(source.syncStatus);
      const matchesQuery = !q || title.includes(q) || raw.includes(q) || url.includes(q);
      const matchesType = sourceTypeFilter === "all" || sourceType === sourceTypeFilter;
      const matchesStatus = sourceStatusFilter === "all" || status === sourceStatusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
    next.sort((a, b) => {
      if (sourceSort === "title") return sourceTitle(a).localeCompare(sourceTitle(b), "zh-CN");
      if (sourceSort === "created") return new Date(asText(b.createdAt)).getTime() - new Date(asText(a.createdAt)).getTime();
      return new Date(sourceUpdatedAt(b)).getTime() - new Date(sourceUpdatedAt(a)).getTime();
    });
    return next;
  }, [sources, sourceSearch, sourceTypeFilter, sourceStatusFilter, sourceSort]);

  const selectedSource = useMemo(() => {
    if (filteredSources.length === 0) return null;
    return filteredSources.find((source) => asText(source.id) === selectedSourceId) || filteredSources[0];
  }, [filteredSources, selectedSourceId]);

  const selectedSourceChunks = useMemo(() => {
    if (!selectedSource) return [];
    const sourceId = asText(selectedSource.id);
    return chunks
      .filter((chunk) => asText(chunk.sourceId) === sourceId)
      .sort((a, b) => asNum(a.chunkIndex) - asNum(b.chunkIndex));
  }, [chunks, selectedSource]);

  const chunkListSourceChunks = useMemo(() => {
    if (!chunkListSource) return [];
    const sourceId = asText(chunkListSource.id);
    return chunks
      .filter((chunk) => asText(chunk.sourceId) === sourceId)
      .sort((a, b) => asNum(a.chunkIndex) - asNum(b.chunkIndex));
  }, [chunks, chunkListSource]);

  const answerSources = answer
    ? (Array.isArray(answer.sources) ? answer.sources as Rec[] : Array.isArray(answer.citations) ? answer.citations as Rec[] : [])
    : [];

  function beginEditSource(source: Rec) {
    setEditingSourceId(asText(source.id));
    setEditTitle(sourceTitle(source));
    setEditHtml(editableRawHtml(source, chunks.filter((chunk) => asText(chunk.sourceId) === asText(source.id))));
    setSourceMenuOpen(false);
  }

  function cancelEditSource() {
    setEditingSourceId("");
    setEditTitle("");
    setEditHtml("");
  }

  async function saveEditedSource(source: Rec) {
    if (!editTitle.trim()) {
      toast.error("标题不能为空");
      return;
    }
    const sourceId = asText(source.id);
    setSavingSource(true);
    try {
      const r = await api.updateKnowledgeSource(knowledgeBaseId, sourceId, {
        title: editTitle.trim(),
        raw_text: editHtml,
        auto_reprocess: true,
      });
      const updated = r.data as Rec;
      setSources((prev) => prev.map((item) => asText(item.id) === sourceId ? updated : item));
      await Promise.all([loadBase(), loadChunks()]);
      cancelEditSource();
      toast.success("内容已保存，正在更新知识库索引。");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSavingSource(false);
    }
  }

  async function removeSource() {
    if (!deleteSource) return;
    setSaving(true);
    try {
      await api.deleteKnowledgeSource(knowledgeBaseId, asText(deleteSource.id));
      const removedSourceId = asText(deleteSource.id);
      setSources((prev) => prev.filter((source) => asText(source.id) !== removedSourceId));
      setChunks((prev) => prev.filter((chunk) => asText(chunk.sourceId) !== removedSourceId));
      if (selectedSourceId === removedSourceId) setSelectedSourceId("");
      setDeleteSource(null);
      setChunkListSource(null);
      toast.success("知识内容已从知识库移除。");
      loadBase();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "移除失败");
    } finally {
      setSaving(false);
    }
  }

  async function removeChunk() {
    if (!deleteChunk) return;
    setSaving(true);
    try {
      const chunkId = asText(deleteChunk.id);
      const sourceId = asText(deleteChunk.sourceId);
      await api.deleteKnowledgeChunk(knowledgeBaseId, chunkId);
      setChunks((prev) => prev.filter((chunk) => asText(chunk.id) !== chunkId));
      setSources((prev) => prev.map((source) => asText(source.id) === sourceId ? { ...source, chunkCount: Math.max(0, asNum(source.chunkCount) - 1) } : source));
      setDeleteChunk(null);
      if (asText(selectedChunk?.id) === chunkId) setSelectedChunk(null);
      setBase((prev) => prev ? { ...prev, chunkCount: Math.max(0, asNum(prev.chunkCount) - 1) } : prev);
      toast.success("引用片段已删除。");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function reprocessSource(source: Rec) {
    const sourceId = asText(source.id);
    setSourceMenuOpen(false);
    setProcessingSourceId(sourceId);
    try {
      const r = await api.syncKnowledgeSource(knowledgeBaseId, sourceId);
      const updated = r.data as Rec;
      setSources((prev) => prev.map((item) => asText(item.id) === sourceId ? updated : item));
      await Promise.all([loadBase(), loadChunks()]);
      toast.success("知识内容已重新处理。");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "重新处理失败");
      loadSources();
    } finally {
      setProcessingSourceId("");
    }
  }

  async function copyText(value: string, success = "已复制") {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(success);
    } catch {
      toast.error("复制失败");
    }
  }

  async function copySourceLink(source: Rec) {
    const url = typeof window === "undefined"
      ? `/knowledge/${knowledgeBaseId}?source=${asText(source.id)}`
      : `${window.location.origin}/knowledge/${knowledgeBaseId}?source=${asText(source.id)}`;
    await copyText(url, "链接已复制。");
    setSourceMenuOpen(false);
  }

  async function askBase() {
    if (!question.trim()) return;
    setQaLoading(true);
    setAnswer(null);
    try {
      const r = await api.askKnowledgeBase(knowledgeBaseId, { question: question.trim() });
      setAnswer(r.data);
      if (chunks.length === 0) loadChunks();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "问答失败");
    } finally {
      setQaLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await api.updateKnowledgeBase(knowledgeBaseId, {
        name: settingsForm.name,
        description: settingsForm.description,
        visibility: settingsForm.visibility,
      });
      setBase((prev) => prev ? { ...prev, name: settingsForm.name, description: settingsForm.description, visibility: settingsForm.visibility } : prev);
      setSettingsOpen(false);
      toast.success("设置已保存。");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBase() {
    setSaving(true);
    try {
      await api.deleteKnowledgeBase(knowledgeBaseId);
      router.push("/knowledge");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  function openCitation(citation: Rec) {
    const sourceId = asText(citation.sourceId);
    const chunkId = asText(citation.id);
    if (sourceId) {
      setSelectedSourceId(sourceId);
      setAskOpen(false);
    }
    setSelectedChunk(chunks.find((chunk) => asText(chunk.id) === chunkId) || citation);
  }

  function openSource(source: Rec) {
    setSelectedSourceId(asText(source.id));
    setSourceMenuOpen(false);
  }

  function unavailable(label: string) {
    toast.error(`${label}暂未开放`);
    setSourceMenuOpen(false);
  }

  if (loading) {
    return (
      <WorkspaceShell active="知识库" title="">
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-sm text-slate-500">加载知识库...</p>
        </div>
      </WorkspaceShell>
    );
  }

  if (!base) {
    return (
      <WorkspaceShell active="知识库" title="">
        <div className="flex flex-col items-center py-16">
          <p className="text-slate-500">知识库未找到</p>
          <Button className="mt-4" asChild><Link href="/knowledge">返回</Link></Button>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell active="知识库" title="">
      <div className="mb-5">
        <Link href="/knowledge" className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 hover:shadow">
          <ArrowLeft className="h-3.5 w-3.5" />返回
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">{asText(base.name)}</h1>
            <p className="mt-1 text-sm text-slate-500">{asText(base.description, "整理资料，让 AI 基于内容回答。")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{visibilityLabel[asText(base.visibility, "private")] || "私有"}</span>
              <span>·</span>
              <span>{asText(base.updatedAt) ? `更新于 ${fmt(asText(base.updatedAt))}` : "暂无更新时间"}</span>
              <span>·</span>
              <span>{asNum(base.sourceCount)} 条内容</span>
              <span>·</span>
              <span>{asNum(base.chunkCount)} 个索引片段</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push(`/knowledge/${knowledgeBaseId}/add-source`)} className="bg-blue-600 text-white hover:bg-blue-700">
              <Upload className="h-4 w-4" />添加资料
            </Button>
            <Button variant="secondary" onClick={() => setAskOpen(true)} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <MessageCircle className="h-4 w-4" />问知识库
            </Button>
            <Button variant="ghost" title="知识库设置" onClick={() => setSettingsOpen(true)} className="border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        {sources.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-4 text-base font-bold text-slate-700">还没有知识内容</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">添加文件、文档、文本或网页链接后，序光会处理内容，并用于后续检索、总结和问答。</p>
            <Button className="mt-5 bg-blue-600 text-white hover:bg-blue-700" onClick={() => router.push(`/knowledge/${knowledgeBaseId}/add-source`)}>
              <Plus className="h-4 w-4" />添加资料
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-200 bg-white p-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="搜索知识内容" value={sourceSearch} onChange={(e) => setSourceSearch(e.target.value)} className="h-10 border-slate-200 bg-slate-50 pl-9 text-sm" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <select value={sourceTypeFilter} onChange={(e) => setSourceTypeFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-blue-300">
                      {contentTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <select value={sourceStatusFilter} onChange={(e) => setSourceStatusFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-blue-300">
                      {contentStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <select value={sourceSort} onChange={(e) => setSourceSort(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-blue-300">
                      {contentSortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="max-h-[650px] overflow-auto p-3">
                  {filteredSources.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
                      <Search className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-700">没有匹配的内容</p>
                      <p className="mt-1 text-xs text-slate-400">调整搜索词或筛选条件。</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSources.map((source) => {
                        const id = asText(source.id);
                        const selected = id === asText(selectedSource?.id);
                        const sourceType = asText(source.sourceType, "manual");
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`group flex w-full gap-3 rounded-xl border bg-white p-3 text-left transition ${selected ? "border-blue-300 bg-blue-50/60 shadow-sm ring-2 ring-blue-50" : "border-transparent hover:border-slate-200 hover:shadow-sm"}`}
                            onClick={() => openSource(source)}
                          >
                            <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-white text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                              {sourceIcon(sourceType)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">{sourceTitle(source)}</p>
                              <p className="mt-1 truncate text-xs text-slate-500">{contentMetaLine(source)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              <section className="min-w-0 bg-white">
                {!selectedSource ? (
                  <div className="flex h-full min-h-[480px] flex-col items-center justify-center px-6 text-center">
                    <Database className="h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">请选择一条知识内容</p>
                    <p className="mt-1 text-sm text-slate-400">左侧目录中展示的是完整资料内容。</p>
                  </div>
                ) : (
                  <SourceReader
                    source={selectedSource}
                    chunks={selectedSourceChunks}
                    sourceMenuOpen={sourceMenuOpen}
                    setSourceMenuOpen={setSourceMenuOpen}
                    onCopy={(text) => copyText(text, "内容已复制。")}
                    onReprocess={() => reprocessSource(selectedSource)}
                    onCopyLink={() => copySourceLink(selectedSource)}
                    onRename={() => unavailable("重命名")}
                    isEditing={editingSourceId === asText(selectedSource.id)}
                    editTitle={editTitle}
                    editHtml={editHtml}
                    canEditDirectly={canEditDirectly(selectedSource)}
                    savingEdit={savingSource}
                    onStartEdit={() => beginEditSource(selectedSource)}
                    onEditTitleChange={setEditTitle}
                    onEditHtmlChange={setEditHtml}
                    onSaveEdit={() => saveEditedSource(selectedSource)}
                    onCancelEdit={cancelEditSource}
                    onOpenProcessing={() => { setProcessingDetailSource(selectedSource); setSourceMenuOpen(false); }}
                    onOpenChunks={() => { setChunkListSource(selectedSource); setSourceMenuOpen(false); }}
                    onDelete={() => { setDeleteSource(selectedSource); setSourceMenuOpen(false); }}
                    processing={processingSourceId === asText(selectedSource.id)}
                  />
                )}
              </section>
            </div>
          </div>
        )}
      </div>

      <SettingsDrawer
        open={settingsOpen}
        form={settingsForm}
        saving={saving}
        onClose={() => setSettingsOpen(false)}
        onChange={setSettingsForm}
        onSave={saveSettings}
        onDisable={() => toast.error("停用知识库暂未开放")}
        onDelete={openDeleteModal}
      />

      <AskDrawer
        open={askOpen}
        question={question}
        answer={answer as Record<string, unknown> | null}
        loading={qaLoading}
        baseName={base?.name ? asText(base.name) : ""}
        sources={sources}
        onClose={() => setAskOpen(false)}
        onQuestionChange={setQuestion}
        onAsk={askBase}
        onSelectSource={(sourceId) => {
          setSelectedSourceId(sourceId);
          setAskOpen(false);
        }}
      />

      <ProcessingDetailModal source={processingDetailSource} base={base} onClose={() => setProcessingDetailSource(null)} />

      <ChunkListModal
        source={chunkListSource}
        chunks={chunkListSourceChunks}
        loading={chunksLoading}
        onClose={() => setChunkListSource(null)}
        onView={setSelectedChunk}
        onCopy={(text) => copyText(text, "引用内容已复制。")}
        onDelete={setDeleteChunk}
      />

      <AppModal open={!!deleteSource} onClose={() => setDeleteSource(null)} title="删除知识内容">
        <p className="text-sm text-slate-600">确定删除这条知识内容吗？</p>
        <p className="mt-2 text-xs text-slate-400">删除后，该内容及其生成的引用片段将不会再参与知识库问答。</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setDeleteSource(null)}>取消</Button>
          <Button onClick={removeSource} disabled={saving} className="bg-red-600 text-white hover:bg-red-700">{saving ? "删除中..." : "确认删除"}</Button>
        </div>
      </AppModal>

      <AppModal
        open={!!selectedChunk}
        onClose={() => setSelectedChunk(null)}
        title="引用来源详情"
        description="用于核对问答回答依据的原文片段。"
        size="lg"
        footer={selectedChunk && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => copyText(asText(selectedChunk.content), "引用内容已复制。")}><Copy className="h-4 w-4" />复制内容</Button>
            <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => { setSelectedChunk(null); handleTabChange("content"); }}>查看内容</Button>
            <Button onClick={() => { setDeleteChunk(selectedChunk); setSelectedChunk(null); }} className="bg-red-600 text-white hover:bg-red-700"><Trash2 className="h-4 w-4" />删除引用</Button>
          </div>
        )}
      >
        {selectedChunk && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <InfoItem label="所属知识库" value={asText(base.name)} />
                <InfoItem label="来源名称" value={asText(selectedChunk.sourceTitle, "知识内容")} />
                <InfoItem label="来源类型" value={typeLabel[asText(selectedChunk.sourceType)] || asText(selectedChunk.sourceType, "—")} />
                <InfoItem label="位置" value={chunkLocation(selectedChunk)} />
                <InfoItem label="创建时间" value={asText(selectedChunk.createdAt) ? fmt(asText(selectedChunk.createdAt)) : "—"} />
                <InfoItem label="更新时间" value={chunkUpdatedAt(selectedChunk) ? fmt(chunkUpdatedAt(selectedChunk)) : "—"} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">引用原文</h4>
              <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">{asText(selectedChunk.content, "空内容")}</div>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal open={!!deleteChunk} onClose={() => setDeleteChunk(null)} title="删除引用片段">
        <p className="text-sm font-medium text-slate-700">确定删除这个引用片段吗？</p>
        <p className="mt-2 text-sm text-slate-500">删除后，该片段将不会再参与知识库问答。</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setDeleteChunk(null)}>取消</Button>
          <Button onClick={removeChunk} disabled={saving} className="bg-red-600 text-white hover:bg-red-700">{saving ? "删除中..." : "确认删除"}</Button>
        </div>
      </AppModal>

      <AppModal open={deleteBaseOpen} onClose={() => setDeleteBaseOpen(false)} title="确认删除知识库">
        <p className="text-sm text-slate-600">
          确定要删除 <strong className="text-red-600">{asText(base.name)}</strong> 吗？此操作不可撤销。
        </p>
        <p className="mt-2 text-xs text-slate-400">删除后，知识库中的知识内容、索引片段和问答记录将无法恢复。</p>
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50/50 p-4">
          <p className="mb-3 text-xs font-semibold text-red-700">请输入以下文字以确认删除：</p>
          <div className="mb-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-center">
            <code className="select-all text-base font-bold tracking-wider text-red-600">{deleteConfirmCode}{asText(base?.name)}</code>
          </div>
          <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="输入上面的确认文字" className="h-[44px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50" />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setDeleteBaseOpen(false)}>取消</Button>
          <Button onClick={deleteBase} disabled={saving || deleteInput !== expectedDeleteInput} className={deleteInput === expectedDeleteInput ? "bg-red-600 text-white hover:bg-red-700" : "cursor-not-allowed bg-slate-200 text-slate-400"}>
            {saving ? "删除中..." : "确认删除"}
          </Button>
        </div>
      </AppModal>
    </WorkspaceShell>
  );
}

// ── 问知识库 抽屉 ──
function AskDrawer({
  open,
  question,
  answer,
  loading,
  baseName,
  sources,
  onClose,
  onQuestionChange,
  onAsk,
  onSelectSource,
}: {
  open: boolean;
  question: string;
  answer: Record<string, unknown> | null;
  loading: boolean;
  baseName: string;
  sources: Rec[];
  onClose: () => void;
  onQuestionChange: (q: string) => void;
  onAsk: () => void;
  onSelectSource: (sourceId: string) => void;
}) {
  const citations = useMemo(() => {
    if (!answer?.sources || !Array.isArray(answer.sources)) return [];
    return (answer.sources as Rec[]).filter((s) => s.title || s.content).slice(0, 5);
  }, [answer]);

  // Look up source in the sources list to get type info
  const enrichedCitations = useMemo(() => {
    return citations.map((c) => {
      const matched = sources.find((s) => asText(s.id) === asText(c.sourceId)) || null;
      const result: Rec = { ...c };
      result.sourceType = matched ? asText(matched.sourceType) : "引用";
      result.chunkIndex = asNum(c.chunkIndex) + 1;
      return result;
    });
  }, [citations, sources]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-[520px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">问知识库</h2>
            {baseName ? (
              <p className="mt-0.5 text-xs text-slate-500">基于「{baseName}」的内容提问</p>
            ) : null}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-b border-slate-100 px-6 py-4">
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAsk(); } }}
              placeholder="向当前知识库提问，例如：这份资料的核心内容是什么？"
              className="h-[88px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              disabled={loading}
            />
            <button
              onClick={onAsk}
              disabled={loading || !question.trim()}
              className="grid h-[44px] w-[44px] shrink-0 self-end place-items-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Answer Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!answer && !loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <MessageCircle className="h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">输入问题后，序光会基于知识库内容为你生成回答。</p>
            </div>
          ) : loading ? null : (
            <div className="space-y-6">
              {/* Answer Text */}
              <div className="rounded-2xl bg-blue-50/50 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600">回答</span>
                </div>
                <p className="text-sm leading-7 text-slate-800 whitespace-pre-wrap">{asText(answer?.answer) || "无法生成回答，请稍后重试。"}</p>
              </div>

              {/* Citation Sources */}
              {enrichedCitations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">引用来源</h3>
                  <div className="space-y-2">
                    {enrichedCitations.map((cite, idx) => (
                      <button
                        key={cite.id ? asText(cite.id) : idx}
                        onClick={() => cite.sourceId ? onSelectSource(asText(cite.sourceId)) : null}
                        className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{asText(cite.title) || "未命名"}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {cite.sourceType} · 第 {cite.chunkIndex} 段
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 self-center text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="shrink-0 border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-400">回答基于知识库内容生成，请核对引用的原始资料。</p>
        </div>
      </div>
    </div>
  );
}

function SourceReader({
  source,
  chunks,
  sourceMenuOpen,
  setSourceMenuOpen,
  onCopy,
  onReprocess,
  onCopyLink,
  onRename,
  isEditing,
  editTitle,
  editHtml,
  canEditDirectly,
  savingEdit,
  onStartEdit,
  onEditTitleChange,
  onEditHtmlChange,
  onSaveEdit,
  onCancelEdit,
  onOpenProcessing,
  onOpenChunks,
  onDelete,
  processing,
}: {
  source: Rec;
  chunks: Rec[];
  sourceMenuOpen: boolean;
  setSourceMenuOpen: (open: boolean) => void;
  onCopy: (text: string) => void;
  onReprocess: () => void;
  onCopyLink: () => void;
  onRename: () => void;
  isEditing: boolean;
  editTitle: string;
  editHtml: string;
  canEditDirectly: boolean;
  savingEdit: boolean;
  onStartEdit: () => void;
  onEditTitleChange: (value: string) => void;
  onEditHtmlChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onOpenProcessing: () => void;
  onOpenChunks: () => void;
  onDelete: () => void;
  processing: boolean;
}) {
  const text = sourcePlainText(source, chunks);
  const sourceType = asText(source.sourceType, "manual");

  return (
    <div className="min-h-[720px] bg-white">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-2xl font-bold text-slate-950 outline-none focus:border-blue-300"
                placeholder="输入标题"
              />
            ) : (
              <h2 className="break-words text-2xl font-bold text-slate-950">{sourceTitle(source)}</h2>
            )}
            <p className="mt-2 text-sm text-slate-500">{contentMetaLine(source)}</p>
            {!isEditing && sourceType === "link" && asText(source.url) ? (
              <a href={asText(source.url)} target="_blank" rel="noreferrer" className="mt-2 block max-w-2xl truncate text-xs text-blue-600 hover:text-blue-700">{asText(source.url)}</a>
            ) : null}
          </div>
          <div className="relative flex shrink-0 flex-wrap gap-2">
            {isEditing ? (
              <>
                <button onClick={onCancelEdit} disabled={savingEdit} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">取消</button>
                <button onClick={onSaveEdit} disabled={savingEdit || !editTitle.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200">
                  {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}保存
                </button>
              </>
            ) : (
              <>
                {canEditDirectly ? (
                  <button onClick={onStartEdit} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Pencil className="h-3.5 w-3.5" />编辑
                  </button>
                ) : null}
                <button title="复制内容" onClick={() => onCopy(text)} disabled={!text} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <Copy className="h-4 w-4" />
                </button>
                <button title="更多" onClick={() => setSourceMenuOpen(!sourceMenuOpen)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </>
            )}
            {!isEditing && sourceMenuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg">
                {!canEditDirectly ? (
                  <>
                    <button onClick={onStartEdit} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" />编辑提取内容</button>
                    <button onClick={() => toast.error("创建可编辑副本暂未开放")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-500 hover:bg-slate-50">创建可编辑副本</button>
                  </>
                ) : null}
                <button onClick={onOpenProcessing} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"><Info className="h-4 w-4" />查看处理详情</button>
                <button onClick={onOpenChunks} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" />查看引用片段</button>
                <button onClick={onReprocess} disabled={processing} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-50">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}重新处理</button>
                <button onClick={onCopyLink} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" />复制链接</button>
                <button onClick={onRename} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-500 hover:bg-slate-50"><Pencil className="h-4 w-4" />重命名</button>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={onDelete} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />从知识库移除</button>
                <button onClick={onDelete} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />删除</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-4xl">
        {isEditing ? (
          <div className="space-y-4 px-6 py-8">
            <KnowledgeEditor
              value={editHtml}
              onChange={onEditHtmlChange}
              sourceType={sourceType}
              editorClassName="min-h-[520px] px-6 py-5 text-[15px] leading-8 text-slate-800 outline-none prose-sm max-w-none focus:outline-none"
            />
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button onClick={onCancelEdit} disabled={savingEdit} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={onSaveEdit} disabled={savingEdit || !editTitle.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}保存
              </button>
            </div>
          </div>
        ) : (
          <SourceContentView source={source} chunks={chunks} />
        )}
    </div>
  );
}

function SettingsDrawer({
  open,
  form,
  saving,
  onClose,
  onChange,
  onSave,
  onDisable,
  onDelete,
}: {
  open: boolean;
  form: SettingsForm;
  saving: boolean;
  onClose: () => void;
  onChange: (form: SettingsForm) => void;
  onSave: () => void;
  onDisable: () => void;
  onDelete: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/20" onClick={onClose}>
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[500px] flex-col border-l border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">知识库设置</h2>
            <p className="mt-1 text-sm text-slate-500">管理知识库基础信息、访问权限和 AI 处理方式。</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-auto px-6 py-5">
          <SettingsSection title="基础信息">
            <label className="block text-xs font-semibold text-slate-500">名称</label>
            <Input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="mt-1" />
            <label className="mt-4 block text-xs font-semibold text-slate-500">简介</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300" />
          </SettingsSection>

          <SettingsSection title="访问权限">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(visibilityLabel).map(([key, label]) => (
                <button key={key} type="button" onClick={() => onChange({ ...form, visibility: key })} className={`rounded-xl border px-3 py-2 text-sm font-medium ${form.visibility === key ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{label}</button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="AI 设置">
            <label className="block text-xs font-semibold text-slate-500">默认问答模型</label>
            <select value={form.defaultModel} onChange={(e) => onChange({ ...form, defaultModel: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300">
              <option>自动选择</option>
              <option>GPT-5</option>
              <option>Claude Sonnet</option>
              <option>Gemini Pro</option>
            </select>
            <label className="mt-4 block text-xs font-semibold text-slate-500">默认处理方式</label>
            <select value={form.processMode} onChange={(e) => onChange({ ...form, processMode: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300">
              <option>智能处理</option>
              <option>保留原文结构</option>
              <option>优先提取问答内容</option>
            </select>
            <ToggleRow label="生成摘要" checked={form.generateSummary} onChange={(checked) => onChange({ ...form, generateSummary: checked })} />
            <ToggleRow label="提取关键词" checked={form.extractKeywords} onChange={(checked) => onChange({ ...form, extractKeywords: checked })} />
          </SettingsSection>

          <SettingsSection title="成员权限">
            <div className="space-y-2">
              {[
                ["当前账号", "所有者"],
                ["团队成员", "编辑者"],
                ["访客", "查看者"],
              ].map(([name, role]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{name}</span>
                  <span className="text-xs text-slate-400">{role}</span>
                </div>
              ))}
            </div>
            <button onClick={() => toast.error("添加成员暂未开放")} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">添加成员</button>
          </SettingsSection>

          <SettingsSection title="危险操作">
            <div className="space-y-2">
              <button onClick={onDisable} className="w-full rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-left text-sm font-medium text-amber-700 hover:bg-amber-100">停用知识库</button>
              <button onClick={onDelete} className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-100">删除知识库</button>
            </div>
          </SettingsSection>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
          <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={onClose}>取消</Button>
          <Button onClick={onSave} disabled={saving || !form.name.trim()} className="bg-blue-600 text-white hover:bg-blue-700">{saving ? "保存中..." : "保存设置"}</Button>
        </div>
      </aside>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-slate-800">{title}</h3>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">{children}</div>
    </section>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-blue-600" />
    </label>
  );
}

function ProcessingDetailModal({ source, base, onClose }: { source: Rec | null; base: Rec; onClose: () => void }) {
  if (!source) return null;
  const meta = (source.metadata || {}) as Rec;
  return (
    <AppModal open={!!source} onClose={onClose} title="处理详情" size="lg">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <InfoItem label="所属知识库" value={asText(base.name)} />
        <InfoItem label="来源类型" value={sourceTypeLabel(source)} />
        <InfoItem label="处理状态" value={statusLabel(source.syncStatus)} />
        <InfoItem label="片段数量" value={`${asNum(source.chunkCount)} 个`} />
        <InfoItem label="字符数" value={`${asNum(meta.characters, sourcePlainText(source).length)} 字符`} />
        <InfoItem label="处理方式" value={asText(meta.parser, "本地解析")} />
        <InfoItem label="创建时间" value={asText(source.createdAt) ? fmt(asText(source.createdAt)) : "—"} />
        <InfoItem label="更新时间" value={sourceUpdatedAt(source) ? fmt(sourceUpdatedAt(source)) : "—"} />
        <InfoItem label="处理时间" value={asText(source.processedAt) ? fmt(asText(source.processedAt)) : "—"} />
        <InfoItem label="索引更新时间" value={asText(source.lastIndexedAt) ? fmt(asText(source.lastIndexedAt)) : "—"} />
      </div>
      {asText(source.errorMessage) ? <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{asText(source.errorMessage)}</div> : null}
      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Metadata</summary>
        <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(meta, null, 2)}</pre>
      </details>
    </AppModal>
  );
}

function ChunkListModal({
  source,
  chunks,
  loading,
  onClose,
  onView,
  onCopy,
  onDelete,
}: {
  source: Rec | null;
  chunks: Rec[];
  loading: boolean;
  onClose: () => void;
  onView: (chunk: Rec) => void;
  onCopy: (text: string) => void;
  onDelete: (chunk: Rec) => void;
}) {
  return (
    <AppModal open={!!source} onClose={onClose} title="引用片段" description="高级检查入口，用于核对问答引用依据。" size="lg">
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-500" />
          <p className="mt-3 text-sm text-slate-500">正在加载...</p>
        </div>
      ) : chunks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <Database className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">暂无引用片段</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chunks.map((chunk) => {
            const content = asText(chunk.content);
            return (
              <article key={asText(chunk.id)} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-100 hover:shadow-sm">
                <p className="text-sm leading-6 text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">{content || "空内容"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
                  <span>{chunkLocation(chunk)}</span>
                  <span>{chunkUpdatedAt(chunk) ? distanceToNow(chunkUpdatedAt(chunk)) : "—"}</span>
                  <span>{asNum(chunk.charCount, content.length)} 字符</span>
                </div>
                <div className="mt-3 flex gap-1">
                  <button onClick={() => onView(chunk)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Eye className="h-3.5 w-3.5" />查看</button>
                  <button onClick={() => onCopy(content)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"><Copy className="h-3.5 w-3.5" />复制</button>
                  <button onClick={() => onDelete(chunk)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" />删除</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppModal>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">{value || "—"}</p>
    </div>
  );
}
