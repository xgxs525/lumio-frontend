"use client";

import { useCallback, useRef, useState } from "react";
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
  Copy, Code, Heading1, Heading2, Heading3, ImageIcon, Indent,
  Italic, Link2, List, ListOrdered, ListTodo, Minus, Outdent,
  Quote, Strikethrough, Table2, Trash2, Type, UnderlineIcon,
  Palette, Share2, Plus, PanelTop, Columns2, Film,
  Grid3x3, BookTemplate, X, Highlighter,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { common, createLowlight } from "lowlight";
const lowlight = createLowlight(common);

type Props = {
  value: string;
  onChange: (html: string) => void;
  sourceType?: string;
  onGeneratePlainText?: (text: string) => void;
};

const tbBtn = "grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700";

const TB = "flex items-center gap-0.5 px-1.5 py-1";

export default function KnowledgeEditor({ value, onChange, sourceType = "text" }: Props) {
  const [insertOpen, setInsertOpen] = useState(false);
  const insertRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        horizontalRule: {},
      }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
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
        class: "min-h-[280px] max-h-[360px] overflow-y-auto px-5 py-4 text-sm text-slate-800 outline-none prose-sm max-w-none focus:outline-none",
      },
    },
  });

  const isActive = useCallback(
    (name: string, attrs?: Record<string, unknown>) =>
      editor?.isActive(name, attrs) ?? false,
    [editor],
  );

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("链接地址：", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("图片地址：", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addYoutube = () => {
    const url = window.prompt("视频链接：", "https://");
    if (url) editor.chain().focus().setHardBreak().insertContent(`<div contenteditable="false" class="rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-400">🎬 视频块：<a href="${url}" class="text-blue-500 underline" target="_blank">${url}</a></div>`).run();
  };

  const addHighlightBlock = () => {
    editor.chain().focus().setHardBreak().insertContent(`<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 my-3"><p class="text-sm text-amber-800 font-semibold">💡 高亮提示</p><p class="text-sm text-amber-700 mt-1">在此处填写重点内容。</p></div>`).run();
  };

  const addColumnsBlock = () => {
    const html = `<div class="flex gap-4 my-3"><div class="flex-1 rounded-xl border border-slate-200 p-4"><p>第一栏</p></div><div class="flex-1 rounded-xl border border-slate-200 p-4"><p>第二栏</p></div></div>`;
    editor.chain().focus().insertContent(html).run();
  };

  const addSubDoc = () => {
    editor.chain().focus().insertContent(`<div contenteditable="false" class="rounded-2xl border border-dashed border-slate-300 p-4 my-3 text-center text-xs text-slate-400">📄 子文档占位 — 点击可展开</div>`).run();
  };

  const insertBlocks = [
    { group: "常用块", items: [
      { label: "任务", icon: ListTodo, action: () => editor.chain().focus().toggleTaskList().run() },
      { label: "图片", icon: ImageIcon, action: addImage },
      { label: "视频或文件", icon: Film, action: addYoutube },
      { label: "表格", icon: Table2, action: addTable },
      { label: "分栏", icon: Columns2, action: addColumnsBlock },
      { label: "高亮块", icon: Highlighter, action: addHighlightBlock },
      { label: "按钮", icon: PanelTop, action: () => editor.chain().focus().insertContent('<span class="inline-block rounded-full bg-blue-600 text-white px-4 py-1.5 text-sm font-semibold cursor-pointer">按钮</span>').run() },
      { label: "子文档", icon: BookTemplate, action: addSubDoc },
    ]},
    { group: "进阶块", items: [
      { label: "网页卡片", icon: Link2, action: () => editor.chain().focus().insertContent('<div contenteditable="false" class="rounded-xl border border-slate-200 p-4 my-2 text-xs text-slate-400">🃏 网页卡片预留</div>').run() },
      { label: "时间轴", icon: Minus, action: () => editor.chain().focus().insertContent('<div contenteditable="false" class="rounded-xl border border-slate-200 p-4 my-2 text-xs text-slate-400">📅 时间轴预留</div>').run() },
      { label: "倒计时", icon: Minus, action: () => editor.chain().focus().insertContent('<div contenteditable="false" class="rounded-xl border border-slate-200 p-4 my-2 text-xs text-slate-400">⏳ 倒计时预留</div>').run() },
    ]},
    { group: "数据块（预留）", items: [
      { label: "表格", icon: Grid3x3, action: () => toast.info("即将支持") },
      { label: "看板", icon: Grid3x3, action: () => toast.info("即将支持") },
      { label: "甘特图", icon: Grid3x3, action: () => toast.info("即将支持") },
      { label: "画册", icon: Grid3x3, action: () => toast.info("即将支持") },
    ]},
  ];

  return (
    <div className="rounded-[16px] border border-slate-200 bg-white overflow-hidden focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-px border-b border-slate-100 bg-slate-50/80 px-2 py-2">
        {/* Text style */}
        <div className={TB}>
          <button onClick={() => editor.chain().focus().setParagraph().run()} title="正文" data-active={isActive("paragraph")} className={tbBtn}><Type className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1" data-active={isActive("heading", { level: 1 })} className={tbBtn}><Heading1 className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2" data-active={isActive("heading", { level: 2 })} className={tbBtn}><Heading2 className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3" data-active={isActive("heading", { level: 3 })} className={tbBtn}><Heading3 className="h-4 w-4" /></button>
        </div>
        <span className="w-px h-5 bg-slate-200 mx-1" />

        {/* Inline format */}
        <div className={TB}>
          <button onClick={() => editor.chain().focus().toggleBold().run()} title="加粗" data-active={isActive("bold")} className={tbBtn}><Bold className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体" data-active={isActive("italic")} className={tbBtn}><Italic className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} title="下划线" data-active={isActive("underline")} className={tbBtn}><UnderlineIcon className="h-3.5 w-3.5" /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线" data-active={isActive("strike")} className={tbBtn}><Strikethrough className="h-4 w-4" /></button>
        </div>
        <span className="w-px h-5 bg-slate-200 mx-1" />

        {/* Colors */}
        <div className={TB}>
          <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" title="字体颜色" value={editor.getAttributes("textStyle").color || "#000000"} />
          <button onClick={() => editor.chain().focus().toggleHighlight().run()} title="高亮" data-active={isActive("highlight")} className={tbBtn}><Highlighter className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()} title="恢复默认" className={tbBtn}><X className="h-3.5 w-3.5" /></button>
        </div>
        <span className="w-px h-5 bg-slate-200 mx-1" />

        {/* Lists */}
        <div className={TB}>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表" data-active={isActive("bulletList")} className={tbBtn}><List className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表" data-active={isActive("orderedList")} className={tbBtn}><ListOrdered className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleTaskList().run()} title="任务列表" data-active={isActive("taskList")} className={tbBtn}><ListTodo className="h-4 w-4" /></button>
        </div>
        <span className="w-px h-5 bg-slate-200 mx-1" />

        {/* Blocks */}
        <div className={TB}>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用" data-active={isActive("blockquote")} className={tbBtn}><Quote className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="代码块" data-active={isActive("codeBlock")} className={tbBtn}><Code className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分割线" className={tbBtn}><Minus className="h-4 w-4" /></button>
          <button onClick={setLink} title="插入链接" data-active={isActive("link")} className={tbBtn}><Link2 className="h-4 w-4" /></button>
        </div>
        <span className="w-px h-5 bg-slate-200 mx-1" />

        {/* Align & Indent */}
        <div className={TB}>
          <button onClick={() => editor.chain().focus().setTextAlign("left").run()} title="左对齐" data-active={isActive("textAlign", { textAlign: "left" })} className={tbBtn}><AlignLeft className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().setTextAlign("center").run()} title="居中" data-active={isActive("textAlign", { textAlign: "center" })} className={tbBtn}><AlignCenter className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().setTextAlign("right").run()} title="右对齐" data-active={isActive("textAlign", { textAlign: "right" })} className={tbBtn}><AlignRight className="h-4 w-4" /></button>
        </div>
        <span className="w-px h-5 bg-slate-200 mx-1" />

        {/* Insert Menu */}
        <div className="relative">
          <button onClick={() => setInsertOpen(!insertOpen)} title="插入内容块"
            className="flex items-center gap-1 h-7 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700">
            <Plus className="h-4 w-4" /> 插入 <ChevronDown className="h-3 w-3" />
          </button>
          {insertOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setInsertOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 w-[280px] rounded-[16px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.1)] p-2 space-y-3 max-h-[400px] overflow-y-auto">
                {insertBlocks.map(({ group, items }) => (
                  <div key={group}>
                    <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
                    <div className="grid grid-cols-2 gap-1">
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

      {/* Editor Area */}
      <EditorContent editor={editor} />

      {/* Bubble menu for block operations */}
      {editor && (
        <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-1.5 py-1 shadow-lg">
          <button onClick={() => { document.execCommand("copy"); toast.info("已复制"); }} title="复制" className={tbBtn}><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={() => { editor.chain().focus().deleteSelection().run(); }} title="删除" className={tbBtn}><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
          <button onClick={() => toast.info("即将支持")} title="翻译" className={tbBtn}>🌐</button>
          <button onClick={() => toast.info("即将支持")} title="分享" className={tbBtn}><Share2 className="h-3.5 w-3.5" /></button>
          <span className="w-px h-4 bg-slate-200" />
          <button onClick={() => editor.chain().focus().toggleBold().run()} title="加粗" data-active={isActive("bold")} className={tbBtn}><Bold className="h-3.5 w-3.5" /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体" className={tbBtn}><Italic className="h-3.5 w-3.5" /></button>
          <button onClick={setLink} title="链接" className={tbBtn}><Link2 className="h-3.5 w-3.5" /></button>
        </BubbleMenu>
      )}
    </div>
  );
}
