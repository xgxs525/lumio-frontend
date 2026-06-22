"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArchiveRestore, FileText, HardDrive, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { AuthGate } from "@/components/workspace/auth-gate";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api";

type TrashFile = Record<string, unknown>;

export default function TrashPage() {
  const [files, setFiles] = useState<TrashFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadTrash() {
    setLoading(true);
    try {
      const res = (await api.drive.listTrash()) as unknown as ApiResponse<TrashFile[]>;
      setFiles(res.data ?? []);
    } catch {
      setFiles([]);
    }
    setLoading(false);
  }

  async function handleRestore(fileId: string) {
    setActionLoading(fileId);
    await api.drive.restoreFile(fileId);
    await loadTrash();
    setActionLoading(null);
  }

  async function handlePermanentDelete(fileId: string) {
    setActionLoading(fileId);
    await api.drive.permanentDeleteFile(fileId);
    await loadTrash();
    setActionLoading(null);
  }

  async function handleEmptyTrash() {
    setActionLoading("empty");
    await api.drive.emptyTrash();
    await loadTrash();
    setActionLoading(null);
  }

  useEffect(() => {
    loadTrash();
  }, []);

  return (
    <AuthGate>
      <WorkspaceShell
        active="drive"
        title="回收站"
        subtitle="查看和恢复已删除的文件。文件删除后保留在回收站中，可随时恢复或永久删除。"
        actions={
          files.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmptyTrash}
              disabled={actionLoading === "empty"}
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              清空回收站
            </Button>
          ) : undefined
        }
      >
        <div className={cn("rounded-2xl border border-slate-200 bg-white", loading && "flex items-center justify-center py-20")}>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <HardDrive className="h-12 w-12 text-slate-300" />
              <p className="text-lg font-bold text-slate-500">回收站为空</p>
              <p className="text-sm text-slate-400">删除的文件会出现在这里</p>
              <Button asChild variant="outline" size="sm" className="mt-2 rounded-xl">
                <Link href="/drive">返回云盘</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {files.map((file) => {
                const fileId = file.id as string;
                const fileName = (file.name ?? file.filename ?? file.display_name ?? "未命名文件") as string;
                const fileSize = file.size ? `${Math.round((file.size as number) / 1024)} KB` : "";
                const deletedAt = file.deleted_at ? new Date(file.deleted_at as string).toLocaleString("zh-CN") : "";
                return (
                  <div key={fileId} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{fileName}</p>
                        <p className="text-xs text-slate-400">
                          {fileSize} · {deletedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(fileId)}
                        disabled={actionLoading === fileId}
                        className="h-8 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {actionLoading === fileId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1 text-sm">恢复</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePermanentDelete(fileId)}
                        disabled={actionLoading === fileId}
                        className="h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </WorkspaceShell>
    </AuthGate>
  );
}
