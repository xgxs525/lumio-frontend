import Link from "next/link";
import { ArrowRight, Bot, Cloud, DatabaseZap, FileText, FolderKanban, LayoutDashboard, Network, Workflow } from "lucide-react";

const products = [
  { href: "/product/ai-assistant", title: "AI 聊天", desc: "不只是普通聊天，而是可以连接文件、文档、云盘和知识库的智能办公助手。支持流式输出和文件问答。", icon: Bot },
  { href: "/product/drive", title: "云盘", desc: "平台的文件存储和管理中心。不是普通网盘，而是一个可以被 AI 理解和处理的智能云盘。", icon: Cloud },
  { href: "/product/docs", title: "在线文档", desc: "在线创建、编辑和管理文档。支持 AI 改写、AI 总结和文档导出。", icon: FileText },
  { href: "/product/knowledge", title: "知识库", desc: "建立个人或团队知识库，登记文件、文档来源，让 AI 带引用来源进行问答。", icon: DatabaseZap },
  { href: "/product/file-ai", title: "文件智能处理", desc: "平台最核心的差异化能力。解析 PDF、Word、Excel、PPT、图片和文本，支持问答与总结。", icon: Network },
  { href: "/product/workspace", title: "工作台", desc: "统一查看文件、任务、AI 会话、团队和账号空间，管理团队成员和权限。", icon: LayoutDashboard },
  { href: "/product/automation", title: "自动化任务", desc: "让文件解析、切片、数据处理和业务动作自动流转进入任务中心统一追踪。", icon: Workflow },
  { href: "/product/projects", title: "项目协作", desc: "管理任务、负责人、截止时间、项目资料和团队协同。", icon: FolderKanban },
];

const categories = ["精选推荐", "AI 能力", "协作办公", "数据处理", "知识管理", "安全管理"];

export default function ProductPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[320px_1fr] lg:px-10">
          <aside>
            <Link href="/product" className="inline-flex items-center gap-3 text-2xl font-semibold">
              查看所有产品
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div className="mt-8 space-y-4">
              {categories.map((item, index) => (
                <div key={item} className={`w-fit border-b-2 pb-1 ${index === 0 ? "border-slate-950 font-semibold" : "border-transparent text-slate-500"}`}>
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Product</p>
            <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">XUGUANG 序光产品</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              从云盘、文档、AI 聊天、文件智能处理到知识库和工作空间，XUGUANG 序光把分散的办公资料连接成一个可协作、可检索、可被 AI 理解和处理的智能平台。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
          {products.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="group grid grid-cols-[48px_1fr] gap-5 rounded-[8px] p-4 transition hover:bg-slate-50">
                <span className={`grid h-12 w-12 place-items-center rounded-[8px] text-white ${index % 4 === 0 ? "bg-blue-600" : index % 4 === 1 ? "bg-cyan-500" : index % 4 === 2 ? "bg-emerald-500" : "bg-violet-500"}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="flex items-center gap-2 text-xl font-black text-slate-950">
                    {item.title}
                    <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                  </span>
                  <span className="mt-2 block leading-7 text-slate-500">{item.desc}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
