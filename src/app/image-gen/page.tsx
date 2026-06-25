"use client";

import { useState } from "react";
import { ArrowRight, Download, Eye, FileImage, History, ImageIcon, Loader2, Plus, Sparkles, Trash2, Upload, WandSparkles, Copy, Check } from "lucide-react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";

type Ratio = "1:1" | "4:3" | "16:9" | "9:16" | "3:4";
type Style = "真实摄影" | "极简设计" | "科技感" | "插画" | "海报" | "产品封面" | "赛博风" | "国风" | "动漫" | "手绘";
type Count = 1 | 2 | 4;

const ratios: Ratio[] = ["1:1", "4:3", "16:9", "9:16", "3:4"];
const styles: Style[] = ["真实摄影", "极简设计", "科技感", "插画", "海报", "产品封面", "赛博风", "国风", "动漫", "手绘"];
const counts: Count[] = [1, 2, 4];
const quickTemplates = [
  { prompt: "极简风格的产品海报，白色背景，银色金属质感", style: "极简设计" },
  { prompt: "赛博朋克风格的城市夜景，霓虹灯光，雨夜氛围", style: "赛博风" },
  { prompt: "国风山水画，云雾缭绕，松鹤延年", style: "国风" },
  { prompt: "现代科技感封面，蓝色渐变，数据流线条", style: "科技感" },
];

function useImageModels() {
  const [items] = useState([
    { id: "stable-diffusion", name: "Stable Diffusion XL", vendor: "Stability AI" },
    { id: "dalle-3", name: "DALL-E 3", vendor: "OpenAI" },
    { id: "midjourney", name: "Midjourney V6", vendor: "Midjourney" },
  ]);
  return { items };
}

interface HistoryItem {
  id: string;
  prompt: string;
  style: string;
  ratio: string;
  time: string;
  imageUrl?: string;
}

function mockHistory(): HistoryItem[] {
  return [
    { id: "1", prompt: "未来城市天际线，日落", style: "科技感", ratio: "16:9", time: "10 分钟前" },
    { id: "2", prompt: "咖啡厅室内设计，暖色调", style: "真实摄影", ratio: "4:3", time: "2 小时前" },
    { id: "3", prompt: "抽象几何图形，渐变色彩", style: "极简设计", ratio: "1:1", time: "昨天" },
    { id: "4", prompt: "产品渲染图，化妆品套装", style: "产品封面", ratio: "3:4", time: "昨天" },
  ];
}

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [style, setStyle] = useState<Style>("真实摄影");
  const [count, setCount] = useState<Count>(1);
  const [modelId, setModelId] = useState("stable-diffusion");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [hasRef, setHasRef] = useState(false);
  const [history] = useState<HistoryItem[]>(mockHistory());
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const { items: models } = useImageModels();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenerated(false);
    try {
      await api.createVideoTask({
        modelId: modelId || "image-gen-default",
        generationType: "image" as never,
        prompt: `${prompt}\n比例：${ratio}\n风格：${style}\n数量：${count}张`,
        negativePrompt: "",
        aspectRatio: ratio,
        duration: "1 秒",
        resolution: "1080p",
        style,
        cameraMotion: "固定",
        count: `${count} 条`,
      });
      setGenerated(true);
    } catch {
      toast.error("生成失败，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <WorkspaceShell active="创作空间" title="图像生成" subtitle="输入画面描述，选择风格、比例和模型，生成封面图、海报和视觉素材。">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab("create")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${activeTab === "create" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          创作
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${activeTab === "history" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          历史记录
        </button>
      </div>

      {activeTab === "create" ? (
      <div className="grid gap-6 xl:grid-cols-[6fr_4fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">画面描述</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="描述你想生成的画面，例如：一只坐在咖啡杯里的橘猫，阳光透过窗帘洒在桌面上，温暖治愈的日式风格"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">参考图片</h2>
            <button
              type="button"
              onClick={() => { if (!hasRef) { setHasRef(true); toast.info("已添加参考图片"); } else { setHasRef(false); } }}
              className={`flex min-h-[88px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 transition ${
                hasRef ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50/30"
              }`}
            >
              {hasRef ? <Check className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
              <span className="text-sm font-bold">{hasRef ? "已选择参考图" : "上传参考图片"}</span>
              <span className="text-[11px] text-slate-400">JPG / PNG / WebP</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">参数设置</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">比例</p>
                <div className="flex flex-wrap gap-1.5">
                  {ratios.map((r) => (
                    <button key={r} onClick={() => setRatio(r)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${ratio === r ? "border-blue-400 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">风格</p>
                <div className="flex flex-wrap gap-1.5">
                  {styles.map((s) => (
                    <button key={s} onClick={() => setStyle(s)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${style === s ? "border-blue-400 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">数量</p>
                <div className="flex flex-wrap gap-1.5">
                  {counts.map((c) => (
                    <button key={c} onClick={() => setCount(c)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${count === c ? "border-blue-400 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{c} 张</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">模型</p>
                <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                  {models.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "生成中..." : generated ? "重新生成" : "开始生成"}
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">快速模板</h2>
            <div className="space-y-2">
              {quickTemplates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(t.prompt); setStyle(t.style as Style); }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-2">{t.prompt}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{t.style}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">生成结果</h2>
            {generating ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-3 text-sm font-semibold text-slate-700">正在生成...</p>
                <p className="mt-1 text-xs text-slate-400">AI 正在为你创作图像</p>
              </div>
            ) : generated ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold text-slate-400">图像 {i + 1}</span>
                    <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-xl bg-slate-950/0 opacity-0 transition group-hover:bg-slate-950/30 group-hover:opacity-100">
                      <button className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-600"><Eye className="h-3.5 w-3.5" /></button>
                      <button className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-600"><Download className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <FileImage className="h-8 w-8 text-slate-200" />
                <p className="mt-3 text-sm text-slate-400">输入描述后点击生成</p>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{item.prompt}</p>
              <div className="mt-1 flex gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{item.style}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{item.ratio}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{item.time}</span>
              <button
                className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                onClick={() => {
                  setPrompt(item.prompt); setStyle(item.style as Style);
                  if (item.ratio) setRatio(item.ratio as Ratio);
                  setActiveTab("create");
                }}
                title="查看详情"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                onClick={() => toast.info("下载功能即将上线")}
                title="下载"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </WorkspaceShell>
  );
}
