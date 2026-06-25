"use client";

/* eslint-disable @next/next/no-img-element -- file previews use authenticated Blob URLs and generated page image URLs. */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Table2,
  X,
} from "lucide-react";

import { toast } from "@/components/ui/toast";
import { useIsolatedWheelScroll } from "@/hooks/use-isolated-wheel-scroll";
import { api } from "@/lib/api";

type Rec = Record<string, unknown>;
type PreviewKind = "image" | "pdf" | "spreadsheet" | "word" | "ppt" | "markdown" | "text" | "link" | "unknown";
type SheetPreview = { name: string; rows: Array<Array<string | number | boolean | null>> };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function asText(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function fileDownloadUrl(fileId: string) {
  return `${API_BASE}/drive/files/${fileId}/download`;
}

function hasFile(source: Rec) {
  return !!asText(source.fileId);
}

function fileName(source: Rec) {
  const meta = metadata(source);
  return asText(source.originalFilename) || asText(meta.originalFilename) || asText(source.title) || "文件";
}

function fileExt(source: Rec) {
  const name = fileName(source).toLowerCase();
  return name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
}

function metadata(source: Rec) {
  return (source.metadata || {}) as Rec;
}

function downloadFileName(source: Rec) {
  const original = fileName(source);
  const ext = fileExt(source);
  if (original && original !== "文件") return original;
  const title = asText(source.title, "download");
  return ext && !title.toLowerCase().endsWith(ext) ? `${title}${ext}` : title;
}

function previewField(source: Rec, key: string) {
  const meta = metadata(source);
  return source[key] ?? meta[key];
}

function classifySource(source: Rec): PreviewKind {
  const sourceType = asText(source.sourceType);
  const ext = fileExt(source);
  const mime = asText(source.fileMimeType).toLowerCase();

  if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".ico"].includes(ext)) return "image";
  if (mime === "application/pdf" || ext === ".pdf") return "pdf";
  if ([".xlsx", ".xls", ".csv", ".tsv"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return "spreadsheet";
  if ([".doc", ".docx", ".rtf", ".odt"].includes(ext) || mime.includes("word") || mime.includes("officedocument.wordprocessingml") || mime === "application/rtf") return "word";
  if ([".ppt", ".pptx"].includes(ext) || mime.includes("presentation") || mime.includes("powerpoint")) return "ppt";
  if (ext === ".md" || ext === ".markdown" || mime.includes("markdown")) return "markdown";
  if (ext === ".txt" || mime.startsWith("text/")) return "text";
  if (sourceType === "link") return "link";
  if (sourceType === "manual" || sourceType === "text") return "text";
  return "unknown";
}

function sanitizePreviewHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

async function downloadOriginal(source: Rec) {
  const fileId = asText(source.fileId);
  if (!fileId) return;
  try {
    const result = await api.downloadDriveFile(fileId);
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename && result.filename !== "download" ? result.filename : downloadFileName(source);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "下载失败");
  }
}

async function copyOriginalLink(source: Rec) {
  const fileId = asText(source.fileId);
  if (!fileId) return;
  const url = typeof window === "undefined"
    ? fileDownloadUrl(fileId)
    : `${window.location.origin}/api/v1/drive/files/${fileId}/download`;
  await navigator.clipboard.writeText(url);
  toast.success("链接已复制。");
}

