import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  FileSpreadsheet,
  FileText,
  Presentation,
  ReceiptText,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categories = ["经营分析", "财务", "销售", "人事", "项目", "内容运营", "文档", "PPT"];

const templates = [
  {
    icon: BarChart3,
    title: "经营数据看板",
    type: "表格",
    scene: "销售、订单、区域统计",
    usage: "18,420 次使用",
    tags: ["经营分析", "图表", "周报"],
  },
  {
    icon: ReceiptText,
    title: "费用报销与对账表",
    type: "表格",
    scene: "费用登记、审批、对账",
    usage: "12,870 次使用",
    tags: ["财务", "对账", "审批"],
  },
  {
    icon: Users,
    title: "员工档案与排班",
    type: "表格",
    scene: "员工信息、考勤、排班",
    usage: "9,560 次使用",
    tags: ["人事", "考勤", "排班"],
  },
  {
    icon: BriefcaseBusiness,
    title: "销售线索跟进库",
    type: "多维表格",
    scene: "客户管理、跟进记录、回款",
    usage: "15,310 次使用",
    tags: ["销售", "客户", "回款"],
  },
  {
    icon: FileText,
    title: "项目复盘文档",
    type: "文档",
    scene: "里程碑、风险、行动项",
    usage: "7,680 次使用",
    tags: ["项目", "复盘", "协作"],
  },
  {
    icon: Presentation,
    title: "月度汇报 PPT",
    type: "PPT",
    scene: "业务汇报、团队例会、复盘",
    usage: "6,240 次使用",
    tags: ["汇报", "演示", "管理"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#061024] text-white">
      <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div className="min-w-0">
            <Badge className="gap-2 border-cyan-200/25 bg-cyan-200/10 text-cyan-50">
              <Sparkles className="h-3.5 w-3.5" />
              模板中心
            </Badge>
            <h1 className="mt-5 max-w-3xl text-[42px] font-black leading-[1.08] tracking-tight md:text-[62px]">
              沉淀可复用的办公模板
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300/78">
              浏览公开模板、预览结构并一键带入工作台。上传模板、我的模板、删除和下载等管理操作，统一放在登录后的工作台中。
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-200/20 bg-slate-950/45 px-4 py-3">
              <Search className="h-5 w-5 text-cyan-100" />
              <span className="text-slate-300/82">搜索模板：订单管理、费用报销、销售周报、项目复盘...</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-20 md:px-6 lg:pb-24">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary">公开模板</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">从高频场景开始复用</h2>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/workspace">
              进入工作台管理我的模板
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <article
                key={template.title}
                id={template.title}
                className="group min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:bg-white/[0.09]"
              >
                <div className="relative h-44 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.25),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(29,78,216,0.42))] p-6">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="absolute bottom-5 left-6 right-6 rounded-2xl border border-white/10 bg-slate-950/45 p-3">
                    <div className="mb-2 h-2 rounded-full bg-white/30" />
                    <div className="h-2 w-2/3 rounded-full bg-cyan-200/55" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="truncate text-xl font-black text-white">{template.title}</h3>
                    <span className="shrink-0 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-semibold text-cyan-50">
                      {template.type}
                    </span>
                  </div>
                  <p className="leading-7 text-slate-300/76">{template.scene}</p>
                  <p className="mt-3 text-sm text-slate-400">{template.usage}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/[0.08] px-3 py-1 text-xs text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="secondary" asChild>
                      <Link href={`/templates#${encodeURIComponent(template.title)}`}>预览</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 hover:from-cyan-200 hover:to-blue-400">
                      <Link href="/login?next=/workspace">使用模板</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-20 md:px-6 lg:pb-24">
        <div className="rounded-[30px] border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(8,19,44,0.96),rgba(17,24,66,0.96)_45%,rgba(7,80,114,0.82))] p-8 md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black">把团队常用模板沉淀到工作台</h2>
              <p className="mt-3 max-w-3xl leading-8 text-slate-300/78">
                登录后可上传企业自己的表格、文档、PPT 和 PDF 模板，并在云盘、文档和知识库中复用。
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/workspace">
                打开工作台
                <FileSpreadsheet className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
