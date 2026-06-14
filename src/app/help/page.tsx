import Link from "next/link";
import { ArrowRight, BookOpen, Code2, FileQuestion, History, LockKeyhole, ShieldCheck } from "lucide-react";

const resources = [
  { slug: "getting-started", title: "使用教程", desc: "从注册、上传文件、创建文档到知识库问答的完整入门路径。", icon: BookOpen },
  { slug: "cases", title: "案例中心", desc: "电商、财务、销售、人事和内容团队的典型用法。", icon: FileQuestion },
  { slug: "docs", title: "帮助文档", desc: "账号、上传、文件处理、分享、权限和套餐说明。", icon: BookOpen },
  { slug: "updates", title: "更新日志", desc: "记录新功能发布、接口调整和产品优化。", icon: History },
  { slug: "api", title: "API 文档", desc: "面向企业客户和开发者的接口说明与鉴权方式。", icon: Code2 },
  { slug: "security", title: "安全与合规", desc: "数据加密、权限管理、审计日志和企业安全说明。", icon: ShieldCheck },
  { slug: "privacy", title: "隐私与协议", desc: "用户协议、隐私政策和服务条款集中入口。", icon: LockKeyhole },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12">
          <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">资源中心</span>
          <h1 className="mt-8 text-5xl font-black tracking-tight sm:text-6xl">帮助你更快上手 Lumio</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            这里集中放置教程、案例、帮助文档、更新日志、API 文档和安全合规说明，避免把说明散落到功能页里。
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.slug} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl" href={`/help/${item.slug}`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mt-6 text-xl font-black">{item.title}</h2>
                <p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">{item.desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-700">
                  查看内容 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
