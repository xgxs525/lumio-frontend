"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Cloud,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  AUTH_CHANGED_EVENT,
  clearStoredAuth,
  getAvatarInitial,
  getDisplayName,
  getStoredAuth,
  type StoredAuth,
  updateStoredIdentity,
} from "@/lib/auth";

type MenuItem = {
  href: string;
  title: string;
  description: string;
};

const productItems: MenuItem[] = [
  { href: "/product/ai-assistant", title: "AI 办公助手", description: "用自然语言处理文件、文档、知识库和数据任务。" },
  { href: "/product/drive", title: "云盘", description: "统一存储文件、模板和处理结果，支持团队共享与权限管理。" },
  { href: "/product/docs", title: "文档协作", description: "在线写作、总结、改写和沉淀团队资料。" },
  { href: "/product/knowledge", title: "知识库", description: "新建知识库、写文档、沉淀 SOP 和业务资料。" },
  { href: "/product/file-ai", title: "文件 AI", description: "解析 PDF、Word、表格、PPT、图片和文本，并围绕文件问答。" },
  { href: "/product/workspace", title: "团队工作台", description: "管理工作空间、任务、成员、权限和处理记录。" },
];

const solutionItems: MenuItem[] = [
  { href: "/solutions/ecommerce", title: "电商运营解决方案", description: "订单拆分、销售统计、库存分析和商品数据清洗。" },
  { href: "/solutions/finance", title: "财务办公解决方案", description: "账单整理、费用统计、对账和发票资料处理。" },
  { href: "/solutions/hr", title: "人事行政解决方案", description: "员工信息、考勤统计、工资表处理和批量通知。" },
  { href: "/solutions/sales", title: "销售管理解决方案", description: "客户管理、线索跟进、业绩报表和区域分析。" },
  { href: "/solutions/knowledge", title: "知识管理解决方案", description: "制度、项目资料、教程和常见问题集中沉淀。" },
  { href: "/solutions/analytics", title: "经营分析解决方案", description: "订单、客户、销售、库存和业务趋势分析。" },
];

const resourceItems: MenuItem[] = [
  { href: "/help", title: "帮助文档", description: "账号、文件上传、数据处理和会员说明。" },
  { href: "/help/tutorials", title: "使用教程", description: "基础入门、功能教程和常见操作。" },
  { href: "/blog", title: "博客", description: "产品更新、实践案例和行业方案。" },
  { href: "/help/api", title: "API 文档", description: "面向企业客户和开发者的集成说明。" },
  { href: "/help/security", title: "安全与合规", description: "数据加密、权限管理和企业安全说明。" },
  { href: "/help/changelog", title: "更新日志", description: "新功能发布、版本更新和产品优化。" },
];

function LogoMark() {
  return (
    <span className="grid h-11 w-11 shrink-0 grid-cols-3 gap-1 rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 p-1.5 shadow-[0_0_28px_rgba(34,211,238,0.35)]">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="rounded-[3px] bg-white/85" />
      ))}
    </span>
  );
}

function MegaMenu({ label, href, items }: { label: string; href: string; items: MenuItem[] }) {
  return (
    <div className="group/nav relative">
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white/78 transition hover:bg-white/10 hover:text-white"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition group-hover/nav:rotate-180" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-[80] w-[840px] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover/nav:visible group-hover/nav:opacity-100">
        <div className="grid gap-3 rounded-2xl border border-white/12 bg-slate-950/96 p-3 shadow-[0_26px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-200/45 hover:bg-white/[0.08]"
            >
              <p className="font-bold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300/72">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function sameSection(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AvatarMenu({ auth }: { auth: StoredAuth }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.logout(auth.token);
    } catch {
      // 本地退出优先。
    }
    clearStoredAuth();
    router.push("/");
  }

  const profileLinks = [
    { href: "/", label: "官网首页", icon: Home },
    { href: "/workspace", label: "工作台", icon: LayoutDashboard },
    { href: "/settings", label: "账号设置", icon: Settings },
    { href: "/drive", label: "云盘", icon: Cloud },
  ].filter((item) => !sameSection(pathname, item.href));

  return (
    <div className="group/avatar relative">
      <button className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-black text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.25)]">
        {getAvatarInitial(auth.user)}
      </button>
      <div className="invisible absolute right-0 top-full z-[90] w-64 pt-3 opacity-0 transition duration-150 group-hover/avatar:visible group-hover/avatar:opacity-100">
        <div className="rounded-2xl border border-white/12 bg-slate-950/96 p-2 shadow-[0_26px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="border-b border-white/10 px-3 py-3">
            <p className="truncate text-sm font-bold text-white">{getDisplayName(auth.user)}</p>
            <p className="mt-1 truncate text-xs text-slate-400">
              {typeof auth.workspace.name === "string" ? auth.workspace.name : "个人工作空间"}
            </p>
          </div>
          {profileLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] ${
                  index === 0 ? "mt-2" : ""
                }`}
                href={item.href}
              >
                <Icon className="h-4 w-4 text-cyan-200" />
                {item.label}
              </Link>
            );
          })}
          <button
            className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-white/10 px-3 py-3 text-left text-sm font-semibold text-red-100 hover:bg-red-500/10"
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    function refreshAuth() {
      setAuth(getStoredAuth());
    }

    refreshAuth();
    const stored = getStoredAuth();
    if (stored?.token) {
      api
        .me(stored.token)
        .then((result) => {
          updateStoredIdentity(result.data);
          setAuth(getStoredAuth());
        })
        .catch(() => {
          clearStoredAuth();
          setAuth(null);
        });
    }

    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    window.addEventListener("storage", refreshAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuth);
      window.removeEventListener("storage", refreshAuth);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b1d]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-black text-white">
          <LogoMark />
          <span className="leading-none">
            <span className="block text-lg tracking-tight">Lumio</span>
            <span className="block text-sm text-cyan-100/78">序光</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-1 xl:flex">
          <Link className="rounded-xl px-3 py-2 text-sm font-semibold text-white/78 transition hover:bg-white/10 hover:text-white" href="/">
            首页
          </Link>
          <MegaMenu label="产品" href="/product" items={productItems} />
          <MegaMenu label="解决方案" href="/solutions" items={solutionItems} />
          <Link className="rounded-xl px-3 py-2 text-sm font-semibold text-white/78 transition hover:bg-white/10 hover:text-white" href="/templates">
            模板中心
          </Link>
          <MegaMenu label="资源中心" href="/help" items={resourceItems} />
          <Link className="rounded-xl px-3 py-2 text-sm font-semibold text-white/78 transition hover:bg-white/10 hover:text-white" href="/pricing">
            价格
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {auth ? (
            <>
              {!sameSection(pathname, "/workspace") && (
                <Button variant="outline" asChild>
                  <Link href="/workspace">工作台</Link>
                </Button>
              )}
              <AvatarMenu auth={auth} />
            </>
          ) : (
            <>
              <Button className="hidden sm:inline-flex" variant="ghost" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 hover:from-cyan-200 hover:to-blue-400"
              >
                <Link href="/register">
                  <Sparkles className="h-4 w-4" />
                  免费开始
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
