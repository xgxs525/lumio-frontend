"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Eye,
  FilePlus,
  FileText,
  FolderOpen,
  FolderPlus,
  Loader2,
  MoreHorizontal,
  Plus,
  Presentation,
  RefreshCw,
  Share2,
  Sparkles,
  Table,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type DriveRecord = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function formatBytes(value: unknown) {
  const bytes = asNumber(value);
  if (!bytes) return "0 KB";
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

function fileName(file: DriveRecord) {
  return asText(file.originalName, asText(file.name, "未命名文件"));
}

export default function FolderDetailPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = use(params);
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [folder, setFolder] = useState<DriveRecord | null>(null);
  const [folders, setFolders] = useState<DriveRecord[]>([]);
  const [files, setFiles] = useState<DriveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [fileCreateModal, setFileCreateModal] = useState<{ open: boolean; type: string; label: string; defaultName: string; ext: string; mime: string; content: string }>({
    open: false, type: "", label: "", defaultName: "", ext: "", mime: "", content: "",
  });
  const [fileCreateName, setFileCreateName] = useState("");

  async function loadFolder() {
    setLoading(true);
    try {
      const [folderResult, folderList, fileList] = await Promise.all([
        api.getFolder(folderId),
        api.listDriveFolders(folderId),
        api.listDriveFiles(folderId),
      ]);
      setFolder(folderResult.data);
      setFolders(folderList.data);
      setFiles(fileList.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载文件夹失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFolder();
  }, [folderId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
    }
    if (createMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createMenuOpen]);

  async function handleUpload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      await api.uploadDriveFile(file, folderId);
      toast.success("上传成功。");
      await loadFolder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    setBusy(true);
    try {
      await api.createDriveFolder(folderName.trim(), folderId);
      setFolderName("");
      setFolderModalOpen(false);
      toast.success("文件夹已创建。");
      await loadFolder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建文件夹失败");
    } finally {
      setBusy(false);
    }
  }

  function openFileCreate(type: string, label: string, defaultName: string, ext: string, mime: string, content: string) {
    setCreateMenuOpen(false);
    setFileCreateName(defaultName);
    setFileCreateModal({ open: true, type, label, defaultName, ext, mime, content });
  }

  async function handleCreateFile() {
    const name = fileCreateName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const result = await api.createDriveFile({
        name: name + (fileCreateModal.ext || ""),
        extension: fileCreateModal.ext,
        mime_type: fileCreateModal.mime,
        content: fileCreateModal.content,
        folder_id: folderId,
      });
      toast.success(`${fileCreateName} 已创建。`);
      setFileCreateModal({ open: false, type: "", label: "", defaultName: "", ext: "", mime: "", content: "" });
      await loadFolder();
      const fileId = (result.data as DriveRecord)?.id;
      if (fileId) router.push(`/drive/files/${String(fileId)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(fileId: string) {
    setBusy(true);
    try {
      await api.deleteDriveFile(fileId);
      toast.success("文件已删除。");
      await loadFolder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  async function handlePreview(fileId: string) {
    setBusy(true);
    try {
      const result = await api.previewDriveFile(fileId);
      toast.info("预览功能已打开。");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "预览失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(fileId: string) {
    setBusy(true);
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
      toast.error(err instanceof Error ? err.message : "下载失败");
    } finally {
      setBusy(false);
    }
  }

  const folderName_text = asText(folder?.name, "加载中...");
  const parentId = asText(folder?.parentId);

  return (
    <WorkspaceShell
      active="云盘"
      title={folderName_text}
      subtitle="管理文件夹内的文件和子文件夹。"
      actions={
        <>
          {/* Breadcrumb */}
          <Link
            href={parentId ? `/drive/folders/${parentId}` : "/drive"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回上级
          </Link>

          <div ref={createMenuRef} className="relative">
            <Button size="sm" onClick={() => setCreateMenuOpen(!createMenuOpen)} className="gap-1 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              新建
              <ChevronDown className={`h-3 w-3 transition ${createMenuOpen ? "rotate-180" : ""}`} />
            </Button>
            {createMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
                <button
                  type="button"
                  onClick={() => { setCreateMenuOpen(false); setFolderModalOpen(true); }}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <FolderPlus className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">新建文件夹</p>
                    <p className="mt-0.5 text-xs text-slate-400">用于整理文件</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openFileCreate("document", "在线文档", "未命名文档", ".md", "text/markdown", "# 未命名文档\n\n")}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <FilePlus className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">新建在线文档</p>
                    <p className="mt-0.5 text-xs text-slate-400">创建可编辑文档</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openFileCreate("spreadsheet", "在线表格", "未命名表格", ".csv", "text/csv", "字段1,字段2\n")}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <Table className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">新建在线表格</p>
                    <p className="mt-0.5 text-xs text-slate-400">创建数据表格</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openFileCreate("presentation", "在线演示", "未命名演示", ".md", "text/markdown", "# 未命名演示\n\n---\n\n## 第1页\n\n")}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <Presentation className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">新建在线演示</p>
                    <p className="mt-0.5 text-xs text-slate-400">创建演示文稿</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openFileCreate("text", "文本文件", "未命名文本", ".txt", "text/plain", "")}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">新建文本文件</p>
                    <p className="mt-0.5 text-xs text-slate-400">创建纯文本或 Markdown 文件</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={() => uploadRef.current?.click()} disabled={busy} className="h-8 text-xs">
            <Upload className="h-3.5 w-3.5" />
            上传文件
          </Button>

          <Button variant="ghost" size="sm" onClick={() => void loadFolder()} disabled={loading} className="h-8 w-8 p-0">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <input
            ref={uploadRef}
            className="hidden"
            type="file"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Sub-folders */}
          {folders.length > 0 && (
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {folders.map((f) => (
                <Link
                  key={asText(f.id)}
                  href={`/drive/folders/${asText(f.id)}`}
                  className="group min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]"
                >
                  <FolderOpen className="mb-5 h-8 w-8 text-cyan-200 transition group-hover:text-cyan-300" />
                  <h2 className="break-words text-lg font-black text-white">{asText(f.name, "未命名文件夹")}</h2>
                  <p className="mt-2 text-sm text-slate-400">创建于 {formatDate(f.createdAt)}</p>
                </Link>
              ))}
            </section>
          )}

          {/* Files table */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[minmax(240px,1.4fr)_120px_120px_140px_340px] gap-4 border-b border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-semibold text-slate-400">
                  <span>文件名</span>
                  <span>类型</span>
                  <span>大小</span>
                  <span>更新时间</span>
                  <span className="text-right">操作</span>
                </div>
                <div className="divide-y divide-white/5">
                  {files.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                      {folders.length === 0 ? "此文件夹为空，点击上方「新建」或「上传文件」添加内容。" : "文件夹内暂无文件。"}
                    </div>
                  ) : (
                    files.map((file) => {
                      const fileId = asText(file.id);
                      return (
                        <div
                          key={fileId}
                          className="grid grid-cols-[minmax(240px,1.4fr)_120px_120px_140px_340px] items-center gap-4 px-5 py-4 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                              <FileText className="h-5 w-5" />
                            </span>
                            <Link
                              className="min-w-0 truncate font-semibold text-white hover:text-cyan-200"
                              href={`/drive/files/${fileId}`}
                              title={fileName(file)}
                            >
                              {fileName(file)}
                            </Link>
                          </div>
                          <span className="truncate text-slate-400">{asText(file.extension, "文件") || "文件"}</span>
                          <span className="text-slate-500">{formatBytes(file.size)}</span>
                          <span className="text-slate-500">{formatDate(file.updatedAt || file.createdAt)}</span>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => void handlePreview(fileId)} className="text-slate-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => void handleDownload(fileId)} className="text-slate-400 hover:text-white">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => void handleDelete(fileId)} className="text-slate-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* File Create Modal */}
      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setFileCreateModal({ open: false, type: "", label: "", defaultName: "", ext: "", mime: "", content: "" })}>
              取消
            </Button>
            <Button disabled={!fileCreateName.trim() || busy} onClick={() => void handleCreateFile()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </div>
        }
        open={fileCreateModal.open}
        size="sm"
        title={`新建${fileCreateModal.label}`}
        description={`在「${folderName_text}」中创建 ${fileCreateModal.label}。`}
        onClose={() => setFileCreateModal({ open: false, type: "", label: "", defaultName: "", ext: "", mime: "", content: "" })}
      >
        <label className="grid gap-2 text-sm font-semibold text-white">
          文件名称
          <Input
            value={fileCreateName}
            onChange={(event) => setFileCreateName(event.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFile(); }}
            placeholder={`例如：新建${fileCreateModal.label}`}
            autoFocus
          />
        </label>
        <p className="mt-2 text-xs text-slate-400">
          文件将保存为 {fileCreateName || "..."}{fileCreateModal.ext}
        </p>
      </AppModal>

      {/* New Folder Modal */}
      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => { setFolderModalOpen(false); setFolderName(""); }}>
              取消
            </Button>
            <Button disabled={!folderName.trim() || busy} onClick={() => void handleCreateFolder()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </div>
        }
        open={folderModalOpen}
        size="sm"
        title="新建文件夹"
        description={`在「${folderName_text}」中创建子文件夹。`}
        onClose={() => { setFolderModalOpen(false); setFolderName(""); }}
      >
        <label className="grid gap-2 text-sm font-semibold text-white">
          文件夹名称
          <Input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="例如：项目资料、设计素材、会议记录"
            autoFocus
          />
        </label>
      </AppModal>
    </WorkspaceShell>
  );
}
