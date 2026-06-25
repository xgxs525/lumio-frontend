"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  Clapperboard,
  Copy,
  Download,
  Eye,
  FileVideo,
  Film,
  FolderDown,
  History,
  ImageIcon,
  Layers3,
  Loader2,
  Maximize2,
  MessageSquareText,
  Pause,
  Play,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";

import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  aspectRatios,
  cameraMotions,
  durations,
  type FilterKey,
  generationCounts,
  generationModeCopy,
  referenceStrengths,
  resolutions,
  storyboardCounts,
  storyboardPaces,
  videoFilters,
  videoStyles,
  type GenerationType,
  type ModelStatus,
  type TaskStatus,
  type VideoGenerationTask,
  type VideoModel,
} from "@/lib/video-data";

const generationModeIcons: Record<GenerationType, LucideIcon> = {
  text: MessageSquareText,
  image: ImageIcon,
  video: FileVideo,
  storyboard: Layers3,
};

const generationModeCompactCopy: Record<GenerationType, { label: string; desc: string }> = {
  text: { label: "文生视频", desc: "提示词生成镜头" },
  image: { label: "图生视频", desc: "上传参考图片" },
  video: { label: "视频参考", desc: "基于素材续写" },
  storyboard: { label: "分镜生成", desc: "脚本拆成镜头" },
};

const modelStatusLabel: Record<ModelStatus, string> = {
  available: "可用",
  coming: "即将上线",
  maintenance: "维护中",
};

const taskStatusLabel: Record<TaskStatus, string> = {
  generating: "生成中",
  success: "生成成功",
  failed: "生成失败",
  saved: "已保存",
};

