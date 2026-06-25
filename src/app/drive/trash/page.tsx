"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArchiveRestore,
  ArrowLeft,
  FileText,
  File,
  Film,
  FolderOpen,
  HardDrive,
  ImageIcon,
  Loader2,
  Search,
  Table,
  Trash2,
  X,
} from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type TrashFile = Record<string, unknown>;

type FilterKey = "全部" | "文件夹" | "文档" | "表格" | "演示" | "图片" | "视频" | "PDF" | "压缩包" | "其他";
type SortKey = "最近删除" | "文件名" | "文件大小" | "即将过期";

const filterOptions: FilterKey[] = ["全部", "文件夹", "文档", "表格", "演示", "图片", "视频", "PDF", "压缩包", "其他"];
const sortOptions: SortKey[] = ["最近删除", "文件名", "文件大小", "即将过期"];

function asText(v: unknown, fallback = "") { return typeof v === "string" ? v : fallback; }
function asNum(v: unknown, fallback = 0) { return typeof v === "number" ? v : fallback; }

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(raw: unknown) {
  const s = asText(raw);
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function daysLeft(deletedAt: unknown) {
  const s = asText(deletedAt);
  if (!s) return 30;
  const deleted = new Date(s);
  if (Number.isNaN(deleted.getTime())) return 30;
  const expire = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const remaining = Math.ceil((expire.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

function daysLeftLabel(deletedAt: unknown) {
  const d = daysLeft(deletedAt);
  if (d === 0) return "今天过期";
  if (d === 1) return "剩余 1 天";
  return `剩余 ${d} 天`;
}

function getFileIcon(file: TrashFile) {
  const ext = asText(file.extension).toLowerCase();
  const isFolder = asText(file.fileType) === "folder" || !!file.is_folder;
  if (isFolder) return <FolderOpen className="h-5 w-5 shrink-0 text-amber-500" />;
  if (ext === ".md" || ext === ".txt") return <FileText className="h-5 w-5 shrink-0 text-blue-500" />;
  if (ext === ".csv" || ext === ".xlsx" || ext === ".xls") return <Table className="h-5 w-5 shrink-0 text-emerald-500" />;
  if (ext === ".pdf") return <File className="h-5 w-5 shrink-0 text-red-500" />;
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) return <ImageIcon className="h-5 w-5 shrink-0 text-purple-500" />;
  if ([".mp4", ".mov", ".webm", ".avi"].includes(ext)) return <Film className="h-5 w-5 shrink-0 text-indigo-500" />;
  return <File className="h-5 w-5 shrink-0 text-slate-400" />;
}

function getFileTypeLabel(file: TrashFile) {
  const isFolder = asText(file.fileType) === "folder" || !!file.is_folder;
  if (isFolder) return "文件夹";
  const ext = asText(file.extension).toLowerCase();
  if (ext === ".md") return "文档";
  if (ext === ".csv" || ext === ".xlsx" || ext === ".xls") return "表格";
  if (ext === ".pdf") return "PDF";
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) return "图片";
  if ([".mp4", ".mov", ".webm", ".avi"].includes(ext)) return "视频";
  if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext)) return "压缩包";
  if (ext === ".txt") return "文本";
  if (ext === ".pptx" || ext === ".ppt") return "演示";
  return "其他";
}

function matchesFilter(file: TrashFile, filter: FilterKey): boolean {
  if (filter === "全部") return true;
  const label = getFileTypeLabel(file);
  return label === filter;
}

