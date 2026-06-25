"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Database,
  File,
  FileText,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Search,
  StopCircle,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

// ─── Types ─────────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  conversationId?: string;
};

type ConversationItem = {
  id: string;
  title: string;
  updatedAt?: string;
  createdAt?: string;
  isPinned?: boolean;
};

type AttachedFile = { id: string; name: string; size?: number; uploading?: boolean; error?: string };

// ─── Model config ──────────────────────────────────────────────
const MODEL_CATEGORIES = [
  {
    label: "推荐",
    items: [{ id: "auto", name: "智能推荐", desc: "自动选择最适合的模型" }],
  },
  {
    label: "通用对话",
    items: [
      { id: "deepseek-chat", name: "DeepSeek V3", desc: "DeepSeek · 快速响应" },
      { id: "gpt-4o", name: "GPT-4o", desc: "OpenAI · 旗舰多模态" },
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet", desc: "Anthropic · 平衡" },
    ],
  },
  {
    label: "深度思考",
    items: [
      { id: "deepseek-reasoner", name: "DeepSeek R1", desc: "深度推理" },
      { id: "claude-opus-4-20250514", name: "Claude Opus", desc: "最强推理" },
    ],
  },
  {
    label: "国内模型",
    items: [
      { id: "qwen-plus", name: "通义千问", desc: "阿里 · 中文优化" },
      { id: "glm-4", name: "智谱 GLM-4", desc: "中文理解 · 编程" },
      { id: "moonshot-v1-8k", name: "Moonshot", desc: "长文本处理" },
    ],
  },
];

const ALL_MODELS = MODEL_CATEGORIES.flatMap((g) => g.items);

// ─── Helpers ────────────────────────────────────────────────────
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function asText(v: unknown, fb = "") { return typeof v === "string" ? v : fb; }

