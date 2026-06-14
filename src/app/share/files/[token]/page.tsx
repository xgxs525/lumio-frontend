"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download, FileText, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type ShareRecord = Record<string, unknown>;

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
  if (!raw) return "长期有效";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function SharedFilePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [file, setFile] = useState<ShareRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const previewKind = useMemo(() => {
    const mime = asText(file?.mimeType);
    if (mime.startsWith("image/")) return "image";
    if (mime === "application/pdf") return "pdf";
    return "download";
  }, [file]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await api.getSharedFile(token);
        setFile(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "分享链接无法打开");
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [token]);

  async function downloadFile() {
    if (!token) return;
    const result = await api.downloadSharedFile(token);
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#061024] px-5 py-8 text-white">
      <section className="mx-auto grid max-w-5xl gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-cyan-100/80">Lumio 文件分享</p>
            <h1 className="mt-2 break-words text-3xl font-black">{loading ? "正在读取文件..." : asText(file?.name, "共享文件")}</h1>
          </div>
          <Button disabled={!file || loading} onClick={() => void downloadFile()}>
            <Download className="h-4 w-4" />
            下载文件
          </Button>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-300/25 bg-red-500/10 p-6 text-red-100">{error}</div>
        ) : loading ? (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-white/10 bg-white/[0.04]">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              {previewKind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={asText(file?.name)} className="max-h-[70vh] w-full rounded-2xl object-contain" src={api.sharedFileDownloadUrl(token)} />
              ) : previewKind === "pdf" ? (
                <iframe className="h-[70vh] w-full rounded-2xl border border-white/10 bg-white" src={api.sharedFileDownloadUrl(token)} title={asText(file?.name)} />
              ) : (
                <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/45 p-8 text-center">
                  <div>
                    <FileText className="mx-auto h-12 w-12 text-cyan-200" />
                    <p className="mt-4 text-lg font-black">当前格式不支持在线预览</p>
                    <p className="mt-2 text-sm text-slate-400">请点击右上角下载后查看。</p>
                  </div>
                </div>
              )}
            </div>
            <aside className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <ShieldCheck className="mb-4 h-6 w-6 text-cyan-200" />
              <h2 className="text-xl font-black">分享信息</h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">文件大小</dt>
                  <dd className="mt-1 font-semibold text-white">{formatBytes(file?.size)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">权限</dt>
                  <dd className="mt-1 font-semibold text-white">只读查看</dd>
                </div>
                <div>
                  <dt className="text-slate-500">有效期</dt>
                  <dd className="mt-1 break-words font-semibold text-white">{formatDate(file?.expiresAt)}</dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
