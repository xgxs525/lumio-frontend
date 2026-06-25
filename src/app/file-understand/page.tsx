"use client";

import Link from "next/link";
import { type ChangeEvent, useRef, useState } from "react";
import {
  BarChart3,
  FileSearch,
  FileText,
  ListChecks,
  Loader2,
  MessageSquareText,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

type ParseStatus = "已完成" | "解析中" | "上传中" | "失败";

interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  time: string;
  status: ParseStatus;
  model: string;
}

const quickActions = [
  { title: "总结全文", desc: "快速生成文件摘要和主要内容。", icon: FileText },
  { title: "提取重点", desc: "提取核心观点、关键数据和重要结论。", icon: ListChecks },
  { title: "基于文件问答", desc: "围绕文件内容直接向 AI 提问。", icon: MessageSquareText },
  { title: "分析表格", desc: "识别表格数据，生成分析和洞察。", icon: BarChart3 },
  { title: "提取行动项", desc: "从文件中提取待办事项、责任人和时间节点。", icon: Search },
  { title: "生成报告", desc: "基于文件内容生成结构化报告。", icon: Sparkles },
];

const mockFiles: ProcessedFile[] = [
  { id: "1", name: "产品方案.pdf", type: "PDF", size: "2.4MB", time: "今天 10:24", status: "已完成", model: "Claude Sonnet 4.6" },
  { id: "2", name: "销售数据.xlsx", type: "Excel", size: "1.8MB", time: "昨天 18:30", status: "已完成", model: "GPT-5.6" },
  { id: "3", name: "客户反馈.docx", type: "Word", size: "856KB", time: "昨天 14:10", status: "已完成", model: "Claude Sonnet 4.6" },
  { id: "4", name: "架构图.png", type: "图片", size: "3.2MB", time: "前天 11:00", status: "已完成", model: "Gemini 1.0" },
  { id: "5", name: "周报汇总.csv", type: "CSV", size: "420KB", time: "3天前", status: "失败", model: "—" },
];

const typeColors: Record<string, string> = {
  PDF: "bg-red-50 text-red-600",
  Word: "bg-blue-50 text-blue-600",
  Excel: "bg-emerald-50 text-emerald-600",
  PPT: "bg-orange-50 text-orange-600",
  TXT: "bg-slate-50 text-slate-600",
  Markdown: "bg-violet-50 text-violet-600",
  图片: "bg-pink-50 text-pink-600",
  CSV: "bg-cyan-50 text-cyan-600",
};

function RightPanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-bold text-slate-950">推荐操作</h3>
      <div className="mt-4 space-y-3">
        {[
          ["上传合同", "→ 提取风险点"],
          ["上传表格", "→ 分析数据趋势"],
          ["上传报告", "→ 生成摘要"],
          ["上传文章", "→ 提取观点"],
          ["上传会议纪要", "→ 提取行动项"],
        ].map(([label, action]) => (
          <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">{label}</span> {action}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FileUnderstandPage() {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<ProcessedFile[]>(mockFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setFiles((prev) => [
        {
          id: String(Date.now()),
          name: file.name,
          type: "PDF",
          size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
          time: "刚刚",
          status: "已完成",
          model: "智能推荐",
        },
        ...prev,
      ]);
      setUploading(false);
    }, 1500);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <WorkspaceShell
      active="知识库"
      title="文件理解"
      subtitle="上传 PDF、Word、Excel、PPT 或图片，让 AI 帮你总结、分析和提取重点。"
      rightPanel={<RightPanel />}
      actions={
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> 上传中...</> : <><Upload className="h-4 w-4" /> 上传文件</>}
        </Button>
      }
    >
      {/* Upload area */}
      <div
        className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center transition hover:border-blue-300 hover:bg-blue-50/30"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        <Upload className="mx-auto h-10 w-10 text-slate-300 group-hover:text-blue-400" />
        <p className="mt-4 text-base font-bold text-slate-700">上传文件，让 AI 帮你理解内容</p>
        <p className="mt-1 text-sm text-slate-400">也可以拖拽文件到这里上传</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["PDF", "Word", "Excel", "PPT", "TXT", "Markdown", "图片", "压缩包"].map((fmt) => (
            <span key={fmt} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-950">文件理解能力</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href="/ai"
                className="group/card flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 group-hover/card:bg-blue-50 group-hover/card:text-blue-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent files */}
      {files.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-950">最近处理</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 md:grid md:grid-cols-[1fr_100px_100px_120px_140px_120px]">
              <span>文件</span>
              <span>类型</span>
              <span>大小</span>
              <span>时间</span>
              <span>模型</span>
              <span>操作</span>
            </div>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col gap-2 border-b border-slate-50 px-5 py-4 last:border-b-0 md:grid md:grid-cols-[1fr_100px_100px_120px_140px_120px] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileSearch className="h-5 w-5 shrink-0 text-slate-400" />
                  <span className="truncate text-sm font-bold text-slate-950">{file.name}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium w-fit ${typeColors[file.type] || "bg-slate-100 text-slate-600"}`}>{file.type}</span>
                <span className="text-xs text-slate-400">{file.size}</span>
                <span className="text-xs text-slate-400">{file.time}</span>
                <span className="text-xs text-slate-500 truncate">{file.model}</span>
                <div className="flex items-center gap-1">
                  <Link href="/ai" className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-blue-700">总结</Link>
                  <Link href="/ai" className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-blue-700">提问</Link>
                  <button onClick={() => removeFile(file.id)} className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-20 flex flex-col items-center text-center">
          <FileSearch className="h-12 w-12 text-slate-300" />
          <h2 className="mt-6 text-xl font-bold text-slate-950">还没有上传文件</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">上传 PDF、Word、表格或图片，让 AI 帮你理解内容。</p>
          <Button className="mt-6" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> 上传文件
          </Button>
        </div>
      )}
    </WorkspaceShell>
  );
}
