"use client";

import { useMemo, useState } from "react";
import { Download, FileText, ImageIcon, Loader2, Maximize2, RefreshCw, X } from "lucide-react";

type Rec = Record<string, unknown>;

function asText(v: unknown, fallback = "") { return typeof v === "string" ? v : fallback; }
function asNum(v: unknown, fallback = 0) { return typeof v === "number" ? v : fallback; }
function stripHtml(html: string) { if (!html) return ""; return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }

// ── File URL helper (full backend URL for iframe/img auth) ──
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
function fileDownloadUrl(fileId: string) { return `${API_BASE}/drive/files/${fileId}/download`; }
function hasFile(source: Rec) { return !!asText(source.fileId); }

// ── Classify ──
function classifySource(source: Rec) {
  const st = asText(source.sourceType);
  const filename = (asText(source.originalFilename) || asText(source.title) || "").toLowerCase();
  const mime = asText(source.fileMimeType).toLowerCase();
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";

  if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".ico"].includes(ext)) return "image" as const;
  if (mime === "application/pdf" || ext === ".pdf") return "pdf" as const;
  if (ext === ".xlsx" || ext === ".xls" || ext === ".csv" || ext === ".tsv" || mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return "spreadsheet" as const;
  if (ext === ".docx" || ext === ".doc" || ext === ".rtf" || ext === ".odt" || mime.includes("word") || mime.includes("document") || mime === "application/rtf") return "word" as const;
  if (ext === ".pptx" || ext === ".ppt" || mime.includes("presentation") || mime.includes("powerpoint")) return "ppt" as const;
  if (ext === ".txt" || ext === ".md" || ext === ".markdown" || mime.startsWith("text/")) return "text" as const;
  if (st === "link") return "link" as const;
  if (st === "manual" || st === "text" || asText(source.rawText)) return "text" as const;
  return "unknown" as const;
}

// ── PDF Viewer (object tag for auth cookie support) ──
function PDFViewer({ source }: { source: Rec }) {
  const fileId = asText(source.fileId);
  const url = fileId ? fileDownloadUrl(fileId) : "";
  return (
    <object data={url} type="application/pdf" className="w-full min-h-[800px] border-0 rounded-b-xl" title="PDF 预览">
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <FileText className="h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-400">浏览器不支持嵌入 PDF 预览。</p>
        <a href={url} download className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Download className="mr-1.5 inline h-3.5 w-3.5" />下载 PDF 文件
        </a>
      </div>
    </object>
  );
}

