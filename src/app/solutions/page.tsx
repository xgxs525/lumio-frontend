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

const groups = ["行业解决方案", "通用解决方案", "企业协作", "解决方案实践"];

export default function SolutionsPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[320px_1fr] lg:px-10">
          <aside>
            <Link href="/solutions" className="inline-flex items-center gap-3 text-2xl font-semibold">
              查看所有解决方案
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div className="mt-8 space-y-4">
              {groups.map((item, index) => (
                <div key={item} className={`w-fit border-b-2 pb-1 ${index === 0 ? "border-slate-950 font-semibold" : "border-transparent text-slate-500"}`}>
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Solutions</p>
            <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">把 AI 办公能力放进真实业务场景</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              围绕运营、财务、人事、销售、仓储、内容和团队知识管理，序光提供可落地的文件处理与协作方案。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
          {solutions.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.slug} href={`/solutions/${item.slug}`} className="group grid grid-cols-[48px_1fr] gap-5 rounded-[8px] p-4 transition hover:bg-slate-50">
                <span className={`grid h-12 w-12 place-items-center rounded-[8px] text-white ${index % 4 === 0 ? "bg-blue-600" : index % 4 === 1 ? "bg-emerald-500" : index % 4 === 2 ? "bg-orange-500" : "bg-violet-500"}`}>
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
