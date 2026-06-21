import Link from "next/link";

const footerGroups = [
  {
    title: "产品",
    links: [
      ["AI 办公助手", "/product/ai-assistant"],
      ["云盘", "/product/drive"],
      ["在线文档", "/product/docs"],
      ["知识库", "/product/knowledge"],
    ],
  },
  {
    title: "资源",
    links: [
      ["帮助文档", "/help"],
      ["使用教程", "/help/tutorials"],
      ["博客", "/blog"],
      ["API 文档", "/help/api"],
    ],
  },
  {
    title: "协议",
    links: [
      ["用户协议", "/help/terms"],
      ["隐私政策", "/help/privacy"],
      ["服务协议", "/help/service"],
      ["安全与合规", "/help/security"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f5f7fb]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_1.8fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-9 w-9 grid-cols-3 gap-1 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 p-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="rounded-sm bg-white" />
              ))}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">XUGUANG</p>
              <p className="text-lg font-black text-slate-950">序光</p>
            </div>
          </div>
          <p className="max-w-md leading-7 text-slate-500">
            上传、管理和处理你的办公文件，用 AI 聊天、云盘、在线文档和知识库重新组织工作信息。
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-bold text-slate-950">{group.title}</h3>
              <div className="grid gap-3 text-sm text-slate-500">
                {group.links.map(([label, href]) => (
                  <Link key={label} href={href} className="transition hover:text-blue-700">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-[12px] text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Copyright © {new Date().getFullYear()} 广州序光向上科技有限公司</p>
          <p>粤ICP备2024061848号-1　粤公网安备 44010602009876号　增值电信业务经营许可证：粤B2-20241288</p>
        </div>
      </div>
    </footer>
  );
}
