"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Braces, Download, Eye, FileText, Loader2, RefreshCw, Save, Sparkles, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatBytes(value: unknown) {
  const bytes = typeof value === "number" ? value : 0;
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

export default function DriveFileEditorPage() {
  const params = useParams<{ fileId: string }>();
  const fileId = params.fileId;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [file, setFile] = useState<RecordMap>({});
  const [content, setContent] = useState("");
  const [editingName, setEditingName] = useState("");
  const [showRename, setShowRename] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [objectUrl, setObjectUrl] = useState("");

  const ext = asText(file.extension, asText(fileName(file).match(/\.[^.]+$/)?.[0], "")).toLowerCase();
  const isText = [".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".html", ".css", ".js", ".ts", ".py", ".log", ".sql"].includes(ext);
  const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico"].includes(ext);
  const fileDisplayName = editingName || fileName(file);

  const meta = useMemo(
    () => [
      ["类型", ext || "未知"],
      ["大小", formatBytes(file.size)],
      ["解析状态", asText(file.parseStatus, "pending")],
      ["更新时间", formatDate(file.updatedAt || file.createdAt)],
    ],
    [ext, file],
  );

  const loadFile = useCallback(async () => {
    if (!fileId) return;
    setError("");
    setLoading(true);
    try {
      const [fileResult, previewResult] = await Promise.all([
        api.getDriveFile(fileId),
        api.previewDriveFile(fileId),
      ]);
      setFile(fileResult.data);
      if (isText) {
        setContent(previewResult.data.content ?? "");
        setEditingName(fileName(fileResult.data));
      } else if (isImage) {
        try {
          const dl = await api.downloadDriveFile(fileId);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          setObjectUrl(URL.createObjectURL(dl.blob));
        } catch { /* ignore */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件加载失败");
    } finally {
      setLoading(false);
    }
  }, [fileId, isText, isImage, objectUrl]);

  useEffect(() => { void loadFile(); return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [fileId]);

  async function downloadFile() {
    try {
      const result = await api.downloadDriveFile(fileId);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url; link.download = result.filename;
      document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "下载失败");
    }
  }

  async function saveContent() {
    setSaving(true);
    setError("");
    try {
      await api.updateDriveFile(fileId, { content });
      toast.success("内容已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveRename() {
    const name = editingName.trim();
    if (!name || name === fileName(file)) { setShowRename(false); return; }
    setSaving(true);
    try {
      await api.updateDriveFile(fileId, { name });
      setFile({ ...file, name, originalName: name });
      setShowRename(false);
      toast.success("文件名已更新。");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重命名失败");
    } finally {
      setSaving(false);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isText && !saving) saveContent();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isText, saving, content]);

  return (
    <WorkspaceShell
      active="云盘"
      title={fileDisplayName}
      subtitle="编辑文件内容，或预览/下载。Cmd/Ctrl+S 快速保存。"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href="/drive">
              <ArrowLeft className="h-4 w-4" />
              返回云盘
            </Link>
          </Button>
          {isText && (
            <Button onClick={() => saveContent()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存
            </Button>
          )}
          <Button variant="ghost" onClick={() => downloadFile()}>
            <Download className="h-4 w-4" />
            下载
          </Button>
        </>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      {/* Meta info */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {meta.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 truncate text-sm font-bold text-white" title={value}>{value}</p>
          </div>
        ))}
      </section>

      {/* Content area */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <div className="flex items-center gap-3 min-w-0">
            {showRename ? (
              <input
                className="h-8 w-full max-w-[260px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:ring-2 focus:ring-blue-300"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => saveRename()}
                onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setShowRename(false); }}
                autoFocus
              />
            ) : (
              <span
                className="font-bold text-white cursor-pointer hover:text-blue-400 transition"
                title="点击重命名"
                onClick={() => { setEditingName(fileName(file)); setShowRename(true); }}
              >
                文件名称
              </span>
            )}
            <h2 className="text-xl font-black text-white">{isText ? "编辑" : "文件预览"}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {isText ? "直接编辑文件内容，Cmd/Ctrl+S 快速保存。" : "该文件类型暂不支持在线编辑。"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isText && (
              <span className="text-xs text-slate-500">
                {content.length.toLocaleString()} 字
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={() => void loadFile()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>
        </div>
        <div className="min-h-[420px]">
          {loading ? (
            <div className="grid min-h-[400px] place-items-center text-sm text-slate-400">
              <Loader2 className="mb-3 h-6 w-6 animate-spin" />
              正在加载...
            </div>
          ) : isText ? (
            <textarea
              ref={editorRef}
              className="h-[620px] w-full resize-none bg-slate-950/60 px-6 py-5 font-mono text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-600"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此输入内容..."
              spellCheck={false}
            />
          ) : isImage && objectUrl ? (
            <div className="grid place-items-center rounded-2xl p-4">
              <img className="max-h-[620px] max-w-full rounded-xl object-contain" alt={fileDisplayName} src={objectUrl} />
            </div>
          ) : (
            <div className="grid min-h-[400px] place-items-center rounded-2xl text-center">
              <div>
                <Braces className="mx-auto h-10 w-10 text-slate-500" />
                <p className="mt-4 font-bold text-white">不支持在线编辑</p>
                <p className="mt-2 text-sm text-slate-400">可以下载文件后使用本地编辑器处理。</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Save bar for mobile */}
      {isText && (
        <div className="mt-4 flex justify-end gap-3 lg:hidden">
          <Button variant="secondary" onClick={() => void loadFile()} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> 放弃
          </Button>
          <Button onClick={() => saveContent()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存
          </Button>
        </div>
      )}
    </WorkspaceShell>
  );
}
