"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const solutionMap: Record<string, { title: string; desc: string; workflows: string[]; metrics: string[] }> = {
  ecommerce: {
    title: "电商运营解决方案",
    desc: "把订单、商品、库存、达人合作和销售报表集中管理，减少重复整理。",
    workflows: ["上传订单表并按地区拆分", "清洗重复客户和异常数据", "生成销售摘要和库存预警", "沉淀复盘资料到知识库"],
    metrics: ["订单处理效率", "库存异常数量", "销售报表生成耗时"],
  },
  finance: {
    title: "财务办公解决方案",
    desc: "围绕账单、费用、报销和发票资料进行整理、对账和归档。",
    workflows: ["上传账单和费用表", "提取关键字段", "生成对账摘要", "导出审计记录"],
    metrics: ["对账完成率", "费用异常数", "资料归档量"],
  },
  hr: {
    title: "人事行政解决方案",
    desc: "管理员工资料、考勤、排班和工资相关文档，让行政流程更清晰。",
    workflows: ["整理员工信息表", "汇总考勤和排班", "生成通知文案", "沉淀制度 SOP"],
    metrics: ["资料完整度", "通知送达量", "制度问答命中率"],
  },
  sales: {
    title: "销售管理解决方案",
    desc: "管理客户线索、跟进记录、区域业绩和回款信息。",
    workflows: ["导入客户表", "提取高价值线索", "生成跟进摘要", "形成销售看板"],
    metrics: ["线索跟进率", "区域业绩", "回款风险"],
  },
  warehouse: {
    title: "仓储库存解决方案",
    desc: "集中处理出入库、盘点、SKU 整理和库存异常问题。",
    workflows: ["上传库存表", "按 SKU 清洗数据", "识别异常库存", "生成补货建议"],
    metrics: ["库存准确率", "异常 SKU 数", "补货及时率"],
  },
  content: {
    title: "内容运营解决方案",
    desc: "把选题、排期、账号数据、复盘报告和素材资料放进一个空间。",
    workflows: ["创建选题文档", "导入发布数据", "生成复盘摘要", "归档爆款案例"],
    metrics: ["内容发布数", "账号增长", "复盘完成率"],
  },
  analytics: {
    title: "企业数据分析解决方案",
    desc: "让不同业务表、文档和报告可以统一分析、总结和问答。",
    workflows: ["上传多源数据", "清洗合并表格", "生成趋势摘要", "形成经营看板"],
    metrics: ["数据处理量", "AI 调用量", "经营趋势指标"],
  },
  enterprise: {
    title: "企业协作解决方案",
    desc: "面向团队和企业的权限、审计、用量、套餐和后台管理。",
    workflows: ["创建团队空间", "邀请成员并分配角色", "配置资料权限", "查看审计和用量"],
    metrics: ["成员活跃度", "存储使用量", "AI 配额消耗"],
  },
};

export default function SolutionDetailPage() {
  const params = useParams<{ slug: string }>();
  const data = solutionMap[params.slug] ?? solutionMap.ecommerce;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cyan-700" href="/solutions">
          <ArrowLeft className="h-4 w-4" />
          返回解决方案
        </Link>
        <div className="mt-8 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white sm:p-12">
          <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">{data.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{data.desc}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/workspace">进入工作台</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/help">查看实施步骤</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">推荐工作流</h2>
            <div className="mt-6 grid gap-4">
              {data.workflows.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-100 font-black text-cyan-700">{index + 1}</span>
                  <div>
                    <p className="font-bold">{item}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">可通过云盘、文档、知识库、AI 助手和任务中心串联完成。</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">关注指标</h2>
            <div className="mt-6 grid gap-3">
              {data.metrics.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
