"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Loader2, ShieldCheck } from "lucide-react";

import { api } from "@/lib/api";

type ShareRecord = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "长期有效";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function SharedDocumentPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [document, setDocument] = useState<ShareRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await api.getSharedDocument(token);
        setDocument(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "分享链接无法打开");
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [token]);

  return (
    <main className="min-h-screen bg-[#061024] px-5 py-8 text-white">
      <section className="mx-auto grid max-w-4xl gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-cyan-100/80">Lumio 文档分享</p>
          <h1 className="mt-2 break-words text-3xl font-black">{loading ? "正在读取文档..." : asText(document?.title, "共享文档")}</h1>
          {document ? (
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="rounded-full bg-white/10 px-3 py-1">只读查看</span>
              <span className="rounded-full bg-white/10 px-3 py-1">有效期：{formatDate(document.expiresAt)}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">更新：{formatDate(document.updatedAt)}</span>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-3xl border border-red-300/25 bg-red-500/10 p-6 text-red-100">{error}</div>
        ) : loading ? (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-white/10 bg-white/[0.04]">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
          </div>
        ) : (
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>这是一个只读分享文档，内容来自 Lumio 工作空间。</span>
            </div>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap break-words bg-transparent p-0 font-sans text-base leading-8 text-slate-100">
                {asText(document?.contentText, "这个文档暂时没有内容。")}
              </pre>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