export default function TrashPage() {
  const [files, setFiles] = useState<TrashFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("全部");
  const [sort, setSort] = useState<SortKey>("最近删除");
  const [confirmDelete, setConfirmDelete] = useState<TrashFile | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  async function loadTrash() {
    setLoading(true);
    try {
      const res = (await api.drive.listTrash()) as unknown as { data: TrashFile[] };
      setFiles(res.data ?? []);
    } catch {
      setFiles([]);
    }
    setLoading(false);
  }

  async function handleRestore(fileId: string) {
    setActionLoading(fileId);
    try {
      await api.drive.restoreFile(fileId);
      toast.success("已恢复到原位置。");
      await loadTrash();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "恢复失败");
    }
    setActionLoading(null);
  }

  async function handlePermanentDelete(fileId: string) {
    setConfirmDelete(null);
    setActionLoading(fileId);
    try {
      await api.drive.permanentDeleteFile(fileId);
      toast.success("已永久删除。");
      await loadTrash();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
    setActionLoading(null);
  }

  async function handleEmptyTrash() {
    setConfirmEmpty(false);
    setActionLoading("empty");
    try {
      await api.drive.emptyTrash();
      toast.success("回收站已清空。");
      await loadTrash();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "清空失败");
    }
    setActionLoading(null);
  }

  useEffect(() => { loadTrash(); }, []);

  const filtered = useMemo(() => {
    let list = files.filter((f) => matchesFilter(f, filter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => {
        const name = asText(f.name || f.filename || f.display_name, "").toLowerCase();
        const orig = asText(f.original_path, "").toLowerCase();
        return name.includes(q) || orig.includes(q);
      });
    }
    list.sort((a, b) => {
      switch (sort) {
        case "文件名":
          return asText(a.name, "").localeCompare(asText(b.name, ""), "zh");
        case "文件大小":
          return asNum(b.size, 0) - asNum(a.size, 0);
        case "即将过期":
          return daysLeft(a.deleted_at) - daysLeft(b.deleted_at);
        default: {
          const da = asText(a.deleted_at);
          const db = asText(b.deleted_at);
          return db.localeCompare(da);
        }
      }
    });
    return list;
  }, [files, filter, search, sort]);

  return (
    <WorkspaceShell
      active="云盘"
      title=""
    >
      <div className="space-y-4 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/drive" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" />返回云盘
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-950">云盘回收站</h1>
            <p className="mt-1 text-sm text-slate-500">这里保存你从云盘删除的文件和文件夹，你可以恢复，也可以永久删除。</p>
          </div>
          <div className="ml-auto">
            {files.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmEmpty(true)}
                disabled={actionLoading === "empty"}
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                清空回收站
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索已删除文件..."
              className="h-9 border-slate-200 bg-white pl-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${filter === f ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none"
            >
              {sortOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <HardDrive className="h-12 w-12 text-slate-300" />
              <p className="text-lg font-bold text-slate-500">{files.length === 0 ? "回收站为空" : "没有匹配的内容"}</p>
              <p className="text-sm text-slate-400">{files.length === 0 ? "从云盘删除的文件会出现在这里" : "尝试调整搜索词或筛选条件"}</p>
              <Button asChild variant="outline" size="sm" className="mt-2 rounded-xl">
                <Link href="/drive">返回云盘</Link>
              </Button>
            </div>
          ) : (
            <div>
              <div className="hidden gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-500 md:grid md:grid-cols-[minmax(180px,1.5fr)_100px_160px_90px_120px_100px_120px]">
                <span>文件名</span>
                <span>类型</span>
                <span>原位置</span>
                <span>大小</span>
                <span>删除时间</span>
                <span>保留期限</span>
                <span className="text-right">操作</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map((file) => {
                  const fileId = asText(file.id);
                  const name = asText(file.name || file.filename || file.display_name, "未命名文件");
                  const typeLabel = getFileTypeLabel(file);
                  const origPath = asText(file.original_path, "云盘根目录");
                  const size = asNum(file.size, 0);
                  const deletedAt = file.deleted_at;
                  const isLoading = actionLoading === fileId;

                  return (
                    <div
                      key={fileId}
                      className="grid items-center gap-4 px-6 py-4 transition hover:bg-slate-50 md:grid-cols-[minmax(180px,1.5fr)_100px_160px_90px_120px_100px_120px]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {getFileIcon(file)}
                        <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
                      </div>
                      <span className="hidden text-xs text-slate-500 md:block">{typeLabel}</span>
                      <span className="hidden truncate text-xs text-slate-400 md:block">{origPath}</span>
                      <span className="hidden text-xs text-slate-400 md:block">{size ? formatBytes(size) : "—"}</span>
                      <span className="hidden text-xs text-slate-400 md:block">{formatDate(deletedAt)}</span>
                      <span className="hidden text-xs text-slate-400 md:block">{daysLeftLabel(deletedAt)}</span>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(fileId)}
                          disabled={isLoading}
                          className="h-8 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
                          <span className="ml-1 hidden text-xs sm:inline">恢复</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(file)}
                          disabled={isLoading}
                          className="h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="ml-1 hidden text-xs sm:inline">删除</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AppModal
        open={!!confirmDelete}
        size="sm"
        title="永久删除此文件？"
        description="永久删除后无法恢复，请确认是否继续。"
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>取消</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => confirmDelete && handlePermanentDelete(asText(confirmDelete.id))}>
              永久删除
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{confirmDelete && asText(confirmDelete.name || confirmDelete.filename || confirmDelete.display_name, "未命名文件")}</p>
            <p className="mt-1 text-sm text-slate-500">此操作不可撤销，文件数据将从服务器上彻底删除。</p>
          </div>
        </div>
      </AppModal>

      <AppModal
        open={confirmEmpty}
        size="sm"
        title="清空云盘回收站？"
        description="清空后，回收站内所有文件和文件夹都将被永久删除，无法恢复。"
        onClose={() => setConfirmEmpty(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmEmpty(false)}>取消</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleEmptyTrash} disabled={actionLoading === "empty"}>
              {actionLoading === "empty" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              确认清空
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">共 {files.length} 个文件将被永久删除。</p>
            <p className="mt-1 text-sm text-slate-500">此操作不可撤销，所有数据将从服务器上彻底删除。</p>
          </div>
        </div>
      </AppModal>
    </WorkspaceShell>
  );
}
