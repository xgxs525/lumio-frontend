"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";

import { api } from "@/lib/api";

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN");
}

export default function SharedDocumentPage() {
  const params = useParams<{ token: string }>();
  const [document, setDocument] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await api.getSharedDocument(params.token);
        setDocument(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "分享文档加载失败");
      }
    }
    void load();
  }, [params.token]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700"><FileText /></span>
            <div>
              <p className="text-sm font-bold text-slate-400">序光共享文档</p>
              <h1 className="text-3xl font-black">{asText(document?.title, "共享文档")}</h1>
            </div>
          </div>
          <Link href="/" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold">前往官网</Link>
        </div>
        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
        ) : (
          <article className="mt-8 rounded-2xl bg-slate-50 p-6 leading-8 text-slate-700">
            <p className="mb-5 text-sm text-slate-400">更新：{formatDate(document?.updatedAt) || "刚刚"}</p>
            <p>{asText(document?.contentText, "这个文档暂时没有内容。")}</p>
          </article>
        )}
      </section>
    </main>
  );
}
