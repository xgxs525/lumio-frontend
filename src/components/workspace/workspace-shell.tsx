"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Cloud,
  CreditCard,
  DatabaseZap,
  FileSearch,
  FileText,
  Film,
  Globe2,
  Headphones,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  TicketPercent,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  clearStoredAuth,
  getAvatarInitial,
  getDisplayName,
  getStoredAuth,
  type StoredAuth,
  updateStoredIdentity,
} from "@/lib/auth";
import { useIsolatedWheelScroll } from "@/hooks/use-isolated-wheel-scroll";
import { cn } from "@/lib/utils";

type WorkspaceShellProps = {
  active: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  rightPanel?: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  pending?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type UtilityKind = "help" | "feedback" | "preferences" | "language" | "account" | null;

const sidebarSections: NavSection[] = [
  {
    title: "核心功能",
    items: [
      { href: "/workspace", label: "工作台", icon: LayoutDashboard },
      { href: "/ai", label: "智能任务", icon: Bot },
      { href: "/models", label: "模型广场", icon: Sparkles },
      { href: "/file-understand", label: "文件理解", icon: FileSearch },
      { href: "/image-gen", label: "图像生成", icon: ImageIcon },
      { href: "/video", label: "视频创作", icon: Film },
    ],
  },
  {
    title: "内容资产",
    items: [
      { href: "/drive", label: "云盘", icon: Cloud },
      { href: "/knowledge", label: "知识库", icon: DatabaseZap },
      { href: "/history", label: "历史记录", icon: Clock },
    ],
  },
  {
    title: "账户",
    items: [
      { href: "/billing", label: "账单与额度", icon: CreditCard },
      { href: "/settings", label: "账号设置", icon: Settings },
    ],
  },
];

const searchableItems = [
  { href: "/workspace", label: "工作台", desc: "多模型 AI 平台使用中心" },
  { href: "/ai", label: "智能任务", desc: "选择模型或智能推荐，完成各类 AI 任务" },
  { href: "/models", label: "模型广场", desc: "浏览和比较已接入的 AI 模型" },
  { href: "/image-gen", label: "图像生成", desc: "输入提示词，生成图片、封面和视觉素材" },
  { href: "/video", label: "视频创作", desc: "选择视频模型，生成短视频、分镜和动态视觉内容" },
  { href: "/drive", label: "云盘", desc: "上传文件，让 AI 读取和分析" },
  { href: "/knowledge", label: "知识库", desc: "沉淀长期资料，让 AI 基于你的内容回答" },
  { href: "/billing", label: "账单与额度", desc: "套餐、订单、支付和额度" },
  { href: "/settings", label: "账号设置", desc: "资料、安全、绑定账号和注销" },
];

const languageOptions = [
  { code: "zh-CN", label: "简体中文", group: "中国站" },
  { code: "zh-HK", label: "繁體中文（中國香港）", group: "中国站" },
  { code: "zh-TW", label: "繁體中文（中國台灣）", group: "中国站" },
  { code: "en", label: "English", group: "International" },
  { code: "ja", label: "日本語", group: "International" },
  { code: "id", label: "Bahasa Indonesia", group: "International" },
  { code: "es", label: "Español", group: "International" },
  { code: "pt", label: "Português", group: "International" },
  { code: "th", label: "ไทย", group: "International" },
];

const helpItems = [
  { href: "/help/faq", label: "常见问题", icon: MessageCircle },
  { href: undefined, label: "联系客服", icon: Headphones },
  { href: undefined, label: "提交反馈", icon: Smile },
  { href: "/docs", label: "使用指南", icon: FileText },
];

let cachedAuth: StoredAuth | null = null;

function currentPathMatches(pathname: string, href: string) {
  if (href === "/workspace") return pathname === "/workspace";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function WorkspaceLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="group/logo relative">
      <Link
        href="/"
        className={cn(
          "flex items-center rounded-3xl px-3 py-3 transition hover:bg-slate-100",
          collapsed ? "justify-center" : "gap-3",
        )}
        aria-label="前往官网"
      >
        {collapsed ? (
          <span className="text-2xl font-black tracking-tight text-slate-950">序</span>
        ) : (
          <div className="flex flex-col leading-none">
            <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">XUGUANG</span>
            <span className="block truncate text-2xl font-black tracking-tight text-slate-950">序光</span>
          </div>
        )}
      </Link>
      <span
        className={cn(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-600 shadow-md",
          collapsed
            ? "left-full top-1/2 ml-3 -translate-y-1/2 group-hover/logo:block"
            : "left-0 top-full mt-1 group-hover/logo:block",
        )}
      >
        前往官网
      </span>
    </div>
  );
}

