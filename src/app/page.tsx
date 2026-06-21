import Link from "next/link";
import {
  ArrowRight,
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

type Capability = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const capabilities: Capability[] = [
  { title: "文件 AI", description: "解析 PDF、Word、表格、PPT、图片和文本，围绕文件提问并生成总结。", icon: Bot },
  { title: "云盘管理", description: "统一保存办公文件、处理结果和团队资料，支持预览、下载、分享和权限控制。", icon: Cloud },
  { title: "在线文档", description: "创建文档、AI 写作、导出资料，把团队沉淀变成可复用内容。", icon: FileText },
  { title: "知识库问答", description: "把 SOP、项目资料、制度和常见问题变成可搜索、可引用的知识库。", icon: DatabaseZap },
  { title: "自动化任务", description: "上传、解析、切片、总结、拆分、合并和清洗进入任务中心统一追踪。", icon: Zap },
  { title: "团队协作", description: "团队空间、成员、角色权限、文件分享和审计日志，适合多人协同。", icon: Users },
];

const scenarios = ["电商运营", "财务办公", "人事行政", "销售管理", "知识管理", "项目协作"];

const heroStats = [
  ["10万+", "企业与个人用户"],
  ["500万+", "文件处理规模"],
  ["98%", "效率提升参考"],
  ["99.9%", "平台稳定性"],
];

function WorkspaceVisual() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(59,130,246,0.18),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.12),transparent_32%)]" />
      <div className="absolute right-[-90px] top-[-40px] h-[420px] w-[420px] rounded-full border border-blue-100 bg-blue-50/70" />
      <div className="absolute right-14 top-20 h-72 w-72 rounded-full border border-dashed border-blue-200" />

      <div className="relative mx-auto mt-14 w-[78%] rounded-[8px] border border-slate-200 bg-white/90 p-7 shadow-[0_20px_70px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 grid-cols-3 gap-1 rounded-[12px] bg-gradient-to-br from-sky-400 to-blue-600 p-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="rounded-[3px] bg-white" />
            ))}
          </span>
          <div>
            <p className="text-xl font-black text-slate-950">序光智能工作网络</p>
            <p className="text-slate-500">文件、文档、知识与 AI 统一连接</p>
          </div>
        </div>

        <div className="mt-8 rounded-[8px] bg-slate-50 p-6">
          <p className="text-lg font-bold text-slate-950">“总结本周上传资料的关键结论”</p>
          <p className="mt-4 leading-7 text-slate-500">已关联云盘、知识库和在线文档，生成摘要、待办和引用来源。</p>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 grid w-[calc(100%-80px)] gap-5 md:grid-cols-2">
        {[
          ["文件处理", "PDF、Word、表格、PPT、图片和文本解析"],
          ["知识沉淀", "资料入库、语义检索、引用来源"],
        ].map(([title, desc]) => (
          <div key={title} className="rounded-[8px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xl font-black text-slate-950">{title}</p>
            <p className="mt-3 leading-7 text-slate-500">{desc}</p>
          </div>
        ))}
      </div>

      {[
        ["在线文档", "right-[8%] top-[31%]"],
        ["云盘", "left-[10%] top-[54%]"],
        ["知识库", "right-[9%] bottom-[30%]"],
      ].map(([label, pos]) => (
        <span key={label} className={`absolute ${pos} rounded-[8px] border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-950 shadow-lg`}>
          {label}
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h2>
      <p className="mt-5 text-lg leading-8 text-slate-600">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[1fr_0.94fr] lg:px-10 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2 text-sm font-bold text-blue-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              AI 原生办公平台
            </div>
            <h1 className="mt-10 max-w-4xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-7xl">
              让文件、文档与知识自动运转
            </h1>
            <p className="mt-8 max-w-3xl text-xl leading-10 text-slate-600">
              序光把云盘、在线文档、知识库和 AI 助手连接起来，帮助团队上传、整理、理解和处理所有办公资料。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-14 rounded-[8px] bg-blue-600 px-9 text-base font-bold text-white hover:bg-blue-700">
                <Link href="/register">
                  免费开始
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-[8px] border-slate-300 px-9 text-base font-bold">
                <Link href="/product">查看产品</Link>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-3">
              {["PDF", "表格", "Word", "PPT", "图片", "文档", "知识库"].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <WorkspaceVisual />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-6 py-10 md:grid-cols-4 lg:px-10">
          {heroStats.map(([value, label]) => (
            <div key={label} className="border-slate-200 md:border-r md:last:border-r-0">
              <p className="text-4xl font-black text-blue-600">{value}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10">
        <SectionTitle eyebrow="Product" title="一个工作空间，覆盖核心办公资料" desc="从文件处理、云盘、文档到知识库与团队权限，序光把分散资料连接成可持续运转的业务资产。" />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href="/product" className="group rounded-[8px] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <span className="grid h-12 w-12 place-items-center rounded-[8px] bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-black text-slate-950">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{item.description}</p>
                <span className="mt-6 inline-flex items-center text-sm font-bold text-blue-600">
                  了解详情
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10">
          <SectionTitle eyebrow="Solutions" title="面向真实业务场景，而不是单点工具" desc="选择业务场景后，团队可以把文件、数据、任务、知识和权限放进同一个工作流。" />
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {scenarios.map((item, index) => (
              <span key={item} className={`rounded-full px-6 py-3 text-sm font-bold ${index === 0 ? "bg-slate-950 text-white" : "bg-white text-slate-600 shadow-sm"}`}>
                {item}
              </span>
            ))}
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[8px] bg-slate-950 p-10 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Scenario</p>
              <h3 className="mt-5 text-4xl font-black">从订单资料到经营分析，一条链路完成</h3>
              <p className="mt-6 leading-8 text-slate-300">上传订单、合同、客户资料和复盘文档后，序光可以自动解析、分类、生成摘要，并沉淀到团队知识库。</p>
              <Link href="/solutions" className="mt-8 inline-flex items-center rounded-[8px] bg-white px-6 py-3 font-bold text-slate-950">
                查看解决方案
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {["资料上传", "AI 解析", "任务追踪", "知识沉淀"].map((item, index) => (
                <div key={item} className="rounded-[8px] border border-slate-200 bg-white p-7">
                  <span className="text-4xl font-black text-blue-600">0{index + 1}</span>
                  <h4 className="mt-6 text-xl font-black">{item}</h4>
                  <p className="mt-3 leading-7 text-slate-500">把散落的办公资料变成可追踪、可检索、可复用的信息流。</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <div className="grid gap-6 rounded-[8px] border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-3">
          {[
            [ShieldCheck, "数据安全保障", "空间隔离、权限控制和审计日志覆盖关键操作。"],
            [Network, "可扩展架构", "后端 API、任务队列、向量检索和对象存储逐步解耦。"],
            [CheckCircle2, "企业级体验", "围绕文件、文档、知识和团队协作构建统一工作台。"],
          ].map(([Icon, title, desc]) => {
            const TypedIcon = Icon as LucideIcon;
            return (
              <div key={title as string} className="flex gap-4">
                <TypedIcon className="mt-1 h-6 w-6 shrink-0 text-blue-600" />
                <div>
                  <p className="font-black text-slate-950">{title as string}</p>
                  <p className="mt-2 leading-7 text-slate-500">{desc as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
