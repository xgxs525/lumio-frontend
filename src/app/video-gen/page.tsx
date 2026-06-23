"use client";

import { useState } from "react";
import { ArrowRight, Check, Clapperboard, Copy, Film, History, Loader2, Pencil, Play, Trash2, Upload, Wand2 } from "lucide-react";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────
type VideoType = "短视频口播" | "产品介绍" | "教程视频" | "品牌宣传" | "图文视频" | "剧情分镜" | "广告脚本";
type Duration = "15 秒" | "30 秒" | "60 秒" | "3 分钟";
type Aspect = "9:16" | "16:9" | "1:1";
type OutputType = "视频脚本" | "分镜脚本" | "画面提示词" | "标题文案" | "口播文案" | "配音文案" | "镜头描述";
type VideoStyle = "简洁专业" | "科技感" | "情绪化" | "商业宣传" | "口语自然" | "高级冷淡" | "短视频爆款";
type VideoModel = "智能推荐" | "创作模型" | "长文本模型" | "视频脚本模型" | "多模态模型" | "自定义模型";

interface StoryboardFrame {
  id: string;
  duration: string;
  visual: string;
  copy: string;
  prompt: string;
}

// ─── Templates ─────────────────────────────────────────────────
const TEMPLATES = [
  { label: "产品介绍视频", prompt: "介绍一个多模型 AI 平台，30 秒，突出一个入口连接多个 AI 模型的核心价值" },
  { label: "短视频口播脚本", prompt: "写一段 60 秒的知识类口播脚本，主题是用 AI 提升工作效率" },
  { label: "小红书视频脚本", prompt: "写一个小红书风格的 AI 工具推荐视频脚本，15 秒，语气亲切" },
  { label: "抖音爆款脚本", prompt: "写一个抖音爆款视频脚本，3 分钟内，开头要有黄金 3 秒抓住注意力" },
  { label: "教程视频大纲", prompt: "写一个分步骤的教程视频大纲，教用户如何用 AI 进行文件理解" },
  { label: "品牌宣传片分镜", prompt: "写一个品牌宣传片分镜脚本，展示多模型 AI 平台的专业感和科技感" },
  { label: "AI 工具介绍视频", prompt: "写一段介绍 AI 工具的视频脚本，突出简单和高效，时长 30 秒" },
  { label: "图文视频脚本", prompt: "写一个适合制作图文视频的脚本，每段配一张图，音乐节奏配合" },
];

const VIDEO_TYPES: VideoType[] = ["短视频口播", "产品介绍", "教程视频", "品牌宣传", "图文视频", "剧情分镜", "广告脚本"];
const DURATIONS: Duration[] = ["15 秒", "30 秒", "60 秒", "3 分钟"];
const ASPECTS: Aspect[] = ["9:16", "16:9", "1:1"];
const OUTPUTS: OutputType[] = ["视频脚本", "分镜脚本", "画面提示词", "标题文案", "口播文案", "配音文案", "镜头描述"];
const VIDEO_STYLES: VideoStyle[] = ["简洁专业", "科技感", "情绪化", "商业宣传", "口语自然", "高级冷淡", "短视频爆款"];
const VIDEO_MODELS: VideoModel[] = ["智能推荐", "创作模型", "长文本模型", "视频脚本模型", "多模态模型", "自定义模型"];

const MOCK_STORYBOARD: StoryboardFrame[] = [
  { id: "1", duration: "0-3 秒", visual: "简洁的 AI 平台首页展示，白色背景，蓝光点缀", copy: "一个入口，连接多个 AI 模型", prompt: "极简科技风网页界面，白色背景，蓝色点缀，高级 SaaS 风格" },
  { id: "2", duration: "3-8 秒", visual: "用户输入任务的动画，输入框内文字快速出现", copy: "输入你的任务，序光智能推荐最合适的模型", prompt: "电脑屏幕特写，输入框内文字动效，科技感 UI" },
  { id: "3", duration: "8-12 秒", visual: "模型选择器弹出，展示多种 AI 模型名称", copy: "从 30+ 个模型版本中选择", prompt: "模型选择下拉菜单动画，清爽 UI，各模型标签排列" },
  { id: "4", duration: "12-15 秒", visual: "AI 生成结果的画面，文字和图片快速呈现", copy: "让 AI 帮你完成写作、翻译、分析和创作", prompt: "AI 生成结果展示，文字内容动效，专业界面" },
];

const MOCK_HISTORY = [
  { id: "1", title: "多模型 AI 平台 30 秒产品介绍", type: "产品介绍" as VideoType, model: "创作模型" as VideoModel, time: "今天 15:10" },
  { id: "2", title: "用 AI 提升工作效率的口播脚本", type: "短视频口播" as VideoType, model: "智能推荐" as VideoModel, time: "今天 10:30" },
  { id: "3", title: "AI 文件理解教程视频大纲", type: "教程视频" as VideoType, model: "长文本模型" as VideoModel, time: "昨天 19:22" },
];

