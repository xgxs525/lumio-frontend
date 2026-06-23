"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import LinkExt from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { common, createLowlight } from "lowlight";
import {
  ArrowLeft, Bold, Italic, UnderlineIcon, Strikethrough, Code, Quote,
  List, ListOrdered, ListTodo, Minus, Link2, ImageIcon, Table2,
  AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, FileText, Upload, Globe, Edit3,
  Type, Highlighter, Save, Send, X, Check, Loader2,
  FileUp, Columns2, Grid3x3, BookTemplate, PanelTop,
  Layout, FolderOpen, BookOpen, BarChart3, Divide, Globe2, Timer, Calendar, Hash,
} from "lucide-react";

// ── Types ──
type Rec = Record<string, unknown>;
const asText = (v: unknown, fb = "") => typeof v === "string" ? v : fb;
const asNum = (v: unknown, fb = 0) => typeof v === "number" ? v : fb;

type SourceType = "file" | "drive" | "document" | "text" | "link" | "manual";
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface TOCItem { id: string; level: number; text: string }

const sourceTypes: { key: SourceType; icon: typeof FileText; label: string; desc: string }[] = [
  { key: "manual", icon: Edit3, label: "手动录入", desc: "手动创建结构化知识内容。" },
  { key: "text", icon: FileText, label: "粘贴文本", desc: "粘贴已有内容，并继续整理格式。" },
  { key: "file", icon: Upload, label: "上传文件", desc: "上传 PDF、Word、表格、PPT 或图片。" },
  { key: "drive", icon: FolderOpen, label: "云盘文件", desc: "从云盘选择已有文件。" },
  { key: "document", icon: BookOpen, label: "导入文档", desc: "选择已有在线文档作为资料。" },
  { key: "link", icon: Globe, label: "网页链接", desc: "添加网页地址并提取内容。" },
];

// ── Slash command config ──
const slashCommands = [
  { group: "基础", items: [
    { key: "text", icon: Type, label: "正文", cmd: "setParagraph" },
    { key: "h1", icon: Heading1, label: "标题 1", cmd: "toggleHeading", args: { level: 1 } },
    { key: "h2", icon: Heading2, label: "标题 2", cmd: "toggleHeading", args: { level: 2 } },
    { key: "h3", icon: Heading3, label: "标题 3", cmd: "toggleHeading", args: { level: 3 } },
    { key: "bullet", icon: List, label: "无序列表", cmd: "toggleBulletList" },
    { key: "ordered", icon: ListOrdered, label: "有序列表", cmd: "toggleOrderedList" },
    { key: "task", icon: ListTodo, label: "任务列表", cmd: "toggleTaskList" },
    { key: "quote", icon: Quote, label: "引用", cmd: "toggleBlockquote" },
    { key: "code", icon: Code, label: "代码块", cmd: "toggleCodeBlock" },
    { key: "hr", icon: Minus, label: "分割线", cmd: "setHorizontalRule" },
  ]},
  { group: "常用", items: [
    { key: "image", icon: ImageIcon, label: "图片", cmd: "image" },
    { key: "table", icon: Table2, label: "表格", cmd: "table" },
    { key: "columns", icon: Columns2, label: "分栏", soon: true },
    { key: "callout", icon: Highlighter, label: "高亮块", soon: true },
    { key: "file", icon: FileUp, label: "视频或文件", cmd: "file" },
    { key: "button", icon: PanelTop, label: "按钮", soon: true },
  ]},
  { group: "数据", items: [
    { key: "kanban", icon: Layout, label: "看板", soon: true },
    { key: "gantt", icon: BarChart3, label: "甘特图", soon: true },
    { key: "gallery", icon: Grid3x3, label: "画册", soon: true },
    { key: "spreadsheet", icon: Table2, label: "电子表格", soon: true },
  ]},
  { group: "进阶", items: [
    { key: "formula", icon: Divide, label: "公式", soon: true },
    { key: "template", icon: BookTemplate, label: "模板", soon: true },
    { key: "subpage", icon: BookOpen, label: "子文档", soon: true },
    { key: "webcard", icon: Globe2, label: "网页卡片", soon: true },
    { key: "timer", icon: Timer, label: "倒计时", soon: true },
    { key: "toc", icon: List, label: "目录导航", soon: true },
    { key: "timeline", icon: Calendar, label: "时间轴", soon: true },
    { key: "embed", icon: Globe2, label: "内嵌网页", soon: true },
  ]},
];

