"use client";

import { useMemo, useState } from "react";
import { Download, ImageIcon, Loader2, Maximize2, RefreshCw, X } from "lucide-react";

type Rec = Record<string, unknown>;

// ── Helpers ──
function asText(v: unknown, fallback = "") { return typeof v === "string" ? v : fallback; }
function asNum(v: unknown, fallback = 0) { return typeof v === "number" ? v : fallback; }

function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function classifySource(source: Rec, chunks: Rec[]) {
  const st = asText(source.sourceType);
  const filename = (asText(source.originalFilename) || asText(source.title) || "").toLowerCase();
  const mime = asText(source.fileMimeType).toLowerCase();
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const isLink = st === "link";
  const hasFileId = !!asText(source.fileId);

  // Image
  if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".ico"].includes(ext)) {
    return "image" as const;
  }
  // PDF
  if (mime === "application/pdf" || ext === ".pdf") return "pdf" as const;
  // Spreadsheet/table
  if (ext === ".xlsx" || ext === ".xls" || ext === ".csv" || ext === ".tsv" || mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv" || mime === "text/tab-separated-values") {
    return "spreadsheet" as const;
  }
  // Word-like
  if (ext === ".docx" || ext === ".doc" || ext === ".rtf" || ext === ".odt" || mime.includes("word") || mime.includes("document") || mime === "application/rtf") {
    return "word" as const;
  }
  // PPT
  if (ext === ".pptx" || ext === ".ppt" || mime.includes("presentation") || mime.includes("powerpoint")) {
    return "ppt" as const;
  }
  // Text/Markdown
  if (ext === ".txt" || ext === ".md" || ext === ".markdown" || mime.startsWith("text/")) {
    const rawText = asText(source.rawText);
    if (rawText) return "text" as const;
  }
  // Link
  if (isLink) return "link" as const;
  // Manual / paste text
  if (st === "manual" || st === "text") return "text" as const;
  // Fallback: if has rawText, treat as text
  if (asText(source.rawText)) return "text" as const;
  // From chunks
  if (chunks.length > 0) return "text" as const;
  return "unknown" as const;
}

