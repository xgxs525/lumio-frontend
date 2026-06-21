import Link from "next/link";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    slug: "ai-workspace",
    title: "为什么企业办公需要 AI 工作空间",
    summary: "当文件、文档、知识库和任务中心连接起来，AI 才能真正进入业务流程。",
    date: "2026-06-20",
  },
  {
    slug: "file-ai-pipeline",
    title: "文件 AI 的第一步：解析、切片和引用来源",
    summary: "介绍 PDF、Word、表格、文本解析后的切片方式，以及为什么问答需要保留来源。",
    date: "2026-06-18",
  },
  {
    slug: "team-knowledge",
    title: "从个人云盘到团队知识库",
    summary: "把资料上传、文档沉淀、知识问答和任务追踪串起来，减少重复沟通。",
    date: "2026-06-15",
  },
];

export default function BlogPage() {
  return (
    <main className="bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <span className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-sky-700">序光博客</span>
        <h1 className="mt-8 max-w-3xl text-5xl font-black tracking-tight">记录 AI 办公平台的产品与技术实践</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          分享文件 AI、知识库、团队协作、商业化和工程架构相关内容，后续可接入 CMS 或后台文章管理。
        </p>
        <div className="mt-12 grid gap-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-400">{post.date}</p>
                  <h2 className="mt-3 text-2xl font-black">{post.title}</h2>
                  <p className="mt-3 max-w-3xl text-slate-600">{post.summary}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-sky-600 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
