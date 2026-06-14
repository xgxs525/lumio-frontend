import Link from "next/link";
import { ArrowRight, Bot, Cloud, DatabaseZap, FileText, FolderKanban, Grid3X3, LayoutDashboard, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";

const products = [
  {
    slug: "ai-assistant",
    title: "AI 办公助手",
    description: "围绕文件、文档和知识库提问，自动生成总结、行动项和业务结论。",
    icon: Bot,
  },
  {
    slug: "smart-docs",
    title: "在线文档",
    description: "创建团队文档，支持 AI 写作、版本保存、导出和沉淀到知识库。",
    icon: FileText,
  },
  {
    slug: "drive",
    title: "云盘",
    description: "统一存储 PDF、表格、Word、PPT、图片和处理结果，支持预览与分享。",
    icon: Cloud,
  },
  {
    slug: "knowledge-base",
    title: "知识库",
    description: "把文件和文档切片向量化，构建可问答、可引用的团队知识资产。",
    icon: DatabaseZap,
  },
  {
    slug: "tables",
    title: "智能表格",
    description: "表格导入、清洗、拆分、合并、分析和报表生成。",
    icon: Grid3X3,
  },
  {
    slug: "automation",
    title: "自动化流程",
    description: "把上传、解析、AI 处理、通知和导出串成可追踪任务。",
    icon: Workflow,
  },
  {
    slug: "dashboard",
    title: "数据看板",
    description: "集中查看文件处理、AI 用量、团队协作和业务趋势。",
    icon: LayoutDashboard,
  },
  {
    slug: "workspace",
    title: "协作工作台",
    description: "面向团队的文件、任务、成员、权限和审计管理入口。",
    icon: FolderKanban,
  },
];

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">
            产品能力
          </span>
          <h1 className="mt-8 text-5xl font-black tracking-tight sm:text-6xl">
            用一个 AI 工作空间承接文件、知识和业务流程
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Lumio 把云盘、在线文档、知识库、AI 会话、任务中心和团队权限放在同一套工作流里，适合从个人办公逐步升级到团队协作。
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
                href={`/product/${item.slug}`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mt-6 text-xl font-black">{item.title}</h2>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{item.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-700">
                  查看详情 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black">从工作台开始体验完整闭环</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                上传文件、提问、生成文档、加入知识库、查看任务状态和用量统计，都可以在工作台完成。
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/workspace">进入工作台</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