// ── Plain text content ──
function TextContent({ source, chunks }: { source: Rec; chunks: Rec[] }) {
  const raw = asText(source.rawText);
  const text = raw ? (stripHtml(raw) || raw) : chunks.map((c) => asText(c.content)).filter(Boolean).join("\n\n");

  // Check if raw text looks like word content (has headings, paragraphs)
  const isWordContent = asText(source.sourceType) === "file" && (
    (asText(source.originalFilename) || "").toLowerCase().match(/\.(docx?|rtf|odt)$/i) ||
    (asText(source.fileMimeType) || "").includes("word")
  );

  if (!text) {
    return (
      <div className="flex min-h-[300px] items-center justify-center px-6 py-12 text-center">
        <p className="text-sm text-slate-400">暂未提取出可预览的正文内容。<br />如果这是刚添加的资料，可能需要等待处理完成。</p>
      </div>
    );
  }

  // Word content: try to detect formatting from raw HTML/text
  if (isWordContent && raw) {
    // Render raw HTML if available, otherwise formatted text
    if (raw.trim().startsWith("<")) {
      return (
        <div
          className="prose prose-slate max-w-none text-[15px] leading-8 text-slate-800 px-6 py-8"
          dangerouslySetInnerHTML={{ __html: raw }}
        />
      );
    }
    // Split by double newlines for paragraphs
    const paragraphs = raw.split(/\n{2,}/).filter(Boolean);
    return (
      <div className="max-w-[760px] mx-auto px-8 py-8 space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[15px] leading-8 text-slate-800">{p}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap px-8 py-8 text-[15px] leading-8 text-slate-800">{text}</div>
  );
}

// ── Image Content ──
function ImageContentView({ source }: { source: Rec }) {
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [fullscreen, setFullscreen] = useState(false);
  const fileId = asText(source.fileId);
  const filename = asText(source.originalFilename) || asText(source.title) || "图片";
  const fileSize = asNum(source.fileSize);

  const imageUrl = fileId ? `/api/v1/drive/files/${fileId}/download` : "";

  if (!imageUrl) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <ImageIcon className="h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">图片文件信息不完整，无法预览。</p>
        <a href="#" onClick={(e) => { e.preventDefault(); setLoadState("error"); }} className="text-xs text-blue-500 hover:text-blue-600">重新加载</a>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-8">
      <div className="flex items-center justify-center rounded-2xl bg-slate-100/50 p-4 min-h-[400px]">
        {loadState === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="text-sm text-slate-400">图片加载中...</span>
          </div>
        )}
        {loadState === "error" && (
          <div className="flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">图片预览失败</p>
            <div className="flex gap-2">
              <button onClick={() => setLoadState("loading")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <RefreshCw className="mr-1 inline h-3 w-3" />重新加载
              </button>
              <a href={imageUrl} download={filename} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <Download className="mr-1 inline h-3 w-3" />下载原图
              </a>
            </div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={filename}
          onLoad={() => setLoadState("loaded")}
          onError={() => setLoadState("error")}
          className={`max-w-full max-h-[600px] object-contain rounded-xl cursor-zoom-in ${loadState === "loaded" ? "" : "hidden"}`}
          onClick={() => loadState === "loaded" && setFullscreen(true)}
        />
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8" onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"><X className="h-5 w-5" /></button>
          <img src={imageUrl} alt={filename} className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── Spreadsheet Content ──
function SpreadsheetView({ source }: { source: Rec }) {
  const raw = asText(source.rawText);
  const sheets = useMemo(() => {
    if (!raw) return [];
    // Parse tab-separated table content
    const lines = raw.split("\n").filter(Boolean);
    // Check if multi-sheet format
    const sheets: { name: string; headers: string[]; rows: string[][] }[] = [];
    let currentSheet: { name: string; headers: string[]; rows: string[][] } | null = null;

    for (const line of lines) {
      const sheetMatch = line.match(/^\[Sheet:\s*(.+?)\]/i);
      if (sheetMatch) {
        if (currentSheet && currentSheet.rows.length > 0) sheets.push(currentSheet);
        currentSheet = { name: sheetMatch[1], headers: [], rows: [] };
        continue;
      }
      if (!currentSheet) {
        currentSheet = { name: "Sheet 1", headers: [], rows: [] };
      }
      const cells = line.split("\t");
      if (currentSheet.headers.length === 0) {
        currentSheet.headers = cells;
      } else {
        currentSheet.rows.push(cells);
      }
    }
    if (currentSheet && currentSheet.rows.length > 0) sheets.push(currentSheet);
    return sheets;
  }, [raw]);

  const [activeSheet, setActiveSheet] = useState(0);

  if (!raw || sheets.length === 0) {
    return <TextContent source={source} chunks={[]} />;
  }

  const sheet = sheets[activeSheet];
  if (!sheet) return <TextContent source={source} chunks={[]} />;

  return (
    <div className="px-2 py-4">
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex gap-1 mb-4 px-4 overflow-x-auto">
          {sheets.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSheet(i)}
              className={`shrink-0 rounded-t-lg px-4 py-2 text-xs font-medium transition ${
                i === activeSheet ? "bg-white text-blue-600 border-x border-t border-slate-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >{s.name}</button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              {sheets.length === 1 && (
                <th className="sticky left-0 bg-slate-50 border-r border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">#</th>
              )}
              {sheet.headers.map((h, i) => (
                <th key={i} className="border-b border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                {sheets.length === 1 && (
                  <td className="sticky left-0 border-r border-slate-100 px-3 py-2 text-xs text-slate-400 whitespace-nowrap bg-inherit">{ri + 1}</td>
                )}
                {row.map((cell, ci) => (
                  <td key={ci} className="border-b border-slate-100 px-4 py-2 text-sm text-slate-700 max-w-[300px] truncate" title={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Exported Component ──
type ContentType = ReturnType<typeof classifySource>;

export function getContentType(source: Rec, chunks: Rec[]) {
  return classifySource(source, chunks);
}

export default function SourceContentView({ source, chunks }: { source: Rec; chunks: Rec[] }) {
  const type = useMemo(() => classifySource(source, chunks), [source, chunks]);

  switch (type) {
    case "image":
      return <ImageContentView source={source} />;
    case "spreadsheet":
      return <SpreadsheetView source={source} />;
    case "word":
    case "pdf":
    case "ppt":
    case "text":
    case "link":
    default:
      return <TextContent source={source} chunks={chunks} />;
  }
}