function groupConversations(items: ConversationItem[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups: { label: string; items: ConversationItem[] }[] = [
    { label: "今天", items: [] },
    { label: "昨天", items: [] },
    { label: "最近 7 天", items: [] },
    { label: "本月", items: [] },
    { label: "更早", items: [] },
  ];

  for (const item of items) {
    const d = new Date(asText(item.updatedAt || item.createdAt));
    if (Number.isNaN(d.getTime())) { groups[4].items.push(item); continue; }
    if (d >= today) groups[0].items.push(item);
    else if (d >= yesterday) groups[1].items.push(item);
    else if (d >= weekAgo) groups[2].items.push(item);
    else if (d >= monthStart) groups[3].items.push(item);
    else groups[4].items.push(item);
  }

  return groups.filter((g) => g.items.length > 0);
}

// ─── Quick actions ──────────────────────────────────────────────
const WELCOME_PROMPTS = [
  { label: "总结文档", prompt: "请帮我总结这份文档的核心要点" },
  { label: "分析表格", prompt: "请帮我分析这个表格数据" },
  { label: "写一份方案", prompt: "请帮我写一份详细的方案" },
  { label: "翻译文本", prompt: "请帮我翻译以下内容" },
  { label: "润色内容", prompt: "请帮我润色和优化以下内容" },
  { label: "提取文件要点", prompt: "请帮我提取这个文件的关键信息" },
];

const QUICK_PROMPTS = [
  { label: "总结文档", prompt: "请帮我总结这份文档的核心要点" },
  { label: "分析表格", prompt: "请帮我分析这个表格数据" },
  { label: "整理资料", prompt: "请帮我整理和归类这些资料" },
  { label: "写一份方案", prompt: "请帮我写一份详细的方案" },
  { label: "翻译文本", prompt: "请帮我翻译以下内容" },
  { label: "润色内容", prompt: "请帮我润色和优化以下内容" },
  { label: "提取文件要点", prompt: "请帮我提取这个文件的关键信息" },
  { label: "解释代码", prompt: "请帮我解释这段代码" },
  { label: "生成图片提示词", prompt: "请帮我生成一张图片的提示词描述" },
  { label: "生成视频脚本", prompt: "请帮我规划一个短视频的脚本" },
];

// ─── Model Selector ─────────────────────────────────────────────
function ModelSelector({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = ALL_MODELS.find((m) => m.id === selected);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 transition"
      >
        <Bot className="h-3 w-3 text-sky-500" />
        {current?.name ?? "选择模型"}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
          <div className="max-h-[420px] overflow-y-auto">
            {MODEL_CATEGORIES.map((cat) => (
              <div key={cat.label} className="mb-1">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{cat.label}</div>
                {cat.items.map((m) => (
                  <button
                    key={m.id} type="button"
                    onClick={() => { onChange(m.id); setOpen(false); }}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected === m.id ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{m.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{m.desc}</div>
                    </div>
                    {selected === m.id && <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Confirm Dialog ─────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div className="w-[380px] rounded-2xl bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button className="bg-red-500 text-white hover:bg-red-600" onClick={onConfirm}>确认删除</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename Dialog ──────────────────────────────────────────────
function RenameDialog({ open, initial, onSave, onCancel }: {
  open: boolean; initial: string; onSave: (v: string) => void; onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => { if (open) setValue(initial); }, [open, initial]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div className="w-[380px] rounded-2xl bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-950">重命名会话</h3>
        <input
          autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onSave(value.trim()); }}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-300"
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button disabled={!value.trim()} onClick={() => onSave(value.trim())}>保存</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Actions ────────────────────────────────────────────
function MessageActions({ content, onCopy, onRegenerate, onLike, onDislike, liked }: {
  content: string; onCopy: () => void; onRegenerate: () => void; onLike: () => void; onDislike: () => void; liked?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover/message:opacity-100">
      <button
        type="button" onClick={() => { navigator.clipboard.writeText(content).catch(() => {}); setCopied(true); onCopy(); setTimeout(() => setCopied(false), 2000); }}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        {copied ? "已复制" : "复制"}
      </button>
      <button type="button" onClick={onRegenerate} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
        <RefreshCw className="h-3 w-3" />重新生成
      </button>
      <button type="button" onClick={onLike} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${liked === true ? "text-sky-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}>
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button type="button" onClick={onDislike} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${liked === false ? "text-red-500" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}>
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Markdown Renderer ──────────────────────────────────────────
const markdownComponents = {
  code({ className, children, ...props }: Record<string, unknown>) {
    const isBlock = typeof children === "string" && children.includes("\n");
    if (isBlock) {
      return (
        <div className="relative my-3 group/code">
          <button type="button"
            onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ""))}
            className="absolute right-3 top-3 rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-300 opacity-0 transition hover:bg-slate-600 group-hover/code:opacity-100"
          >复制</button>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">
            <code>{String(children).replace(/\n$/, "")}</code>
          </pre>
        </div>
      );
    }
    return <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-rose-600" {...props}>{String(children)}</code>;
  },
  table({ children }: { children: React.ReactNode }) {
    return <div className="my-3 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-sm">{children}</table></div>;
  },
  th({ children }: { children: React.ReactNode }) {
    return <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-600">{children}</th>;
  },
  td({ children }: { children: React.ReactNode }) {
    return <td className="border-b border-slate-100 px-3 py-2 text-sm text-slate-700">{children}</td>;
  },
};

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AiPage() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});

  // Dialogs
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [quickPromptOpen, setQuickPromptOpen] = useState(false);
  const quickPromptRef = useRef<HTMLDivElement>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userScrolledUpRef = useRef(false);

  // ── Scroll helpers ───────────────────────────────────────────
  const scrollToBottom = useCallback((force = false) => {
    if (!force && userScrolledUpRef.current) return;
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = dist > 120;
    setShowScrollButton(dist > 300);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, loading, scrollToBottom]);

  // ── Textarea auto-resize ─────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  // ── Load conversations ───────────────────────────────────────
  async function loadConversations() {
    try {
      const result = await api.listAIConversations();
      const raw = (result.data as ConversationItem[]) ?? [];
      // Sort pinned first
      raw.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(asText(b.updatedAt || b.createdAt)).getTime() - new Date(asText(a.updatedAt || a.createdAt)).getTime();
      });
      setConversations(raw);
    } catch { setConversations([]); }
  }

  useEffect(() => { void loadConversations(); }, []);

  // Esc to close quick prompt menu
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setQuickPromptOpen(false); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Click outside to close quick prompt menu
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (quickPromptRef.current && !quickPromptRef.current.contains(e.target as Node)) setQuickPromptOpen(false);
    }
    if (quickPromptOpen) { document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick); }
  }, [quickPromptOpen]);

  // ── Select conversation ──────────────────────────────────────
  async function selectConversation(id: string) {
    setConversationId(id);
    setAttachedFiles([]);
    try {
      const result = await api.listAIMessages(id);
      const restored: Message[] = (result.data as Array<Record<string, unknown>>)
        .map((item) => ({
          id: asText(item.id) || uid(),
          role: (asText(item.role) === "user" ? "user" : "assistant") as Message["role"],
          content: asText(item.content),
          model: asText(item.modelName) || undefined,
        }))
        .filter((item) => item.content);
      setMessages(restored);
      userScrolledUpRef.current = false;
      setTimeout(() => scrollToBottom(true), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "会话加载失败");
    }
  }

  function startNewConversation() {
    setConversationId("");
    setMessages([]);
    setInput("");
    setAttachedFiles([]);
    userScrolledUpRef.current = false;
  }

  // ── Conversation actions ─────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      await api.deleteAIConversation(id);
      if (id === conversationId) startNewConversation();
      await loadConversations();
    } catch (err) { toast.error(err instanceof Error ? err.message : "删除失败"); }
    setDeleteTarget(null);
  }

  async function handleRename(id: string, title: string) {
    try {
      await api.updateAIConversation(id, { title });
      await loadConversations();
    } catch (err) { toast.error(err instanceof Error ? err.message : "重命名失败"); }
    setRenameTarget(null);
    setContextMenuId(null);
  }

  async function handleTogglePin(id: string, current: boolean) {
    try {
      await api.updateAIConversation(id, { isPinned: !current });
      await loadConversations();
    } catch (err) { toast.error(err instanceof Error ? err.message : "操作失败"); }
    setContextMenuId(null);
  }

  // ── Upload file ──────────────────────────────────────────────
  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const tempId = uid();
    setAttachedFiles((prev) => [...prev, { id: tempId, name: file.name, size: file.size, uploading: true }]);
    setUploading(true);
    try {
      const result = await api.uploadDriveFile(file);
      const fileId = result.data?.id as string;
      if (fileId) {
        setAttachedFiles((prev) => prev.map((f) => f.id === tempId ? { ...f, id: fileId, uploading: false, error: undefined } : f));
      }
    } catch (err) {
      setAttachedFiles((prev) => prev.map((f) => f.id === tempId ? { ...f, uploading: false, error: err instanceof Error ? err.message : "上传失败" } : f));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAttachedFile(id: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  // ── Send message ─────────────────────────────────────────────
  async function handleSend(regenerateMsg?: Message) {
    const text = regenerateMsg ? regenerateMsg.content : input.trim();
    if (!text && !regenerateMsg) return;

    let nextMessages: Message[];
    if (regenerateMsg) {
      const idx = messages.findIndex((m) => m.id === regenerateMsg.id);
      nextMessages = idx >= 0 ? messages.slice(0, idx) : [...messages, { id: uid(), role: "user", content: text }];
      if (idx >= 0 && messages[idx].role === "assistant") {
        // Find the user message before it
        const userIdx = idx - 1;
        if (userIdx >= 0 && messages[userIdx].role === "user") {
          nextMessages = messages.slice(0, idx);
        }
      }
    } else {
      const userMsg: Message = { id: uid(), role: "user", content: text };
      nextMessages = [...messages, userMsg];
    }

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    userScrolledUpRef.current = false;
    scrollToBottom(true);

    try {
      const modelParam = selectedModel === "auto" ? undefined : selectedModel;
      const attachedFileId = attachedFiles.length > 0 ? attachedFiles[0].id : undefined;

      const result = await api.chat(
        nextMessages.map((m) => ({ role: m.role, content: m.content })),
        {
          conversationId: conversationId || undefined,
          sourceType: attachedFileId ? "drive" : "workspace",
          sourceId: attachedFileId,
          title: text.slice(0, 40),
          model: modelParam,
        },
      );

      if (result.data.conversationId) setConversationId(result.data.conversationId);
      const assistantMsg: Message = {
        id: result.data.messageId || uid(),
        role: "assistant",
        content: result.data.content,
        model: result.data.model,
        conversationId: result.data.conversationId,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await loadConversations();
    } catch (err) {
      const errText = err instanceof Error ? err.message : "AI 请求失败";
      toast.error(errText);
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: `❌ ${errText}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleStopGeneration() { setLoading(false); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  }

  // ── Filter conversations ─────────────────────────────────────
  const filtered = sidebarSearch
    ? conversations.filter((c) => c.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : conversations;
  const grouped = groupConversations(filtered);

  // ── Copy all ──────────────────────────────────────────────────
  function copyAll(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
  }

  const hasMessages = messages.length > 0;

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <WorkspaceShell active="任务中心" title="" subtitle="">
      <div className="flex h-[calc(100vh-76px)] overflow-hidden bg-[#F7F9FC]">
        {/* ── Session Sidebar ─────────────────────────────── */}
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="shrink-0 space-y-3 p-4">
            <Button
              className="w-full justify-start gap-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 h-11 font-semibold"
              onClick={startNewConversation}
            >
              <Plus className="h-4 w-4" />新建聊天
            </Button>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                className="flex-1 bg-transparent text-xs text-slate-600 outline-none placeholder:text-slate-400"
                placeholder="搜索聊天记录..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {grouped.length === 0 ? (
              <p className="px-2 py-8 text-center text-xs text-slate-400">
                {sidebarSearch ? "无匹配结果" : "暂无聊天记录"}
              </p>
            ) : (
              grouped.map((group) => (
                <div key={group.label} className="mb-2">
                  <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const active = item.id === conversationId;
                    return (
                      <div
                        key={item.id}
                        className={`group/item relative flex items-center rounded-lg transition ${
                          active ? "bg-sky-50" : "hover:bg-slate-50"
                        }`}
                      >
                        {active && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-sky-500" />}
                        <button
                          type="button"
                          onClick={() => void selectConversation(item.id)}
                          className="flex-1 truncate py-2 pl-3 pr-1 text-left text-sm text-slate-700"
                        >
                          <span className={`truncate block ${active ? "font-semibold text-sky-800" : ""}`}>
                            {item.isPinned && <Pin className="mr-1 inline h-3 w-3 text-amber-400" />}
                            {item.title || "新会话"}
                          </span>
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === item.id ? null : item.id); }}
                            className="mr-1 rounded-md p-1 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-500 group-hover/item:opacity-100"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                          {contextMenuId === item.id && (
                            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-[0_10px_40px_rgba(15,23,42,0.1)]">
                              {[
                                { icon: Pencil, label: "重命名", action: () => setRenameTarget({ id: item.id, title: item.title }) },
                                { icon: Pin, label: item.isPinned ? "取消置顶" : "置顶", action: () => handleTogglePin(item.id, !!item.isPinned) },
                                { icon: Trash2, label: "删除", action: () => setDeleteTarget(item.id), danger: true },
                              ].map(({ icon: Icon, label, action, danger }) => (
                                <button
                                  key={label} type="button"
                                  onClick={(e) => { e.stopPropagation(); action(); }}
                                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${danger ? "text-red-500 hover:bg-red-50" : "text-slate-700"}`}
                                >
                                  <Icon className="h-3.5 w-3.5" />{label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Main Chat Area ──────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Header */}
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur px-6">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-100 to-blue-100">
                <Bot className="h-4 w-4 text-sky-600" />
              </span>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900">序光 AI 助手</h1>
                <p className="text-[11px] text-slate-400 truncate">多模型 AI · 文件上下文 · 知识库问答</p>
              </div>
            </div>
            <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto"
          >
            <div className="mx-auto max-w-[860px] px-6 py-6">
              {!hasMessages ? (
                // Welcome state
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50">
                    <Bot className="h-8 w-8 text-sky-500" />
                  </div>
                  <h2 className="mt-6 text-xl font-bold tracking-tight text-slate-900">今天想处理什么？</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    你可以直接提问，也可以上传文件，让序光帮你总结、分析、整理和生成内容。
                  </p>
                  <div className="mt-8 flex max-w-md flex-wrap justify-center gap-2">
                    {WELCOME_PROMPTS.map((a) => (
                      <button
                        key={a.label} type="button"
                        onClick={() => { setInput(a.prompt); setTimeout(() => textareaRef.current?.focus(), 50); }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, i) => (
                    <div
                      key={message.id}
                      className={`group/message flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`relative max-w-[75%] ${
                          message.role === "user"
                            ? "rounded-2xl rounded-br-md bg-sky-50 px-5 py-3.5"
                            : "px-1 py-2"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="mb-2 flex items-center gap-2">
                            <Bot className="h-4 w-4 text-sky-500" />
                            <span className="text-xs font-semibold text-slate-500">序光 AI</span>
                            {message.model && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">{message.model}</span>
                            )}
                          </div>
                        )}
                        <div className={`text-sm leading-7 ${message.role === "user" ? "text-slate-800" : "text-slate-700"}`}>
                          {message.role === "assistant" ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {message.content}
                            </ReactMarkdown>
                          ) : (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          )}
                        </div>
                        {message.role === "assistant" && !message.content.startsWith("❌") && (
                          <MessageActions
                            content={message.content}
                            onCopy={() => copyAll(message.content)}
                            onRegenerate={() => handleSend(message)}
                            onLike={() => setLikedMessages((prev) => ({ ...prev, [message.id]: true }))}
                            onDislike={() => setLikedMessages((prev) => ({ ...prev, [message.id]: false }))}
                            liked={likedMessages[message.id]}
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-3 rounded-2xl px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                        <span className="text-sm text-slate-400">序光正在思考...</span>
                        <button
                          type="button" onClick={handleStopGeneration}
                          className="ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-500 transition"
                        >
                          <StopCircle className="h-3 w-3" />停止生成
                        </button>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Back-to-bottom button */}
          {showScrollButton && (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                onClick={() => { userScrolledUpRef.current = false; scrollToBottom(true); }}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm transition hover:border-sky-200 hover:text-sky-600"
              >
                <ArrowDown className="h-3 w-3" />回到最新消息
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="shrink-0 px-6 pb-6 pt-2"
            style={{ background: "linear-gradient(to top, #F7F9FC 70%, rgba(247,249,252,0))" }}
          >
            {/* Attached files */}
            {attachedFiles.length > 0 && (
              <div className="mx-auto mb-3 flex max-w-[860px] flex-wrap gap-2">
                {attachedFiles.map((file) => (
                  <span key={file.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                      file.error ? "border-red-200 bg-red-50 text-red-600" :
                      file.uploading ? "border-sky-200 bg-sky-50 text-sky-600" :
                      "border-sky-200 bg-sky-50 text-sky-700"
                    }`}
                  >
                    <File className="h-3 w-3" />
                    {file.name}
                    {file.size ? ` ${(file.size / 1024).toFixed(0)}KB` : ""}
                    {file.uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                    {file.error && <span className="cursor-pointer underline" onClick={() => {/* retry */}}>重试</span>}
                    <button type="button" onClick={() => removeAttachedFile(file.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-red-100 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mx-auto max-w-[860px]">
              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition focus-within:border-sky-300 focus-within:shadow-[0_8px_30px_rgba(14,165,233,0.08)]">
                {/* Left buttons */}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { void handleFileUpload(e); }} />
                <button type="button" disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 self-end rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-sky-600 transition mb-0.5"
                  title="上传文件">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                </button>
                <button type="button"
                  className="shrink-0 self-end rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-sky-600 transition mb-0.5"
                  title="选择知识库">
                  <Database className="h-5 w-5" />
                </button>
                <div ref={quickPromptRef} className="relative">
                  <button type="button"
                    onClick={() => setQuickPromptOpen(!quickPromptOpen)}
                    className="shrink-0 self-end rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-slate-100 hover:text-sky-600 transition mb-0.5 font-medium"
                    title="快捷指令">
                    ✨
                  </button>
                  {quickPromptOpen && (
                    <div className="absolute bottom-full left-0 z-50 mb-2 w-[200px] max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_48px_rgba(15,23,42,0.1)]">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-2 py-1">快捷指令</div>
                      <div className="space-y-0.5">
                        {QUICK_PROMPTS.map((a) => (
                          <button key={a.label} type="button"
                            onClick={() => { setInput(a.prompt); setQuickPromptOpen(false); textareaRef.current?.focus(); }}
                            className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 transition hover:bg-sky-50 hover:text-sky-700">
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <textarea ref={textareaRef} value={input}
                  onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="问序光，或者上传文件让它帮你处理..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                />

                {/* Right buttons */}
                <button type="button" disabled={loading || !input.trim()}
                  onClick={() => void handleSend()}
                  className="shrink-0 self-end grid h-10 w-10 place-items-center rounded-xl bg-sky-600 text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-30 disabled:cursor-not-allowed mb-0.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                序光可能产生不准确信息，请对重要内容进行核实
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Dialogs ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除会话"
        message="确定删除这条会话吗？删除后不可恢复。"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      <RenameDialog
        open={!!renameTarget}
        initial={renameTarget?.title ?? ""}
        onSave={(v) => renameTarget && handleRename(renameTarget.id, v)}
        onCancel={() => setRenameTarget(null)}
      />
    </WorkspaceShell>
  );
}