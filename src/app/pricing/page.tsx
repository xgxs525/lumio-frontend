import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";

const plans = [
  {
    name: "免费版",
    price: "¥0",
    desc: "适合个人体验核心文件处理和 AI 问答。",
    cta: "免费开始",
    href: "/register",
    features: ["基础文件上传", "个人云盘空间", "基础 AI 问答", "模板浏览"],
  },
  {
    name: "专业版",
    price: "¥29",
    unit: "/ 月",
    desc: "适合个人办公、自由职业者和高频资料处理。",
    cta: "选择专业版",
    href: "/register",
    featured: true,
    features: ["更大文件容量", "文件总结与问答", "文档 AI 写作", "更多处理额度"],
  },
  {
    name: "团队版",
    price: "¥99",
    unit: "/ 月",
    desc: "适合小团队共享资料、知识库和任务处理。",
    cta: "选择团队版",
    href: "/register",
    features: ["团队成员管理", "团队知识库", "权限与分享", "用量统计"],
  },
  {
    name: "企业版",
    price: "定制",
    desc: "适合需要私有化、专属模型、审计和集成的企业。",
    cta: "联系方案顾问",
    href: "/enterprise",
    features: ["私有化部署", "专属模型配置", "企业安全审计", "API 与系统集成"],
  },
];

const compare = [
  ["文件处理", "基础", "增强", "团队共享", "企业定制"],
  ["AI 调用额度", "体验额度", "个人高频", "团队额度池", "专属配额"],
  ["知识库", "个人知识库", "个人知识库", "团队知识库", "企业知识中台"],
  ["权限与审计", "基础", "基础", "角色权限", "高级审计"],
];

export default function PricingPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="mx-auto max-w-[1440px] px-6 py-20 text-center lg:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Pricing</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">选择适合团队阶段的套餐</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            从个人体验到企业级部署，序光按照文件存储、AI 调用额度、团队成员和安全能力提供不同套餐。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-[8px] border p-7 shadow-sm ${plan.featured ? "border-blue-500 bg-blue-50/60" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black">{plan.name}</h2>
                {plan.featured ? <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">推荐</span> : null}
              </div>
              <p className="mt-5 text-5xl font-black text-slate-950">
                {plan.price}
                {plan.unit ? <span className="text-base font-semibold text-slate-500">{plan.unit}</span> : null}
              </p>
              <p className="mt-5 min-h-[56px] leading-7 text-slate-500">{plan.desc}</p>
              <Link
                href={plan.href}
                className={`mt-7 inline-flex h-12 w-full items-center justify-center rounded-[8px] font-bold ${
                  plan.featured ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-300 bg-white text-slate-950 hover:border-blue-500"
                }`}
              >
                {plan.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <div className="mt-7 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Compare</p>
              <h2 className="mt-4 text-4xl font-black">能力对比</h2>
              <p className="mt-5 leading-8 text-slate-600">先按当前团队规模选择套餐，后续可升级到团队或企业能力。</p>
            </div>
            <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white">
              {compare.map((row) => (
                <div key={row[0]} className="grid grid-cols-5 border-b border-slate-200 last:border-b-0">
                  {row.map((cell, index) => (
                    <div key={`${row[0]}-${cell}`} className={`min-w-0 px-4 py-4 text-sm ${index === 0 ? "font-bold text-slate-950" : "text-slate-600"}`}>
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [Sparkles, "AI 额度", "不同套餐拥有不同 AI 调用额度，企业版可接专属模型网关。"],
            [Users, "成员限制", "团队版支持多人协作，企业版支持更细权限、部门和审计策略。"],
            [ShieldCheck, "安全合规", "重要数据建议使用企业版，便于接入对象存储、审计和私有化部署。"],
          ].map(([Icon, title, desc]) => {
            const TypedIcon = Icon as typeof Sparkles;
            return (
              <div key={title as string} className="rounded-[8px] border border-slate-200 bg-white p-7">
                <TypedIcon className="h-6 w-6 text-blue-600" />
                <h3 className="mt-5 text-xl font-black">{title as string}</h3>
                <p className="mt-3 leading-7 text-slate-500">{desc as string}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