// ── Toolbar button ──
const tb = "grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700";
const tbSm = "grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600";

// ── Processing Settings ──
const processingModes = [
  { key: "intelligent", label: "智能处理，推荐" },
  { key: "paragraph", label: "按段落处理" },
  { key: "heading", label: "按标题结构处理" },
  { key: "keep_original", label: "保留原文" },
];

// ── Slash Command Extension ──
interface SlashItem { key: string; icon: typeof Type; label: string; cmd?: string; args?: Record<string, unknown>; soon?: boolean }

const SlashPluginKey = new PluginKey("slash-command");

function slashPlugin(items: { group: string; items: SlashItem[] }[]) {
  const flat = items.flatMap(g => g.items);
  let popupEl: HTMLElement | null = null;
  let selectedIdx = 0;
  let filteredItems: SlashItem[] = [];

  function renderPopup() {
    if (!popupEl) return;
    const groups: Record<string, SlashItem[]> = {};
    filteredItems.forEach(i => {
      const group = items.find(g => g.items.some(x => x.key === i.key))?.group || "其他";
      if (!groups[group]) groups[group] = [];
      groups[group].push(i);
    });
    popupEl.innerHTML = Object.entries(groups).map(([group, groupItems]) =>
      `<div class="mb-1 last:mb-0">
        <div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">${group}</div>
        ${groupItems.map((item, idx) => {
          const isSelected = filteredItems.indexOf(item) === selectedIdx;
          return `<div data-slash-item data-key="${item.key}" class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition text-sm ${isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"} ${item.soon ? "opacity-50" : ""}">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isSelected ? "bg-blue-100" : "bg-slate-100"} text-slate-500">${item.label[0]}</span>
            <span class="font-medium">${item.label}</span>
            ${item.soon ? '<span class="ml-auto text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">即将</span>' : ""}
          </div>`;
        }).join("")}
      </div>`
    ).join("");
  }

  function filterItems(query: string) {
    const q = query.toLowerCase();
    filteredItems = flat.filter(i => i.label.toLowerCase().includes(q) || i.key.includes(q)).slice(0, 12);
    selectedIdx = 0;
    renderPopup();
  }

  function closePopup() {
    if (popupEl) { popupEl.remove(); popupEl = null; }
    filteredItems = [];
  }

  function executeCommand(editor: Editor, item: SlashItem) {
    closePopup();
    if (!item.cmd || !editor) return;
    const chain = editor.chain().focus();

    // Delete the slash trigger text
    const { $from } = editor.state.selection;
    const from = $from.start();
    chain.deleteRange({ from, to: $from.pos });

    if (item.cmd === "setParagraph") chain.setParagraph();
    else if (item.cmd === "toggleHeading") chain.toggleHeading(item.args as { level: 1 | 2 | 3 });
    else if (item.cmd === "toggleBulletList") chain.toggleBulletList();
    else if (item.cmd === "toggleOrderedList") chain.toggleOrderedList();
    else if (item.cmd === "toggleTaskList") chain.toggleTaskList();
    else if (item.cmd === "toggleBlockquote") chain.toggleBlockquote();
    else if (item.cmd === "toggleCodeBlock") chain.toggleCodeBlock();
    else if (item.cmd === "setHorizontalRule") chain.setHorizontalRule();
    else if (item.cmd === "image") { const url = window.prompt("图片地址：", "https://"); if (url) chain.setImage({ src: url }); }
    else if (item.cmd === "table") chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    else if (item.cmd === "file") { /* handled externally */ }
    else return;
    chain.run();
  }

  return new Plugin({
    key: SlashPluginKey,
    state: {
      init() { return { active: false, range: { from: 0, to: 0 }, query: "" }; },
      apply(tr, prev) { return prev; },
    },
    props: {
      handleDOMEvents: {
        keydown(view, event) {
          if (!popupEl) return false;
          if (event.key === "ArrowDown") { event.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, filteredItems.length - 1); renderPopup(); return true; }
          if (event.key === "ArrowUp") { event.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); renderPopup(); return true; }
          if (event.key === "Enter") { event.preventDefault(); const item = filteredItems[selectedIdx]; if (item) executeCommand(view.state.schema.cached.editor as unknown as Editor, item); return true; }
          if (event.key === "Escape") { event.preventDefault(); closePopup(); return true; }
          return false;
        },
      },
      handleTextInput(view, from: number, to: number, text: string) {
        const { $from } = view.state.selection;
        const nodeText = $from.parent.textContent;

        // Check if current line starts with /
        const lineStart = $from.start();
        const lineText = nodeText.slice(0, $from.parentOffset + 1);

        if (lineText.startsWith("/")) {
          const query = lineText.slice(1);
          if (!popupEl) {
            popupEl = document.createElement("div");
            popupEl.className = "fixed z-[200] w-[340px] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-2 overflow-hidden";
            document.body.appendChild(popupEl);
            // Position near cursor
            const coords = view.coordsAtPos(from);
            popupEl.style.left = `${coords.left}px`;
            popupEl.style.top = `${coords.bottom + 8}px`;
          }
          filterItems(query);
          return false;
        } else {
          closePopup();
          return false;
        }
      },
    },
    view(editorView) {
      return {
        update() {
          if (popupEl) {
            const { $from } = editorView.state.selection;
            const start = $from.start();
            const lineText = $from.parent.textContent.slice(0, $from.parentOffset + 1);
            if (!lineText.startsWith("/")) closePopup();
          }
        },
        destroy() { closePopup(); },
      };
    },
  });
}

