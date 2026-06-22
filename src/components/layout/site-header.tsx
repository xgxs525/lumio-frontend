"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Cloud,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

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
  tag?: string;
};

const productItems: MenuItem[] = [
  { href: "/product/ai-assistant", title: "AI 办公助手", description: "用自然语言完成文件问答、资料总结、内容生成和自动化任务。", tag: "AI" },
  { href: "/product/drive", title: "云盘", description: "统一存储文件、模板、知识库附件和 AI 处理结果，支持团队共享。", tag: "存储" },
  { href: "/product/docs", title: "在线文档", description: "在线写作、AI 改写、协作编辑和团队资料沉淀。", tag: "协作" },
  { href: "/product/knowledge", title: "知识库", description: "沉淀 SOP、教程、制度和业务资料，形成可问答的知识资产。", tag: "知识" },
  { href: "/product/file-ai", title: "文件 AI", description: "解析 PDF、Word、表格、PPT、图片和文本，并支持问答与总结。", tag: "处理" },
  { href: "/product/workspace", title: "工作台", description: "统一管理任务、成员、权限、处理记录和团队空间。", tag: "空间" },
  { href: "/product/automation", title: "自动化流程", description: "让文件解析、数据处理、消息提醒和审批流自动运转。", tag: "流程" },
  { href: "/product/analytics", title: "数据看板", description: "汇总文件、任务和业务数据，形成可视化经营视图。", tag: "看板" },
];

const solutionItems: MenuItem[] = [
  { href: "/solutions/ecommerce", title: "电商运营解决方案", description: "订单拆分、销售统计、库存分析和商品资料清洗。", tag: "电商" },
  { href: "/solutions/finance", title: "财务办公解决方案", description: "账单整理、费用统计、对账和发票资料处理。", tag: "财务" },
  { href: "/solutions/hr", title: "人事行政解决方案", description: "员工信息、考勤统计、排班和工资资料整理。", tag: "人事" },
  { href: "/solutions/sales", title: "销售管理解决方案", description: "客户表管理、线索跟进、业绩报表和区域分析。", tag: "销售" },
  { href: "/solutions/knowledge", title: "知识管理解决方案", description: "制度、项目资料、教程和常见问题集中沉淀。", tag: "知识" },
  { href: "/solutions/analytics", title: "企业数据分析解决方案", description: "订单、客户、销售、库存和业务趋势分析。", tag: "分析" },
  { href: "/solutions/team", title: "团队协作解决方案", description: "把文件、文档、任务和知识库连接成团队工作空间。", tag: "协作" },
  { href: "/solutions/security", title: "安全合规解决方案", description: "围绕权限、审计、空间隔离和数据访问做治理。", tag: "安全" },
];

const resourceItems: MenuItem[] = [
  { href: "/templates", title: "模板中心", description: "办公模板、场景模板和可复用资料库。", tag: "模板" },
  { href: "/help", title: "帮助文档", description: "账号、文件上传、数据处理和会员说明。", tag: "帮助" },
  { href: "/help/tutorials", title: "使用教程", description: "基础入门、功能教程和常见操作。", tag: "教程" },
  { href: "/help/cases", title: "案例中心", description: "电商、财务、销售和团队协作案例。", tag: "案例" },
  { href: "/blog", title: "博客", description: "产品更新、实践案例和行业方案。", tag: "博客" },
  { href: "/help/api", title: "API 文档", description: "面向企业客户和开发者的集成说明。", tag: "API" },
  { href: "/help/security", title: "安全与合规", description: "数据加密、权限管理和企业安全说明。", tag: "合规" },
];

const menuCategories: Record<string, string[]> = {
  产品: ["精选推荐", "AI 能力", "协作办公", "数据处理", "知识管理", "安全管理"],
  解决方案: ["行业解决方案", "部门场景", "团队协作", "企业知识", "经营分析"],
  资源中心: ["精选推荐", "使用教程", "帮助文档", "开发者", "安全合规"],
};

const languages = [
  "English",
  "Bahasa Indonesia",
  "Español",
  "Português",
  "Türkçe",
  "العربية",
  "ไทย",
  "日本語",
  "한국어",
];

const AUTH_ME_CACHE_KEY = "lumio_me_checked_at";
const AUTH_ME_CACHE_MS = 2 * 60 * 1000;

