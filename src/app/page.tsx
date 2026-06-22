import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Cloud,
  DatabaseZap,
  FileText,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Capability = { title: string; description: string; icon: LucideIcon };

const capabilities: Capability[] = [
  { title: "文件 AI", description: "解析 PDF、Word、表格、PPT、图片和文本，围绕文件提问并生成总结。", icon: Bot },
  { title: "云盘管理", description: "统一保存办公文件、处理结果和团队资料，支持预览、下载、分享和权限控制。", icon: Cloud },
  { title: "在线文档", description: "创建文档、AI 写作、导出资料，把团队沉淀变成可复用内容。", icon: FileText },
  { title: "知识库问答", description: "把 SOP、项目资料、制度和常见问题变成可搜索、可引用的知识库。", icon: DatabaseZap },
  { title: "自动化任务", description: "上传、解析、切片、总结、拆分、合并和清洗进入任务中心统一追踪。", icon: Zap },
  { title: "团队协作", description: "团队空间、成员、角色权限、文件分享和审计日志，适合多人协同。", icon: Users },
];

const solutions = [
  { tag: "电商", name: "电商运营", desc: "订单拆分、销售统计、库存分析和商品资料清洗。", icon: BarChart3 },
  { tag: "财务", name: "财务办公", desc: "账单整理、费用统计、对账和发票资料处理。", icon: FileText },
  { tag: "人事", name: "人事行政", desc: "员工信息、考勤统计、排班和工资资料整理。", icon: Users },
  { tag: "销售", name: "销售管理", desc: "客户表管理、线索跟进、业绩报表和区域分析。", icon: Zap },
  { tag: "知识", name: "知识管理", desc: "制度、项目资料、教程和常见问题集中沉淀。", icon: DatabaseZap },
  { tag: "协作", name: "团队协作", desc: "把文件、文档、任务和知识库连接成团队工作空间。", icon: Network },
];

const highlights = [
  { value: "10万+", label: "企业与个人用户" },
  { value: "500万+", label: "文件处理规模" },
  { value: "98%", label: "效率提升参考" },
  { value: "99.9%", label: "平台稳定性" },
];

const features = [
  { icon: ShieldCheck, title: "数据安全保障", desc: "空间隔离、权限控制和审计日志覆盖关键操作。" },
  { icon: Network, title: "可扩展架构", desc: "后端 API、任务队列、向量检索和对象存储逐步解耦。" },
  { icon: CheckCircle2, title: "企业级体验", desc: "围绕文件、文档、知识和团队协作构建统一工作台。" },
];

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-cyan-100/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1440px] gap-16 px-6 pt-16 pb-24 lg:grid-cols-[1fr_0.95fr] lg:px-10 lg:pt-24 lg:pb-32">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            一个能理解文件、文档和知识的 AI 工作空间
          </span>
          <h1 className="mt-8 max-w-2xl text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-950 md:text-7xl">
            让所有文件、文档和知识
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">都能被 AI 理解和处理</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-500">
            XUGUANG 序光是一个 AI 原生办公平台，集云盘、在线文档、AI 聊天、文件智能处理、知识库和团队协作于一体，帮助个人和团队高效管理、理解和处理所有办公信息。
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="h-14 rounded-xl bg-blue-600 px-9 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-600/30">
              <Link href="/register">
                免费开始
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-xl border-slate-300 px-9 text-base font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600">
              <Link href="/product">查看产品</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {["PDF", "表格", "Word", "PPT", "图片", "文档", "知识库"].map((item) => (
              <span key={item} className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">序</span>
              <div>
                <p className="text-sm font-extrabold text-slate-950">XUGUANG 序光</p>
                <p className="text-xs text-slate-400">AI 原生办公平台</p>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600">
                  <Bot className="h-4 w-4 text-white" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950">AI 助手 · 智能问答</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">&ldquo;总结本周上传资料的关键结论&rdquo;</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
                已关联云盘、知识库和在线文档，生成摘要、待办和引用来源。
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: "文件处理", color: "bg-blue-50 border-blue-200 text-blue-700", icon: FileText },
                { label: "知识库", color: "bg-cyan-50 border-cyan-200 text-cyan-700", icon: DatabaseZap },
                { label: "云盘", color: "bg-violet-50 border-violet-200 text-violet-700", icon: Cloud },
                { label: "在线文档", color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: Users },
              ].map(({ label, color, icon: Icon }) => (
                <div key={label} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1440px] divide-y divide-slate-100 md:grid-cols-4 md:divide-x md:divide-y-0">
        {highlights.map(({ value, label }) => (
          <div key={label} className="px-8 py-10 text-center">
            <p className="text-4xl font-extrabold text-blue-600">{value}</p>
            <p className="mt-3 text-base font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Product</p>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">一个工作空间，覆盖核心办公资料</h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-500">
          从文件处理、云盘、文档到知识库与团队权限，序光把分散资料连接成可持续运转的业务资产。
        </p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href="/product"
              className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-xl font-extrabold text-slate-950 group-hover:text-blue-700">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-500">{item.description}</p>
              <span className="mt-6 inline-flex items-center text-sm font-bold text-blue-600">
                了解详情
                <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SolutionsSection() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Solutions</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">面向真实业务场景</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-500">
            选择业务场景后，团队可以把文件、数据、任务、知识和权限放进同一个工作流。
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map(({ tag, name, desc, icon: Icon }) => (
            <Link
              key={tag}
              href={`/solutions/${tag.toLowerCase()}`}
              className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
            >
              <span className={cn(
                "grid h-10 w-10 place-items-center rounded-lg transition",
                tag === "电商" && "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
                tag === "财务" && "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
                tag === "人事" && "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
                tag === "销售" && "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100",
                tag === "知识" && "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
                tag === "协作" && "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
              )}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-slate-950">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              <span className="mt-5 inline-flex items-center text-sm font-bold text-blue-600">
                查看详情
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-14 rounded-2xl bg-slate-950 p-12 text-center text-white">
          <h3 className="text-3xl font-extrabold">从订单资料到经营分析，一条链路完成</h3>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            上传订单、合同、客户资料和复盘文档后，序光可以自动解析、分类、生成摘要，并沉淀到团队知识库。
          </p>
          <Link href="/solutions" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100">
            查看所有解决方案
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Trust</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">企业级可靠与安全</h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-8 text-center transition hover:shadow-lg">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-xl font-extrabold text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-cyan-500">
      <div className="mx-auto max-w-[1440px] px-6 py-20 text-center lg:px-10">
        <h2 className="text-3xl font-extrabold text-white md:text-5xl">准备好开始了吗？</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">免费注册序光，让文件、文档与知识自动运转。</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="h-14 rounded-xl bg-white px-10 text-base font-extrabold text-blue-600 shadow-lg shadow-blue-900/20 transition hover:bg-slate-50">
            <Link href="/register">免费开始</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 rounded-xl border-white/30 px-10 text-base font-bold text-white transition hover:bg-white/10">
            <Link href="/help">了解更多</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="bg-white text-slate-950">
      <HeroSection />
      <StatsBar />
      <CapabilitiesSection />
      <SolutionsSection />
      <TrustSection />
      <CTASection />
    </main>
  );
}
