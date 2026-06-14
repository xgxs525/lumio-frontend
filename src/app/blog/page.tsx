import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";

const posts = [
  {
    slug: "ai-workspace",
    title: "为什么企业办公需要 AI 工作空间，而不只是单点工具",
    date: "2026-06-13",
    tag: "产品思考",
    summary: "当文件、文档、知识库和任务中心连接起来，AI 才能真正进入业务流程。",
  },
  {
    slug: "file-ai-pipeline",
    title: "文件 AI 的第一步：解析、切片和引用来源",
    date: "2026-06-12",
    tag: "技术架构",
    summary: "介绍 PDF、Word、表格、文本解析后的切片方式，以及为什么问答需要保留来源。",
  },
  {
    slug: "team-knowledge-loop",
    title: "从个人云盘到团队知识库：Lumio 的协作闭环",
    date: "2026-06-10",
    tag: "协作场景",
    summary: "把资料上传、文档沉淀、知识问答和任务追踪串起来，减少重复沟通。",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
            <Newspaper className="h-4 w-4" />
            Lumio 博客
          </span>
          <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            记录 AI 办公平台的产品与技术实践
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            分享文件 AI、知识库、团队协作、商业化和工程架构相关内容，后续可接入 CMS 或后台文章管理。
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />
                {post.date}
                <span className="rounded-full bg-cyan-50 px-3 py-1 font-bold text-cyan-700">{post.tag}</span>
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight">{post.title}</h2>
              <p className="mt-4 min-h-24 leading-7 text-slate-600">{post.summary}</p>
              <Link className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-700" href={`/blog/${post.slug}`}>
                阅读全文 <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
