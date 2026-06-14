import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, Building2, FileCheck2, Landmark, PackageSearch, ShoppingBag, Users } from "lucide-react";

const solutions = [
  { slug: "ecommerce", title: "电商运营解决方案", desc: "订单拆分、销售统计、库存分析和商品资料清洗。", icon: ShoppingBag },
  { slug: "finance", title: "财务办公解决方案", desc: "账单整理、费用统计、对账和发票资料处理。", icon: Landmark },
  { slug: "hr", title: "人事行政解决方案", desc: "员工信息、考勤统计、排班和工资资料整理。", icon: Users },
  { slug: "sales", title: "销售管理解决方案", desc: "客户表管理、线索跟进、业绩报表和区域分析。", icon: BriefcaseBusiness },
  { slug: "warehouse", title: "仓储库存解决方案", desc: "库存盘点、出入库记录、SKU 整理和异常预警。", icon: PackageSearch },
  { slug: "content", title: "内容运营解决方案", desc: "选题表、发布排期、账号数据统计和复盘报告。", icon: FileCheck2 },
  { slug: "analytics", title: "企业数据分析解决方案", desc: "多表汇总、可视化看板和业务趋势分析。", icon: BarChart3 },
  { slug: "enterprise", title: "企业协作解决方案", desc: "团队空间、权限、审计、知识库和用量治理。", icon: Building2 },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12">
          <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">解决方案</span>
          <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            把文件处理、知识沉淀和团队协作放到真实业务场景里
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Lumio 不只是单个工具，而是围绕运营、财务、人事、销售、仓储和内容团队的 AI 工作空间。
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {solutions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.slug} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl" href={`/solutions/${item.slug}`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-cyan-200">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mt-6 text-xl font-black">{item.title}</h2>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{item.desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-700">
                  查看方案 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