function createSlashExtension(items: { group: string; items: SlashItem[] }[]) {
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [slashPlugin(items)];
    },
  });
}

// ── Main Page ──
export default function AddSourcePage() {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const router = useRouter();

  // Knowledge base info
  const [kbName, setKbName] = useState("知识库");
  const [kbLoading, setKbLoading] = useState(true);

  // Source type
  const [sourceType, setSourceTypeState] = useState<SourceType>("manual");

  // ── Per-type state ──
  const empty = { manual: "", text: "", file: "", drive: "", document: "", link: "" } as Record<SourceType, string>;
  const emptyFile = { manual: null, text: null, file: null, drive: null, document: null, link: null } as Record<SourceType, File | null>;
  
  const [titles, setTitles] = useState<Record<SourceType, string>>({ ...empty });
  const [editorContents, setEditorContents] = useState<Record<SourceType, string>>({ ...empty });
  const [selectedFiles, setSelectedFiles] = useState<Record<SourceType, File | null>>({ ...emptyFile });
  const [linkUrls, setLinkUrls] = useState<Record<SourceType, string>>({ ...empty });
  const [charCounts, setCharCounts] = useState<Record<SourceType, number>>({ manual: 0, text: 0, file: 0, drive: 0, document: 0, link: 0 });
  const [wordCounts, setWordCounts] = useState<Record<SourceType, number>>({ manual: 0, text: 0, file: 0, drive: 0, document: 0, link: 0 });

  // Derived per-type accessors
  const title = titles[sourceType];
  const setTitle = (v: string) => setTitles(prev => ({ ...prev, [sourceType]: v }));
  const editorContent = editorContents[sourceType];
  const selectedFile = selectedFiles[sourceType];
  const setSelectedFile = (f: File | null) => setSelectedFiles(prev => ({ ...prev, [sourceType]: f }));
  const linkUrl = linkUrls[sourceType];
  const setLinkUrl = (v: string) => setLinkUrls(prev => ({ ...prev, [sourceType]: v }));
  const charCount = charCounts[sourceType];
  const wordCount = wordCounts[sourceType];

  const fileRef = useRef<HTMLInputElement>(null);

  // Global state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const editorRef = useRef<Editor | null>(null);

  // Right panel
  const [rightTab, setRightTab] = useState<"structure" | "settings" | "info">("structure");

  // Processing settings
  const [procMode, setProcMode] = useState("intelligent");
  const [genSummary, setGenSummary] = useState(true);
  const [extractKeywords, setExtractKeywords] = useState(true);
  const [joinQa, setJoinQa] = useState(true);

  // Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight: createLowlight(common) }),
      TaskList, TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      LinkExt.configure({ openOnClick: false }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      TextStyle, Color,
      Placeholder.configure({ placeholder: "输入内容，或输入 / 插入内容块。" }),
      createSlashExtension(slashCommands),
    ],
    content: editorContent,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setCharCounts(prev => ({ ...prev, [sourceType]: text.length }));
      setWordCounts(prev => ({ ...prev, [sourceType]: text.trim() ? text.trim().split(/\s+/).length : 0 }));
      triggerAutoSave();
    },
    editorProps: {
      attributes: {
        class: "min-h-[650px] px-12 py-8 text-base text-slate-800 leading-7 outline-none prose prose-slate max-w-none [&_h1]:text-2xl [&_h1]:font-extrabold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-3 [&_blockquote]:border-blue-300 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_pre]:rounded-2xl [&_pre]:bg-slate-950 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:text-sm [&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-pink-600 [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_td]:text-sm [&_hr]:my-8 [&_hr]:border-slate-200 [&_img]:rounded-xl",
      },
    },
  });

  // Sync editorRef
  useEffect(() => { editorRef.current = editor; }, [editor]);

  // Type switch handler — saves current editor content before switching
  const setSourceType = useCallback((t: SourceType) => {
    const ed = editorRef.current;
    if (ed) {
      setEditorContents(prev => ({ ...prev, [sourceType]: ed.getHTML() }));
    }
    setSourceTypeState(t);
  }, [sourceType]);

  // Restore editor content when sourceType changes
  useEffect(() => {
    if (editor && editorContents[sourceType]) {
      const nextContent = editorContents[sourceType];
      if (editor.getHTML() !== nextContent) {
        editor.commands.setContent(nextContent);
      }
    }
  }, [sourceType]);

  // Load KB info
  useEffect(() => {
    (async () => {
      try {
        const r = await api.getKnowledgeBase(knowledgeBaseId);
        setKbName(asText((r.data as Rec).name, "知识库"));
      } catch { /* keep default */ }
      finally { setKbLoading(false); }
    })();
  }, [knowledgeBaseId]);

  // Auto-save
  const autoSaveActive = useRef(false);
  function triggerAutoSave() {
    if (sourceType !== "manual" && sourceType !== "text") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(() => {
      try {
        // Save per-type
        const allDrafts: Record<string, unknown> = {};
        for (const t of Object.keys(editorContents) as SourceType[]) {
          allDrafts[t] = {
            title: titles[t],
            content: t === sourceType ? editor?.getHTML() || "" : editorContents[t],
          };
        }
        localStorage.setItem(`kb-draft-${knowledgeBaseId}`, JSON.stringify({
          sourceType,
          drafts: allDrafts,
          updatedAt: new Date().toISOString(),
        }));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch {
        setSaveStatus("error");
      }
    }, 2000);
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(`kb-draft-${knowledgeBaseId}`);
      if (!raw) return;
      const draft = JSON.parse(raw);
      // Restore per-type drafts
      if (draft.drafts) {
        for (const t of Object.keys(draft.drafts)) {
          if (draft.drafts[t].title) {
            setTitles(prev => ({ ...prev, [t]: draft.drafts[t].title }));
          }
          if (draft.drafts[t].content) {
            setEditorContents(prev => ({ ...prev, [t]: draft.drafts[t].content }));
          }
        }
      }
      if (draft.sourceType) {
        setSourceTypeState(draft.sourceType as SourceType);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { if (editor) loadDraft(); }, [editor]);

  // TOC from headings
  const toc = useMemo<TOCItem[]>(() => {
    if (!editor) return [];
    const items: TOCItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        items.push({ id: `h-${pos}`, level: node.attrs.level as number, text: node.textContent });
      }
    });
    return items;
  }, [editor?.state.doc.content]);

  // ── Actions ──
  function scrollToHeading(id: string) {
    const pos = parseInt(id.replace("h-", ""), 10);
    if (!isNaN(pos) && editor) {
      editor.chain().setTextSelection(pos).scrollIntoView().run();
    }
  }

  const insertImage = () => {
    const url = window.prompt("图片地址：", "https://");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertFile = () => {
    fileRef.current?.click();
  };

  const setLink = () => {
    const prev = editor?.getAttributes("link").href;
    const url = window.prompt("链接地址：", prev || "https://");
    if (url === null) return;
    if (url === "") { editor?.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // ── Submit ──
  async function handleSubmit() {
    if (sourceType === "manual") {
      if (!title.trim()) { toast.error("请输入标题"); return; }
      if (!editor?.getText().trim()) { toast.error("请输入正文"); return; }
    } else if (sourceType === "text") {
      if (!editor?.getText().trim()) { toast.error("请输入文本内容"); return; }
    } else if (sourceType === "link") {
      if (!linkUrl.trim()) { toast.error("请输入有效网页链接"); return; }
    } else if (sourceType === "file") {
      if (!selectedFile) { toast.error("请选择文件"); return; }
    }

    setSubmitting(true);
    try {
      let sourceId = "";
      if (sourceType === "file" && selectedFile) {
        const uploadResult = await api.uploadDriveFile(selectedFile);
        const data = uploadResult.data as Record<string, unknown>;
        sourceId = (data.id || data.storageKey) as string || "";
        if (!sourceId) { toast.error("文件上传失败"); setSubmitting(false); return; }
      } else if (sourceType === "link") {
        sourceId = linkUrl.trim();
      } else {
        sourceId = editor?.getHTML() || editor?.getText() || "";
      }

      const payload: { source_type: string; source_id: string; title?: string } = {
        source_type: sourceType,
        source_id: sourceId,
      };
      if (title.trim()) payload.title = title.trim();

      await api.addKnowledgeSource(knowledgeBaseId, payload);

      // Clear draft
      localStorage.removeItem(`kb-draft-${knowledgeBaseId}`);
      toast.success("资料已添加，正在处理内容。");
      router.push(`/knowledge/${knowledgeBaseId}?tab=sources`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDraft() {
    triggerAutoSave();
    toast.success("草稿已保存。");
  }

  // ── Toolbar helpers ──
  const isActive = useCallback((name: string, attrs?: Record<string, unknown>) => editor?.isActive(name, attrs) ?? false, [editor]);
  const canSubmit = sourceType === "file" ? !!selectedFile : sourceType === "link" ? !!linkUrl.trim() : !!editor?.getText().trim();
  const showEditor = sourceType === "manual" || sourceType === "text";
  const showSimpleForm = sourceType === "file" || sourceType === "link" || sourceType === "drive" || sourceType === "document";

  return (
    <div className="flex flex-col h-screen bg-[#f4f6f9] text-slate-900">
      {/* ── Top Bar ── */}
      <header className="flex shrink-0 items-center justify-between gap-4 h-[72px] px-6 border-b border-slate-200/70 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => router.push(`/knowledge/${knowledgeBaseId}?tab=sources`)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-950">添加资料</h1>
            <p className="text-xs text-slate-400 truncate">
              正在添加到：<span className="font-semibold text-slate-600">{kbLoading ? "加载中..." : kbName}</span>
            </p>
          </div>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" />保存中...</span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600"><Check className="h-3 w-3" />已自动保存</span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-red-500"><X className="h-3 w-3" />保存失败</span>
          )}

          <button onClick={saveDraft} className="flex items-center gap-1.5 h-[38px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <Save className="h-4 w-4" />保存草稿
          </button>
          <button onClick={handleSubmit} disabled={submitting || !canSubmit}
            className={`flex items-center gap-1.5 h-[38px] rounded-xl px-4 text-sm font-semibold transition ${
              submitting || !canSubmit ? "bg-blue-100 text-blue-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            }`}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />处理中...</> : <><Send className="h-4 w-4" />添加到知识库</>}
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left Sidebar ── */}
        <aside className="shrink-0 w-[248px] border-r border-slate-200/70 bg-white overflow-y-auto py-4 px-3 space-y-1">
          {sourceTypes.map(({ key, icon: Icon, label, desc }) => (
            <button key={key} onClick={() => setSourceType(key)}
              className={`w-full text-left rounded-[14px] px-3.5 py-3 transition ${
                sourceType === key
                  ? "bg-blue-50 border-l-[3px] border-blue-500 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-[3px] border-transparent"
              }`}>
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-400 pl-6.5">{desc}</p>
            </button>
          ))}
        </aside>

        {/* ── Center Editor ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {showEditor && (
            <div className="flex-1 flex flex-col bg-white mx-6 my-5 rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="flex shrink-0 items-center gap-0.5 px-4 py-2.5 border-b border-slate-100 bg-white sticky top-0 z-30 overflow-x-auto">
                {/* Heading dropdown */}
                <div className="flex items-center gap-0.5 pr-3 mr-3 border-r border-slate-100">
                  <button className={`${tb} text-xs font-semibold`} onClick={() => editor?.chain().focus().setParagraph().run()} data-active={editor?.isActive("paragraph")}>
                    <Type className="h-4 w-4" />
                  </button>
                  <button className={tb} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} data-active={isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></button>
                  <button className={tb} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} data-active={isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></button>
                  <button className={tb} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} data-active={isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></button>
                </div>

                {/* Inline */}
                <button className={tb} onClick={() => editor?.chain().focus().toggleBold().run()} data-active={isActive("bold")}><Bold className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().toggleItalic().run()} data-active={isActive("italic")}><Italic className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().toggleUnderline().run()} data-active={isActive("underline")}><UnderlineIcon className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().toggleStrike().run()} data-active={isActive("strike")}><Strikethrough className="h-4 w-4" /></button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* List + block */}
                <button className={tb} onClick={() => editor?.chain().focus().toggleBulletList().run()} data-active={isActive("bulletList")}><List className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().toggleOrderedList().run()} data-active={isActive("orderedList")}><ListOrdered className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().toggleTaskList().run()} data-active={isActive("taskList")}><ListTodo className="h-4 w-4" /></button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <button className={tb} onClick={() => editor?.chain().focus().toggleBlockquote().run()} data-active={isActive("blockquote")}><Quote className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} data-active={isActive("codeBlock")}><Code className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Align */}
                <button className={tb} onClick={() => editor?.chain().focus().setTextAlign("left").run()} data-active={isActive("textAlign", { textAlign: "left" })}><AlignLeft className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().setTextAlign("center").run()} data-active={isActive("textAlign", { textAlign: "center" })}><AlignCenter className="h-4 w-4" /></button>
                <button className={tb} onClick={() => editor?.chain().focus().setTextAlign("right").run()} data-active={isActive("textAlign", { textAlign: "right" })}><AlignRight className="h-4 w-4" /></button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Insert buttons */}
                <button className={tb} title="插入图片" onClick={insertImage}><ImageIcon className="h-4 w-4" /></button>
                <button className={tb} title="插入表格" onClick={insertTable}><Table2 className="h-4 w-4" /></button>
                <button className={tb} title="插入链接" onClick={setLink}><Link2 className="h-4 w-4" /></button>
                <button className={tb} title="插入附件" onClick={insertFile}><FileUp className="h-4 w-4" /></button>
                <input ref={fileRef} type="file" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const r = await api.uploadFile(f);
                    const url = `/api/v1/files/${r.storageKey}`;
                    editor?.chain().focus().insertContent(`<p><a href="${url}" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">📎 ${f.name} (${(f.size / 1024).toFixed(1)} KB)</a></p>`).run();
                  } catch { toast.error("文件上传失败"); }
                }} />
              </div>

              {/* Title */}
              <div className="px-12 pt-8 pb-3">
                <input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); triggerAutoSave(); }}
                  placeholder="请输入标题，例如：AI 平台产品说明"
                  className="w-full h-[52px] text-3xl font-extrabold tracking-tight text-slate-950 bg-transparent border-none outline-none placeholder:text-slate-300"
                />
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
              </div>
            </div>
          )}

          {showSimpleForm && (
            <div className="flex-1 mx-6 my-5 rounded-2xl border border-slate-200/60 bg-white shadow-sm p-10 flex flex-col items-center justify-center">
              {sourceType === "file" && (
                <div className="w-full max-w-[480px] text-center">
                  <Upload className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-lg font-bold text-slate-900">上传文件</h3>
                  <p className="mt-1 text-sm text-slate-500">支持 PDF、Word、Excel、PPT、TXT、Markdown、图片等格式。</p>
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center hover:border-blue-300 hover:bg-blue-50/30 transition cursor-pointer"
                    onClick={() => fileRef.current?.click()}>
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">拖拽文件到这里，或点击选择文件</p>
                    <p className="mt-1 text-xs text-slate-400">PDF · Word · Excel · PPT · TXT · Markdown · 图片</p>
                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setSelectedFile(f);
                    }} />
                  </div>
                  {selectedFile && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button className="text-slate-400 hover:text-red-500" onClick={() => setSelectedFile(null)}><X className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              )}

              {sourceType === "link" && (
                <div className="w-full max-w-[560px]">
                  <Globe className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-center text-lg font-bold text-slate-900">添加网页链接</h3>
                  <p className="mt-1 text-center text-sm text-slate-500">序光会提取网页正文，并加入当前知识库。</p>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">网页链接 <span className="text-red-500">*</span></label>
                      <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        className="w-full h-[48px] rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">资料标题（可选）</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="输入资料标题"
                        className="w-full h-[48px] rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                    </div>
                  </div>
                </div>
              )}

              {sourceType === "drive" && (
                <div className="text-center">
                  <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-lg font-bold text-slate-900">选择云盘文件</h3>
                  <p className="mt-1 text-sm text-slate-500">从云盘选择已有文件加入知识库。</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">即将支持</p>
                </div>
              )}

              {sourceType === "document" && (
                <div className="text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-lg font-bold text-slate-900">导入文档</h3>
                  <p className="mt-1 text-sm text-slate-500">选择已有在线文档加入知识库。</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">即将支持</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="shrink-0 w-[320px] border-l border-slate-200/70 bg-white overflow-y-auto flex flex-col">
          {/* Tabs */}
          <div className="flex shrink-0 border-b border-slate-100">
            {(["structure", "settings", "info"] as const).map((t) => (
              <button key={t} onClick={() => setRightTab(t)}
                className={`flex-1 py-3 text-xs font-semibold transition border-b-2 ${
                  rightTab === t ? "border-blue-500 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}>
                {{ structure: "文档结构", settings: "处理设置", info: "资料信息" }[t]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Document Structure */}
            {rightTab === "structure" && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">文档结构</h4>
                {toc.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <Hash className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-xs text-slate-400">使用 H1 / H2 / H3 创建文档结构。</p>
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button onClick={() => scrollToHeading(item.id)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition truncate"
                          style={{ paddingLeft: `${(item.level - 1) * 16 + 12}px` }}>
                          <span className="text-[11px] text-slate-300 mr-2">H{item.level}</span>
                          {item.text || "无标题"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Processing Settings */}
            {rightTab === "settings" && (
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">处理设置</h4>

                <div>
                  <label className="text-xs font-semibold text-slate-600">处理方式</label>
                  <div className="mt-2 space-y-1.5">
                    {processingModes.map((m) => (
                      <button key={m.key} onClick={() => setProcMode(m.key)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                          procMode === m.key ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                        }`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">生成资料摘要</span>
                    <button onClick={() => setGenSummary(!genSummary)}
                      className={`relative w-9 h-5 rounded-full transition ${genSummary ? "bg-blue-500" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition ${genSummary ? "translate-x-4" : ""}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">提取关键词</span>
                    <button onClick={() => setExtractKeywords(!extractKeywords)}
                      className={`relative w-9 h-5 rounded-full transition ${extractKeywords ? "bg-blue-500" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition ${extractKeywords ? "translate-x-4" : ""}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">加入知识库问答</span>
                    <button onClick={() => setJoinQa(!joinQa)}
                      className={`relative w-9 h-5 rounded-full transition ${joinQa ? "bg-blue-500" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition ${joinQa ? "translate-x-4" : ""}`} />
                    </button>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">内容格式</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Block JSON", "Markdown", "HTML", "纯文本"].map((f) => (
                      <span key={f} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Document Info */}
            {rightTab === "info" && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">资料信息</h4>
                <div className="space-y-3 text-sm">
                  {[
                    ["资料标题", title || "未填写"],
                    ["来源类型", { manual: "手动录入", text: "粘贴文本", file: "上传文件", link: "网页链接", drive: "云盘文件", document: "导入文档" }[sourceType]],
                    ["所属知识库", kbLoading ? "加载中..." : kbName],
                    ["字数", `${wordCount} 字`],
                    ["字符数", `${charCount} 字符`],
                    ["保存状态", { idle: "就绪", saving: "保存中", saved: "已保存", error: "保存失败" }[saveStatus]],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-medium text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Bottom Bar ── */}
      <footer className="flex shrink-0 items-center justify-between h-[68px] px-6 border-t border-slate-200/70 bg-white/80 backdrop-blur-sm">
        <p className="text-xs text-slate-400">
          {showEditor ? "编辑内容会自动保存。添加后，序光会处理内容并加入知识库问答。" : "选择资料后点击提交，序光将处理内容并加入当前知识库。"}
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/knowledge/${knowledgeBaseId}?tab=sources`)}
            className="h-[40px] min-w-[64px] rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            取消
          </button>
          {showEditor && (
            <button onClick={saveDraft}
              className="h-[40px] min-w-[88px] rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              保存草稿
            </button>
          )}
          <button onClick={handleSubmit} disabled={submitting || !canSubmit}
            className={`h-[40px] min-w-[140px] rounded-xl px-5 text-sm font-semibold transition ${
              submitting || !canSubmit ? "bg-blue-100 text-blue-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            }`}>
            {submitting ? <span className="flex items-center gap-1.5"><Loader2 className="h-4 w-4 animate-spin" />处理中...</span> : "添加到知识库"}
          </button>
        </div>
      </footer>
    </div>
  );
}
