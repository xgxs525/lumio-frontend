"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bot, Clock, FileSearch, Film, ImageIcon, MessageSquareText, Search, Sparkles, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

type TaskType = "全部" | "智能任务" | "文件理解" | "图像生成" | "视频生成" | "写作翻译" | "代码分析";
type TimeRange = "今天" | "最近7天" | "最近30天" | "全部时间";
type TaskStatus = "全部" | "已完成" | "生成中" | "失败";

interface HistoryItem {
  id: string;
  title: string;
  type: TaskType;
  model: string;
  related: string;
  time: string;
  cost: string;
  status: TaskStatus;
}

const mockHistory: HistoryItem[] = [
  { id: "1", title: "总结销售复盘报告", type: "文件理解", model: "Claude Sonnet 4.6", related: "Q2 销售复盘.pdf", time: "12 分钟前", cost: "28 点", status: "已完成" },
  { id: "2", title: "生成短视频文案", type: "写作翻译", model: "GPT-5.6", related: "—", time: "今天 09:40", cost: "12 点", status: "已完成" },
  { id: "3", title: "解释代码报错", type: "代码分析", model: "DeepSeek-V4-Pro", related: "error.log", time: "昨天 20:18", cost: "16 点", status: "已完成" },
  { id: "4", title: "生成封面图提示词", type: "图像生成", model: "图像生成模型", related: "—", time: "昨天 18:30", cost: "20 点", status: "已完成" },
  { id: "5", title: "翻译并润色英文邮件", type: "写作翻译", model: "GPT-5.6", related: "—", time: "昨天 15:00", cost: "8 点", status: "已完成" },
  { id: "6", title: "分析用户反馈数据", type: "文件理解", model: "Claude Sonnet 4.6", related: "用户反馈.xlsx", time: "昨天 10:20", cost: "24 点", status: "已完成" },
  { id: "7", title: "规划产品发布视频脚本", type: "视频生成", model: "视频生成模型", related: "—", time: "前天 16:45", cost: "18 点", status: "已完成" },
  { id: "8", title: "重构数据处理模块", type: "代码分析", model: "DeepSeek-V4-Pro", related: "data.py", time: "前天 14:00", cost: "22 点", status: "失败" },
];

const typeFilters: TaskType[] = ["全部", "智能任务", "文件理解", "图像生成", "视频生成", "写作翻译", "代码分析"];
const timeFilters: TimeRange[] = ["全部时间", "今天", "最近7天", "最近30天"];
const statusFilters: TaskStatus[] = ["全部", "已完成", "生成中", "失败"];

const typeIcons: Record<string, typeof Bot> = {
  "智能任务": Bot,
  "文件理解": FileSearch,
  "图像生成": ImageIcon,
  "视频生成": Film,
  "写作翻译": MessageSquareText,
  "代码分析": Sparkles,
};

const statusStyles: Record<string, string> = {
  "已完成": "bg-emerald-50 text-emerald-700",
  "生成中": "bg-blue-50 text-blue-700",
  "失败": "bg-red-50 text-red-700",
};

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TaskType>("全部");
  const [timeFilter, setTimeFilter] = useState<TimeRange>("全部时间");
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("全部");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = mockHistory.filter((item) => {
    if (typeFilter !== "全部" && item.type !== typeFilter) return false;
    if (statusFilter !== "全部" && item.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.related.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <WorkspaceShell active="历史记录" title="历史记录" subtitle="查看你过去使用过的 AI 任务、模型、文件和生成结果。">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索任务标题、模型、文件或内容"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400"
          />
        </div>
        <FilterChipGroup options={typeFilters} selected={typeFilter} onChange={setTypeFilter} />
        <FilterChipGroup options={timeFilters} selected={timeFilter} onChange={setTimeFilter} />
        <FilterChipGroup options={statusFilters} selected={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Table header */}
          <div className="hidden gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 md:grid md:grid-cols-[1.5fr_90px_130px_90px_110px_70px_100px]">
            <span>任务</span>
            <span>类型</span>
            <span>模型</span>
            <span>关联内容</span>
            <span>时间</span>
            <span>额度</span>
            <span>操作</span>
          </div>
          {filtered.map((item) => {
            const Icon = typeIcons[item.type] || Bot;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 border-b border-slate-50 px-5 py-4 last:border-b-0 md:grid md:grid-cols-[1.5fr_90px_130px_90px_110px_70px_100px] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <Link href="/ai" className="truncate text-sm font-bold text-slate-950 hover:text-blue-700">
                    {item.title}
                  </Link>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 w-fit">{item.type}</span>
                <span className="text-xs text-slate-500 truncate">{item.model}</span>
                <span className="text-xs text-slate-400 truncate">{item.related}</span>
                <span className="text-xs text-slate-400">{item.time}</span>
                <span className="text-xs font-medium text-slate-600">{item.cost}</span>
                <div className="flex items-center gap-1">
                  <Link
                    href="/ai"
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                  >
                    继续
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">删除历史记录</h3>
              <button onClick={() => setDeleteId(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">确定删除这条历史记录吗？删除后不可恢复。</p>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>取消</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { /* TODO */ setDeleteId(null); }}>
                删除
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceShell>
  );
}

/* ── helpers ── */

function FilterChipGroup<T extends string>({ options, selected, onChange }: { options: T[]; selected: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            selected === opt
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-20 flex flex-col items-center text-center">
      <Clock className="h-12 w-12 text-slate-300" />
      <h2 className="mt-6 text-xl font-bold text-slate-950">还没有历史任务</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        你开始的智能任务、文件理解、图像生成和视频创作都会保存在这里。
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/ai">新建任务<ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/file-understand">上传文件</Link>
        </Button>
      </div>
    </div>
  );
}
