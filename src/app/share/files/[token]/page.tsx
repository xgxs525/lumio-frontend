"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, File } from "lucide-react";

import { api } from "@/lib/api";

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export default function SharedFilePage() {
  const params = useParams<{ token: string }>();
  const [file, setFile] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await api.getSharedFile(params.token);
        setFile(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "分享文件加载失败");
      }
    }
    void load();
  }, [params.token]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700"><File /></span>
            <div>
              <p className="text-sm font-bold text-slate-400">序光共享文件</p>
              <h1 className="text-3xl font-black">{asText(file?.filename, "共享文件")}</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold">前往官网</Link>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-bold text-white">
              <Download className="h-4 w-4" />
              下载文件
            </button>
          </div>
        </div>
        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p className="text-lg font-black">文件预览</p>
            <p className="mt-3 text-sm text-slate-500">当前格式如不支持在线预览，可下载后查看。后续可接入 Office/PDF 转换服务。</p>
          </div>
        )}
      </section>
    </main>
  );
}
