"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";

const productMap: Record<string, { title: string; subtitle: string; points: string[]; actions: string[] }> = {
  "ai-assistant": {
    title: "AI 办公助手",
    subtitle: "像聊天一样处理文件、文档、表格和知识库问题。",
    points: ["文件问答与总结", "文档 AI 写作", "知识库引用来源", "任务状态和用量记录"],
    actions: ["上传文件后提问", "生成行动项", "沉淀为知识"],
  },
  "smart-docs": {
    title: "在线文档",
    subtitle: "创建、保存、导出和分享团队文档，并让 AI 帮你写作。",
    points: ["在线编辑", "AI 续写与总结", "版本记录", "加入知识库"],
    actions: ["创建方案", "导出 Markdown", "分享给团队"],
  },
  drive: {
    title: "云盘",
    subtitle: "统一管理办公文件、模板、知识库附件和 AI 处理结果。",
    points: ["文件上传", "在线预览", "AI 索引", "链接分享"],
    actions: ["新建文件", "上传资料", "查看预览"],
  },
  "knowledge-base": {
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
  automation: {
    title: "自动化流程",
    subtitle: "让上传、解析、AI 处理、通知和导出进入可追踪任务流。",
    points: ["异步任务", "进度追踪", "失败记录", "后续接入队列"],
    actions: ["创建任务", "查看状态", "复用流程"],
  },
  dashboard: {
    title: "数据看板",
    subtitle: "集中观察文件、AI、团队和商业化用量。",
    points: ["用量统计", "任务统计", "团队统计", "后台概览"],
    actions: ["查看用量", "导出记录", "识别异常"],
  },
  workspace: {
    title: "协作工作台",
    subtitle: "为团队提供文件、任务、成员、权限和审计的统一入口。",
    points: ["团队空间", "成员邀请", "角色权限", "审计日志"],
    actions: ["进入工作台", "邀请成员", "配置权限"],
  },
};

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const data = productMap[slug] ?? productMap["ai-assistant"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cyan-700" href="/product">
          <ArrowLeft className="h-4 w-4" />
          返回产品
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white sm:p-12">
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
              Lumio 产品
            </span>
            <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">{data.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{data.subtitle}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/workspace">立即使用</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/help">查看文档</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Rocket className="h-8 w-8 text-cyan-600" />
            <h2 className="mt-5 text-2xl font-black">适合场景</h2>
            <div className="mt-5 grid gap-3">
              {data.actions.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.points.map((point) => (
            <div key={point} className="rounded-3xl border border-slate-200 bg-white p-6">
              <CheckCircle2 className="h-6 w-6 text-cyan-600" />
              <h3 className="mt-5 text-lg font-black">{point}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">已纳入 Lumio 一期到五期的工作流规划，能实现的部分已接入真实接口，外部服务可配置接入。</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
