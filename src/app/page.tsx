"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { getStoredAuth, type StoredAuth } from "@/lib/auth";

const modelRows = [
  [
    "GPT-5.6",
    "GPT-5.5",
    "GPT-4o",
    "Claude Mythos",
    "Claude Sonnet 4.6",
    "Claude Sonnet 4.5",
    "Gemini 1.0",
  ],
  [
    "Llama 4",
    "Llama 3.3",
    "Llama 3.1",
    "DeepSeek-V4-Pro",
    "DeepSeek-V4-Flash",
    "DeepSeek-V3.2",
    "Qwen3.7-Max",
  ],
  [
    "GLM-5.2",
    "GLM-5.1",
    "GLM-5-Turbo",
    "GLM-5V-Turbo",
    "Kimi K2.7 Code",
    "Kimi K2.6",
    "Kimi K2.5",
  ],
  [
    "MiniMax-M3",
    "MiniMax-M2.7",
    "MiniMax-M2.5",
    "Hy3 Preview",
    "HY 2.0 Think",
    "HY 2.0 Instruct",
    "豆包大模型 2.0",
  ],
];

const rowStyles: Array<{ tag: string; direction: "left" | "right" }> = [
  { tag: "bg-blue-50 text-blue-700 border-blue-100", direction: "left" },
  { tag: "bg-emerald-50 text-emerald-700 border-emerald-100", direction: "right" },
  { tag: "bg-violet-50 text-violet-700 border-violet-100", direction: "left" },
  { tag: "bg-amber-50 text-amber-700 border-amber-100", direction: "right" },
];

function ModelMarqueeRow({
  items,
  style,
  direction,
}: {
  items: string[];
  style: { tag: string };
  direction: "left" | "right";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="group relative overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
      <div
        ref={trackRef}
        className="flex w-max animate-marquee gap-3 px-8 py-2 group-hover:[animation-play-state:paused]"
        style={
          {
            animationDirection: direction === "left" ? "normal" : "reverse",
            animationDuration: `${35 + items.length * 3}s`,
          } as CSSProperties
        }
      >
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className={`inline-flex shrink-0 items-center rounded-full border px-5 py-2 text-[14px] font-medium leading-none whitespace-nowrap ${style.tag}`}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [auth, setAuth] = useState<StoredAuth | null>(null);

  useEffect(() => {
    setAuth(getStoredAuth());
    const handler = () => setAuth(getStoredAuth());
    window.addEventListener("lumio-auth-changed", handler);
    return () => window.removeEventListener("lumio-auth-changed", handler);
  }, []);

  return (
    <main className="overflow-x-hidden bg-white text-slate-950">
      {/* ── Hero ── */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pt-20 pb-24 lg:grid-cols-[1fr_1fr] lg:pt-28 lg:pb-32">
        {/* Left text */}
        <div className="flex flex-col justify-center">
          <h1 className="max-w-lg text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[56px] lg:leading-[1.06]">
            一个入口，连接多个 AI 模型
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-500">
            序光整合多种 AI 模型能力，支持对话、写作、翻译、编程、分析、文件理解、图像制作和视频创作。你可以根据任务选择模型，也可以让序光智能推荐更合适的模型。
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            {auth ? (
              <Link
                href="/workspace"
                className="inline-flex h-12 items-center rounded-xl bg-slate-900 px-8 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                进入工作台
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center rounded-xl bg-slate-900 px-8 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  免费开始
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-xl border border-slate-200 px-8 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  登录
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right preview card — 智能模型推荐演示 */}
        <div className="hidden lg:flex lg:items-center lg:justify-center">
          <div className="w-full max-w-[400px] rounded-[24px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40">
            {/* Card title */}
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">AI</span>
              <span className="text-sm font-bold text-slate-800">智能模型推荐</span>
            </div>

            {/* 1. User task input */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-400">你的任务</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-700">
                帮我总结这份 30 页 PDF，并指出里面的问题。
              </p>
            </div>

            {/* 2. Task identification → arrow */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">识别为</span>
              <span className="text-xs text-slate-300">→</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">文件理解</span>
                <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">长文本分析</span>
                <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">逻辑整理</span>
                <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">图像制作</span>
                <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">视频创作</span>
              </div>
            </div>

            {/* 3. Recommendation */}
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">推荐模型</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Claude Sonnet 4.6</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                适合长文本理解、结构化分析和复杂内容总结
              </p>
            </div>

            {/* 4. Alternative models */}
            <p className="mt-5 mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">也可使用</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700">GPT-5.6</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700">DeepSeek-V4-Pro</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700">Gemini 1.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Model versions marquee ── */}
      <section className="bg-[#f7f9fc] py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          {/* This outer wrapper is critical — the white card holds the marquee */}
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">AI 模型版本</h2>
            <p className="mt-2 text-sm text-slate-500">持续接入更多模型，按任务智能推荐</p>
          </div>
        </div>
        {/* Full-bleed marquee container */}
        <div className="relative mt-12 overflow-hidden">
          <div className="mx-auto max-w-[1440px] px-6">
            <div className="rounded-2xl bg-white py-10 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
              <div className="space-y-6">
                {modelRows.map((items, i) => (
                  <ModelMarqueeRow
                    key={i}
                    items={items}
                    style={rowStyles[i]}
                    direction={rowStyles[i].direction}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-md px-6 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">开始使用序光</h2>
          <p className="mt-3 text-sm text-slate-500">
            在一个平台里，选择和使用不同 AI 模型。
          </p>
          {auth ? (
            <Link
              href="/workspace"
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-slate-900 px-10 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              进入工作台
            </Link>
          ) : (
            <Link
              href="/register"
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-slate-900 px-10 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              免费开始
            </Link>
          )}
        </div>
      </section>

      <p className="pb-8 text-center text-xs text-slate-400">
        AI 可能产生不准确的信息，请对重要内容进行核实。
      </p>
    </main>
  );
}