// ─── Component ─────────────────────────────────────────────────
export default function VideoGenPage() {
  const [topic, setTopic] = useState("");
  const [videoType, setVideoType] = useState<VideoType>("产品介绍");
  const [duration, setDuration] = useState<Duration>("30 秒");
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [outputs, setOutputs] = useState<OutputType[]>(["视频脚本", "分镜脚本", "画面提示词"]);
  const [vStyle, setVStyle] = useState<VideoStyle>("科技感");
  const [model, setModel] = useState<VideoModel>("智能推荐");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const toggleOutput = (o: OutputType) => {
    setOutputs((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  };

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 3000);
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
            <p className="font-bold text-amber-800">视频创作即将上线</p>
            <p className="mt-0.5 text-sm text-amber-600">
              输入主题，生成短视频脚本、分镜、画面提示词和内容方案。当前功能正在接入中，后续将支持视频生成和多模态创作流程。
            </p>
          </div>
          <a href="/changelog" className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-900">
            了解更新 →
          </a>
        </div>

        {/* ── Header ─────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">视频创作</h1>
          <p className="mt-1 text-sm text-slate-500">
            输入主题或脚本，让 AI 帮你生成短视频脚本、分镜、画面提示词和内容方案。
          </p>
        </div>

        {/* ── Main Grid ──────────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left: Settings */}
          <div className="space-y-5">
            {/* Topic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">视频主题</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="输入你想创作的视频主题，例如：介绍一个多模型 AI 平台的 30 秒短视频"
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <Upload className="mx-auto h-4 w-4 text-slate-400" />
                <p className="mt-1 text-xs text-slate-500">上传素材（可选）</p>
                <p className="text-[11px] text-slate-400">图片 / 脚本 / 参考文件</p>
              </div>
            </div>

            {/* Video type */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">视频类型</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {VIDEO_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setVideoType(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      videoType === t ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration & Aspect */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">视频时长</label>
                <div className="mt-2 flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        duration === d ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">画面比例</label>
                <div className="mt-2 flex gap-2">
                  {ASPECTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAspect(a)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        aspect === a ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output content */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">输出内容</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {OUTPUTS.map((o) => (
                  <button
                    key={o}
                    onClick={() => toggleOutput(o)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      outputs.includes(o) ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">风格</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {VIDEO_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setVStyle(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      vStyle === s ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Model */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">模型选择</label>
              <div className="mt-2 space-y-1.5">
                {VIDEO_MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                      model === m ? "border-violet-200 bg-violet-50 text-violet-700" : "border-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${model === m ? "bg-violet-500" : "bg-slate-300"}`} />
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              disabled={!topic.trim() || generating}
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? "正在生成..." : "生成视频方案"}
            </button>
          </div>

          {/* Right: Result + Templates + History */}
          <div className="space-y-6">
            {/* Templates */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">快捷模板</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setTopic(t.prompt)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-violet-200 hover:text-violet-700"
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
                  <Film className="h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 font-bold text-slate-500">还没有视频方案</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-400">
                    输入主题，选择视频类型和时长，让序光生成脚本、分镜和画面提示词。
                  </p>
                </div>
              ) : generating ? (
                /* Generating */
                <div className="flex flex-col items-center py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  <h3 className="mt-4 font-bold text-slate-700">正在生成视频方案...</h3>
                </div>
              ) : (
                /* Storyboard */
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {topic.slice(0, 30) || "视频方案"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">{videoType} · {duration} · {aspect} · {model}</p>

                  {/* Suggested title */}
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">视频标题建议</h4>
                    <p className="mt-1 text-sm font-bold text-slate-800">一个入口，连接无限可能 — 序光多模型 AI 平台</p>
                  </div>

                  {/* Storyboard frames */}
                  <div className="mt-4 space-y-3">
                    {MOCK_STORYBOARD.map((frame, idx) => (
                      <div key={frame.id} className="rounded-xl border border-slate-200 p-4 group">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded bg-violet-100 text-[11px] font-bold text-violet-600">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">镜头 {idx + 1}</span>
                          <span className="text-[11px] text-slate-400">· {frame.duration}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400">画面</span>
                            <p className="mt-0.5 text-xs text-slate-600">{frame.visual}</p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400">文案</span>
                            <p className="mt-0.5 text-xs text-slate-600">{frame.copy}</p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400">画面提示词</span>
                            <p className="mt-0.5 text-xs text-slate-500 italic">{frame.prompt}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleCopy(frame.copy)}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                          >
                            {copied === frame.copy ? "已复制" : "复制"}
                          </button>
                          <button className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700">重新生成</button>
                          <button className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700">生成图片</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setGenerated(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">重新生成</button>
                    <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">保存脚本到文档</button>
                    <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">复制全部</button>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">最近视频任务</label>
              {MOCK_HISTORY.map((item) => (
                <div key={item.id} className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100">
                    <Film className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.type} · {item.model} · {item.time}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="rounded p-1 text-slate-400 hover:text-slate-600"><Pencil className="h-3.5 w-3.5" /></button>
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
