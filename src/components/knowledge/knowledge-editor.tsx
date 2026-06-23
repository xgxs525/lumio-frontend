"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown,
  Copy, Code, Heading1, Heading2, Heading3, ImageIcon,
  Italic, Link2, List, ListOrdered, ListTodo, Minus,
  Quote, Strikethrough, Table2, Trash2, Type,
  Palette, Share2, Plus, PanelTop, Columns2, Film,
  Grid3x3, BookTemplate, X, Highlighter,
  Indent, Outdent, AArrowDown,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { common, createLowlight } from "lowlight";
const lowlight = createLowlight(common);

const TEXT_COLORS = [
  "#111827","#374151","#6B7280","#EF4444","#F97316","#EAB308",
  "#22C55E","#14B8A6","#3B82F6","#6366F1","#8B5CF6","#EC4899",
  "#92400E","#D946EF",
];

const BG_COLORS = [
  "transparent","#F3F4F6","#FEE2E2","#FED7AA","#FEF3C7","#DCFCE7",
  "#CCFBF1","#DBEAFE","#E0E7FF","#EDE9FE","#FCE7F3","#F5E6D3",
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  sourceType?: string;
  onGeneratePlainText?: (text: string) => void;
  editorClassName?: string;
};

const tbBtn = "grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600";
const TB = "flex items-center gap-0.5 px-1";
const sep = <span className="w-px h-5 bg-slate-200 mx-1 shrink-0" />;

// ── Color Swatch Panel ──
function ColorPanel({
  open,
  colors,
  current,
  label,
  onSelect,
  onClose,
  onReset,
}: {
  open: boolean;
  colors: string[];
  current: string;
  label: string;
  onSelect: (c: string) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute top-full left-0 mt-2 z-40 w-[248px] rounded-2xl border border-slate-200 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.1)] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">{label}</span>
          <button onClick={onClose} className="grid h-6 w-6 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {colors.map((c) => {
            const isActive = current === c || (c === "transparent" && !current);
            const displayColor = c === "transparent" ? "#FFFFFF" : c;
            return (
              <button
                key={c}
                title={c === "transparent" ? "无背景" : c}
                onClick={() => { onSelect(c); onClose(); }}
                className={`grid h-7 w-7 place-items-center rounded-lg border-2 transition hover:scale-110 ${
                  isActive ? "border-blue-500 shadow-sm" : "border-slate-200 hover:border-slate-300"
                }`}
                style={{ backgroundColor: displayColor }}
              >
                {c === "transparent" && <X className="h-3 w-3 text-slate-400" />}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { onReset(); onClose(); }}
          className="mt-3 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          恢复默认
        </button>
      </div>
    </>
  );
}

