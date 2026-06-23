"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Search } from "lucide-react";

import { BackNav } from "@/components/common/back-nav";
import { CrossLink } from "@/components/common/cross-link";
import { Input } from "@/components/ui/input";

type FaqCategory = "全部" | "账号与登录" | "模型使用" | "文件理解" | "额度与账单" | "隐私与安全";

interface FaqItem {
  q: string;
  a: string;
  category: FaqCategory;
}

const faqs: FaqItem[] = [
  { q: "登录不了怎么办？", a: "请确认输入的邮箱或手机号是否正确，密码是否区分大小写。如果忘记密码，可以在登录页点击「忘记密码」进行重置。", category: "账号与登录" },
  { q: "忘记密码怎么办？", a: "在登录页点击「忘记密码」，按提示输入注册邮箱或手机号，系统会发送验证码用于重置密码。", category: "账号与登录" },
  { q: "注册后为什么没有进入工作台？", a: "注册成功后会自动登录并进入工作台。如果注册后跳转异常，请尝试刷新页面或重新登录。", category: "账号与登录" },
  { q: "如何修改邮箱或手机号？", a: "登录后进入「账号设置」，在安全设置中可以修改绑定的邮箱和手机号。部分操作需要验证当前密码。", category: "账号与登录" },

  { q: "为什么有些模型不可用？", a: "部分模型可能处于接入中或维护状态。可在「模型广场」查看每个模型的当前可用状态。有些模型需要特定套餐才能使用。", category: "模型使用" },
  { q: "怎么选择合适的模型？", a: "如果不确定选哪个模型，可以直接使用「智能推荐」模式，序光会根据你的任务自动推荐。也可以到「模型广场」查看各模型的能力和适用场景。", category: "模型使用" },
  { q: "智能推荐模型是怎么工作的？", a: "序光会分析你的任务类型、内容长度、是否需要推理、是否涉及代码等因素，匹配最适合的 AI 模型给你使用。", category: "模型使用" },
  { q: "可以同时使用多个模型吗？", a: "可以。在智能任务中，每次发送消息时都可以切换模型。也可以为不同任务使用不同模型。", category: "模型使用" },

  { q: "支持哪些文件格式？", a: "目前支持 PDF、Word (.docx)、Excel (.xlsx)、PPT (.pptx)、TXT、Markdown、常见图片格式（JPG/PNG/WebP）和 ZIP 压缩包。", category: "文件理解" },
  { q: "文件上传失败怎么办？", a: "请检查文件是否过大（单文件建议不超过 50MB）、格式是否支持。如果持续失败，可以尝试刷新页面后重新上传。", category: "文件理解" },
  { q: "上传文件后多久可以分析？", a: "小文件通常几秒内即可完成解析，大文件或复杂表格可能需要数十秒。解析完成后可在文件理解页面查看状态。", category: "文件理解" },
  { q: "上传的文件安全吗？", a: "文件经过加密传输和存储，仅你本人和授权团队成员可以访问。详情见隐私政策。", category: "文件理解" },

  { q: "AI 额度怎么消耗？", a: "每次 AI 请求根据使用的模型、输入输出长度、是否包含文件等因素消耗不同数量的额度。模型广场中标注了各模型的消耗水平。", category: "额度与账单" },
  { q: "如何查看剩余额度？", a: "在工作台首页可以看到当日使用次数和剩余额度。进入「账单与额度」页面可查看详细使用记录和额度分布。", category: "额度与账单" },
  { q: "账单在哪里查看？", a: "进入「账单与额度」页面，可以查看消费记录、订单、账单详情和可开票金额。", category: "额度与账单" },
  { q: "额度不够用了怎么办？", a: "可以在「账单与额度」页面查看可用套餐，选择合适的方案进行购买或升级。", category: "额度与账单" },

  { q: "我的数据安全吗？", a: "序光采用加密传输和存储，所有文件、会话和资料均受到安全保护。详细信息见隐私政策和安全合规页面。", category: "隐私与安全" },
  { q: "AI 模型会记住我的对话吗？", a: "对话历史保存在你的账户下，仅用于方便你后续继续使用。不会用于训练模型或其他用途。", category: "隐私与安全" },
  { q: "如何注销账号？", a: "进入「账号设置」→「安全设置」，可以申请注销账号。注销后所有数据将被永久删除，请谨慎操作。", category: "隐私与安全" },
];

const categories: FaqCategory[] = ["全部", "账号与登录", "模型使用", "文件理解", "额度与账单", "隐私与安全"];

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory>("全部");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = faqs.filter((item) => {
    if (category !== "全部" && item.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <main className="bg-white text-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <BackNav />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">常见问题</h1>
        <p className="mt-3 text-lg text-slate-500">
          查找关于账号、模型、文件、额度和使用问题的解答。
        </p>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索问题，例如：文件上传失败、额度消耗、模型不可用"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setOpenIndex(null); }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  category === cat
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          {filtered.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-900 pr-4">{item.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
              {openIndex === i ? (
                <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                  <p className="text-sm leading-7 text-slate-600">{item.a}</p>
                </div>
              ) : null}
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">没有找到相关问题，请尝试其他关键词。</p>
            </div>
          ) : null}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">没有找到答案？</p>
          <div className="mt-3 flex justify-center gap-3">
            <CrossLink href="/docs" className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-700">
              使用指南
            </CrossLink>
            <CrossLink href="/changelog" className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-700">
              更新日志
            </CrossLink>
          </div>
        </div>
      </div>
    </main>
  );
}
