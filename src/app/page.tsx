import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  DatabaseZap,
  FileArchive,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Layers,
  LockKeyhole,
  MessageSquare,
  Presentation,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const capabilities = [
  { icon: MessageSquare, title: "AI 办公助手", description: "像和同事一样与 AI 对话，分析资料、生成内容、解决办公问题。" },
  { icon: Cloud, title: "云盘", description: "上传、管理、搜索和分享所有办公文件，形成统一资料入口。" },
  { icon: FileText, title: "在线文档", description: "创建文档，让 AI 帮你写作、总结、改写和整理。" },
  { icon: DatabaseZap, title: "知识库", description: "把文件和文档变成可以对话的团队知识资产。" },
  { icon: FileSpreadsheet, title: "表格处理", description: "处理表格导入、清洗、拆分、合并、统计和报表生成。" },
  { icon: Users, title: "团队协作", description: "支持团队、部门、成员、权限和协作空间管理。" },
];

const fileTypes = [
  { icon: FileText, name: "PDF", items: ["总结全文", "提取重点", "文档问答"] },
  { icon: FileSpreadsheet, name: "表格", items: ["数据清洗", "拆分合并", "统计分析"] },
  { icon: FileText, name: "Word", items: ["改写润色", "摘要生成", "结构整理"] },
  { icon: Presentation, name: "PPT", items: ["提炼大纲", "生成讲稿", "内容复盘"] },
  { icon: Layers, name: "CSV", items: ["字段识别", "格式统一", "批量转换"] },
  { icon: ImageIcon, name: "图片", items: ["文字识别", "票据提取", "信息归档"] },
  { icon: FileArchive, name: "压缩包", items: ["批量读取", "自动分类", "归档分析"] },
  { icon: DatabaseZap, name: "知识库", items: ["文档沉淀", "语义搜索", "团队问答"] },
];

const scenes = [
  ["个人办公", "总结文件、处理表格、写文档、整理资料。"],
  ["团队协作", "共享文件、创建团队文档、搭建团队知识库。"],
  ["数据处理", "清洗数据、合并表格、生成统计结果。"],
  ["内容创作", "整理资料、生成大纲、改写文案、提取观点。"],
  ["企业知识库", "把制度、项目资料变成可问答知识库。"],
  ["经营分析", "围绕订单、客户、销售和库存做趋势分析。"],
];