function selectedLanguageLabel(code: string) {
  return languageOptions.find((item) => item.code === code)?.label ?? "简体中文";
}

function UtilityPanel({
  kind,
  title,
  selectedLanguage,
  onClose,
  onLanguageChange,
}: {
  kind: UtilityKind;
  title: string;
  selectedLanguage: string;
  onClose: () => void;
  onLanguageChange: (value: string) => void;
}) {
  const [score, setScore] = useState<number | null>(null);

  if (!kind || kind === "account") return null;

  const panelWidth = kind === "help" ? "w-[340px]" : "w-[420px]";

  return (
    <aside
      className={`fixed right-5 top-20 z-50 max-w-[calc(100vw-40px)] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60 ${panelWidth}`}
      onMouseLeave={onClose}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {kind === "language" ? "Language" : "Support"}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-slate-950">
            {kind === "help" && "帮助中心"}
            {kind === "feedback" && "满意度评价"}
            {kind === "preferences" && "偏好设置"}
            {kind === "language" && "语言切换"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {kind === "help" ? (
        <div className="space-y-1 p-3">
          {helpItems.map((item) => {
            const Icon = item.icon;
            const inner = (
              <span className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">{item.label}</span>
              </span>
            );
            if (item.href) {
              return (
                <Link key={item.label} href={`${item.href}?from=workspace`} onClick={onClose}
                  className="flex rounded-lg transition hover:bg-slate-50">
                  {inner}
                </Link>
              );
            }
            return (
              <button key={item.label} type="button" onClick={onClose}
                className="flex w-full rounded-lg transition hover:bg-slate-50">
                {inner}
              </button>
            );
          })}
        </div>
      ) : null}

      {kind === "feedback" ? (
        <div className="p-5">
          <p className="text-sm leading-6 text-slate-600">诚邀您对“{title}”页面进行满意度评价，帮助我们继续优化工作台体验。</p>
          <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
            <span>非常不满意</span>
            <span>非常满意</span>
          </div>
          <div className="mt-3 grid grid-cols-11 gap-2">
            {Array.from({ length: 11 }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setScore(index)}
                className={cn(
                  "h-10 rounded-xl border text-sm font-bold transition",
                  score === index
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50",
                )}
              >
                {index}
              </button>
            ))}
          </div>
          <textarea
            className="mt-5 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder="也可以补充说明哪里不好用、哪里看不清、哪里容易误操作。"
          />
          <button
            type="button"
            className="mt-4 w-full rounded-2xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-700"
            onClick={onClose}
          >
            提交评价
          </button>
        </div>
      ) : null}

      {kind === "preferences" ? (
        <div className="space-y-3 p-5">
          {["紧凑模式", "减少动效", "固定顶部栏"].map((item, index) => (
            <label key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <span>
                <span className="block font-black text-slate-950">{item}</span>
                <span className="mt-1 block text-sm text-slate-500">
                  {index === 0 && "提升信息密度，适合高频办公。"}
                  {index === 1 && "降低页面过渡动效，减少闪动感。"}
                  {index === 2 && "滚动页面时保持操作入口可见。"}
                </span>
              </span>
              <input className="h-5 w-5 accent-blue-600" type="checkbox" defaultChecked={index === 2} />
            </label>
          ))}
        </div>
      ) : null}

      {kind === "language" ? (
        <div className="max-h-[68vh] overflow-y-auto p-4">
          {["中国站", "International"].map((group) => (
            <div key={group} className="mb-4">
              <p className="px-3 py-2 text-sm font-black text-slate-500">{group}</p>
              <div className="space-y-1">
                {languageOptions
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => onLanguageChange(item.code)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-semibold transition",
                        selectedLanguage === item.code ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span>{item.label}</span>
                      {selectedLanguage === item.code ? <Check className="h-5 w-5" /> : null}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function AccountPanel({
  auth,
  displayName,
  avatarInitial,
  onLogout,
  onClose,
}: {
  auth: StoredAuth;
  displayName: string;
  avatarInitial: string;
  onLogout: () => void;
  onClose: () => void;
}) {
  const email = typeof auth.user.email === "string" ? auth.user.email : "未绑定邮箱";
  const workspaceName = typeof auth.workspace.name === "string" ? auth.workspace.name : `${displayName}的工作区`;
  const accountId = typeof auth.user.id === "string" ? auth.user.id : "local-account";

  const menuItems = [
    { href: "/workspace", label: "工作台", icon: LayoutDashboard },
    { href: "/billing", label: "账单与额度", icon: CreditCard },
    { href: "/settings", label: "账号设置", icon: Settings },
  ];

  return (
    <div
      className="fixed right-0 top-0 z-50"
      style={{ width: "250px", height: "100vh", pointerEvents: "none" }}
      onMouseLeave={onClose}
    >
      <aside
        className="absolute right-8 top-20 w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 pointer-events-auto"
      >
        <div className="border-b border-slate-100 px-3 py-3">
          <p className="truncate text-sm font-bold text-slate-950">{displayName}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{email}</p>
        </div>
      <div className="py-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <Icon className="h-4 w-4 text-slate-400" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-5 py-4 font-black text-slate-700 transition hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-5 w-5" />
        退出登录
      </button>
    </aside>
    </div>
  );
}

export function WorkspaceShell({ active, title, subtitle, children, actions, rightPanel }: WorkspaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<StoredAuth | null>(() => cachedAuth);
  const [status, setStatus] = useState<"checking" | "authenticated" | "anonymous">(() =>
    cachedAuth ? "authenticated" : "checking",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [utilityCollapsed, setUtilityCollapsed] = useState(false);
  const [activeUtility, setActiveUtility] = useState<UtilityKind>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("zh-CN");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  const sidebarNavRef = useRef<HTMLElement>(null);

  useIsolatedWheelScroll(sidebarNavRef);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Esc to close all panels
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveUtility(null);
        setSearchOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("xuguang_workspace_locale");
    if (storedLanguage) setSelectedLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const stored = getStoredAuth();

    if (!stored) {
      cachedAuth = null;
      setStatus("anonymous");
      const next = encodeURIComponent(pathname || "/workspace");
      router.replace(`/login?next=${next}`);
      return;
    }

    cachedAuth = stored;
    setAuth(stored);
    setStatus("authenticated");

    api
      .me(stored.token)
      .then((result) => {
        if (cancelled) return;
        const nextAuth: StoredAuth = {
          ...stored,
          user: result.data.user,
          workspace: result.data.workspace,
        };
        cachedAuth = nextAuth;
        setAuth(nextAuth);
        updateStoredIdentity({ user: result.data.user, workspace: result.data.workspace });
      })
      .catch(() => {
        if (cancelled) return;
        cachedAuth = null;
        clearStoredAuth();
        setStatus("anonymous");
        const next = encodeURIComponent(pathname || "/workspace");
        router.replace(`/login?next=${next}`);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const matchedSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchableItems.slice(0, 6);
    return searchableItems
      .filter((item) => `${item.label} ${item.desc}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchQuery]);

  function handleLanguageChange(value: string) {
    setSelectedLanguage(value);
    window.localStorage.setItem("xuguang_workspace_locale", value);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    const target = matchedSearchItems[0];
    setSearchOpen(false);
    if (target) {
      router.push(target.href);
      return;
    }
    if (query) {
      router.push(`/ai?prompt=${encodeURIComponent(query)}`);
    }
  }

  async function handleLogout() {
    const token = auth?.token;
    cachedAuth = null;
    clearStoredAuth();
    setAuth(null);
    setStatus("anonymous");
    if (token) {
      api.logout(token).catch(() => undefined);
    }
    router.replace("/login");
  }

  function toggleUtility(kind: Exclude<UtilityKind, null>) {
    setActiveUtility((current) => (current === kind ? null : kind));
  }

  if (status !== "authenticated" || !auth) return null;

  const displayName = getDisplayName(auth.user);
  const avatarInitial = getAvatarInitial(auth.user);
  const languageLabel = selectedLanguageLabel(selectedLanguage);

  return (
    <div data-active-section={active} className="xuguang-workspace-light min-h-screen overflow-x-hidden bg-[#f3f6fb] text-slate-950">
      <div
        className={cn(
          "grid min-h-screen transition-[grid-template-columns] duration-200",
          sidebarCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
      >
        <aside className="group/sidebar relative sticky top-0 hidden h-screen border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
          <div className="shrink-0">
            <WorkspaceLogo collapsed={sidebarCollapsed} />
          </div>

          {/* Collapse button — pinned to right edge, revealed on sidebar hover */}
          <div className="group/toggle absolute -right-3 top-1/2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm opacity-0 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow group-hover/sidebar:opacity-100"
              aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
            <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 shadow-sm group-hover/toggle:block">
              {sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            </span>
          </div>

          <nav ref={sidebarNavRef} className="mt-8 flex-1 space-y-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] pr-1">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                {!sidebarCollapsed ? (
                  <p className="mt-4 mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                ) : (
                  <div className="mt-4 mb-1 mx-auto h-px w-6 bg-slate-200" />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const selected = currentPathMatches(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.pending ? "#" : item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                          sidebarCollapsed ? "justify-center" : "gap-3",
                          selected
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                          item.pending && !sidebarCollapsed ? "pointer-events-none" : "",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed ? (
                          <span className="flex items-center gap-2 truncate">
                            {item.label}
                            {item.pending ? (
                              <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                                即将上线
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>


        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <div className="flex h-[76px] items-center gap-4 px-5 lg:px-8">
              <form ref={searchRef} onSubmit={handleSearch} className="relative min-w-0 flex-1 max-w-4xl">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="h-14 w-full rounded-full border border-slate-200 bg-slate-100 pl-14 pr-5 text-base font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="搜索会话、模型、文件或知识库"
                  aria-label="搜索"
                />
                {searchOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/60">
                    {matchedSearchItems.length ? (
                      matchedSearchItems.map((item) => (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                            router.push(item.href);
                          }}
                          className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-blue-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-black text-slate-950">{item.label}</span>
                            <span className="mt-1 block truncate text-sm text-slate-500">{item.desc}</span>
                          </span>
                          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                        </button>
                      ))
                    ) : (
                      <button type="submit" className="w-full rounded-2xl px-4 py-4 text-left text-sm text-slate-500 hover:bg-blue-50">
                        没有匹配结果，按 Enter 转到 AI 助手继续提问。
                      </button>
                    )}
                  </div>
                ) : null}
              </form>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleUtility("language")}
                  className="hidden h-11 items-center gap-2 rounded-full px-3 font-bold text-slate-700 transition hover:bg-slate-100 md:flex"
                >
                  <Globe2 className="h-5 w-5" />
                  <span className="max-w-24 truncate">{languageLabel}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleUtility("account")}
                  className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-xl font-black text-white shadow-lg shadow-cyan-200"
                  aria-label="账户菜单"
                >
                  {avatarInitial}
                </button>
              </div>
            </div>
          </header>

          <main className={cn(
            "mx-auto max-w-[1680px] px-5 lg:px-8 lg:pr-20",
            title ? "py-8" : "py-0",
          )}>
            {title ? (
              <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-4xl">
                  <h1 className="text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">{title}</h1>
                  {subtitle ? <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
              </div>
            ) : null}

            <div className={cn("grid min-w-0 gap-6", rightPanel ? "2xl:grid-cols-[minmax(0,1fr)_420px]" : "")}>
              <div className="min-w-0">{children}</div>
              {rightPanel ? <div className="min-w-0">{rightPanel}</div> : null}
            </div>
          </main>
        </section>
      </div>


      <div className="group/help fixed right-6 bottom-6 z-40 hidden lg:block">
        <button
          type="button"
          onClick={() => toggleUtility("help")}
          className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-700 hover:shadow-md"
          aria-label="帮助"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm group-hover/help:block">
          帮助中心
        </span>
      </div>

      <UtilityPanel
        kind={activeUtility}
        title={title}
        selectedLanguage={selectedLanguage}
        onClose={() => setActiveUtility(null)}
        onLanguageChange={handleLanguageChange}
      />

      {activeUtility === "account" ? (
        <AccountPanel
          auth={auth}
          displayName={displayName}
          avatarInitial={avatarInitial}
          onLogout={handleLogout}
          onClose={() => setActiveUtility(null)}
        />
      ) : null}
    </div>
  );
}