const taskStatusTone: Record<TaskStatus, string> = {
  generating: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  saved: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const thumbnailToneClass: Record<VideoGenerationTask["thumbnailTone"], string> = {
  blue: "from-slate-950 via-blue-900 to-cyan-500",
  cyan: "from-slate-950 via-cyan-800 to-blue-400",
  violet: "from-slate-950 via-violet-900 to-fuchsia-500",
  emerald: "from-slate-950 via-emerald-900 to-lime-400",
  rose: "from-slate-950 via-rose-900 to-orange-400",
};

const MODELS_PER_PAGE = 12;

function useVideoModels() {
  const [models, setModels] = useState<VideoModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listVideoModels()
      .then((response) => {
        if (!active) return;
        setModels(response.data.items as VideoModel[]);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "视频模型加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { models, loading, error };
}

function useRecentVideoTasks(limit = 3) {
  const [tasks, setTasks] = useState<VideoGenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.recentVideoTasks(limit);
      setTasks(response.data as VideoGenerationTask[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "最近记录加载失败");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { tasks, loading, error, refresh: load };
}

function findVideoModel(models: VideoModel[], modelId: string | undefined | null) {
  if (!models.length) return null;
  return models.find((model) => model.id === modelId) || models.find((model) => model.status === "available") || models[0];
}

function getRecommendedModels(models: VideoModel[]) {
  const recommended = models.filter((model) => model.isRecommended && model.status === "available");
  return (recommended.length ? recommended : models.filter((model) => model.status === "available")).slice(0, 5);
}

function supportsGenerationType(model: VideoModel | null | undefined, type: GenerationType) {
  return Boolean(model?.supportedGenerationTypes.includes(type));
}

function recommendModels(models: VideoModel[], prompt: string) {
  const available = models.filter((model) => model.status === "available");
  const text = prompt.toLowerCase();
  const byFilter = (filters: FilterKey[]) =>
    available.filter((model) => filters.some((filter) => model.filters.includes(filter))).map((model) => model.id);
  if (/口播|中文|短视频|剧情|社媒|抖音|小红书/.test(text)) {
    return byFilter(["chinese", "people"]).slice(0, 3);
  }
  if (/电影|广告|商业|品牌|产品|质感|大片/.test(text)) {
    return byFilter(["commercial", "global"]).slice(0, 3);
  }
  if (/开源|部署|研究|实验|自部署/.test(text)) {
    return byFilter(["open"]).slice(0, 3);
  }
  return getRecommendedModels(available).map((model) => model.id).slice(0, 3);
}

function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-xl shadow-slate-300/40">
      <span className="inline-flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-500" />
        {message}
      </span>
      <button type="button" onClick={onClose} className="ml-3 text-slate-400 hover:text-slate-700" aria-label="关闭提示">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function showStatusPill(status: TaskStatus) {
  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold", taskStatusTone[status])}>
      {taskStatusLabel[status]}
    </span>
  );
}

function ModelStatusPill({ status }: { status: ModelStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-bold",
        status === "available" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "coming" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "maintenance" && "border-slate-200 bg-slate-100 text-slate-500",
      )}
    >
      {modelStatusLabel[status]}
    </span>
  );
}

function VideoThumbnail({
  task,
  className,
  large = false,
}: {
  task: VideoGenerationTask;
  className?: string;
  large?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br", thumbnailToneClass[task.thumbnailTone], className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_26%),radial-gradient(circle_at_78%_70%,rgba(255,255,255,0.18),transparent_24%)]" />
      <div className="absolute inset-x-4 top-4 h-px bg-white/30" />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 text-white">
        <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
          {task.aspectRatio} · {task.duration}
        </span>
        <Film className={cn("drop-shadow", large ? "h-6 w-6" : "h-4 w-4")} />
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  href,
  disabled,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "danger";
}) {
  const className = cn(
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition",
    tone === "primary"
      ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
      : tone === "danger"
        ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    disabled && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-400",
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ModelDetailModal({
  model,
  onClose,
  onSelect,
}: {
  model: VideoModel | null;
  onClose: () => void;
  onSelect?: (model: VideoModel) => void;
}) {
  if (!model) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8">
      <button type="button" className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} aria-label="关闭模型详情" />
      <section className="relative max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-2xl shadow-slate-400/40">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-950">{model.displayName}</h2>
              <ModelStatusPill status={model.status} />
              {model.isRecommended ? (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  推荐
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{model.description}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(86vh-150px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard label="平台" value={model.provider} />
            <InfoCard label="版本" value={model.version} />
            <InfoCard label="状态" value={modelStatusLabel[model.status]} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 items-stretch">
            <DetailBlock title="支持能力" items={model.supportedGenerationTypes.map((item) => generationModeCopy[item].label)} />
            <DetailBlock title="适合场景" items={model.useCases} />
            <DetailBlock title="输入类型" items={model.inputTypes} />
            <DetailBlock title="输出类型" items={model.outputTypes} />
            <DetailBlock
              title="支持参数"
              items={[
                `比例：${model.supportedAspectRatios.join("、")}`,
                `时长：${model.supportedDurations.join("、")}`,
                `清晰度：${model.supportedResolutions.join("、")}`,
                `生成数量：最多 ${model.maxGenerationCount} 条`,
                `参考强度：${model.supportedReferenceStrengths.join("、") || "暂不支持"}`,
              ]}
              wide
            />
            <DetailBlock title="限制说明" items={model.parameterLimits} wide />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
              <p className="text-xs font-bold text-slate-400">模型说明</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {model.displayName} 当前用于序光视频创作链路中的模型选择、参数校验和结果预览。不同模型会根据能力禁用不支持的比例、时长、清晰度、风格和镜头运动。
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
            关闭
          </button>
          <button
            type="button"
            onClick={() => onSelect?.(model)}
            disabled={model.status !== "available"}
            className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            选择模型
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function DetailBlock({ title, items, wide }: { title: string; items: string[]; wide?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4", wide && "lg:col-span-2")}>
      <p className="text-xs font-bold text-slate-400">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ModelCard({
  model,
  onDetail,
  onSelect,
  selected,
}: {
  model: VideoModel;
  onDetail: (model: VideoModel) => void;
  onSelect?: (model: VideoModel) => void;
  selected?: boolean;
}) {
  const available = model.status === "available";
  return (
    <article
      className={cn(
        "flex min-h-[170px] flex-col rounded-[14px] border bg-white p-3.5 shadow-sm transition",
        selected ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-200 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{model.displayName}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">平台：{model.provider}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {model.isRecommended ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">推荐</span>
          ) : null}
          <ModelStatusPill status={model.status} />
        </div>
      </div>

      <p className="mt-1.5 line-clamp-2 min-h-[30px] text-xs leading-5 text-slate-500">{model.description}</p>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {model.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-2 grid gap-1 text-xs text-slate-500">
        <p className="truncate">
          <span className="font-semibold text-slate-700">输入：</span>
          {model.inputTypes.join("、")}
        </p>
        <p className="truncate">
          <span className="font-semibold text-slate-700">输出：</span>
          {model.outputTypes.join("、")}
        </p>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        {available ? (
          <button
            type="button"
            onClick={() => onSelect?.(model)}
            className={cn(
              "h-8 rounded-lg text-xs font-bold transition",
              selected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-700",
            )}
          >
            {selected ? "已选择" : "选择模型"}
          </button>
        ) : (
          <button type="button" disabled className="h-8 cursor-not-allowed rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
            等待接入
          </button>
        )}
        <button
          type="button"
          onClick={() => onDetail(model)}
          className="h-8 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          查看详情
        </button>
      </div>
    </article>
  );
}

export function VideoHomePage() {
  const { models, loading: modelsLoading, error: modelsError } = useVideoModels();
  const { tasks: recentTasks, refresh: refreshRecent } = useRecentVideoTasks(3);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [modelQuery, setModelQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [homeMode, setHomeMode] = useState<GenerationType>("text");
  const [homePrompt, setHomePrompt] = useState("");
  const [homeStatus, setHomeStatus] = useState<"idle" | "generating" | "success" | "failed">("idle");
  const [homeProgress, setHomeProgress] = useState(0);
  const [homeTask, setHomeTask] = useState<VideoGenerationTask | null>(null);
  const [detailModel, setDetailModel] = useState<VideoModel | null>(null);
  const modelSectionRef = useRef<HTMLElement>(null);
  const createSectionRef = useRef<HTMLElement>(null);

  const filteredModels = useMemo(() => {
    const normalized = modelQuery.trim().toLowerCase();
    return models.filter((model) => {
      const filterMatch = activeFilter === "all" || model.filters.includes(activeFilter);
      const queryMatch = !normalized || `${model.displayName} ${model.provider} ${model.tags.join(" ")}`.toLowerCase().includes(normalized);
      return filterMatch && queryMatch;
    });
  }, [activeFilter, modelQuery, models]);

  const selectedModel = findVideoModel(models, selectedModelId);
  const totalPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageModels = filteredModels.slice((safeCurrentPage - 1) * MODELS_PER_PAGE, safeCurrentPage * MODELS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, modelQuery]);

  useEffect(() => {
    if (!models.length || selectedModelId) return;
    setSelectedModelId(getRecommendedModels(models)[0]?.id || models[0].id);
  }, [models, selectedModelId]);

  function selectModel(model: VideoModel) {
    if (model.status !== "available") return;
    setSelectedModelId(model.id);
    window.setTimeout(() => createSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function goToPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages || 1);
    setCurrentPage(nextPage);
    window.setTimeout(() => modelSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function chooseMode(mode: GenerationType) {
    setHomeMode(mode);
    window.setTimeout(() => createSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  async function generateHomeVideo() {
    if (!homePrompt.trim() || homeStatus === "generating" || !selectedModel) return;
    setHomeStatus("generating");
    setHomeProgress(18);
    setHomeTask(null);
    try {
      const response = await api.createVideoTask({
        modelId: selectedModel.id,
        generationType: homeMode,
        prompt: homePrompt,
        negativePrompt: "",
        aspectRatio: selectedModel.supportedAspectRatios[0],
        duration: selectedModel.supportedDurations[0],
        resolution: selectedModel.supportedResolutions[0],
        style: selectedModel.supportedStyles[0],
        cameraMotion: selectedModel.supportedCameraMotions[0],
        count: "1 条",
      });
      const task = response.data as VideoGenerationTask;
      setHomeTask(task);
      setHomeProgress(task.progress || 100);
      setHomeStatus(task.status === "failed" ? "failed" : "success");
      void refreshRecent();
    } catch {
      setHomeProgress(42);
      setHomeStatus("failed");
    }
  }

  return (
    <WorkspaceShell active="创作空间" title="">
      <div className="space-y-5 py-5">
        <section className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Clapperboard className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-slate-950">视频创作</h1>
                <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
                  选择视频模型，输入提示词或上传参考图，生成短视频、分镜画面和动态视觉内容。
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
              <Link href={selectedModelId ? `/video/create?model=${selectedModelId}` : "/video/create"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
              <Sparkles className="h-4 w-4" />
              新建视频
            </Link>
            <Link href="/video/history" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <History className="h-4 w-4" />
              历史记录
            </Link>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {[
            { label: "文生视频", mode: "text" as GenerationType, icon: MessageSquareText, desc: "提示词生成镜头画面" },
            { label: "图生视频", mode: "image" as GenerationType, icon: ImageIcon, desc: "参考图生成动态内容" },
            { label: "分镜生成", mode: "storyboard" as GenerationType, icon: Layers3, desc: "脚本拆成镜头段落" },
            { label: "视频续写", mode: "video" as GenerationType, icon: Film, desc: "已有素材延展故事" },
          ].map((item) => (
            <button key={item.label} type="button" onClick={() => chooseMode(item.mode)} className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-white group-hover:text-blue-600">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-900">{item.label}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{item.desc}</span>
              </span>
            </button>
          ))}
        </section>

        <section ref={modelSectionRef} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">选择视频模型</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={modelQuery}
                  onChange={(event) => setModelQuery(event.target.value)}
                  placeholder="搜索模型"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 sm:w-56"
                />
              </div>
              <Link href="/models" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                模型广场
              </Link>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {videoFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-bold transition",
                  activeFilter === filter.key
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-[732px]">
            <div className="grid gap-3 lg:grid-cols-3 items-stretch">
              {pageModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  selected={model.id === selectedModelId}
                  onDetail={setDetailModel}
                  onSelect={selectModel}
                />
              ))}
            </div>

            {!pageModels.length ? (
              <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <div>
                  <Search className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-500">
                    {modelsLoading ? "正在从数据库加载视频模型" : modelsError || "没有匹配的视频模型"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={cn(
                    "h-8 w-8 rounded-lg border text-xs font-bold transition",
                    page === safeCurrentPage
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
              >
                下一页
              </button>
            </div>
          ) : null}
        </section>

        <section ref={createSectionRef} id="home-create-input" className="grid scroll-mt-24 gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[15px] font-black leading-6 text-slate-950">创作输入区</h2>
                <p className="mt-1 text-sm text-slate-500">
                  当前模型：<span className="font-bold text-slate-800">{selectedModel?.displayName || "正在加载模型"}</span>
                  <span className="ml-2 text-slate-400">适合：{selectedModel?.useCases.slice(0, 3).join("、") || "-"}</span>
                </p>
              </div>
              <Link href={selectedModelId ? `/video/create?model=${selectedModelId}` : "/video/create"} className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700">
                进入完整新建页
              </Link>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(generationModeCopy) as GenerationType[]).map((mode) => {
                const Icon = generationModeIcons[mode];
                const disabled = !selectedModel || !supportsGenerationType(selectedModel, mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => !disabled && setHomeMode(mode)}
                    disabled={disabled}
                    title={disabled ? "当前模型不支持该生成方式" : undefined}
                    className={cn(
                      "flex min-h-[74px] items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition",
                      homeMode === mode ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      disabled && "cursor-not-allowed bg-slate-100 text-slate-300 hover:bg-slate-100",
                    )}
                  >
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", homeMode === mode ? "bg-blue-100" : "bg-slate-100")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block whitespace-nowrap text-[13px] font-black leading-5">{generationModeCompactCopy[mode].label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{generationModeCompactCopy[mode].desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <textarea
              value={homePrompt}
              onChange={(event) => setHomePrompt(event.target.value)}
              placeholder={homeMode === "storyboard" ? "输入故事主题或脚本，序光会拆成分镜画面。" : "描述画面、动作和镜头，例如：电影感广告片，产品从清晨光线里被缓慢推近。"}
              rows={5}
              className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-500">
                比例 {selectedModel?.supportedAspectRatios[0] || "-"} · 时长 {selectedModel?.supportedDurations[0] || "-"} · 清晰度 {selectedModel?.supportedResolutions[0] || "-"}
              </p>
              <button
                type="button"
                onClick={generateHomeVideo}
                disabled={!homePrompt.trim() || homeStatus === "generating"}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {homeStatus === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {homeStatus === "generating" ? "生成中..." : homeStatus === "failed" ? "重新生成" : "生成视频"}
              </button>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-950">生成结果区</h2>
              <div className="mt-4">
                {homeStatus === "idle" ? (
                  <WaitingResult onGenerate={generateHomeVideo} disabled={!homePrompt.trim()} />
                ) : homeStatus === "generating" ? (
                  <GeneratingState progress={homeProgress} />
                ) : homeStatus === "failed" ? (
                  <FailedState reason="模型繁忙" onRetry={generateHomeVideo} onEdit={() => createSectionRef.current?.scrollIntoView({ behavior: "smooth" })} onSwitch={() => modelSectionRef.current?.scrollIntoView({ behavior: "smooth" })} />
                ) : (
                  <VideoPreviewPlayer
                    task={{
                      aspectRatio: homeTask?.aspectRatio || selectedModel?.supportedAspectRatios[0] || "16:9",
                      duration: homeTask?.duration || selectedModel?.supportedDurations[0] || "10 秒",
                      resolution: homeTask?.resolution || selectedModel?.supportedResolutions[0] || "1080p",
                      thumbnailTone: homeTask?.thumbnailTone || "blue",
                      modelName: homeTask?.modelName || selectedModel?.displayName || "视频模型",
                    }}
                    prompt={homePrompt}
                    detailHref={homeTask ? `/video/tasks/${homeTask.id}` : undefined}
                  />
                )}
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-950">最近记录</h2>
                <Link href="/video/history" className="text-xs font-bold text-blue-600 hover:text-blue-700">查看全部</Link>
              </div>
              <div className="mt-3 space-y-3">
                {recentTasks.map((task) => (
                  <RecentTaskCard key={task.id} task={task} />
                ))}
                {!recentTasks.length ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-bold text-slate-400">
                    还没有生成记录
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </div>

      <ModelDetailModal
        model={detailModel}
        onClose={() => setDetailModel(null)}
        onSelect={(model) => {
          setDetailModel(null);
          selectModel(model);
        }}
      />
    </WorkspaceShell>
  );
}

function UploadCard({
  type,
  label,
  selected,
  onPick,
}: {
  type: "image" | "video" | "material";
  label: string;
  selected?: boolean;
  onPick?: () => void;
}) {
  const Icon = type === "image" ? ImageIcon : type === "video" ? FileVideo : Upload;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!onPick}
      className={cn(
        "flex min-h-[88px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 transition",
        selected
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : onPick
            ? "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50/30"
            : "border-slate-200 bg-slate-50 text-slate-400 cursor-default",
      )}
    >
      {selected ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
      <span className="text-sm font-bold">{selected ? "已选择" : label}</span>
      <span className="text-[11px] text-slate-400">
        {type === "video" ? "MP4 / MOV / WebM" : type === "image" ? "JPG / PNG / WebP" : "图片 / 视频 / 脚本文件"}
      </span>
    </button>
  );
}

type ParameterOptionState = "available" | "disabled" | "coming";

function OptionGroup({
  title,
  options,
  value,
  getStatus,
  onChange,
}: {
  title: string;
  options: readonly string[];
  value: string;
  getStatus: (option: string) => { state: ParameterOptionState; reason?: string };
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-20 shrink-0 text-sm font-black text-slate-800">{title}</span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {options.map((option) => {
            const status = getStatus(option);
            const disabled = status.state !== "available";
            return (
              <button
                key={option}
                type="button"
                onClick={() => !disabled && onChange(option)}
                disabled={disabled}
                title={status.reason}
                className={cn(
                  "min-h-8 rounded-full border px-3 text-xs font-bold transition",
                  value === option && status.state === "available"
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50",
                  status.state === "disabled" && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 hover:border-slate-200 hover:bg-slate-100",
                  status.state === "coming" && "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
                )}
              >
                {option}
                {status.state === "coming" ? <span className="ml-1 text-[10px]">即将支持</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getCountValue(option: string) {
  return Number(option.replace(/[^\d]/g, "")) || 1;
}

function optionState(
  option: string,
  supported: readonly string[] | undefined,
  pending: readonly string[] | undefined,
  disabledReason: string,
) {
  if (supported?.includes(option)) {
    return { state: "available" as const };
  }
  if (pending?.includes(option)) {
    return { state: "coming" as const, reason: "该参数正在接入，即将支持" };
  }
  return { state: "disabled" as const, reason: disabledReason };
}

function countOptionState(option: string, model: VideoModel) {
  if (getCountValue(option) <= model.maxGenerationCount) {
    return { state: "available" as const };
  }
  if (model.pendingParameters?.generationCounts?.includes(option as never)) {
    return { state: "coming" as const, reason: "更高生成数量正在接入" };
  }
  return { state: "disabled" as const, reason: `当前模型单次最多生成 ${model.maxGenerationCount} 条` };
}

function VideoPreviewPlayer({
  task,
  prompt,
  onCopy,
  onRegenerate,
  onSave,
  detailHref,
}: {
  task: Pick<VideoGenerationTask, "aspectRatio" | "duration" | "resolution" | "thumbnailTone" | "modelName">;
  prompt: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onSave?: () => void;
  detailHref?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  async function enterFullScreen() {
    await frameRef.current?.requestFullscreen?.();
  }

  return (
    <article className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
      <div ref={frameRef} className={cn("relative aspect-video overflow-hidden bg-gradient-to-br", thumbnailToneClass[task.thumbnailTone])}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.3),transparent_25%),linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.16)_46%,transparent_52%)]" />
        {playing ? (
          <div className="absolute inset-0">
            <div className="absolute left-8 top-8 h-20 w-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-10 right-8 h-24 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-white/40" />
            <div className="absolute inset-0 animate-pulse bg-white/5" />
          </div>
        ) : null}

        {!playing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-slate-950 shadow-lg backdrop-blur hover:bg-white"
              aria-label="播放视频"
            >
              <Play className="h-7 w-7 fill-current" />
            </button>
            <p className="mt-4 max-w-xs text-sm font-bold drop-shadow">默认显示视频封面，点击后进入预览播放状态</p>
          </div>
        ) : null}

        {loadError ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/75 px-6 text-center text-white">
            <div>
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-300" />
              <p className="mt-3 text-sm font-bold">视频加载失败</p>
              <p className="mt-1 text-xs text-white/70">请稍后重试或下载原文件查看。</p>
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-2 py-1 text-white backdrop-blur">
            <button type="button" onClick={() => setPlaying((value) => !value)} title={playing ? "暂停" : "播放"} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15">
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            </button>
            <button type="button" onClick={() => setMuted((value) => !value)} title={muted ? "开启声音" : "静音"} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15">
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={enterFullScreen} title="全屏" className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {task.duration} · {task.aspectRatio} · {task.resolution}
          </span>
        </div>

        <video className="hidden" onError={() => setLoadError(true)} />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">{task.modelName}</p>
            <p className="mt-1 text-xs text-slate-500">视频封面与播放器控件已就绪</p>
          </div>
          {showStatusPill("success")}
        </div>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{prompt || "未填写提示词"}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {detailHref ? <ActionButton icon={Eye} label="查看详情" href={detailHref} /> : null}
          <ActionButton icon={Download} label="下载" />
          <ActionButton icon={FolderDown} label="保存到云盘" onClick={onSave} />
          <ActionButton icon={RefreshCw} label="重新生成" onClick={onRegenerate} />
          <ActionButton icon={Copy} label="复制提示词" onClick={onCopy} />
        </div>
      </div>
    </article>
  );
}

function WaitingResult({ onGenerate, disabled }: { onGenerate: () => void; disabled?: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
        <Clapperboard className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-black text-slate-800">等待生成视频</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        输入提示词并设置参数后，点击下方生成按钮。
      </p>
    </div>
  );
}

function EmptyResult({ onPick }: { onPick: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
        <Play className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-black text-slate-800">开始创建你的第一个 AI 视频</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        选择一个视频模型，输入提示词或上传参考图，序光会帮你生成视频内容。
      </p>
      <button type="button" onClick={onPick} className="mt-4 h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
        选择推荐模型
      </button>
    </div>
  );
}

function GeneratingState({
  progress,
  onCancel,
}: {
  progress: number;
  onCancel?: () => void;
}) {
  const step = progress < 25 ? "排队中" : progress < 70 ? "生成中" : progress < 100 ? "处理中" : "完成";
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900">视频生成中</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">序光正在调用视频模型生成内容，可能需要几分钟。</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <span>{step} · 预计还需要 2 分钟</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {["排队中", "生成中", "处理中", "完成"].map((item, index) => {
          const activeIndex = progress < 25 ? 0 : progress < 70 ? 1 : progress < 100 ? 2 : 3;
          return (
            <span
              key={item}
              className={cn(
                "rounded-lg border px-2 py-1 text-center text-[11px] font-bold",
                index <= activeIndex ? "border-blue-200 bg-white text-blue-700" : "border-transparent bg-white/50 text-slate-400",
              )}
            >
              {item}
            </span>
          );
        })}
      </div>
      {onCancel ? (
        <button type="button" onClick={onCancel} className="mt-4 h-9 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-50">
          取消生成
        </button>
      ) : null}
    </div>
  );
}

function FailedState({
  reason = "模型繁忙",
  onRetry,
  onEdit,
  onSwitch,
}: {
  reason?: string;
  onRetry?: () => void;
  onEdit?: () => void;
  onSwitch?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-black text-rose-700">视频生成失败</h3>
          <p className="mt-2 text-sm leading-6 text-rose-600">
            可能是提示词过于复杂、模型繁忙或素材格式不支持。
          </p>
          <p className="mt-2 inline-flex rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-700">
            失败原因：{reason}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onRetry} className="h-9 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700">
          重新生成
        </button>
        <button type="button" onClick={onEdit} className="h-9 rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 hover:bg-rose-50">
          修改提示词
        </button>
        <button type="button" onClick={onSwitch} className="h-9 rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 hover:bg-rose-50">
          切换模型
        </button>
      </div>
    </div>
  );
}

function RecentTaskCard({ task }: { task: VideoGenerationTask }) {
  return (
    <Link href={`/video/tasks/${task.id}`} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
      <VideoThumbnail task={task} className="h-14 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-black text-slate-800">{task.modelName}</p>
          {showStatusPill(task.status)}
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{task.promptSummary}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-400">
          {task.createdAtLabel} · {task.aspectRatio}
        </p>
      </div>
    </Link>
  );
}

function ModelPickerModal({
  models: allModels,
  selectedModelId,
  onClose,
  onSelect,
  onDetail,
  recommendedOnly = false,
}: {
  models: VideoModel[];
  selectedModelId: string;
  onClose: () => void;
  onSelect: (model: VideoModel) => void;
  onDetail: (model: VideoModel) => void;
  recommendedOnly?: boolean;
}) {
  const models = recommendedOnly ? getRecommendedModels(allModels) : allModels;
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4 py-8">
      <button type="button" className="absolute inset-0 bg-slate-950/25 backdrop-blur-sm" onClick={onClose} aria-label="关闭模型选择" />
      <section className="relative flex max-h-[86vh] w-full max-w-4xl flex-col rounded-[20px] border border-slate-200 bg-white shadow-2xl shadow-slate-400/40">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">{recommendedOnly ? "选择推荐模型" : "切换视频模型"}</h2>
            <p className="mt-1 text-sm text-slate-500">选择后会同步刷新可用参数，不支持的参数会自动置灰。</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              selected={model.id === selectedModelId}
              onDetail={onDetail}
              onSelect={(item) => {
                onSelect(item);
                onClose();
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export function VideoCreatePage({ initialModelId }: { initialModelId?: string }) {
  const { models, loading: modelsLoading, error: modelsError } = useVideoModels();
  const { tasks: recentTasks, refresh: refreshRecent } = useRecentVideoTasks(3);
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || "");
  const [generationType, setGenerationType] = useState<GenerationType>("text");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [storyTheme, setStoryTheme] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("10 秒");
  const [resolution, setResolution] = useState("1080p");
  const [style, setStyle] = useState("电影感");
  const [cameraMotion, setCameraMotion] = useState("推近");
  const [count, setCount] = useState("1 条");
  const [storyboardCount, setStoryboardCount] = useState("5 镜");
  const [storyboardPace, setStoryboardPace] = useState("标准");
  const [referenceStrength, setReferenceStrength] = useState("中");
  const [hasImageReference, setHasImageReference] = useState(false);
  const [hasVideoReference, setHasVideoReference] = useState(false);
  const [taskStatus, setTaskStatus] = useState<"idle" | "generating" | "success" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [generatedTask, setGeneratedTask] = useState<VideoGenerationTask | null>(null);
  const [detailModel, setDetailModel] = useState<VideoModel | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelPickerMode, setModelPickerMode] = useState<"all" | "recommended">("all");
  const [toast, setToast] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  const selectedModel = selectedModelId ? findVideoModel(models, selectedModelId) : null;
  const modelForControls = selectedModel || getRecommendedModels(models)[0] || null;
  const activePrompt = generationType === "storyboard" ? storyTheme : prompt;
  const hasRequiredMaterial = generationType === "image" ? hasImageReference : generationType === "video" ? hasVideoReference : true;
  const hasCreativeContent = activePrompt.trim().length > 0 && hasRequiredMaterial;
  const canGenerate = selectedModel !== null && hasCreativeContent && selectedModel.status === "available" && supportsGenerationType(selectedModel, generationType);
  const recommendedModelIds = useMemo(() => recommendModels(models, activePrompt), [activePrompt, models]);

  useEffect(() => {
    if (!models.length) return;
    if (selectedModelId && models.some((model) => model.id === selectedModelId)) return;
    setSelectedModelId(getRecommendedModels(models)[0]?.id || models[0].id);
  }, [models, selectedModelId]);

  useEffect(() => {
    if (!selectedModel) return;
    if (!supportsGenerationType(selectedModel, generationType)) {
      setGenerationType(selectedModel.supportedGenerationTypes[0]);
    }
    if (!selectedModel.supportedAspectRatios.includes(aspectRatio as never)) setAspectRatio(selectedModel.supportedAspectRatios[0]);
    if (!selectedModel.supportedDurations.includes(duration as never)) setDuration(selectedModel.supportedDurations[0]);
    if (!selectedModel.supportedResolutions.includes(resolution as never)) setResolution(selectedModel.supportedResolutions[0]);
    if (!selectedModel.supportedStyles.includes(style as never)) setStyle(selectedModel.supportedStyles[0]);
    if (!selectedModel.supportedCameraMotions.includes(cameraMotion as never)) setCameraMotion(selectedModel.supportedCameraMotions[0]);
    if (!selectedModel.supportedReferenceStrengths.includes(referenceStrength as never)) setReferenceStrength(selectedModel.supportedReferenceStrengths[0] || "低");
    if (getCountValue(count) > selectedModel.maxGenerationCount) setCount(`${selectedModel.maxGenerationCount} 条`);
  }, [aspectRatio, cameraMotion, count, duration, generationType, referenceStrength, resolution, selectedModel, style]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function pushToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function handleGenerate() {
    if (!selectedModel || !canGenerate || taskStatus === "generating") return;
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setTaskStatus("generating");
    setProgress(12);
    setGeneratedTask(null);

    [32, 58, 84].forEach((value, index) => {
      const timer = window.setTimeout(() => setProgress(value), 700 * (index + 1));
      timersRef.current.push(timer);
    });

    try {
      const response = await api.createVideoTask({
        modelId: selectedModel.id,
        generationType,
        prompt: activePrompt,
        negativePrompt,
        actionDescription,
        storyboardText: generationType === "storyboard" ? storyTheme : "",
        inputImageUrl: hasImageReference ? "local-reference-image" : undefined,
        inputVideoUrl: hasVideoReference ? "local-reference-video" : undefined,
        aspectRatio,
        duration,
        resolution,
        style,
        cameraMotion,
        referenceStrength,
        count,
      });
      const task = response.data as VideoGenerationTask;
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
      setGeneratedTask(task);
      setProgress(task.progress || 100);
      setTaskStatus(task.status === "failed" ? "failed" : "success");
      void refreshRecent();
    } catch {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
      setProgress(42);
      setTaskStatus("failed");
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(activePrompt || "电影感广告片，产品从清晨光线里被缓慢推近。");
    pushToast("提示词已复制");
  }

  async function saveToDrive() {
    if (generatedTask?.id) {
      try {
        const response = await api.saveVideoTask(generatedTask.id);
        setGeneratedTask(response.data as VideoGenerationTask);
        void refreshRecent();
      } catch {
        pushToast("保存失败，请稍后重试");
        return;
      }
    }
    pushToast("已保存到云盘");
  }

  function cancelGenerate() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setProgress(0);
    setTaskStatus("idle");
  }

  function selectModel(model: VideoModel) {
    if (model.status !== "available") return;
    setSelectedModelId(model.id);
  }

  function openAllModels() {
    setModelPickerMode("all");
    setModelPickerOpen(true);
  }

  function openRecommendedModels() {
    setModelPickerMode("recommended");
    setModelPickerOpen(true);
  }

  function generateButtonLabel() {
    if (taskStatus === "generating") return "生成中...";
    if (taskStatus === "failed") return "重新生成";
    if (!selectedModel) return "请先选择模型";
    if (!hasCreativeContent) return "请完善创作内容";
    return generationType === "storyboard" ? "生成分镜" : "生成视频";
  }

  const previewTask: Pick<VideoGenerationTask, "aspectRatio" | "duration" | "resolution" | "thumbnailTone" | "modelName"> = generatedTask || {
    aspectRatio: aspectRatio as VideoGenerationTask["aspectRatio"],
    duration: duration as VideoGenerationTask["duration"],
    resolution: resolution as VideoGenerationTask["resolution"],
    thumbnailTone: "blue",
    modelName: selectedModel?.displayName || "请选择视频模型",
  };

  return (
    <WorkspaceShell active="创作空间" title="">
      <div className="space-y-6 py-6">
        <section className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/video" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-950">新建视频</h1>
              <p className="mt-1 text-sm text-slate-500">
                当前模型：<span className="font-bold text-slate-800">{selectedModel ? selectedModel.displayName : "请选择视频模型"}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={selectedModel ? openAllModels : openRecommendedModels} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
            <Sparkles className="h-4 w-4" />
            {selectedModel ? "切换模型" : "选择推荐模型"}
          </button>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div id="create-input" className="space-y-6">
            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-950">创作输入区</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {selectedModel ? selectedModel.description : "先选择一个视频模型，序光会根据模型能力自动适配可用参数。"}
                  </p>
                </div>
                {selectedModel ? <ModelStatusPill status={selectedModel.status} /> : null}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {(Object.keys(generationModeCopy) as GenerationType[]).map((mode) => {
                  const Icon = generationModeIcons[mode];
                  const disabled = selectedModel ? !supportsGenerationType(selectedModel, mode) : false;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => !disabled && setGenerationType(mode)}
                      disabled={disabled}
                      title={disabled ? "当前模型不支持该生成方式" : undefined}
                      className={cn(
                        "flex min-h-[78px] items-center gap-2.5 rounded-2xl border p-3 text-left transition",
                        generationType === mode
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40",
                        disabled && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 hover:border-slate-200 hover:bg-slate-100",
                      )}
                    >
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", generationType === mode ? "bg-blue-100" : "bg-slate-100")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block whitespace-nowrap text-[13px] font-black leading-5">{generationModeCompactCopy[mode].label}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{generationModeCompactCopy[mode].desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  {generationType === "storyboard" ? (
                    <div>
                      <label className="text-xs font-bold text-slate-500">故事主题</label>
                      <textarea
                        value={storyTheme}
                        onChange={(event) => setStoryTheme(event.target.value)}
                        placeholder="输入故事或脚本，例如：一个新产品从清晨实验室走向城市街头，被不同用户自然使用。"
                        rows={8}
                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-500">提示词</label>
                      <textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        placeholder="描述你想生成的视频，例如：电影感广告片，产品从清晨光线里被缓慢推近，金属材质，高级质感。"
                        rows={8}
                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  )}

                  {generationType === "image" ? (
                    <div>
                      <label className="text-xs font-bold text-slate-500">动作描述</label>
                      <input
                        value={actionDescription}
                        onChange={(event) => setActionDescription(event.target.value)}
                        placeholder="例如：产品缓慢旋转，背景光线从左侧掠过"
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  ) : null}

                  {generationType !== "storyboard" ? (
                    <div>
                      <label className="text-xs font-bold text-slate-500">反向提示词</label>
                      <textarea
                        value={negativePrompt}
                        onChange={(event) => setNegativePrompt(event.target.value)}
                        placeholder="不想出现的内容，例如：低清晰度、画面闪烁、文字水印、人物畸形"
                        rows={3}
                        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {generationType === "image" ? <UploadCard type="image" label="上传图片" selected={hasImageReference} onPick={() => setHasImageReference(true)} /> : null}
                  {generationType === "video" ? <UploadCard type="video" label="上传参考视频" selected={hasVideoReference} onPick={() => setHasVideoReference(true)} /> : null}
                  {generationType === "text" || generationType === "storyboard" ? <UploadCard type="material" label="上传参考素材" /> : null}

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-black text-blue-700">
                      <BadgeCheck className="h-4 w-4" />
                      模型智能推荐
                    </div>
                    <div className="mt-3 space-y-2">
                      {recommendedModelIds.map((modelId) => {
                        const model = findVideoModel(models, modelId);
                        if (!model) return null;
                        const available = model.status === "available";
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => available && selectModel(model)}
                            disabled={!available}
                            className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
                              {model.provider[0]}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-800">{model.displayName}</p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-400">{model.provider} · {model.status === "coming" ? "即将接入" : model.status === "maintenance" ? "维护中" : "可用"}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-slate-500" />
                  <h2 className="text-base font-black text-slate-950">参数设置</h2>
                </div>
                <p className="text-xs font-bold text-slate-400">已根据当前模型自动适配可用参数</p>
              </div>

              {modelForControls ? (
                <div className="mt-4 space-y-3">
                  {generationType !== "storyboard" ? (
                  <OptionGroup
                    title="视频比例"
                    options={aspectRatios}
                    value={aspectRatio}
                    getStatus={(option) =>
                      optionState(option, modelForControls.supportedAspectRatios, modelForControls.pendingParameters?.aspectRatios, "当前模型暂不支持该比例")
                    }
                    onChange={setAspectRatio}
                  />
                  ) : null}
                  <OptionGroup
                  title="视频时长"
                  options={durations}
                  value={duration}
                  getStatus={(option) =>
                    optionState(option, modelForControls.supportedDurations, modelForControls.pendingParameters?.durations, "当前模型暂不支持该时长")
                  }
                  onChange={setDuration}
                  />
                  <OptionGroup
                  title="清晰度"
                  options={resolutions}
                  value={resolution}
                  getStatus={(option) =>
                    optionState(
                      option,
                      modelForControls.supportedResolutions,
                      modelForControls.pendingParameters?.resolutions,
                      option === "4K" ? "当前模型暂不支持 4K 输出" : "当前模型暂不支持该清晰度",
                    )
                  }
                  onChange={setResolution}
                  />
                  {generationType === "text" || generationType === "storyboard" ? (
                  <OptionGroup
                    title={generationType === "storyboard" ? "画面风格" : "风格"}
                    options={videoStyles}
                    value={style}
                    getStatus={(option) =>
                      optionState(option, modelForControls.supportedStyles, modelForControls.pendingParameters?.styles, "当前模型暂不支持该风格")
                    }
                    onChange={setStyle}
                  />
                  ) : null}
                  {generationType !== "storyboard" ? (
                  <OptionGroup
                    title="镜头运动"
                    options={cameraMotions}
                    value={cameraMotion}
                    getStatus={(option) =>
                      optionState(option, modelForControls.supportedCameraMotions, modelForControls.pendingParameters?.cameraMotions, "当前模型暂不支持该镜头运动")
                    }
                    onChange={setCameraMotion}
                  />
                  ) : null}
                  {generationType !== "storyboard" ? (
                  <OptionGroup
                    title="生成数量"
                    options={generationCounts}
                    value={count}
                    getStatus={(option) => countOptionState(option, modelForControls)}
                    onChange={setCount}
                  />
                  ) : null}
                  {generationType === "video" ? (
                  <OptionGroup
                    title="参考强度"
                    options={referenceStrengths}
                    value={referenceStrength}
                    getStatus={(option) =>
                      optionState(
                        option,
                        modelForControls.supportedReferenceStrengths,
                        modelForControls.pendingParameters?.referenceStrengths,
                        "当前模型暂不支持该参考强度",
                      )
                    }
                    onChange={setReferenceStrength}
                  />
                  ) : null}
                  {generationType === "storyboard" ? (
                  <>
                    <OptionGroup title="分镜数量" options={storyboardCounts} value={storyboardCount} getStatus={() => ({ state: "available" })} onChange={setStoryboardCount} />
                    <OptionGroup title="镜头节奏" options={storyboardPaces} value={storyboardPace} getStatus={() => ({ state: "available" })} onChange={setStoryboardPace} />
                  </>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
                  {modelsLoading ? "正在从数据库读取模型参数" : modelsError || "暂无可用视频模型"}
                </div>
              )}

              <div className="sticky bottom-4 z-10 mt-5 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-200/70 backdrop-blur">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate || taskStatus === "generating"}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {taskStatus === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {generateButtonLabel()}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950">生成结果区</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">结果预览台会展示空、生成中、成功和失败状态。</p>
                </div>
                {taskStatus === "success" ? showStatusPill("success") : taskStatus === "failed" ? showStatusPill("failed") : null}
              </div>
              <div className="mt-4">
                {taskStatus === "idle" && selectedModel ? <WaitingResult onGenerate={handleGenerate} disabled={!hasCreativeContent} /> : null}
                {taskStatus === "idle" && !selectedModel ? <EmptyResult onPick={openRecommendedModels} /> : null}
                {taskStatus === "generating" ? <GeneratingState progress={progress} onCancel={cancelGenerate} /> : null}
                {taskStatus === "failed" ? (
                  <FailedState
                    reason="模型繁忙"
                    onRetry={handleGenerate}
                    onEdit={() => document.getElementById("create-input")?.scrollIntoView({ behavior: "smooth" })}
                    onSwitch={openAllModels}
                  />
                ) : null}
                {taskStatus === "success" ? (
                  <VideoPreviewPlayer
                    task={previewTask}
                    prompt={activePrompt}
                    onCopy={copyPrompt}
                    onRegenerate={handleGenerate}
                    onSave={saveToDrive}
                    detailHref={generatedTask ? `/video/tasks/${generatedTask.id}` : undefined}
                  />
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {modelPickerOpen ? (
        <ModelPickerModal
          models={models}
          selectedModelId={selectedModelId}
          onClose={() => setModelPickerOpen(false)}
          onSelect={selectModel}
          onDetail={(model) => setDetailModel(model)}
          recommendedOnly={modelPickerMode === "recommended"}
        />
      ) : null}
      <ModelDetailModal
        model={detailModel}
        onClose={() => setDetailModel(null)}
        onSelect={(model) => {
          selectModel(model);
          setDetailModel(null);
          setModelPickerOpen(false);
        }}
      />
      <Toast message={toast} onClose={() => setToast(null)} />
    </WorkspaceShell>
  );
}

export function VideoHistoryPage() {
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<VideoGenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const modelOptions = useMemo(() => Array.from(new Set(items.map((task) => task.modelName))), [items]);

  async function loadTasks() {
    setLoading(true);
    try {
      const response = await api.listVideoTasks({ limit: 100 });
      setItems(response.data.items as VideoGenerationTask[]);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "视频历史加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const statusMatch = filter === "all" || item.status === filter;
      const modelMatch = modelFilter === "all" || item.modelName === modelFilter;
      const timeMatch =
        timeFilter === "all" ||
        (timeFilter === "today" && item.createdAtLabel.startsWith("今天")) ||
        (timeFilter === "yesterday" && item.createdAtLabel.startsWith("昨天")) ||
        (timeFilter === "earlier" && !item.createdAtLabel.startsWith("今天") && !item.createdAtLabel.startsWith("昨天"));
      const queryMatch = !normalized || `${item.modelName} ${item.prompt} ${item.promptSummary}`.toLowerCase().includes(normalized);
      return statusMatch && modelMatch && timeMatch && queryMatch;
    });
  }, [filter, items, modelFilter, query, timeFilter]);

  function pushToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function saveItem(taskId: string) {
    try {
      const response = await api.saveVideoTask(taskId);
      const updated = response.data as VideoGenerationTask;
      setItems((current) => current.map((item) => (item.id === taskId ? updated : item)));
      pushToast("已保存到云盘");
    } catch {
      pushToast("保存失败，请稍后重试");
    }
  }

  async function deleteItem(taskId: string) {
    try {
      await api.deleteVideoTask(taskId);
      setItems((current) => current.filter((item) => item.id !== taskId));
      pushToast("视频任务已删除");
    } catch {
      pushToast("删除失败，请稍后重试");
    }
  }

  return (
    <WorkspaceShell active="创作空间" title="">
      <div className="space-y-6 py-6">
        <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950">视频历史记录</h1>
              <p className="mt-1 text-sm text-slate-500">查看所有视频生成任务，按状态筛选并进入任务详情。</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索模型或提示词"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 sm:w-72"
                />
              </div>
              <Link href="/video/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                <Sparkles className="h-4 w-4" />
                新建视频
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "全部" },
                { key: "generating", label: "生成中" },
                { key: "success", label: "生成成功" },
                { key: "failed", label: "生成失败" },
                { key: "saved", label: "已保存" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as "all" | TaskStatus)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-xs font-bold transition",
                    filter === item.key
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              >
                <option value="all">全部模型</option>
                {modelOptions.map((modelName) => (
                  <option key={modelName} value={modelName}>{modelName}</option>
                ))}
              </select>
              <select
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              >
                <option value="all">全部时间</option>
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="earlier">更早</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[20px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-500" />
            <h2 className="mt-4 text-base font-black text-slate-700">正在从数据库读取历史记录</h2>
          </section>
        ) : filteredItems.length ? (
          <section className="grid gap-4">
            {filteredItems.map((task) => (
              <article key={task.id} className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[132px_minmax(0,1fr)_280px] xl:items-center">
                  <VideoThumbnail task={task} className="h-24 w-full rounded-2xl xl:w-[132px]" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black text-slate-950">{task.modelName}</p>
                      {showStatusPill(task.status)}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{task.promptSummary}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {task.createdAtLabel} · {task.aspectRatio} · {task.duration} · {task.resolution}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
                    <ActionButton icon={Eye} label="查看" href={`/video/tasks/${task.id}`} />
                    <ActionButton icon={Download} label="下载" disabled={task.status === "failed" || task.status === "generating"} />
                    <ActionButton icon={FolderDown} label="保存到云盘" onClick={() => saveItem(task.id)} disabled={task.status === "failed" || task.status === "generating"} />
                    <ActionButton icon={Trash2} label="删除" tone="danger" onClick={() => deleteItem(task.id)} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-[20px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <History className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-base font-black text-slate-700">{loadError || "暂无匹配的视频历史"}</h2>
            <p className="mt-2 text-sm text-slate-400">生成视频后，任务会从数据库出现在这里。</p>
          </section>
        )}
      </div>
      <Toast message={toast} onClose={() => setToast(null)} />
    </WorkspaceShell>
  );
}

function TaskInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-800">{value || "-"}</p>
    </div>
  );
}

export function VideoTaskDetailPage({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { models } = useVideoModels();
  const [task, setTask] = useState<VideoGenerationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getVideoTask(taskId)
      .then((response) => {
        if (!active) return;
        setTask(response.data as VideoGenerationTask);
        setLoadError(null);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "视频任务加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  const model = task ? models.find((item) => item.id === task.modelId) || null : null;
  const saved = Boolean(task?.isSaved || task?.status === "saved");

  function pushToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function copyPrompt() {
    if (!task) return;
    await navigator.clipboard.writeText(task.prompt);
    setCopied(true);
    pushToast("提示词已复制");
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function saveToDrive() {
    if (!task) return;
    try {
      const response = await api.saveVideoTask(task.id);
      setTask(response.data as VideoGenerationTask);
      pushToast("已保存到云盘");
    } catch {
      pushToast("保存失败，请稍后重试");
    }
  }

  async function deleteTask() {
    if (!task) return;
    try {
      await api.deleteVideoTask(task.id);
      pushToast("视频任务已删除");
      window.setTimeout(() => router.push("/video/history"), 700);
    } catch {
      pushToast("删除失败，请稍后重试");
    }
  }

  if (loading) {
    return (
      <WorkspaceShell active="创作空间" title="">
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-500" />
          <p className="mt-4 text-sm font-bold text-slate-500">正在从数据库读取任务详情</p>
        </div>
      </WorkspaceShell>
    );
  }

  if (!task) {
    return (
      <WorkspaceShell active="创作空间" title="">
        <div className="py-16 text-center">
          <AlertTriangle className="mx-auto h-9 w-9 text-rose-500" />
          <h1 className="mt-4 text-lg font-black text-slate-800">{loadError || "视频任务不存在"}</h1>
          <Link href="/video/history" className="mt-5 inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
            返回历史记录
          </Link>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell active="创作空间" title="">
      <div className="space-y-6 py-6">
        <section className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/video/history" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
              返回历史
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-950">视频任务详情</h1>
              <p className="mt-1 text-sm text-slate-500">{task.createdAtLabel} · {task.modelName}</p>
            </div>
          </div>
          {showStatusPill(saved ? "saved" : task.status)}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-slate-950">生成视频预览</h2>
              <span className="text-xs font-bold text-slate-400">{task.aspectRatio} · {task.duration}</span>
            </div>
            <div className="mt-4">
              {task.status === "generating" ? (
                <GeneratingState progress={task.progress} />
              ) : task.status === "failed" ? (
                <FailedState reason={task.errorMessage || "模型繁忙"} onRetry={() => pushToast("已进入重新生成流程")} onEdit={() => undefined} onSwitch={() => undefined} />
              ) : (
                <VideoPreviewPlayer
                  task={task}
                  prompt={task.prompt}
                  onCopy={copyPrompt}
                  onRegenerate={() => pushToast("已进入重新生成流程")}
                  onSave={saveToDrive}
                />
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-950">任务信息</h2>
              <div className="mt-4 grid gap-3">
                <TaskInfoRow label="使用模型" value={task.modelName} />
                <TaskInfoRow label="生成方式" value={generationModeCopy[task.generationType].label} />
                <TaskInfoRow label="提示词" value={task.prompt} />
                <TaskInfoRow label="反向提示词" value={task.negativePrompt} />
                <div className="grid grid-cols-2 gap-3">
                  <TaskInfoRow label="视频比例" value={task.aspectRatio} />
                  <TaskInfoRow label="视频时长" value={task.duration} />
                  <TaskInfoRow label="清晰度" value={task.resolution} />
                  <TaskInfoRow label="风格" value={task.style} />
                  <TaskInfoRow label="镜头运动" value={task.cameraMotion} />
                  <TaskInfoRow label="生成数量" value={task.count} />
                  <TaskInfoRow label="参考强度" value={task.referenceStrength || "-"} />
                  <TaskInfoRow label="生成状态" value={taskStatusLabel[saved ? "saved" : task.status]} />
                </div>
                {task.storyboardText ? <TaskInfoRow label="分镜文本" value={task.storyboardText} /> : null}
                <TaskInfoRow label="创建时间" value={task.createdAtLabel} />
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-950">模型信息</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{model?.description || "模型信息正在同步中。"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(model?.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} label="下载视频" disabled={task.status === "failed" || task.status === "generating"} />
            <ActionButton icon={FolderDown} label={saved ? "已保存到云盘" : "保存到云盘"} onClick={saveToDrive} disabled={task.status === "failed" || task.status === "generating"} />
            <ActionButton icon={copied ? Check : Copy} label={copied ? "已复制" : "复制提示词"} onClick={copyPrompt} />
            <ActionButton icon={RefreshCw} label="重新生成" href={`/video/create?model=${task.modelId}`} />
            <ActionButton icon={Trash2} label="删除任务" tone="danger" onClick={deleteTask} />
          </div>
        </section>
      </div>
      <Toast message={toast} onClose={() => setToast(null)} />
    </WorkspaceShell>
  );
}