function sameSection(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SiteLanguageSwitcher() {
  return (
    <div className="group/lang relative flex h-full items-center">
      <button className="inline-flex h-full items-center gap-1 text-slate-300 hover:text-white" type="button">
        <Globe2 className="h-3.5 w-3.5" />
        中国站
        <ChevronDown className="h-3 w-3 transition group-hover/lang:rotate-180" />
      </button>
      <div className="invisible absolute right-0 top-full z-[100] w-80 pt-0 opacity-0 transition group-hover/lang:visible group-hover/lang:opacity-100 group-focus-within/lang:visible group-focus-within/lang:opacity-100">
        <div className="rounded-b-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="text-lg font-semibold">中国站</div>
          <button className="mt-4 flex w-full items-center border-l-2 border-red-600 px-4 py-2 text-left text-sm font-semibold text-red-600" type="button">
            简体中文
          </button>
          <div className="my-4 h-px bg-slate-200" />
          <div className="text-lg font-semibold">International</div>
          <div className="mt-3 grid gap-1">
            {languages.map((language) => (
              <button key={language} className="rounded-lg px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950" type="button">
                {language}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">站点归属会根据注册账号区域自动识别；这里仅切换界面语言。</p>
        </div>
      </div>
    </div>
  );
}

function MegaMenu({
  label,
  href,
  items,
  active,
}: {
  label: string;
  href: string;
  items: MenuItem[];
  active?: boolean;
}) {
  const categories = menuCategories[label] ?? [];

  return (
    <div className="group/nav relative">
      <Link
        href={href}
        className={`inline-flex h-12 items-center gap-1 border-b-2 px-1 text-[15px] font-semibold transition focus-visible:outline-none ${
          active
            ? "border-slate-950 text-slate-950"
            : "border-transparent text-slate-800 hover:border-slate-950 hover:text-slate-950"
        }`}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition group-hover/nav:rotate-180 group-focus-within/nav:rotate-180" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-[80] w-screen -translate-x-1/2 border-t border-slate-200 bg-white opacity-0 shadow-[0_30px_80px_rgba(15,23,42,0.12)] transition duration-150 group-hover/nav:visible group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:opacity-100">
        <div className="mx-auto grid max-h-[calc(100vh-140px)] max-w-[1440px] gap-10 overflow-y-auto px-8 py-8 lg:grid-cols-[300px_1fr]">
          <aside>
            <Link href={href} className="inline-flex items-center gap-3 text-2xl font-semibold text-slate-950">
              查看所有{label}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <label className="mt-6 flex h-11 items-center gap-3 rounded-full border border-slate-200 px-4 text-sm text-slate-400">
              <Search className="h-4 w-4" />
              <span>搜索{label}</span>
            </label>
            <div className="mt-6 space-y-3">
              {categories.map((category, index) => (
                <div
                  key={category}
                  className={`w-fit border-b-2 pb-1 text-base ${
                    index === 0 ? "border-slate-950 font-semibold text-slate-950" : "border-transparent text-slate-500"
                  }`}
                >
                  {category}
                </div>
              ))}
            </div>
          </aside>

          <section>
            <h3 className="text-2xl font-semibold text-slate-950">{label === "产品" ? "精选推荐" : label}</h3>
            <div className="mt-7 grid gap-x-16 gap-y-9 md:grid-cols-2">
              {items.map((item, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group/item grid min-w-0 grid-cols-[38px_1fr] gap-4 rounded-2xl p-2 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white ${
                      index % 4 === 0
                        ? "bg-blue-600"
                        : index % 4 === 1
                          ? "bg-cyan-500"
                          : index % 4 === 2
                            ? "bg-emerald-500"
                            : "bg-violet-500"
                    }`}
                  >
                    {item.tag ?? item.title.slice(0, 1)}
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-950 group-hover/item:text-blue-700">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">{item.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function AvatarMenu({ auth }: { auth: StoredAuth }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.logout(auth.token);
    } catch {
      // Local logout should still work if the backend is temporarily unavailable.
    }
    clearStoredAuth();
    router.push("/");
  }

  const profileLinks = [
    { href: "/workspace", label: "工作台", icon: LayoutDashboard },
    { href: "/settings", label: "账号设置", icon: Settings },
    { href: "/drive", label: "云盘", icon: Cloud },
  ].filter((item) => !sameSection(pathname, item.href));

  return (
    <div className="group/avatar relative">
      <button className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
        {getAvatarInitial(auth.user)}
      </button>
      <div className="invisible absolute right-0 top-full z-[90] w-64 pt-3 opacity-0 transition duration-150 group-hover/avatar:visible group-hover/avatar:opacity-100 group-focus-within/avatar:visible group-focus-within/avatar:opacity-100">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_26px_80px_rgba(15,23,42,0.14)]">
          <div className="border-b border-slate-200 px-3 py-3">
            <p className="truncate text-sm font-bold text-slate-950">{getDisplayName(auth.user)}</p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {typeof auth.workspace.name === "string" ? auth.workspace.name : "个人工作空间"}
            </p>
          </div>
          {profileLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 ${
                  index === 0 ? "mt-2" : ""
                }`}
                href={item.href}
              >
                <Icon className="h-4 w-4 text-blue-600" />
                {item.label}
              </Link>
            );
          })}
          <button
            className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-slate-200 px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
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
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/help?query=${encodeURIComponent(query)}`);
  }

  useEffect(() => {
    function refreshAuth() {
      setAuth(getStoredAuth());
    }

    refreshAuth();
    const stored = getStoredAuth();
    if (stored?.token) {
      const lastChecked = Number(window.sessionStorage.getItem(AUTH_ME_CACHE_KEY) || 0);
      if (Date.now() - lastChecked >= AUTH_ME_CACHE_MS) {
        window.sessionStorage.setItem(AUTH_ME_CACHE_KEY, String(Date.now()));
        api
          .me(stored.token)
          .then((result) => {
            updateStoredIdentity(result.data);
            setAuth(getStoredAuth());
          })
          .catch(() => {
            window.sessionStorage.removeItem(AUTH_ME_CACHE_KEY);
            clearStoredAuth();
            setAuth(null);
          });
      }
    }

    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    window.addEventListener("storage", refreshAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuth);
      window.removeEventListener("storage", refreshAuth);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white text-slate-950 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="hidden h-8 bg-slate-950 text-xs text-slate-300 lg:block">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-end gap-6 px-8">
          <SiteLanguageSwitcher />
        </div>
      </div>

      <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="序光首页" className="flex shrink-0 items-center font-black text-slate-950">
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">XUGUANG</span>
            <span className="text-[25px] tracking-tight">序光</span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-[15px] font-medium text-slate-800 lg:flex">
          <form
            className="flex h-10 w-64 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 transition focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
            onSubmit={handleSearchSubmit}
          >
            <Search className="h-4 w-4 shrink-0" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索产品、文档..."
              type="search"
              value={searchQuery}
            />
          </form>
          {auth ? (
            <AvatarMenu auth={auth} />
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-700">
                登录
              </Link>
              <Button asChild className="rounded-full bg-blue-600 px-6 text-white shadow-[0_14px_30px_rgba(37,99,235,0.18)] hover:bg-blue-700">
                <Link href="/register">免费开始</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {auth ? (
            <AvatarMenu auth={auth} />
          ) : (
            <Button asChild className="rounded-full bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">
              <Link href="/register">免费开始</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-lg font-extrabold text-slate-950">导航</span>
              <button onClick={() => setMobileMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <nav className="space-y-2">
                <Link href="/product" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">产品</Link>
                <Link href="/solutions" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">解决方案</Link>
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">价格</Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">资源中心</Link>
                <div className="my-3 border-t border-slate-200" />
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">登录</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-bold text-white hover:bg-blue-700">免费开始</Link>
              </nav>
            </div>
          </div>
        </div>
      ) : null}

      <div className="hidden border-t border-slate-200 bg-white lg:block">
        <div className="mx-auto flex h-12 max-w-[1440px] items-center px-8">
          <nav className="flex items-center gap-12">
            <MegaMenu label="产品" href="/product" items={productItems} active={sameSection(pathname, "/product")} />
            <MegaMenu label="解决方案" href="/solutions" items={solutionItems} active={sameSection(pathname, "/solutions")} />
            <Link
              className={`inline-flex h-12 items-center border-b-2 px-1 text-[15px] font-semibold transition ${
                sameSection(pathname, "/pricing")
                  ? "border-slate-950 text-slate-950"
                  : "border-transparent text-slate-800 hover:border-slate-950 hover:text-slate-950"
              }`}
              href="/pricing"
            >
              价格
            </Link>
            <MegaMenu
              label="资源中心"
              href="/help"
              items={resourceItems}
              active={sameSection(pathname, "/help") || sameSection(pathname, "/blog") || sameSection(pathname, "/templates")}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}
