"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Brain, Download, Eye, FileText, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;
type PreviewRecord = {
  kind: "text" | "image" | "pdf" | "download";
  file: RecordMap;
  content: string;
  truncated: boolean;
  downloadUrl: string;
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function formatBytes(value: unknown) {
  const bytes = asNumber(value);
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fileName(file: RecordMap) {
  return asText(file.originalName, asText(file.name, "未命名文件"));
}

export default function DriveFilePreviewPage() {
  const params = useParams<{ fileId: string }>();
  const fileId = params.fileId;
  const [file, setFile] = useState<RecordMap>({});
  const [preview, setPreview] = useState<PreviewRecord | null>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const [question, setQuestion] = useState("请总结这个文件的核心结论，并列出下一步行动。");
  const [jobResult, setJobResult] = useState<RecordMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const ext = asText(file.extension, asText(fileName(file).match(/\.[^.]+$/)?.[0], ""));
  const meta = useMemo(
    () => [
      ["类型", ext || "未知"],
      ["大小", formatBytes(file.size)],
      ["解析状态", asText(file.parseStatus, "pending")],
      ["AI 状态", asText(file.aiStatus, "pending")],
      ["上传时间", formatDate(file.createdAt)],
    ],
    [ext, file],
  );

  const loadPreview = useCallback(async () => {
    if (!fileId) return;
    setError("");
    setLoading(true);
    try {
      const [fileResult, previewResult] = await Promise.all([
        api.getDriveFile(fileId),
        api.previewDriveFile(fileId),
      ]);
      setFile(fileResult.data);
      setPreview(previewResult.data);

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl("");
      }
      if (["image", "pdf"].includes(previewResult.data.kind)) {
        const downloadResult = await api.downloadDriveFile(fileId);
        setObjectUrl(URL.createObjectURL(downloadResult.blob));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件预览加载失败");
    } finally {
      setLoading(false);
    }
  }, [fileId, objectUrl]);

  useEffect(() => {
    void loadPreview();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  async function downloadFile() {
    setBusy(true);
    setError("");
    try {
      const result = await api.downloadDriveFile(fileId);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "下载失败");
    } finally {
      setBusy(false);
    }
  }

  async function runFileAi(mode: "index" | "summary" | "ask" | "clean") {
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "index"
          ? await api.indexDriveFileAsync(fileId)
          : mode === "summary"
            ? await api.summarizeDriveFileAsync(fileId)
            : mode === "clean"
              ? await api.cleanDriveTableAsync(fileId)
              : await api.askDriveFileAsync(fileId, { question });
      setJobResult(result.data);
      const job = (result.data.job || {}) as RecordMap;
      setNotice(`异步任务已提交${asText(job.id) ? `，任务 ID：${asText(job.id)}` : ""}。可在任务中心查看进度。`);
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件 AI 任务提交失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell
      active="云盘"
      title={fileName(file)}
      subtitle="独立文件预览页，支持预览、下载、解析、总结、问答和清洗任务。"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href="/drive">
              <ArrowLeft className="h-4 w-4" />
              返回云盘
            </Link>
          </Button>
          <Button onClick={() => void downloadFile()} disabled={busy}>
            <Download className="h-4 w-4" />
            下载
          </Button>
        </>
      }
      rightPanel={
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <Brain className="mb-4 h-7 w-7 text-cyan-200" />
            <h2 className="text-xl font-black text-white">文件 AI</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">先提交解析和向量化任务，再围绕文件提问或生成总结。</p>
            <div className="mt-4 grid gap-2">
              <Button className="w-full" onClick={() => void runFileAi("index")} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                解析并建立索引
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => void runFileAi("summary")} disabled={busy}>
                文件总结
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => void runFileAi("clean")} disabled={busy}>
                表格清洗
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
            <h2 className="text-xl font-black text-white">文件问答</h2>
            <textarea
              className="mt-4 min-h-28 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-300"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <Button className="mt-3 w-full" onClick={() => void runFileAi("ask")} disabled={busy || !question.trim()}>
              <Wand2 className="h-4 w-4" />
              提交问答任务
            </Button>
          </div>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {meta.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 truncate text-sm font-bold text-white" title={value}>{value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="text-xl font-black text-white">文件预览</h2>
            <p className="mt-1 text-sm text-slate-400">大文件会限制预览长度，完整内容请下载查看。</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void loadPreview()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
        <div className="min-h-[360px] p-4 sm:p-6">
          {loading ? (
            <div className="grid min-h-[320px] place-items-center text-sm text-slate-400">
              <Loader2 className="mb-3 h-6 w-6 animate-spin" />
              正在加载预览...
            </div>
          ) : preview?.kind === "text" ? (
            <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/70 p-5 text-sm leading-7 text-slate-100">
              {preview.content || "暂无可预览文本。"}
            </pre>
          ) : preview?.kind === "image" && objectUrl ? (
            <div className="grid place-items-center rounded-2xl bg-slate-950/50 p-4">
              <img className="max-h-[620px] max-w-full rounded-xl object-contain" alt={fileName(file)} src={objectUrl} />
            </div>
          ) : preview?.kind === "pdf" && objectUrl ? (
            <iframe className="h-[620px] w-full rounded-2xl border border-white/10 bg-white" src={objectUrl} title={fileName(file)} />
          ) : (
            <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-white/15 text-center">
              <div>
                <FileText className="mx-auto h-10 w-10 text-cyan-200" />
                <p className="mt-4 font-bold text-white">该文件暂不支持在线预览</p>
                <p className="mt-2 text-sm text-slate-400">可以下载文件，或提交解析任务后在 AI 里查看摘要。</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {jobResult && (
        <section className="mt-6 rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-6">
          <Eye className="h-6 w-6 text-cyan-200" />
          <h2 className="mt-4 text-xl font-black text-white">最近提交结果</h2>
          <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-4 text-xs leading-6 text-cyan-50">
            {JSON.stringify(jobResult, null, 2)}
          </pre>
        </section>
      )}
    </WorkspaceShell>
  );
}
