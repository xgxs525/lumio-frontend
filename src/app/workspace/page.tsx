import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  FileSearch,
  Film,
  ImageIcon,
  MessageSquareText,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

const taskCards = [
  {
    href: "/ai",
    icon: Bot,
    color: "bg-blue-50 text-blue-600",
    title: "智能任务",
    desc: "选择模型或使用智能推荐，完成写作、翻译、编程、分析等任务。",
  },
  {
    href: "/file-understand",
    icon: FileSearch,
    color: "bg-emerald-50 text-emerald-600",
    title: "文件理解",
    desc: "上传 PDF、Word、表格或图片，让 AI 总结、分析和提取重点。",
  },
  {
    href: "/image-gen",
    icon: ImageIcon,
    color: "bg-violet-50 text-violet-600",
    title: "图像生成",
    desc: "输入描述，生成封面图、插画、海报或视觉素材。",
    pending: true,
  },
  {
    href: "/video",
    icon: Film,
    color: "bg-amber-50 text-amber-600",
    title: "视频创作",
    desc: "选择视频模型，生成视频、预览结果、保存云盘并查看历史。",
  },
];

const assetCards = [
  { href: "/drive", icon: Upload, color: "bg-sky-50 text-sky-600", title: "云盘", desc: "存放 AI 可处理的文件，方便随时调用、分析和总结。" },
  { href: "/docs", icon: MessageSquareText, color: "bg-rose-50 text-rose-600", title: "文档", desc: "保存 AI 生成或整理后的内容，支持继续编辑和复用。" },
  { href: "/knowledge", icon: Brain, color: "bg-indigo-50 text-indigo-600", title: "知识库", desc: "沉淀长期资料，让 AI 基于你的内容进行回答。" },
];

const stats = [
  { title: "今日使用", value: "32 次 AI 请求", icon: Sparkles },
  { title: "剩余额度", value: "3,280 / 5,000", icon: Sparkles },
  { title: "常用模型", value: "Claude Sonnet 4.6", icon: Bot },
  { title: "已接入模型", value: "30+ 个模型版本", icon: Bot },
];

function ModelRecommendCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">AI</span>
        <span className="text-base font-bold text-slate-900">智能模型推荐</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        输入任务后，序光会根据任务类型、内容长度、是否需要推理、是否涉及代码或文件，推荐更合适的模型。
      </p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-400">用户任务</p>
        <p className="mt-1 text-[13px] leading-6 text-slate-700">
          帮我总结这份 30 页 PDF，并指出里面的问题。
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-400">识别为</span>
        <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">文件理解</span>
        <span className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">长文本分析</span>
        <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">逻辑整理</span>
      </div>
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">推荐模型</p>
        <p className="mt-0.5 text-sm font-bold text-slate-900">Claude Sonnet 4.6</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">GPT-5.6</span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">DeepSeek-V4-Pro</span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">Gemini 1.0</span>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <WorkspaceShell
      active="工作台"
      title="开始一个 AI 任务"
      subtitle="选择模型，或让序光根据任务智能推荐。支持写作、翻译、编程、分析、文件理解、图像生成和视频创作。"
      rightPanel={
        <div className="space-y-5">
          <ModelRecommendCard />
        </div>
      }
      actions={
        <>
          <Button asChild>
            <Link href="/ai">
              新建任务
              <Bot className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/drive">
              上传文件
              <Upload className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      {/* ── Core task cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {taskCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-bold text-slate-950">{card.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{card.desc}</p>
              {card.pending ? (
                <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">即将上线</span>
              ) : null}
            </div>
          );
          return card.pending ? (
            <div key={card.title}>{content}</div>
          ) : (
            <Link key={card.title} href={card.href}>
              {content}
            </Link>
          );
        })}
      </section>

      {/* ── Asset & Content ── */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-950">资料与内容</h2>
        <p className="mt-1 text-sm text-slate-500">辅助 AI 更好理解和处理你的文件与内容。</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {assetCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-950">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{card.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon className="mb-3 h-5 w-5 text-blue-600" />
              <p className="text-xs font-medium text-slate-400">{item.title}</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{item.value}</p>
            </div>
          );
        })}
      </section>
    </WorkspaceShell>
  );
}
