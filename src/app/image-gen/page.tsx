"use client";

import { useState } from "react";
import { ArrowRight, Download, Eye, FileImage, History, ImageIcon, Loader2, Plus, Sparkles, Trash2, Upload, Wand2, Copy, Check } from "lucide-react";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────
type Ratio = "1:1" | "4:3" | "16:9" | "9:16" | "3:4";
type Style = "真实摄影" | "极简设计" | "科技感" | "插画" | "海报" | "产品封面" | "赛博风" | "国风" | "动漫" | "手绘";
type Count = 1 | 2 | 4;
type ModelName = "智能推荐" | "通用图像模型" | "写实图像模型" | "设计海报模型" | "插画模型" | "自定义模型";

interface HistoryItem {
  id: string;
  prompt: string;
  model: ModelName;
  time: string;
}

// ─── Templates ─────────────────────────────────────────────────
const TEMPLATES = [
  { label: "小红书封面", prompt: "小红书风格封面图，年轻女性产品推荐，极简设计，柔光，清新色调" },
  { label: "公众号首图", prompt: "微信公众号首图，专业科技风格，蓝色系，几何元素，简洁大气" },
  { label: "短视频封面", prompt: "短视频封面图，醒目标题区，高对比度，运营风格，视觉冲击力强" },
  { label: "产品海报", prompt: "AI 产品宣传海报，未来科技感，深蓝背景，光线粒子效果，高级品牌感" },
  { label: "人物头像", prompt: "专业人像摄影，柔和侧光，浅灰背景，清晰面部细节，自然表情" },
  { label: "场景插画", prompt: "现代办公场景插画，2.5D 等距视角，莫兰迪色调，简洁线条" },
  { label: "科技背景图", prompt: "纯色深蓝科技背景，细线网格，发光节点，抽象数据流，16:9" },
  { label: "社交媒体配图", prompt: "Instagram 风格方形配图，明亮配色，简单构图，适合品牌传播" },
];

const RATIOS: Ratio[] = ["1:1", "4:3", "16:9", "9:16", "3:4"];
const STYLES: Style[] = ["真实摄影", "极简设计", "科技感", "插画", "海报", "产品封面", "赛博风", "国风", "动漫", "手绘"];
const COUNTS: Count[] = [1, 2, 4];
const MODELS: ModelName[] = ["智能推荐", "通用图像模型", "写实图像模型", "设计海报模型", "插画模型", "自定义模型"];

const MOCK_HISTORY: HistoryItem[] = [
  { id: "1", prompt: "极简科技风 AI 平台首页封面图", model: "通用图像模型", time: "今天 14:22" },
  { id: "2", prompt: "赛博风城市夜景海报 16:9", model: "写实图像模型", time: "今天 11:40" },
  { id: "3", prompt: "手绘风格产品使用流程图", model: "智能推荐", time: "昨天 20:18" },
  { id: "4", prompt: "国风水墨 AI 平台 Logo 配景", model: "智能推荐", time: "昨天 16:05" },
];

// ─── Component ─────────────────────────────────────────────────
export default function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [style, setStyle] = useState<Style>("科技感");
  const [count, setCount] = useState<Count>(1);
  const [model, setModel] = useState<ModelName>("智能推荐");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="bg-[#f7f9fc] text-slate-950 min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/workspace" className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 hover:shadow">
          <ArrowLeft className="h-3.5 w-3.5" />
          返回工作台
        </Link>

        {/* ── Coming Soon Banner ──────────────────────── */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-amber-800">图像生成即将上线</p>
            <p className="mt-0.5 text-sm text-amber-600">
              输入描述，生成封面图、海报、插画和视觉素材。当前功能正在接入中，后续将支持多种图片模型和风格选择。
            </p>
          </div>
          <a href="/changelog" className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-900">
            了解更新 →
          </a>
        </div>

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">图像生成</h1>
            <p className="mt-1 text-sm text-slate-500">
              输入画面描述，选择风格、比例和模型，生成适合内容创作、封面设计和视觉表达的图片。
            </p>
          </div>
        </div>

        {/* ── Main Grid ──────────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left: Settings */}
          <div className="space-y-5">
            {/* Prompt */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">提示词</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想生成的画面，例如：一张极简科技风的 AI 平台首页封面图"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              {/* Upload ref */}
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <Upload className="mx-auto h-4 w-4 text-slate-400" />
                <p className="mt-1 text-xs text-slate-500">上传参考图</p>
                <p className="text-[11px] text-slate-400">JPG / PNG / WebP</p>
              </div>
            </div>

            {/* Ratio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">图片比例</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatio(r)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      ratio === r ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">图片风格</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      style === s ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">生成数量</label>
              <div className="mt-2 flex gap-2">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition ${
                      count === c ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {c} 张
                  </button>
                ))}
              </div>
            </div>

            {/* Model */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">模型选择</label>
              <div className="mt-2 space-y-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                      model === m ? "border-blue-200 bg-blue-50 text-blue-700" : "border-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${model === m ? "bg-blue-500" : "bg-slate-300"}`} />
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              disabled={!prompt.trim() || generating}
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? "正在生成..." : "生成图片"}
            </button>
          </div>

          {/* Right: Result + History */}
          <div className="space-y-6">
            {/* Templates */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">快捷模板</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setPrompt(t.prompt)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result area */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              {!generated && !generating ? (
                /* Empty state */
                <div className="flex flex-col items-center py-16 text-center">
                  <ImageIcon className="h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 font-bold text-slate-500">还没有生成图片</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-400">
                    输入画面描述，选择图片比例和风格，开始生成你的第一张图片。
                  </p>
                </div>
              ) : generating ? (
                /* Generating state */
                <div className="flex flex-col items-center py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <h3 className="mt-4 font-bold text-slate-700">正在生成图片...</h3>
                  <p className="mt-1 text-sm text-slate-400">预计需要几秒到几十秒</p>
                </div>
              ) : (
                /* Generated result */
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">生成结果</h3>
                    <span className="text-xs text-slate-400">{count} 张 · {model}</span>
                  </div>
                  <div className={`mt-4 grid gap-4 ${count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                    {Array.from({ length: count }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group">
                        <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-[11px] text-slate-400">图片 {i + 1}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button title="下载" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Download className="h-3 w-3" /></button>
                            <button title="查看" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Eye className="h-3 w-3" /></button>
                            <button
                              title="复制提示词"
                              onClick={() => handleCopy(prompt)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              {copied === prompt ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setGenerated(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">重新生成</button>
                    <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">保存到云盘</button>
                    <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">继续编辑</button>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">最近生成</label>
              {MOCK_HISTORY.map((item) => (
                <div key={item.id} className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">{item.prompt}</p>
                    <p className="text-[11px] text-slate-400">{item.model} · {item.time}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="rounded p-1 text-slate-400 hover:text-slate-600"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="rounded p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