const securityItems = [
  { icon: LockKeyhole, title: "数据安全保障" },
  { icon: CheckCircle2, title: "ISO 27001 认证规划" },
  { icon: Users, title: "企业级权限管理" },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-cyan-200/20 bg-[#071529] p-5 shadow-[0_30px_120px_rgba(34,211,238,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_36%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(59,130,246,0.24),transparent_30%)]" />
      <div className="relative grid gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-black text-white">Lumio AI</p>
              <p className="truncate text-sm text-cyan-100/70">Connected workspace</p>
            </div>
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-cyan-100" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100">
              <Cloud className="h-4 w-4" />
              AI Drive
            </p>
            {["Q2 Sales Report.pdf", "Customer Analysis Table", "Product Review.docx"].map((file) => (
              <div key={file} className="mb-2 truncate rounded-xl bg-white/[0.08] px-3 py-2 text-xs text-white/72">
                {file}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-violet-100">
              <FileText className="h-4 w-4" />
              AI Docs
            </p>
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-white/35" />
              <div className="h-2 rounded-full bg-white/18" />
              <div className="h-2 w-2/3 rounded-full bg-cyan-300/50" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["PDF", "Word", "PPT", "TXT"].map((type) => (
                <span key={type} className="rounded-xl bg-white/[0.08] px-3 py-2 text-center text-xs font-bold text-white/78">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200/20 bg-slate-950/68 p-4">
          <div className="ml-auto max-w-[82%] rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950">
            请总结这个文件夹里所有报告的核心结论。
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm leading-7 text-slate-200/86">
            我已分析 12 个文件。Q2 增长主要来自北美市场，客户流失集中在中小企业客户，产品 A 的复购率高于产品 B。
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:px-6 lg:py-20 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-8 right-0 h-96 w-96 rounded-full bg-blue-500/18 blur-3xl" />

        <div className="relative min-w-0 space-y-7">
          <Badge className="gap-2 border-cyan-200/25 bg-cyan-200/10 text-cyan-50">
            <Sparkles className="h-3.5 w-3.5" />
            AI 原生 · 云端办公 · 企业级协作
          </Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl break-words text-4xl font-black leading-[1.08] tracking-tight text-white md:text-6xl xl:text-7xl">
              Lumio 序光：新一代 AI 原生办公平台
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-200/78 md:text-xl md:leading-9">
              上传、管理和处理你的所有办公文件。用 AI 聊天、云盘、在线文档和知识库，让个人和团队更高效地完成工作。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.35)] hover:from-cyan-200 hover:to-blue-400"
            >
              <Link href="/register">
                免费开始
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="#ai-demo">查看演示</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-300/80">
            {["PDF", "表格", "Word", "PPT", "图片", "文档", "知识库"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-w-0">
          <HeroVisual />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-14 md:px-6">
        <div className="mb-10 max-w-3xl">
          <Badge variant="secondary">核心能力</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
            一个工作空间，完成所有 AI 办公任务
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300/80">
            从文件上传、文档写作、AI 聊天到知识库问答，Lumio 把分散的信息重新组织起来。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:bg-white/[0.09]"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.25)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-300/75">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="solutions" className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/18 to-blue-500/18 p-8">
          <Badge>场景方案</Badge>
          <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">适合每一种高频办公场景</h2>
          <p className="mt-4 leading-8 text-slate-300/78">
            无论是个人办公、团队协作、资料整理，还是企业知识管理，Lumio 都能提供 AI 支持。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {scenes.map(([title, description]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="mt-2 leading-7 text-slate-300/75">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="files" className="mx-auto max-w-7xl px-5 py-14 md:px-6">
        <div className="mb-10 max-w-3xl">
          <Badge variant="secondary">文件智能</Badge>
          <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">上传常用办公文件，让 AI 帮你处理</h2>
          <p className="mt-4 leading-8 text-slate-300/78">
            Lumio 支持主流办公文件类型，并根据内容提供总结、问答、提取、转换和自动处理能力。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fileTypes.map((file) => {
            const Icon = file.icon;
            return (
              <div key={file.name} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-black text-white">{file.name}</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {file.items.map((item) => (
                    <span key={item} className="rounded-full bg-white/[0.08] px-3 py-1 text-xs text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="ai-demo" className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:px-6 lg:grid-cols-2">
        <div>
          <Badge>AI 对话演示</Badge>
          <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">和文件、文档、知识库直接对话</h2>
          <p className="mt-4 leading-8 text-slate-300/78">
            不需要手动翻找内容，直接向 Lumio 提问，它会从你的文件和知识库中找到答案。
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm font-semibold text-cyan-100">用户问题</p>
            <p className="mt-3 rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950">
              请总结这个文件夹里所有报告的核心结论。
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-cyan-200/20 bg-slate-950/65 p-6 shadow-[0_0_60px_rgba(34,211,238,0.14)]">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-white">Lumio 回答</p>
              <p className="text-sm text-slate-400">已分析 12 个文件</p>
            </div>
          </div>
          <ol className="space-y-3 text-slate-200/85">
            {["Q2 销售增长主要来自北美市场。", "客户流失率集中在中小企业客户。", "产品 A 的复购率明显高于产品 B。"].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="docs" className="mx-auto max-w-7xl px-5 py-14 md:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8">
          <Badge>资源中心</Badge>
          <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">教程、案例、文档和合规资料</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["使用教程", "基础入门、功能教程和常见操作。"],
              ["案例中心", "电商、财务、销售和团队协作案例。"],
              ["帮助文档", "账号、上传、数据处理和会员说明。"],
              ["安全与合规", "数据加密、权限管理和企业安全说明。"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl bg-slate-950/45 p-5">
                <h3 className="font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300/75">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-5 py-14 md:px-6">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-6 md:grid-cols-3">
          {securityItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-slate-950/40 p-4">
                <Icon className="h-5 w-5 text-cyan-200" />
                <span className="font-semibold text-slate-200">{item.title}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-6">
        <div className="relative overflow-hidden rounded-[32px] border border-cyan-200/20 bg-cyan-300 p-8 text-slate-950 md:p-12">
          <div className="absolute right-10 top-8 h-32 w-32 rounded-full border border-slate-950/15" />
          <div className="relative max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">开始用 AI 重新组织你的工作</h2>
            <p className="mt-4 text-lg leading-8 text-slate-800">
              上传一个文件，创建一篇文档，或者直接和 AI 对话。Lumio 会帮你把复杂信息变得清晰。
            </p>
            <Button className="mt-8 bg-slate-950 text-white hover:bg-slate-900" size="lg" asChild>
              <Link href="/register">
                免费开始
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
