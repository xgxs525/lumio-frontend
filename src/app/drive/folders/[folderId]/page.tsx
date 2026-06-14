"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Eye, FileText, FolderOpen, Loader2, Plus, RefreshCw, Upload } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function formatBytes(value: unknown) {
  const bytes = num(value);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: unknown) {
  const raw = text(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function DriveFolderPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = params.folderId;
  const uploadRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState<RecordMap>({});
  const [folders, setFolders] = useState<RecordMap[]>([]);
  const [files, setFiles] = useState<RecordMap[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [preview, setPreview] = useState<RecordMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadFolder() {
    setError("");
    setLoading(true);
    try {
      const [folderResult, childResult, fileResult] = await Promise.all([
        api.getFolder(folderId),
        api.listDriveFolders(folderId),
        api.listDriveFiles(folderId),
      ]);
      setFolder(folderResult.data);
      setFolders(childResult.data);
      setFiles(fileResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件夹加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFolder();
  }, [folderId]);

  async function createFolder() {
    if (!newFolderName.trim()) return;
    setBusy(true);
    try {
      await api.createDriveFolder(newFolderName.trim(), folderId);
      setNewFolderName("");
      setNotice("文件夹已创建。");
      await loadFolder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建文件夹失败");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      await api.uploadDriveFile(file, folderId);
      setNotice("文件已上传到当前文件夹。");
      await loadFolder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function openPreview(fileId: string) {
    setBusy(true);
    try {
      const result = await api.previewDriveFile(fileId);
      setPreview(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "预览失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell
      active="云盘"
      title={text(folder.name, "文件夹详情")}
      subtitle="查看当前文件夹内的子文件夹、文件、预览和下载入口。"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href="/drive">
              <ArrowLeft className="h-4 w-4" />
              返回云盘
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => void loadFolder()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="新建子文件夹名称" />
              <Button onClick={() => void createFolder()} disabled={busy || !newFolderName.trim()}>
                <Plus className="h-4 w-4" />
                新建文件夹
              </Button>
              <Button variant="secondary" onClick={() => uploadRef.current?.click()} disabled={busy}>
                <Upload className="h-4 w-4" />
                上传文件
              </Button>
              <input ref={uploadRef} className="hidden" type="file" onChange={(event) => void uploadFile(event.target.files?.[0])} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {folders.map((item) => (
              <Link key={text(item.id)} href={`/drive/folders/${text(item.id)}`} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5 transition hover:border-cyan-300/40">
                <FolderOpen className="mb-6 h-8 w-8 text-cyan-200" />
                <h2 className="break-words text-xl font-black text-white">{text(item.name, "未命名文件夹")}</h2>
                <p className="mt-3 text-sm text-slate-400">创建于 {formatDate(item.createdAt)}</p>
              </Link>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-xl font-black text-white">文件列表</h2>
              <p className="mt-1 text-sm text-slate-400">当前文件夹内的文件会显示在这里。</p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[minmax(220px,1fr)_120px_150px_180px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold text-slate-500">
                  <span>文件名</span>
                  <span>大小</span>
                  <span>更新时间</span>
                  <span className="text-right">操作</span>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    正在加载文件...
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">当前文件夹还没有文件。</div>
                ) : (
                  files.map((file) => (
                    <div key={text(file.id)} className="grid grid-cols-[minmax(220px,1fr)_120px_150px_180px] items-center gap-4 border-b border-white/10 px-5 py-4 text-sm last:border-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-cyan-200" />
                        <span className="truncate font-semibold text-white">{text(file.name, "未命名文件")}</span>
                      </div>
                      <span className="text-slate-400">{formatBytes(file.size)}</span>
                      <span className="text-slate-400">{formatDate(file.updatedAt || file.createdAt)}</span>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => void openPreview(text(file.id))}>
                          <Eye className="h-4 w-4" />
                          预览
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={api.driveFileDownloadUrl(text(file.id))} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                            下载
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <FolderOpen className="mb-5 h-8 w-8 text-cyan-200" />
          <h2 className="text-xl font-black text-white">文件夹概览</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="rounded-2xl bg-white/[0.06] p-4 text-slate-300">子文件夹：{num(folder.childCount, folders.length)}</div>
            <div className="rounded-2xl bg-white/[0.06] p-4 text-slate-300">文件：{num(folder.fileCount, files.length)}</div>
            <div className="rounded-2xl bg-white/[0.06] p-4 text-slate-300">更新：{formatDate(folder.updatedAt || folder.createdAt)}</div>
          </div>
        </aside>
      </section>

      <AppModal open={!!preview} title="文件预览" size="lg" onClose={() => setPreview(null)}>
        {preview?.kind === "text" ? (
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/70 p-4 text-sm leading-7 text-slate-100">{text(preview.content)}</pre>
        ) : (
          <div className="rounded-2xl bg-slate-950/55 p-5 text-sm text-slate-300">
            当前文件类型需要浏览器或外部转换服务预览，可先下载查看。
            <div className="mt-4">
              <Button asChild>
                <a href={text(preview?.downloadUrl)} target="_blank" rel="noreferrer">打开文件</a>
              </Button>
            </div>
          </div>
        )}
      </AppModal>
    </WorkspaceShell>
  );
}
