import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

const posts: Record<string, { title: string; date: string; tag: string; body: string[] }> = {
  "ai-workspace": {
    title: "为什么企业办公需要 AI 工作空间",
    date: "2026-06-13",
    tag: "产品思考",
    body: [
      "单点工具只能解决一次性问题，AI 工作空间要解决的是文件、文档、知识库、任务和团队权限之间的连续流转。",
      "Lumio 的核心思路是让资料先沉淀到云盘和知识库，再通过 AI 会话、任务中心和团队协作把处理结果继续传递给业务流程。",
      "这也是为什么平台需要从上传、解析、切片、问答、总结，到用量、账单和审计日志形成完整闭环。",
    ],
  },
  "file-ai-pipeline": {
    title: "文件 AI 的第一步：解析、切片和引用来源",
    date: "2026-06-12",
    tag: "技术架构",
    body: [
      "文件问答不是把原文件一次性塞给模型，而是要先解析 PDF、Word、表格、TXT 和 Markdown，再按语义切片。",
      "切片后生成 embedding，检索时把最相关的片段作为上下文提供给模型，回答里再附带引用来源。",
      "后续接入 OCR、PPT 解析和更强的文档转换服务后，文件 AI 的覆盖范围会继续扩大。",
    ],
  },
  "team-knowledge-loop": {
    title: "从个人云盘到团队知识库：Lumio 的协作闭环",
    date: "2026-06-10",
    tag: "协作场景",
    body: [
      "企业资料的价值不只在保存，而在被重复调用、被解释、被追踪和被权限保护。",
      "团队可以把文件和在线文档加入知识库，成员围绕知识库提问，答案回到任务中心成为下一步行动。",
      "这条链路需要权限、审计、用量统计和分享能力一起支撑，才能从个人效率工具升级为团队工作空间。",
    ],
  },
};

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-cyan-700">
          <ArrowLeft className="h-4 w-4" />
          返回博客
        </Link>
        <div className="mt-8 rounded-[2rem] bg-slate-950 p-8 text-white sm:p-12">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <CalendarDays className="h-4 w-4" />
            {post.date}
            <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-bold text-cyan-100">{post.tag}</span>
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
        </div>
        <article className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {post.body.map((paragraph) => (
            <p key={paragraph} className="mb-5 text-lg leading-9 text-slate-700 last:mb-0">
              {paragraph}
            </p>
          ))}
        </article>
      </section>
    </main>
  );
}
