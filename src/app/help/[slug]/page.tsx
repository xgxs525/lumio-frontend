"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Code2, FileQuestion, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";

const articleMap: Record<
  string,
  {
    title: string;
    description: string;
    sections: Array<{ heading: string; body: string; points: string[] }>;
  }
> = {
  "getting-started": {
    title: "使用教程",
    description: "从创建账号到上传文件、生成文档、进入知识库问答的完整路径。",
    sections: [
      {
        heading: "第一次使用",
        body: "先注册或登录账号，Lumio 会自动创建个人工作空间。进入工作台后，可以从云盘上传文件，或直接新建文档。",
        points: ["创建账号", "进入工作台", "上传第一份资料", "在 AI 助手里提问"],
      },
      {
        heading: "文件处理流程",
        body: "上传后可以预览文件、提交解析任务、生成摘要、加入知识库，并在任务中心查看状态。",
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
        points: ["账单整理", "费用统计", "凭证归档", "审计留痕"],
      },
    ],
  },
  docs: {
    title: "帮助文档",
    description: "账号、文件、知识库、团队、套餐和权限相关说明。",
    sections: [
      {
        heading: "账号与权限",
        body: "账号体系支持个人空间和团队空间，后续可接短信、邮箱、企业身份和单点登录。",
        points: ["账号登录", "角色权限", "成员邀请", "账号注销"],
      },
      {
        heading: "文件与知识库",
        body: "文件进入云盘后可以解析、切片、向量化，再加入知识库用于问答和引用来源。",
        points: ["文件上传", "文件预览", "加入知识库", "知识库问答"],
      },
    ],
  },
  updates: {
    title: "更新日志",
    description: "记录产品功能、接口、页面和数据结构的迭代。",
    sections: [
      {
        heading: "一期闭环",
        body: "补齐工作台权限、云盘、文档、知识库、任务中心、用量统计和管理后台。",
        points: ["登录态拦截", "真实 API 接入", "独立详情页", "用量记录"],
      },
      {
        heading: "文件 AI",
        body: "文件解析、切片、embedding、问答、总结和任务状态进入异步任务流。",
        points: ["解析任务", "向量索引", "问答保存", "任务追踪"],
      },
    ],
  },
  api: {
    title: "API 文档",
    description: "面向企业客户和开发者的接口说明，当前优先覆盖工作台核心能力。",
    sections: [
      {
        heading: "鉴权",
        body: "登录后使用 Bearer Token 访问工作台接口。前端统一在请求头中带入 Authorization。",
        points: ["POST /auth/login", "GET /auth/me", "POST /auth/logout"],
      },
      {
        heading: "核心资源",
        body: "云盘、文档、知识库、任务、团队、用量和账单均使用统一 JSON 响应。",
        points: ["GET /drive/files", "GET /documents", "GET /knowledge-bases", "GET /jobs"],
      },
    ],
  },
  security: {
    title: "安全与合规",
    description: "数据安全、访问权限、审计日志和企业级安全能力说明。",
    sections: [
      {
        heading: "数据保护",
        body: "文件存储、元数据、知识库切片和 AI 会话分工作空间隔离，后续可接企业 OSS 与 KMS。",
        points: ["工作空间隔离", "权限控制", "审计日志", "外部存储"],
      },
      {
        heading: "合规规划",
        body: "当前先保留安全与合规说明入口，企业备案、等保、合同和 DPA 需要后续材料支持。",
        points: ["企业合同", "安全白皮书", "数据处理协议", "审计导出"],
      },
    ],
  },
  privacy: {
    title: "隐私与协议",
    description: "用户协议、隐私政策、服务协议和数据处理说明。",
    sections: [
      {
        heading: "用户协议",
        body: "说明账号使用、内容上传、服务限制、支付订单和账号注销相关规则。",
        points: ["账号规则", "内容责任", "套餐权益", "终止服务"],
      },
      {
        heading: "隐私政策",
        body: "说明收集哪些账号和使用数据、如何用于服务运行、以及用户如何请求删除数据。",
        points: ["数据收集", "数据使用", "数据删除", "联系方式"],
      },
    ],
  },
};

export default function HelpDetailPage() {
  const params = useParams<{ slug: string }>();
  const article = articleMap[params.slug] ?? articleMap.docs;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cyan-700" href="/help">
          <ArrowLeft className="h-4 w-4" />
          返回资源中心
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-8 sm:p-10">
              <h1 className="text-5xl font-black tracking-tight">{article.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{article.description}</p>
            </div>
            <div className="grid gap-0 divide-y divide-slate-200">
              {article.sections.map((section) => (
                <section key={section.heading} className="p-8 sm:p-10">
                  <h2 className="text-2xl font-black">{section.heading}</h2>
                  <p className="mt-4 leading-8 text-slate-600">{section.body}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {section.points.map((point) => (
                      <div key={point} className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-4">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-600" />
                        <span className="truncate text-sm font-bold">{point}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <FileQuestion className="h-7 w-7 text-cyan-600" />
              <h2 className="mt-5 text-xl font-black">还没解决？</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">可以进入工作台，把文件或问题交给 AI 助手继续处理。</p>
              <Button className="mt-5 w-full" asChild>
                <Link href="/workspace">进入工作台</Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Code2 className="h-7 w-7 text-blue-600" />
              <h2 className="mt-5 text-xl font-black">开发接入</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">后续企业客户可以通过 API、Webhook 和私有化部署接入。</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <LockKeyhole className="h-7 w-7 text-emerald-600" />
              <h2 className="mt-5 text-xl font-black">安全说明</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">所有工作台数据按空间隔离，关键操作进入审计日志。</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
