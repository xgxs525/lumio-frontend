import type { Metadata } from "next";
import { BackNav } from "@/components/common/back-nav";
import { CrossLink } from "@/components/common/cross-link";

export const metadata: Metadata = {
  title: "使用指南 - 序光",
};

const sections = [
  {
    title: "快速开始",
    items: [
      ["如何注册和登录", "点击首页「免费开始」进入注册页，输入邮箱或手机号并设置密码即可创建账号。注册后自动进入工作台。已有账号点击「登录」即可。"],
      ["如何开始第一个智能任务", "登录后在工作台点击「新建任务」，输入你的问题或任务描述，序光会根据内容智能推荐合适的 AI 模型。"],
      ["如何进入工作台", "登录后自动进入工作台。也可以在任意页面点击右上角头像，选择「工作台」进入。"],
    ],
  },
  {
    title: "模型使用",
    items: [
      ["如何选择模型", "在智能任务页面，输入框右侧可以选择模型。也可以到「模型广场」查看所有可用模型的能力和适用场景。"],
      ["如何使用智能推荐", "直接输入任务，不指定模型，序光会根据任务类型、内容长度、是否需要推理等自动推荐最合适的模型。"],
      ["如何设置常用模型", "在「模型广场」找到常用模型，点击星标按钮即可设为常用。常用模型会显示在列表顶部。"],
      ["不同模型适合什么任务", "Claude 适合长文本分析；GPT 适合通用对话和创作；DeepSeek 适合代码和推理；Gemini 适合多模态理解。详情见模型广场。"],
    ],
  },
  {
    title: "智能任务",
    items: [
      ["如何提问", "在输入框中直接输入问题，按 Enter 发送。可以围绕文件、代码、知识等任何内容提问。"],
      ["如何写作", "输入写作需求，例如「帮我写一封商务邮件」「写一段产品介绍文案」，选择写作类模型效果更佳。"],
      ["如何翻译", "输入需要翻译的内容和目标语言，例如「把这段中文翻译成英文」。"],
      ["如何分析内容", "上传或粘贴需要分析的内容，提出分析需求，例如「分析这篇文章的核心观点」。"],
      ["如何处理代码", "粘贴代码并描述需求，例如「解释这段代码的作用」「帮我优化这个函数」。推荐使用 DeepSeek 或 Kimi 模型。"],
    ],
  },
  {
    title: "文件理解",
    items: [
      ["支持哪些文件格式", "目前支持 PDF、Word (.docx)、Excel (.xlsx)、PPT (.pptx)、TXT、Markdown、常见图片格式和压缩包。"],
      ["如何上传文件", "在工作台或文件理解页面点击「上传文件」，选择文件即可上传。也可以直接拖拽文件到上传区域。"],
      ["如何总结文件", "上传文件后，在文件理解页面点击「总结」按钮，或到智能任务中引用该文件并描述需求。"],
      ["如何基于文件提问", "上传文件后进入智能任务，在输入框中引用文件，然后提出具体问题即可。"],
    ],
  },
  {
    title: "图像与视频",
    items: [
      ["如何生成图片", "在智能任务页面输入图像描述，例如「生成一张科技感蓝色背景的海报」，序光会调用图像生成模型处理。"],
      ["如何写图片提示词", "描述越详细生成的图片越精确。建议包含：主体、风格、色彩、构图、用途。例如「一只猫坐在窗边，日式动画风格，暖色调，竖向构图」。"],
      ["如何生成视频脚本", "输入视频主题和需求，序光会生成分场景脚本、旁白文字和画面描述。"],
      ["如何生成分镜提示词", "在视频创作中输入完整的视频描述，序光会拆分为多个分镜，并为每个分镜生成画面提示词。"],
    ],
  },
  {
    title: "账户与额度",
    items: [
      ["如何查看额度", "在工作台顶部可以看到当日使用次数和剩余额度。也可以进入「账单与额度」页面查看详细使用记录。"],
      ["额度如何消耗", "每次 AI 请求根据模型、输入输出长度、是否包含文件等因素消耗不同额度。模型广场中标注了各模型的大致消耗水平。"],
      ["如何查看账单", "进入「账单与额度」页面，可以查看消费记录、订单和账单详情。"],
      ["如何升级套餐", "在「账单与额度」页面查看可用套餐，选择合适方案进行购买或升级。"],
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="bg-white text-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
        <BackNav />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">使用指南</h1>
        <p className="mt-3 text-lg text-slate-500">
          了解如何使用序光开始智能任务、选择模型、理解文件和管理额度。
        </p>

        <div className="mt-12 space-y-14">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <div className="mt-5 grid gap-4">
                {section.items.map(([q, a]) => (
                  <div key={q} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                    <h3 className="text-sm font-bold text-slate-950">{q}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">还有疑问？</p>
          <div className="mt-3 flex justify-center gap-3">
            <CrossLink href="/help/faq" className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-700">
              查看常见问题
            </CrossLink>
            <CrossLink href="/changelog" className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-700">
              查看更新日志
            </CrossLink>
          </div>
        </div>
      </div>
    </main>
  );
}
