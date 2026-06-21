import Link from "next/link";

const docs: Record<string, { title: string; description: string; sections: { heading: string; body: string; points: string[] }[] }> = {
  tutorials: {
    title: "使用教程",
    description: "从创建账号到上传文件、生成文档、进入知识库问答的完整路径。",
    sections: [
      {
        heading: "快速开始",
        body: "先注册或登录账号，序光会自动创建个人工作空间。进入工作台后，可以从云盘上传文件，也可以直接新建文档。",
        points: ["创建账号", "进入工作台", "上传第一份资料", "在 AI 助手里提问"],
      },
      {
        heading: "文件处理",
        body: "上传后可以预览文件、提交解析任务、生成摘要、加入知识库，并在任务中心查看执行状态。",
        points: ["文件预览", "异步解析", "摘要生成", "任务状态追踪"],
      },
    ],
  },
  cases: {
    title: "案例中心",
    description: "沉淀电商、财务、销售、人事和内容团队的典型办公场景。",
    sections: [
      {
        heading: "电商运营",
        body: "上传订单、商品和库存资料后，按地区或 SKU 汇总，生成销售摘要和库存风险提示。",
        points: ["订单拆分", "库存清洗", "销售总结", "复盘文档"],
      },
      {
        heading: "财务办公",
        body: "围绕账单、报销、发票和合同资料做自动归档、对账摘要和知识问答。",
        points: ["账单整理", "发票识别", "合同摘要", "费用统计"],
      },
    ],
  },
  "api-docs": {
    title: "API 文档",
    description: "面向企业客户和开发者的接口说明，当前优先覆盖工作台核心能力。",
    sections: [
      {
        heading: "认证方式",
        body: "登录后使用 Bearer Token 访问工作台接口。前端会统一在请求头中带入 Authorization。",
        points: ["注册登录", "当前用户", "刷新状态", "退出登录"],
      },
      {
        heading: "业务接口",
        body: "云盘、文档、知识库、任务、团队、用量和账单均使用统一 JSON 响应。",
        points: ["文件接口", "文档接口", "知识库接口", "任务接口"],
      },
    ],
  },
  security: {
    title: "安全与合规",
    description: "数据安全、访问权限、审计日志和企业级安全能力说明。",
    sections: [
      {
        heading: "数据隔离",
        body: "文件存储、元数据、知识库切片和 AI 会话按工作空间隔离，后续可接企业 OSS 与 KMS。",
        points: ["空间隔离", "角色权限", "审计日志", "分享控制"],
      },
      {
        heading: "合规规划",
        body: "当前保留安全与合规说明入口，企业备案、等保、合同和 DPA 需要后续材料支持。",
        points: ["企业合同", "安全白皮书", "数据处理协议", "审计导出"],
      },
    ],
  },
};

export default async function HelpDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = docs[slug] ?? docs.tutorials;
  return (
    <main className="bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Link href="/help" className="text-sm font-bold text-sky-700">返回资源中心</Link>
        <h1 className="mt-8 text-5xl font-black tracking-tight">{doc.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{doc.description}</p>
        <div className="mt-12 grid gap-6">
          {doc.sections.map((section) => (
            <article key={section.heading} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-black">{section.heading}</h2>
              <p className="mt-4 leading-8 text-slate-600">{section.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {section.points.map((point) => (
                  <span key={point} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">{point}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