function PreviewToolbar({
  title,
  icon,
  source,
  loading,
  onReload,
  extra,
}: {
  title: string;
  icon: ReactNode;
  source: Rec;
  loading?: boolean;
  onReload?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex min-h-12 flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/95 px-4 py-2 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        <span className="truncate">{title}</span>
      </div>
      {extra}
      {onReload ? (
        <button
          onClick={onReload}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          title="重新加载"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      ) : null}
      {hasFile(source) ? (
        <>
          <button
            onClick={() => void copyOriginalLink(source)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            title="复制文件链接"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => void downloadOriginal(source)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            下载原文件
          </button>
        </>
      ) : null}
    </div>
  );
}

function PreviewLoading({ title = "预览生成中", description = "序光正在生成文件预览，完成后会自动显示。" }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function PreviewProblem({
  title,
  description,
  source,
  onReload,
}: {
  title: string;
  description: string;
  source: Rec;
  onReload?: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="h-9 w-9 text-amber-400" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {onReload ? (
          <button onClick={onReload} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
            重新加载
          </button>
        ) : null}
        {hasFile(source) ? (
          <button onClick={() => void downloadOriginal(source)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download className="mr-1 inline h-3.5 w-3.5" />
            下载原文件
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ImagePreview({ source }: { source: Rec }) {
  const [objectUrl, setObjectUrl] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useIsolatedWheelScroll(fullscreenRef);

  useEffect(() => {
    if (!fullscreen) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [fullscreen]);

  useEffect(() => {
    let cancelled = false;
    let url = "";

    async function load() {
      const fileId = asText(source.fileId);
      if (!fileId) {
        setState("error");
        return;
      }
      setState("loading");
      try {
        const result = await api.downloadDriveFile(fileId);
        if (cancelled) return;
        url = URL.createObjectURL(result.blob);
        setObjectUrl(url);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [source, reloadKey]);

  return (
    <div>
      <PreviewToolbar
        title="图片原图预览"
        icon={<ImageIcon className="h-5 w-5 text-blue-500" />}
        source={source}
        loading={state === "loading"}
        onReload={() => setReloadKey((value) => value + 1)}
      />
      {state === "loading" ? <PreviewLoading title="图片加载中" description="正在读取原始图片文件。" /> : null}
      {state === "error" ? (
        <PreviewProblem
          title="图片预览失败"
          description="你可以重新加载，或下载原图查看。"
          source={source}
          onReload={() => setReloadKey((value) => value + 1)}
        />
      ) : null}
      {state === "ready" && objectUrl ? (
        <div className="px-4 py-5">
          <div className="flex min-h-[480px] items-center justify-center rounded-2xl bg-slate-100/60 p-4">
            <img
              src={objectUrl}
              alt={fileName(source)}
              className="max-h-[720px] max-w-full cursor-zoom-in rounded-xl object-contain shadow-sm"
              onClick={() => setFullscreen(true)}
            />
          </div>
        </div>
      ) : null}
      {fullscreen && objectUrl ? (
        <div ref={fullscreenRef} className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto overscroll-contain bg-black/80 p-8 backdrop-blur-sm" onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <X className="h-5 w-5" />
          </button>
          <img src={objectUrl} alt={fileName(source)} className="max-h-full max-w-full rounded-2xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
}

function PdfPage({ doc, pageNumber, scale }: { doc: PDFDocumentProxy; pageNumber: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    async function renderPage() {
      setRendering(true);
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const task = page.render({ canvas, canvasContext: context, viewport });
      renderTask = task;
      await task.promise.catch(() => null);
      if (!cancelled) setRendering(false);
    }

    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [doc, pageNumber, scale]);

  return (
    <div className="mx-auto mb-4 w-fit rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 text-center text-xs font-medium text-slate-400">第 {pageNumber} 页</div>
      <div className="relative">
        {rendering ? (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : null}
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
    </div>
  );
}

function PdfPreview({ source }: { source: Rec }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadPdf = useCallback(async () => {
    const fileId = asText(source.fileId);
    if (!fileId) {
      setState("error");
      setError("缺少原文件，无法预览 PDF。");
      return;
    }
    setState("loading");
    setError("");
    try {
      const [pdfjsLib, download] = await Promise.all([
        import("pdfjs-dist"),
        api.downloadDriveFile(fileId),
      ]);
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs";
      const buffer = await download.blob.arrayBuffer();
      const loaded = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      setDoc(loaded);
      setPageCount(loaded.numPages);
      setState("ready");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "PDF 渲染失败");
    }
  }, [source]);

  useEffect(() => {
    void loadPdf();
  }, [loadPdf, reloadKey]);

  async function fitWidth() {
    if (!doc) return;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const width = Math.max(320, (containerRef.current?.clientWidth || 900) - 56);
    setScale(Math.min(2.4, Math.max(0.6, width / viewport.width)));
  }

  const pages = useMemo(() => Array.from({ length: pageCount }, (_, index) => index + 1), [pageCount]);

  return (
    <div>
      <PreviewToolbar
        title="PDF 原文件预览"
        icon={<FileText className="h-5 w-5 text-red-500" />}
        source={source}
        loading={state === "loading"}
        onReload={() => setReloadKey((value) => value + 1)}
        extra={
          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <button onClick={() => setScale((value) => Math.max(0.55, value - 0.15))} className="grid h-8 w-8 place-items-center text-slate-500 hover:bg-slate-50" title="缩小">
              <Minus className="h-4 w-4" />
            </button>
            <button onClick={() => void fitWidth()} className="h-8 border-x border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50">适应宽度</button>
            <button onClick={() => setScale((value) => Math.min(2.6, value + 0.15))} className="grid h-8 w-8 place-items-center text-slate-500 hover:bg-slate-50" title="放大">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        }
      />
      {state === "loading" ? <PreviewLoading title="PDF 加载中" description="正在读取并渲染 PDF 页面。" /> : null}
      {state === "error" ? (
        <PreviewProblem
          title="文件预览失败"
          description={error || "你可以下载原文件查看，或稍后重试。"}
          source={source}
          onReload={() => setReloadKey((value) => value + 1)}
        />
      ) : null}
      {state === "ready" && doc ? (
        <div ref={containerRef} className="bg-slate-100/70 px-3 py-4">
          {pages.map((pageNumber) => (
            <PdfPage key={`${pageNumber}-${scale}`} doc={doc} pageNumber={pageNumber} scale={scale} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PageImagesPreview({ source, images }: { source: Rec; images: string[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] || "";
  return (
    <div>
      <PreviewToolbar
        title="页面图片预览"
        icon={<FileText className="h-5 w-5 text-blue-500" />}
        source={source}
        extra={
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <button onClick={() => setActive((value) => Math.max(0, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50" disabled={active === 0}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">第 {active + 1} / {images.length} 页</span>
            <button onClick={() => setActive((value) => Math.min(images.length - 1, value + 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50" disabled={active >= images.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />
      <div className="bg-slate-100/70 px-4 py-5">
        <img src={current} alt={`第 ${active + 1} 页`} className="mx-auto max-h-[760px] max-w-full rounded-xl bg-white object-contain shadow-sm ring-1 ring-slate-200" />
      </div>
    </div>
  );
}

function HtmlDocumentPreview({ source, html, title = "文档预览" }: { source: Rec; html: string; title?: string }) {
  return (
    <div>
      <PreviewToolbar title={title} icon={<FileText className="h-5 w-5 text-blue-500" />} source={source} />
      <div className="bg-slate-100/70 px-4 py-5">
        <div
          className="mx-auto max-w-[840px] rounded-2xl bg-white px-8 py-7 text-[15px] leading-8 text-slate-800 shadow-sm ring-1 ring-slate-200 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_strong]:font-bold [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(html) }}
        />
      </div>
    </div>
  );
}

function WordPreview({ source }: { source: Rec }) {
  const [html, setHtml] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const ext = fileExt(source);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const previewHtml = asText(previewField(source, "previewHtml")) || asText(previewField(source, "preview_html"));
      if (previewHtml) {
        setHtml(previewHtml);
        setState("ready");
        return;
      }

      const fileId = asText(source.fileId);
      if (!fileId) {
        setState("fallback");
        setMessage("缺少原文件，无法生成文档预览。");
        return;
      }

      if (ext !== ".docx") {
        setState("fallback");
        setMessage("当前格式需要后端转换服务才能原样预览。");
        return;
      }

      setState("loading");
      setMessage("");
      try {
        const [mammoth, download] = await Promise.all([
          import("mammoth"),
          api.downloadDriveFile(fileId),
        ]);
        const arrayBuffer = await download.blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
        });
        if (cancelled) return;
        setHtml(result.value);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        setState("fallback");
        setMessage(err instanceof Error ? err.message : "文档预览生成失败。");
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [source, ext, reloadKey]);

  if (state === "loading") {
    return (
      <div>
        <PreviewToolbar title="Word 文档预览" icon={<FileText className="h-5 w-5 text-blue-500" />} source={source} loading onReload={() => setReloadKey((value) => value + 1)} />
        <PreviewLoading title="文档预览生成中" description="序光正在读取 Word 原文件并生成文档预览。" />
      </div>
    );
  }

  if (state === "ready") {
    return <HtmlDocumentPreview source={source} html={html} title="Word 文档预览" />;
  }

  const raw = asText(source.rawText);
  if (raw) {
    return (
      <div>
        <PreviewToolbar title="Word 文档预览" icon={<FileText className="h-5 w-5 text-blue-500" />} source={source} onReload={() => setReloadKey((value) => value + 1)} />
        <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-xs text-amber-700">
          {message || "原文件预览暂不可用，以下为保留换行的文本兜底预览。"}
        </div>
        <TextContent source={{ ...source, rawText: raw }} compact />
      </div>
    );
  }

  return (
    <div>
      <PreviewToolbar title="Word 文档预览" icon={<FileText className="h-5 w-5 text-blue-500" />} source={source} onReload={() => setReloadKey((value) => value + 1)} />
      <PreviewProblem title="文件预览失败" description={message || "你可以下载原文件查看，或稍后重试。"} source={source} onReload={() => setReloadKey((value) => value + 1)} />
    </div>
  );
}

function PptPreview({ source }: { source: Rec }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [scale, setScale] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const ext = fileExt(source);

  useIsolatedWheelScroll(scrollRef);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const fileId = asText(source.fileId);
      const wrapper = wrapperRef.current;
      if (!fileId || !wrapper) {
        setState("error");
        setMessage("缺少原文件，无法预览 PPT。");
        return;
      }
      if (ext !== ".pptx") {
        setState("error");
        setMessage("当前 PPT 格式需要转换服务生成 PDF 或页面图片后才能预览。");
        return;
      }
      setState("loading");
      setMessage("");
      wrapper.innerHTML = "";
      try {
        const [pptxPreview, download] = await Promise.all([
          import("pptx-preview"),
          api.downloadDriveFile(fileId),
        ]);
        if (cancelled) return;
        const previewer = pptxPreview.init(wrapper, { width: 960, height: 540 });
        await previewer.preview(await download.blob.arrayBuffer());
        if (!cancelled) setState("ready");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(err instanceof Error ? err.message : "PPT 预览生成失败。");
      }
    }

    const cleanupWrapper = wrapperRef.current;
    void load();
    return () => {
      cancelled = true;
      if (cleanupWrapper) cleanupWrapper.innerHTML = "";
    };
  }, [source, ext, reloadKey]);

  return (
    <div>
      <PreviewToolbar
        title="PPT 幻灯片预览"
        icon={<FileText className="h-5 w-5 text-orange-500" />}
        source={source}
        loading={state === "loading"}
        onReload={() => setReloadKey((value) => value + 1)}
        extra={
          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <button onClick={() => setScale((value) => Math.max(0.6, value - 0.1))} className="grid h-8 w-8 place-items-center text-slate-500 hover:bg-slate-50" title="缩小">
              <Minus className="h-4 w-4" />
            </button>
            <button onClick={() => setScale(1)} className="h-8 border-x border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50">100%</button>
            <button onClick={() => setScale((value) => Math.min(1.8, value + 0.1))} className="grid h-8 w-8 place-items-center text-slate-500 hover:bg-slate-50" title="放大">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        }
      />
      {state === "loading" ? <PreviewLoading title="幻灯片加载中" description="正在读取 PPTX 原文件并渲染幻灯片。" /> : null}
      {state === "error" ? <PreviewProblem title="文件预览失败" description={message || "你可以下载原文件查看，或稍后重试。"} source={source} onReload={() => setReloadKey((value) => value + 1)} /> : null}
      <div ref={scrollRef} className={`${state === "ready" ? "block" : "hidden"} overflow-auto overscroll-contain bg-slate-100/70 px-4 py-5 [scrollbar-gutter:stable]`}>
        <div className="mx-auto w-fit origin-top" style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
          <div ref={wrapperRef} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" />
        </div>
      </div>
    </div>
  );
}

function SpreadsheetPreview({ source }: { source: Rec }) {
  const [sheets, setSheets] = useState<SheetPreview[]>([]);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useIsolatedWheelScroll(tableScrollRef);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const fileId = asText(source.fileId);
      if (!fileId) {
        setState("error");
        setMessage("缺少原文件，无法预览表格。");
        return;
      }
      setState("loading");
      setMessage("");
      try {
        const [xlsx, download] = await Promise.all([
          import("xlsx"),
          api.downloadDriveFile(fileId),
        ]);
        const ext = fileExt(source);
        const workbook = [".csv", ".tsv"].includes(ext)
          ? xlsx.read(await download.blob.text(), { type: "string", raw: true, FS: ext === ".tsv" ? "\t" : "," })
          : xlsx.read(await download.blob.arrayBuffer(), { type: "array", cellDates: true });
        const next = workbook.SheetNames.map((name) => ({
          name,
          rows: xlsx.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" }) as SheetPreview["rows"],
        })).filter((sheet) => sheet.rows.length > 0);
        if (cancelled) return;
        setSheets(next);
        setActive(0);
        setState(next.length ? "ready" : "error");
        if (!next.length) setMessage("表格中没有可预览的数据。");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(err instanceof Error ? err.message : "表格预览失败。");
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [source, reloadKey]);

  const sheet = sheets[active];
  const header = sheet?.rows[0] || [];
  const rows = sheet?.rows.slice(1) || [];
  const columnCount = Math.max(header.length, ...rows.map((row) => row.length), 1);
  const headers = Array.from({ length: columnCount }, (_, index) => String(header[index] ?? `列 ${index + 1}`));

  async function copyTable() {
    if (!sheet) return;
    const text = sheet.rows.map((row) => row.map((cell) => String(cell ?? "")).join("\t")).join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("表格已复制。");
  }

  return (
    <div>
      <PreviewToolbar
        title="表格原文件预览"
        icon={<Table2 className="h-5 w-5 text-emerald-500" />}
        source={source}
        loading={state === "loading"}
        onReload={() => setReloadKey((value) => value + 1)}
        extra={state === "ready" ? (
          <button onClick={() => void copyTable()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Copy className="h-3.5 w-3.5" />
            复制表格
          </button>
        ) : null}
      />
      {state === "loading" ? <PreviewLoading title="表格加载中" description="正在读取原始表格文件并生成 Sheet 预览。" /> : null}
      {state === "error" ? <PreviewProblem title="文件预览失败" description={message || "你可以下载原文件查看，或稍后重试。"} source={source} onReload={() => setReloadKey((value) => value + 1)} /> : null}
      {state === "ready" && sheet ? (
        <div className="bg-slate-100/70 p-3">
          {sheets.length > 1 ? (
            <div className="mb-3 flex gap-1 overflow-x-auto">
              {sheets.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => setActive(index)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${index === active ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
          <div ref={tableScrollRef} className="max-h-[calc(100vh-260px)] overflow-auto overscroll-contain [scrollbar-gutter:stable] rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-400">#</th>
                  {headers.map((head, index) => (
                    <th key={index} className="border-b border-r border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-600">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="sticky left-0 border-b border-r border-slate-100 bg-inherit px-3 py-2 text-xs text-slate-400">{rowIndex + 1}</td>
                    {headers.map((_, colIndex) => (
                      <td key={colIndex} className="max-w-[360px] truncate border-b border-r border-slate-100 px-4 py-2 text-slate-700" title={String(row[colIndex] ?? "")}>
                        {String(row[colIndex] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MarkdownContent({ source }: { source: Rec }) {
  const raw = asText(source.rawText);
  if (!raw) {
    return <PreviewProblem title="暂无可预览内容" description="该 Markdown 内容还没有正文。" source={source} />;
  }
  return (
    <div>
      <PreviewToolbar title="Markdown 预览" icon={<FileText className="h-5 w-5 text-slate-500" />} source={source} />
      <div className="mx-auto max-w-[860px] px-6 py-6">
        <div className="prose prose-slate max-w-none text-[15px] leading-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{raw}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function TextContent({ source, compact = false }: { source: Rec; compact?: boolean }) {
  const raw = asText(source.rawText);
  const url = asText(source.url);
  if (!raw) {
    return <PreviewProblem title="暂无可预览内容" description="该内容还没有正文，可能仍在处理中。" source={source} />;
  }

  if (raw.trim().startsWith("<")) {
    return (
      <div>
        {!compact ? <PreviewToolbar title="文本内容预览" icon={<FileText className="h-5 w-5 text-slate-500" />} source={source} /> : null}
        <div className="mx-auto max-w-[860px] px-6 py-6">
          {url ? <a href={url} target="_blank" rel="noreferrer" className="mb-5 block truncate text-sm text-blue-600 hover:text-blue-700">{url}</a> : null}
          <div className="prose prose-slate max-w-none text-[15px] leading-8" dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(raw) }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {!compact ? <PreviewToolbar title="文本内容预览" icon={<FileText className="h-5 w-5 text-slate-500" />} source={source} /> : null}
      <div className="mx-auto max-w-[860px] px-6 py-6">
        {url ? <a href={url} target="_blank" rel="noreferrer" className="mb-5 block truncate text-sm text-blue-600 hover:text-blue-700">{url}</a> : null}
        <div className="whitespace-pre-wrap text-[15px] leading-8 text-slate-800">{raw}</div>
      </div>
    </div>
  );
}

export default function SourceContentView({ source }: { source: Rec; chunks: Rec[] }) {
  const type = useMemo(() => classifySource(source), [source]);
  const previewImages = asArray(previewField(source, "previewImages") || previewField(source, "preview_images")).filter((item): item is string => typeof item === "string");
  const previewHtml = asText(previewField(source, "previewHtml")) || asText(previewField(source, "preview_html"));
  const previewStatus = asText(previewField(source, "previewStatus") || previewField(source, "preview_status"));
  const previewError = asText(previewField(source, "previewError") || previewField(source, "preview_error"));

  if (previewStatus === "pending" || previewStatus === "processing") {
    return <PreviewLoading />;
  }

  if (previewStatus === "failed" && !hasFile(source)) {
    return <PreviewProblem title="文件预览失败" description={previewError || "你可以下载原文件查看，或稍后重试。"} source={source} />;
  }

  if (previewImages.length > 0) return <PageImagesPreview source={source} images={previewImages} />;
  if (previewHtml && ["word", "ppt", "unknown"].includes(type)) return <HtmlDocumentPreview source={source} html={previewHtml} title="文件预览" />;

  if (type === "image") return <ImagePreview source={source} />;
  if (type === "pdf") return <PdfPreview source={source} />;
  if (type === "spreadsheet") return <SpreadsheetPreview source={source} />;
  if (type === "word") return <WordPreview source={source} />;
  if (type === "ppt") return <PptPreview source={source} />;
  if (type === "markdown") return <MarkdownContent source={source} />;
  if (type === "text" || type === "link") return <TextContent source={source} />;

  if (hasFile(source)) {
    return (
      <div>
        <PreviewToolbar title="文件预览" icon={<FileText className="h-5 w-5 text-slate-500" />} source={source} />
        <PreviewProblem title="文件预览失败" description="当前文件类型暂未生成可视化预览，你可以下载原文件查看。" source={source} />
      </div>
    );
  }

  return <TextContent source={source} />;
}