// ── Main Editor Component ──
export default function KnowledgeEditor({ value, onChange, sourceType = "text", editorClassName }: Props) {
  const [insertOpen, setInsertOpen] = useState(false);
  const [fontColorOpen, setFontColorOpen] = useState(false);
  const [bgColorOpen, setBgColorOpen] = useState(false);
  const fontColorRef = useRef<HTMLDivElement>(null);
  const bgColorRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (fontColorRef.current && !fontColorRef.current.contains(e.target as Node)) setFontColorOpen(false);
      if (bgColorRef.current && !bgColorRef.current.contains(e.target as Node)) setBgColorOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false, horizontalRule: {} }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList, TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: true }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: sourceType === "text"
          ? "粘贴内容后，你可以继续编辑、整理格式..."
          : "输入你想保存到知识库的正文内容...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: editorClassName || "min-h-[280px] max-h-[360px] overflow-y-auto px-5 py-4 text-sm text-slate-800 outline-none prose-sm max-w-none focus:outline-none",
      },
    },
  });

  const isActive = useCallback(
    (name: string, attrs?: Record<string, unknown>) => editor?.isActive(name, attrs) ?? false,
    [editor],
  );

  if (!editor) return null;

  // ── Auto-scroll during drag selection ──
  useEffect(() => {
    const el = editor.view.dom;
    let rafId = 0;
    let scrolling = false;

    const onMove = (e: MouseEvent) => {
      if (!e.buttons) { scrolling = false; cancelAnimationFrame(rafId); return; }
      const rect = el.getBoundingClientRect();
      const threshold = 60;
      const minSpeed = 2, maxSpeed = 18;
      const y = e.clientY;
      const topDist = y - rect.top;
      const botDist = rect.bottom - y;

      const scroll = (dir: number, dist: number) => {
        if (!scrolling) return;
        const speed = Math.min(maxSpeed, Math.max(minSpeed, (threshold - Math.max(0, dist)) * (maxSpeed - minSpeed) / threshold + minSpeed));
        el.scrollTop += dir * speed;
        rafId = requestAnimationFrame(() => scroll(dir, dist));
      };

      if (topDist < threshold && topDist > 0) { scrolling = true; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => scroll(-1, topDist)); }
      else if (botDist < threshold && botDist > 0) { scrolling = true; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => scroll(1, botDist)); }
      else { scrolling = false; cancelAnimationFrame(rafId); }
    };

    const onUp = () => { scrolling = false; cancelAnimationFrame(rafId); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") { scrolling = false; cancelAnimationFrame(rafId); } };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keydown", onEsc);
      cancelAnimationFrame(rafId);
    };
  }, [editor]);

  const chain = () => editor.chain().focus();

  // ── Actions ──
  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("链接地址：", prev || "https://");
    if (url === null) return;
    if (url === "") { chain().extendMarkRange("link").unsetLink().run(); return; }
    chain().extendMarkRange("link").setLink({ href: url }).run();
  };
  const addImage = () => { const url = window.prompt("图片地址：", "https://"); if (url) chain().setImage({ src: url }).run(); };
  const addTable = () => { chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); };
  const addYoutube = () => {
    const url = window.prompt("视频链接：", "https://");
    if (url) chain().setHardBreak().insertContent(`<div contenteditable="false" class="rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-400">🎬 视频块：<a href="${url}" class="text-blue-500 underline" target="_blank">${url}</a></div>`).run();
  };
  const addHighlightBlock = () => {
    chain().setHardBreak().insertContent(`<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 my-3"><p class="text-sm text-amber-800 font-semibold">💡 高亮提示</p><p class="text-sm text-amber-700 mt-1">在此处填写重点内容。</p></div>`).run();
  };
  const addColumnsBlock = () => {
    chain().insertContent(`<div class="flex gap-4 my-3"><div class="flex-1 rounded-xl border border-slate-200 p-4"><p>第一栏</p></div><div class="flex-1 rounded-xl border border-slate-200 p-4"><p>第二栏</p></div></div>`).run();
  };
  const addSubDoc = () => {
    chain().insertContent(`<div contenteditable="false" class="rounded-2xl border border-dashed border-slate-300 p-4 my-3 text-center text-xs text-slate-400">📄 子文档占位 — 点击可展开</div>`).run();
  };

  // ── Font Color ──
  const currentTextColor = editor.getAttributes("textStyle").color || "#111827";
  const setTextColor = (color: string) => chain().setColor(color).run();
  const resetTextColor = () => chain().unsetColor().run();

  // ── Background Color ──
  const currentBgColor = editor.getAttributes("highlight").color || "";
  const setBgColor = (color: string) => {
    if (color === "transparent") { chain().unsetHighlight().run(); return; }
    chain().toggleHighlight({ color }).run();
  };
  const resetBgColor = () => chain().unsetHighlight().run();

  // ── Indent / Outdent ──
  const indentMore = () => {
    const cur = parseInt(String(editor.getAttributes("textStyle").textIndent || "0"), 10);
    chain().setMark("textStyle", { textIndent: `${cur + 24}px` }).run();
  };
  const indentLess = () => {
    const cur = parseInt(String(editor.getAttributes("textStyle").textIndent || "0"), 10);
    const next = Math.max(0, cur - 24);
    if (next === 0) {
      chain().setMark("textStyle", { textIndent: null }).run();
    } else {
      chain().setMark("textStyle", { textIndent: `${next}px` }).run();
    }
  };

  const insertBlocks = [
    { group: "常用块", items: [
      { label: "任务", icon: ListTodo, action: () => chain().toggleTaskList().run() },
      { label: "图片", icon: ImageIcon, action: addImage },
      { label: "视频或文件", icon: Film, action: addYoutube },
      { label: "表格", icon: Table2, action: addTable },
      { label: "分栏", icon: Columns2, action: addColumnsBlock },
      { label: "高亮块", icon: Highlighter, action: addHighlightBlock },
      { label: "按钮", icon: PanelTop, action: () => chain().insertContent('<span class="inline-block rounded-full bg-blue-600 text-white px-4 py-1.5 text-sm font-semibold cursor-pointer">按钮</span>').run() },
      { label: "子文档", icon: BookTemplate, action: addSubDoc },
    ]},
    { group: "进阶块", items: [
      { label: "网页卡片", icon: Link2, action: () => chain().insertContent('<div contenteditable="false" class="rounded-xl border border-slate-200 p-4 my-2 text-xs text-slate-400">🃏 网页卡片预留</div>').run() },
      { label: "时间轴", icon: Minus, action: () => chain().insertContent('<div contenteditable="false" class="rounded-xl border border-slate-200 p-4 my-2 text-xs text-slate-400">📅 时间轴预留</div>').run() },
      { label: "倒计时", icon: Minus, action: () => chain().insertContent('<div contenteditable="false" class="rounded-xl border border-slate-200 p-4 my-2 text-xs text-slate-400">⏳ 倒计时预留</div>').run() },
    ]},
    { group: "数据块（即将支持）", items: [
      { label: "看板", icon: Grid3x3, action: () => toast.info("即将支持") },
      { label: "甘特图", icon: Grid3x3, action: () => toast.info("即将支持") },
      { label: "画册", icon: Grid3x3, action: () => toast.info("即将支持") },
    ]},
  ];

  return (
    <div className="rounded-[16px] border border-slate-200 bg-white overflow-hidden focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-px border-b border-slate-100 bg-slate-50/80 px-2 py-2 select-none">

        {/* 1. 文本类型 */}
        <div className={TB}>
          <button onClick={() => chain().setParagraph().run()} title="正文" data-active={isActive("paragraph")} className={tbBtn}><Type className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleHeading({ level: 1 }).run()} title="H1" data-active={isActive("heading", { level: 1 })} className={tbBtn}><Heading1 className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleHeading({ level: 2 }).run()} title="H2" data-active={isActive("heading", { level: 2 })} className={tbBtn}><Heading2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleHeading({ level: 3 }).run()} title="H3" data-active={isActive("heading", { level: 3 })} className={tbBtn}><Heading3 className="h-3.5 w-3.5" /></button>
        </div>
        {sep}

        {/* 2. 文字样式 */}
        <div className={TB}>
          <button onClick={() => chain().toggleBold().run()} title="加粗" data-active={isActive("bold")} className={tbBtn}><Bold className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleItalic().run()} title="斜体" data-active={isActive("italic")} className={tbBtn}><Italic className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleUnderline().run()} title="下划线" data-active={isActive("underline")} className={tbBtn}><span className="text-xs font-bold underline">U</span></button>
          <button onClick={() => chain().toggleStrike().run()} title="删除线" data-active={isActive("strike")} className={tbBtn}><Strikethrough className="h-3.5 w-3.5" /></button>
        </div>
        {sep}

        {/* 3. 字体颜色 + 背景颜色 */}
        <div className={TB}>
          {/* Font color */}
          <div className="relative" ref={fontColorRef}>
            <button onClick={() => { setFontColorOpen(!fontColorOpen); setBgColorOpen(false); }} title="字体颜色"
              className={`${tbBtn} flex-col gap-0`}
              data-active={!!editor.getAttributes("textStyle").color}
            >
              <AArrowDown className="h-3.5 w-3.5" />
              <span className="block w-3 h-0.5 rounded-full" style={{ backgroundColor: currentTextColor }} />
            </button>
            <ColorPanel
              open={fontColorOpen}
              colors={TEXT_COLORS}
              current={currentTextColor}
              label="字体颜色"
              onSelect={setTextColor}
              onClose={() => setFontColorOpen(false)}
              onReset={resetTextColor}
            />
          </div>

          {/* Background color */}
          <div className="relative" ref={bgColorRef}>
            <button onClick={() => { setBgColorOpen(!bgColorOpen); setFontColorOpen(false); }} title="背景颜色"
              className={`${tbBtn} flex-col gap-0`}
              data-active={isActive("highlight")}
            >
              <Highlighter className="h-3.5 w-3.5" />
              <span className="block w-3 h-0.5 rounded-full" style={{
                backgroundColor: currentBgColor || (isActive("highlight") ? "#FEF08A" : "transparent"),
                border: currentBgColor ? "none" : "1px dashed #CBD5E1",
              }} />
            </button>
            <ColorPanel
              open={bgColorOpen}
              colors={BG_COLORS}
              current={currentBgColor}
              label="背景颜色"
              onSelect={setBgColor}
              onClose={() => setBgColorOpen(false)}
              onReset={resetBgColor}
            />
          </div>
        </div>
        {sep}

        {/* 4. 列表 */}
        <div className={TB}>
          <button onClick={() => chain().toggleBulletList().run()} title="无序列表" data-active={isActive("bulletList")} className={tbBtn}><List className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleOrderedList().run()} title="有序列表" data-active={isActive("orderedList")} className={tbBtn}><ListOrdered className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleTaskList().run()} title="任务列表" data-active={isActive("taskList")} className={tbBtn}><ListTodo className="h-3.5 w-3.5" /></button>
        </div>
        {sep}

        {/* 5. 内容结构 */}
        <div className={TB}>
          <button onClick={() => chain().toggleBlockquote().run()} title="引用" data-active={isActive("blockquote")} className={tbBtn}><Quote className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleCodeBlock().run()} title="代码块" data-active={isActive("codeBlock")} className={tbBtn}><Code className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().setHorizontalRule().run()} title="分割线" className={tbBtn}><Minus className="h-3.5 w-3.5" /></button>
        </div>
        {sep}

        {/* 6. 对齐与缩进 */}
        <div className={TB}>
          <button onClick={() => chain().setTextAlign("left").run()} title="左对齐" data-active={isActive("textAlign", { textAlign: "left" })} className={tbBtn}><AlignLeft className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().setTextAlign("center").run()} title="居中" data-active={isActive("textAlign", { textAlign: "center" })} className={tbBtn}><AlignCenter className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().setTextAlign("right").run()} title="右对齐" data-active={isActive("textAlign", { textAlign: "right" })} className={tbBtn}><AlignRight className="h-3.5 w-3.5" /></button>
          <button onClick={indentMore} title="增加缩进" className={tbBtn}><Indent className="h-3.5 w-3.5" /></button>
          <button onClick={indentLess} title="减少缩进" className={tbBtn}><Outdent className="h-3.5 w-3.5" /></button>
        </div>
        {sep}

        {/* 7. 插入 */}
        <div className={TB}>
          <button onClick={setLink} title="插入链接" data-active={isActive("link")} className={tbBtn}><Link2 className="h-3.5 w-3.5" /></button>
          <button onClick={addImage} title="插入图片" className={tbBtn}><ImageIcon className="h-3.5 w-3.5" /></button>
          <button onClick={addTable} title="插入表格" className={tbBtn}><Table2 className="h-3.5 w-3.5" /></button>
        </div>
        {sep}

        {/* 8. 更多插入菜单 */}
        <div className="relative">
          <button onClick={() => setInsertOpen(!insertOpen)} title="更多插入"
            className="flex items-center gap-1 h-7 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700">
            <Plus className="h-3.5 w-3.5" /> 插入 <ChevronDown className="h-3 w-3" />
          </button>
          {insertOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setInsertOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 w-[280px] rounded-[16px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.1)] p-2 space-y-3 max-h-[420px] overflow-y-auto">
                {insertBlocks.map(({ group, items }) => (
                  <div key={group}>
                    <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
                    <div className="grid grid-cols-2 gap-0.5">
                      {items.map(({ label, icon: Icon, action }) => (
                        <button key={label} onClick={() => { action(); setInsertOpen(false); }}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Editor Area ── */}
      <EditorContent editor={editor} />

      {/* ── Bubble Menu ── */}
      {editor && (
        <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-1.5 py-1 shadow-lg">
          <button onClick={() => { navigator.clipboard.writeText(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ")); toast.info("已复制"); }} title="复制" className={tbBtn}><Copy className="h-3.5 w-3.5" /></button>
          <span className="w-px h-4 bg-slate-200" />
          <button onClick={() => chain().toggleBold().run()} title="加粗" data-active={isActive("bold")} className={tbBtn}><Bold className="h-3.5 w-3.5" /></button>
          <button onClick={() => chain().toggleItalic().run()} title="斜体" className={tbBtn}><Italic className="h-3.5 w-3.5" /></button>
          <button onClick={setLink} title="链接" className={tbBtn}><Link2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => { chain().deleteSelection().run(); }} title="删除" className={tbBtn}><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
        </BubbleMenu>
      )}
    </div>
  );
}
