"use client";

import { useState } from "react";
import { Zap, Sparkles, Wrench, Bug } from "lucide-react";

import { BackNav } from "@/components/common/back-nav";

type LogType = "全部" | "新功能" | "模型更新" | "体验优化" | "问题修复";

interface ChangelogEntry {
  date: string;
  version?: string;
  tags: LogType[];
  items: string[];
}

const changelog: ChangelogEntry[] = [
  {
    date: "2026-06-23",
    tags: ["新功能", "模型更新", "体验优化"],
    items: [
      "新增「模型广场」页面，支持查看不同 AI 模型的能力和适用场景。",
      "新增「文件理解」页面，支持上传 PDF、Word、表格并进行总结分析。",
      "新增「历史记录」页面，记录所有 AI 任务、模型使用和文件处理历史。",
      "新增多模型版本展示动效，首页直观感受序光已接入的模型。",
      "优化首页为多模型 AI 平台定位，突出模型选择和智能推荐能力。",
      "优化工作台左侧导航结构，分组更清晰。",
      "优化用户头像菜单，精简入口。",
    ],
  },
  {
    date: "2026-06-22",
    tags: ["新功能", "体验优化"],
    items: [
      "新增「模型推荐」功能，输入任务后序光会智能推荐更合适的模型。",
      "支持在智能任务中上传文件作为上下文，AI 可基于文件内容回答。",
      "优化智能任务页面布局，输入框固定在底部，消息区独立滚动。",
      "优化登录页和注册页，文案改为多模型 AI 平台表达。",
    ],
  },
  {
    date: "2026-06-21",
    tags: ["新功能", "问题修复"],
    items: [
      "新增多模型支持：已接入 DeepSeek、OpenAI、Claude、Gemini 等模型。",
      "修复 AI 聊天中 lazy-load 关系导致的 500 错误。",
      "修复软删除文件夹与唯一约束冲突的问题。",
      "修复前端 IPv4/IPv6 双栈连接导致的 Failed to fetch 错误。",
    ],
  },
];

const typeFilters: LogType[] = ["全部", "新功能", "模型更新", "体验优化", "问题修复"];

const tagStyles: Record<LogType, string> = {
  "全部": "bg-slate-50 text-slate-600",
  "新功能": "bg-emerald-50 text-emerald-700",
  "模型更新": "bg-blue-50 text-blue-700",
  "体验优化": "bg-violet-50 text-violet-700",
  "问题修复": "bg-amber-50 text-amber-700",
};

const tagIcons: Record<LogType, typeof Zap> = {
  "全部": Zap,
  "新功能": Sparkles,
  "模型更新": Zap,
  "体验优化": Wrench,
  "问题修复": Bug,
};

export default function ChangelogPage() {
  const [filter, setFilter] = useState<LogType>("全部");

  const filtered = filter === "全部"
    ? changelog
    : changelog.filter((e) => e.tags.includes(filter));

  return (
    <main className="bg-white text-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <BackNav />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">更新日志</h1>
        <p className="mt-3 text-lg text-slate-500">
          查看序光最近的功能更新、模型接入和体验优化。
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {typeFilters.map((type) => {
            const Icon = tagIcons[type];
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  filter === type
                    ? "border-slate-300 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <Icon className="h-3 w-3" />
                {type}
              </button>
            );
          })}
        </div>

        <div className="mt-10 space-y-10">
          {filtered.map((entry, i) => (
            <div key={i} className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%+40px)] before:w-px before:bg-slate-200 last:before:hidden">
              <div className="absolute left-0 top-1.5 h-[23px] w-[23px] rounded-full border-2 border-white bg-slate-300 ring-1 ring-slate-200" />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-bold text-slate-950">{entry.date}</p>
                  <div className="flex gap-1.5">
                    {entry.tags.map((tag) => (
                      <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagStyles[tag]}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {entry.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm leading-7 text-slate-600">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
