"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Loader2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { AuthGate } from "@/components/workspace/auth-gate";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

type SharedFolder = { folder_id: string; name: string; file_count: number; shared_by_name?: string; created_at?: string };

export default function SharedFoldersPage() {
  const [folders, setFolders] = useState<SharedFolder[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFolders() {
    setLoading(true);
    try {
      const res = await api.drive.listSharedFolders();
      setFolders(res.data ?? []);
    } catch {
      setFolders([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFolders();
  }, []);

  return (
    <AuthGate>
      <WorkspaceShell
        active="team"
        title="团队共享文件夹"
        subtitle="查看团队内所有共享的文件夹。团队成员可在云盘中将这些文件夹设置为团队共享。"
      >
        <div className="rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Share2 className="h-12 w-12 text-slate-300" />
              <p className="text-lg font-bold text-slate-500">暂无团队共享文件夹</p>
              <p className="text-sm text-slate-400">在云盘中新建文件夹后可设为团队共享</p>
              <Button asChild variant="outline" size="sm" className="mt-2 rounded-xl">
                <Link href="/drive">前往云盘</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {folders.map((f) => (
                <Link
                  key={f.folder_id}
                  href={`/drive/folders/${f.folder_id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{f.name}</p>
                      <p className="text-xs text-slate-400">
                        {f.file_count} 个文件{f.shared_by_name ? ` · ${f.shared_by_name} 共享` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {f.created_at ? new Date(f.created_at).toLocaleDateString("zh-CN") : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </WorkspaceShell>
    </AuthGate>
  );
}
