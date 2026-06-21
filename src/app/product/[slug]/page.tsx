import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const products: Record<string, { title: string; subtitle: string; points: string[]; actions: string[] }> = {
  ai: {
    title: "AI 办公助手",
    subtitle: "像聊天一样处理文件、文档、表格和知识库问题。",
    points: ["文件问答与总结", "文档 AI 写作", "知识库引用来源", "任务状态和用量记录"],
    actions: ["上传文件后提问", "生成行动项", "沉淀为知识"],
  },
  docs: {
    title: "在线文档",
    subtitle: "创建、保存、导出和分享团队文档，并让 AI 帮你写作。",
    points: ["在线编辑", "AI 续写与总结", "版本记录", "加入知识库"],
    actions: ["新建文档", "AI 改写", "导出资料"],
  },
  drive: {
    title: "云盘",
    subtitle: "统一管理办公文件、模板、知识库附件和 AI 处理结果。",
    points: ["文件上传", "在线预览", "AI 索引", "链接分享"],
    actions: ["新建文件", "上传资料", "查看预览"],
  },
  knowledge: {
    title: "知识库",
    subtitle: "把团队资料转成可检索、可问答、可引用的知识资产。",
    points: ["知识库创建", "文件加入知识库", "文档加入知识库", "带来源问答"],
    actions: ["登记资料来源", "同步索引", "知识问答"],
  },
  tables: {
    title: "智能表格",
    subtitle: "处理表格导入、清洗、拆分、合并和分析任务。",
    points: ["表格解析", "数据清洗", "拆分合并", "报表生成"],
    actions: ["上传表格", "开始清洗", "生成结果文件"],
  },
  workflow: {
    title: "自动化流程",
    subtitle: "让上传、解析、AI 处理、通知和导出进入可追踪任务流。",
    points: ["异步任务", "失败重试", "用量记录", "审计日志"],
    actions: ["创建任务", "查看队列", "导出结果"],
  },
};

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products[slug] ?? products.ai;

  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Link href="/product" className="text-sm font-bold text-sky-700">返回产品</Link>
            <h1 className="mt-8 text-5xl font-black tracking-tight">{product.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{product.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/workspace" className="rounded-full bg-sky-600 px-6 py-3 text-sm font-black text-white">立即使用</Link>
              <Link href="/help/api-docs" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-black">查看文档</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black">核心能力</h2>
            <div className="mt-6 grid gap-4">
              {product.points.map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-sky-600" />
                  <span className="font-bold">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-black">典型流程</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {product.actions.map((action, index) => (
            <div key={action} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-100 text-sm font-black text-sky-700">{index + 1}</span>
              <h3 className="mt-6 text-xl font-black">{action}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">已纳入序光工作流规划，能实现的部分已接入真实接口，外部服务可配置接入。</p>
            </div>
          ))}
        </div>
        <Link href="/workspace" className="mt-10 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white">
          进入工作台 <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
