import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Cloud,
  DatabaseZap,
  FileText,
  HardDrive,
  MessageSquareText,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

const quickActions = [
  { href: "/drive", icon: Upload, title: "上传文件", description: "上传 PDF、表格、文档、PPT、图片等资料，让 AI 读取与处理。" },
  { href: "/docs", icon: FileText, title: "新建文档", description: "从空白文档开始写作、总结、改写或沉淀团队资料。" },
  { href: "/ai", icon: Bot, title: "询问 AI", description: "围绕工作区文件和知识库直接提问，快速得到可执行答案。" },
  { href: "/knowledge", icon: DatabaseZap, title: "创建知识库", description: "把 SOP、制度、项目资料变成可检索、可问答的知识资产。" },
];

const recentFiles = [
  { name: "Q2 销售复盘.pdf", type: "PDF", time: "今天 10:24", status: "已建立索引" },
  { name: "客户数据分析表", type: "表格", time: "昨天 18:30", status: "已生成摘要" },
  { name: "产品发布方案.docx", type: "文档", time: "昨天 11:12", status: "可继续编辑" },
  { name: "品牌素材包.zip", type: "压缩包", time: "周二 15:06", status: "待分类" },
];

const aiCards = [
  { title: "总结销售复盘报告", source: "关联 3 个文件", time: "12 分钟前" },
  { title: "提取客户流失原因", source: "来自客户资料库", time: "今天 09:40" },
  { title: "生成项目周报初稿", source: "来自项目文档", time: "昨天 20:18" },
];

function AssistantPanel() {
  return (
    <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-700">
          <Bot className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-black text-slate-950">序光助手</p>
          <p className="text-sm text-slate-500">当前工作空间上下文</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
        我可以帮你总结最近上传的文件、生成项目周报、检查数据异常，或把文档沉淀到知识库。
      </div>
      <div className="mt-4 grid gap-2">
        {["总结最近 7 天新增文件", "生成团队周报", "查看待处理任务"].map((item) => (
          <button
            key={item}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-slate-950"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <WorkspaceShell
      active="工作台"
      title="欢迎回来，进入你的智能工作台"
      subtitle="集中查看最近文件、AI 会话、任务进度和团队空间状态，让每天的办公任务更有秩序。"
      rightPanel={<AssistantPanel />}
      actions={
        <>
          <Button asChild>
            <Link href="/drive">
              上传文件
              <Upload className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/docs">新建文档</Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
            >
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black text-slate-950">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-2xl font-black text-slate-950">最近文件</h2>
              <p className="mt-1 text-sm text-slate-500">最近上传、编辑和处理过的文件。</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/drive">
                查看全部
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-slate-200">
            {recentFiles.map((file) => (
              <div
                key={file.name}
                className="grid min-w-0 gap-3 p-5 text-sm md:grid-cols-[minmax(180px,1fr)_100px_130px_130px]"
              >
                <span className="min-w-0 truncate font-bold text-slate-950">{file.name}</span>
                <span className="text-slate-500">{file.type}</span>
                <span className="text-slate-500">{file.time}</span>
                <span className="font-semibold text-cyan-700">{file.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <MessageSquareText className="h-5 w-5 text-cyan-600" />
            <h2 className="text-2xl font-black text-slate-950">最近 AI 会话</h2>
          </div>
          <div className="grid gap-3">
            {aiCards.map((item) => (
              <Link
                key={item.title}
                href="/ai"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50"
              >
                <p className="font-bold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm text-slate-500">{item.source}</p>
                <p className="mt-3 text-xs font-semibold text-cyan-700">{item.time}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {[
          { icon: Cloud, title: "文件空间", value: "286 个文件", detail: "本周新增 18 个文件" },
          { icon: HardDrive, title: "存储用量", value: "42GB / 100GB", detail: "仍有充足空间" },
          { icon: Sparkles, title: "AI 额度", value: "3,280 / 5,000", detail: "适合继续处理批量任务" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="mb-4 h-5 w-5 text-cyan-600" />
              <p className="text-sm text-slate-500">{item.title}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
            </div>
          );
        })}
      </section>
    </WorkspaceShell>
  );
}