// ── Image Viewer ──
function ImageViewer({ source }: { source: Rec }) {
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [fullscreen, setFullscreen] = useState(false);
  const fileId = asText(source.fileId);
  const filename = asText(source.originalFilename) || asText(source.title) || "图片";
  const url = fileId ? fileDownloadUrl(fileId) : "";
  if (!url) return <EmptyState icon={<ImageIcon className="h-10 w-10 text-slate-300" />} text="图片文件信息不完整，无法预览。" />;

  return (
    <div className="relative px-6 py-8">
      <div className="flex items-center justify-center rounded-2xl bg-slate-100/50 p-4 min-h-[400px]">
        {loadState === "loading" && <div className="flex flex-col items-center gap-3"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /><span className="text-sm text-slate-400">图片加载中...</span></div>}
        {loadState === "error" && (
          <div className="flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">图片预览失败</p>
            <div className="flex gap-2">
              <button onClick={() => setLoadState("loading")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><RefreshCw className="mr-1 inline h-3 w-3" />重新加载</button>
              <a href={url} download={filename} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><Download className="mr-1 inline h-3 w-3" />下载原图</a>
            </div>
          </div>
        )}
        <img src={url} alt={filename} onLoad={() => setLoadState("loaded")} onError={() => setLoadState("error")}
          className={`max-w-full max-h-[600px] object-contain rounded-xl cursor-zoom-in ${loadState === "loaded" ? "" : "hidden"}`}
          onClick={() => loadState === "loaded" && setFullscreen(true)} />
      </div>
      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8" onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"><X className="h-5 w-5" /></button>
          <img src={url} alt={filename} className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── Spreadsheet Table ──
function SpreadsheetView({ source }: { source: Rec }) {
  const raw = asText(source.rawText);
  const sheets = useMemo(() => {
    if (!raw) return [];
    const lines = raw.split("\n").filter(Boolean);
    const out: { name: string; headers: string[]; rows: string[][] }[] = [];
    let cur: typeof out[0] | null = null;
    for (const line of lines) {
      const m = line.match(/^\[Sheet:\s*(.+?)\]/i);
      if (m) { if (cur && cur.rows.length > 0) out.push(cur); cur = { name: m[1], headers: [], rows: [] }; continue; }
      if (!cur) cur = { name: "Sheet 1", headers: [], rows: [] };
      const cells = line.split("\t");
      if (cur.headers.length === 0) cur.headers = cells;
      else cur.rows.push(cells);
    }
    if (cur && cur.rows.length > 0) out.push(cur);
    return out;
  }, [raw]);
  const [active, setActive] = useState(0);

  if (!sheets.length) return <TextContent source={source} />;
  const sheet = sheets[active];
  if (!sheet) return <TextContent source={source} />;

  return (
    <div className="px-2 py-4">
      {sheets.length > 1 && (
        <div className="flex gap-1 mb-4 px-4 overflow-x-auto">
          {sheets.map((s, i) => (
            <button key={i} onClick={() => setActive(i)} className={`shrink-0 rounded-t-lg px-4 py-2 text-xs font-medium transition ${i === active ? "bg-white text-blue-600 border-x border-t border-slate-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>{s.name}</button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-slate-50">
            {sheets.length === 1 && <th className="sticky left-0 bg-slate-50 border-r border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">#</th>}
            {sheet.headers.map((h, i) => <th key={i} className="border-b border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {sheet.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                {sheets.length === 1 && <td className="sticky left-0 border-r border-slate-100 px-3 py-2 text-xs text-slate-400 whitespace-nowrap bg-inherit">{ri + 1}</td>}
                {row.map((cell, ci) => <td key={ci} className="border-b border-slate-100 px-4 py-2 text-sm text-slate-700 max-w-[300px] truncate" title={cell}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Empty State ──
function EmptyState({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon || <FileText className="h-10 w-10 text-slate-300" />}
      <p className="text-sm text-slate-400 max-w-sm">{text}</p>
    </div>
  );
}

// ── Text Content ──
function TextContent({ source }: { source: Rec }) {
  const raw = asText(source.rawText);
  const text = raw ? (stripHtml(raw) || raw) : "";

  if (!text) {
    // For file types that have a file ID, don't show empty — file preview handles it
    if (hasFile(source)) return <PDFViewer source={source} />;
    return <EmptyState text="暂未提取出可预览的正文内容。如果这是刚添加的资料，可能需要等待处理完成。" />;
  }

  // Word content with HTML
  if (raw && raw.trim().startsWith("<")) {
    return <div className="prose prose-slate max-w-none text-[15px] leading-8 text-slate-800 px-6 py-8" dangerouslySetInnerHTML={{ __html: raw }} />;
  }

  // Format by paragraphs
  const paragraphs = raw ? raw.split(/\n{2,}/).filter(Boolean) : [text];
  if (paragraphs.length > 1) {
    return (
      <div className="max-w-[760px] mx-auto px-8 py-8 space-y-4">
        {paragraphs.map((p, i) => <p key={i} className="text-[15px] leading-8 text-slate-800">{p}</p>)}
      </div>
    );
  }
  return <div className="whitespace-pre-wrap px-8 py-8 text-[15px] leading-8 text-slate-800">{text}</div>;
}

// ── File download bar (for Word/PPT that can't be embedded) ──
function FileContent({ source, icon, label }: { source: Rec; icon: React.ReactNode; label: string }) {
  const fileId = asText(source.fileId);
  const filename = asText(source.originalFilename) || asText(source.title) || "文件";
  const url = fileId ? fileDownloadUrl(fileId) : "";
  const rawText = asText(source.rawText);

  return (
    <div>
      {/* File action bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-sm text-slate-600">{icon} <span className="font-medium">{label} 预览</span></div>
        <div className="flex-1" />
        <a href={url} download={filename} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition">
          <Download className="h-3.5 w-3.5" />下载原文件
        </a>
      </div>
      {/* Extracted text preview */}
      {rawText ? (
        rawText.trim().startsWith("<") ? (
          <div className="prose prose-slate max-w-none text-[15px] leading-8 text-slate-800 px-6 py-8" dangerouslySetInnerHTML={{ __html: rawText }} />
        ) : (
          <div className="max-w-[760px] mx-auto px-8 py-8 space-y-4">
            {rawText.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i} className="text-[15px] leading-8 text-slate-800">{p}</p>)}
          </div>
        )
      ) : (
        <EmptyState text="文档内容提取中，处理完成后将显示正文预览。你可下载原文件阅读全部内容。" />
      )}
    </div>
  );
}

// ── Main ──
export default function SourceContentView({ source, chunks }: { source: Rec; chunks: Rec[] }) {
  const type = useMemo(() => classifySource(source), [source]);

  // PDF: always show PDF viewer if fileId exists
  if (type === "pdf" && hasFile(source)) return <PDFViewer source={source} />;
  if (type === "pdf") return <EmptyState icon={<FileText className="h-10 w-10 text-slate-300" />} text="PDF 预览失败。可下载原文件查看，或稍后重试。" />;

  // Image
  if (type === "image") return <ImageViewer source={source} />;

  // Spreadsheet
  if (type === "spreadsheet") return <SpreadsheetView source={source} />;

  // Word: file action bar + extracted text
  if (type === "word") return <FileContent source={source} icon={<FileText className="h-5 w-5 text-blue-500" />} label="Word 文档" />;

  // PPT
  if (type === "ppt") return <FileContent source={source} icon={<FileText className="h-5 w-5 text-orange-500" />} label="PPT 文档" />;

  // Text/link/unknown
  return <TextContent source={source} />;
}
