import Link from "next/link";
import { ArrowRight, BookOpen, FileQuestion, FileText, LifeBuoy, LockKeyhole, Megaphone, Newspaper } from "lucide-react";

const resources = [
  { href: "/help/tutorials", title: "使用教程", desc: "基础入门、文件上传、AI 问答、知识库和团队协作教程。", icon: BookOpen },
  { href: "/help/cases", title: "案例中心", desc: "电商、财务、销售、人事和团队协作的落地案例。", icon: FileText },
  { href: "/help/docs", title: "帮助文档", desc: "账号问题、文件上传、数据处理和会员说明。", icon: FileQuestion },
  { href: "/help/updates", title: "更新日志", desc: "新功能发布、版本更新和产品优化记录。", icon: Megaphone },
  { href: "/help/api", title: "API 文档", desc: "面向企业客户和开发者的集成说明。", icon: LifeBuoy },
  { href: "/help/security", title: "安全与合规", desc: "数据加密、权限管理和企业级安全说明。", icon: LockKeyhole },
  { href: "/blog", title: "博客", desc: "产品实践、行业观察和办公自动化方法。", icon: Newspaper },
];

export default function HelpPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Resources</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">资源中心</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            集中查看教程、帮助文档、案例、API、安全合规和产品更新，帮助团队更快上手序光。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
          {resources.map((item, index) => {
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
