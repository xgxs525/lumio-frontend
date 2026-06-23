"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerGroups = [
  {
    title: "资源",
    links: [
      ["使用指南", "/docs"],
      ["常见问题", "/help/faq"],
      ["更新日志", "/changelog"],
    ],
  },
  {
    title: "账户",
    links: [
      ["登录", "/login"],
      ["免费开始", "/register"],
    ],
  },
  {
    title: "法律",
    links: [
      ["用户协议", "/help/terms"],
      ["隐私政策", "/help/privacy"],
    ],
  },
];

export function SiteFooter() {
  const pathname = usePathname();
  const isWorkspace = pathname?.startsWith("/workspace");

  function toFrom(href: string) {
    if (isWorkspace && (href === "/docs" || href === "/help/faq" || href === "/changelog")) {
      return `${href}?from=workspace`;
    }
    return href;
  }

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">XUGUANG</p>
          <p className="text-lg font-black text-slate-950">序光</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
            一个入口，连接多个 AI 模型。
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-bold text-slate-950">{group.title}</h3>
              <div className="grid gap-2">
                {group.links.map(([label, href]) => (
                  <Link key={label} href={toFrom(href)} className="text-sm text-slate-500 transition hover:text-blue-700">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-[12px] text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} XUGUANG 序光. All rights reserved.</p>
          <p>粤ICP备2024061848号-1　粤公网安备 44010602009876号</p>
        </div>
      </div>
    </footer>
  );
}
