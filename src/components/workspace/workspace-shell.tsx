"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  CreditCard,
  DatabaseZap,
  FileText,
  Globe2,
  Grid3X3,
  Headphones,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  TicketPercent,
  UserRound,
  Users,
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
};

type UtilityKind = "help" | "feedback" | "preferences" | "language" | "account" | null;

const sidebarItems: NavItem[] = [
  { href: "/workspace", label: "工作台", icon: LayoutDashboard },
  { href: "/ai", label: "AI 助手", icon: Bot },
  { href: "/drive", label: "云盘", icon: Cloud },
  { href: "/docs", label: "文档", icon: FileText },
  { href: "/knowledge", label: "知识库", icon: DatabaseZap },
  { href: "/tasks", label: "任务中心", icon: ListTodo },
  { href: "/team", label: "团队", icon: Users },
  { href: "/usage", label: "用量统计", icon: BarChart3 },
  { href: "/billing", label: "账单与额度", icon: CreditCard },
  { href: "/admin", label: "后台管理", icon: ShieldCheck },
  { href: "/enterprise", label: "企业版", icon: BriefcaseBusiness },
  { href: "/settings", label: "账号设置", icon: Settings },
];

const searchableItems = [
  { href: "/workspace", label: "工作台", desc: "查看最近文件、任务和团队状态" },
  { href: "/ai", label: "AI 助手", desc: "围绕文件、文档和知识库提问" },
  { href: "/drive", label: "云盘", desc: "上传、预览、下载和管理文件" },
  { href: "/docs", label: "文档", desc: "创建在线文档并使用 AI 写作" },
  { href: "/knowledge", label: "知识库", desc: "新建知识库、登记来源并问答" },
  { href: "/tasks", label: "任务中心", desc: "查看解析、总结、导出等任务状态" },
  { href: "/team", label: "团队", desc: "成员、部门、权限和审计日志" },
  { href: "/usage", label: "用量统计", desc: "查看存储、Token 和调用额度" },
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
  { title: "帮助中心", desc: "查看上传、知识库、用量和账号说明。", icon: CircleHelp },
  { title: "在线支持", desc: "工作日 9:00-18:00 响应常见问题。", icon: Headphones },
  { title: "建议反馈", desc: "提交产品建议、页面问题和体验反馈。", icon: MessageCircle },
  { title: "专业服务", desc: "企业交付、数据迁移和流程定制支持。", icon: ShieldCheck },
];

let cachedAuth: StoredAuth | null = null;

function currentPathMatches(pathname: string, href: string) {
  if (href === "/workspace") return pathname === "/workspace";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function WorkspaceLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "group relative flex items-center rounded-3xl px-3 py-3 transition hover:bg-slate-100",
        collapsed ? "justify-center" : "gap-3",
      )}
      aria-label="前往官网"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-cyan-300 to-blue-500 text-white shadow-lg shadow-cyan-200">
        <Grid3X3 className="h-8 w-8" />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-2xl font-black tracking-tight text-slate-950">序光</span>
        </span>
      ) : null}
      <span
        className={cn(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-lg group-hover:block",
          collapsed ? "left-full top-1/2 ml-3 -translate-y-1/2" : "left-8 top-full mt-2",
        )}
      >
        前往官网
      </span>
    </Link>
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

  return (
    <aside className="fixed right-20 top-24 z-50 w-[420px] max-w-[calc(100vw-120px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {kind === "language" ? "Language" : "Support"}
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {kind === "help" && "帮助中心"}
            {kind === "feedback" && "满意度评价"}
            {kind === "preferences" && "偏好设置"}
            {kind === "language" && "语言切换"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {kind === "help" ? (
        <div className="space-y-3 p-5">
          {helpItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-black text-slate-950">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">{item.desc}</span>
                </span>
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

  return (
    <aside className="fixed right-8 top-24 z-50 w-[430px] max-w-[calc(100vw-80px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
      <div className="flex items-start gap-4 border-b border-slate-200 p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-2xl font-black text-white">
          {avatarInitial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-slate-950">{displayName}</h3>
              <p className="mt-1 truncate text-sm text-slate-500">{workspaceName}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="truncate font-semibold text-slate-950">{email}</p>
            <p className="mt-1 truncate">账号 ID：{accountId}</p>
            <p className="mt-1 text-emerald-600">账号状态：已登录</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4 p-5">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">可用额度</p>
          <p className="mt-2 text-3xl font-black text-slate-950">¥0.00</p>
        </div>
        <Link href="/billing" onClick={onClose} className="self-center rounded-full border border-slate-300 px-5 py-2 font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-600">
          充值
        </Link>
      </div>

      <div className="mx-5 grid grid-cols-3 rounded-2xl bg-slate-50 p-4 text-center">
        {[
          ["0", "待续费"],
          ["0", "待支付"],
          ["0", "我的订单"],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="m-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <TicketPercent className="h-5 w-5 text-blue-600" />
          <p className="mt-3 font-black text-slate-950">代金券</p>
          <p className="mt-1 text-sm text-slate-500">0 张 ¥0.00</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <ReceiptText className="h-5 w-5 text-blue-600" />
          <p className="mt-3 font-black text-slate-950">可开票金额</p>
          <p className="mt-1 text-sm text-slate-500">¥0.00</p>
        </div>
      </div>

      <div className="grid grid-cols-4 border-t border-slate-200">
        {[
          { href: "/settings", label: "账号", icon: UserRound },
          { href: "/usage", label: "用量", icon: BarChart3 },
          { href: "/billing", label: "账单", icon: WalletCards },
          { href: "/drive", label: "云盘", icon: Cloud },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex flex-col items-center gap-2 px-3 py-4 text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Icon className="h-5 w-5" />
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
          sidebarCollapsed ? "lg:grid-cols-[96px_minmax(0,1fr)]" : "lg:grid-cols-[280px_minmax(0,1fr)]",
        )}
      >
        <aside className="sticky top-0 hidden h-screen border-r border-slate-200 bg-white px-4 py-5 shadow-[8px_0_32px_rgba(15,23,42,0.04)] lg:flex lg:flex-col">
          <div className="flex items-center justify-between gap-2">
            <WorkspaceLogo collapsed={sidebarCollapsed} />
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="grid h-10 w-10 place-items-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="收起侧边栏"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="mx-auto mt-3 grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              aria-label="展开侧边栏"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          ) : null}

          <nav className="mt-8 flex-1 space-y-2 overflow-y-auto pr-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const selected = currentPathMatches(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-2xl px-4 py-3 text-base font-black transition",
                    sidebarCollapsed ? "justify-center" : "gap-3",
                    selected ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          {!sidebarCollapsed ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="font-black text-slate-950">存储空间</p>
                <span className="text-sm font-bold text-slate-500">42%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
              </div>
              <p className="mt-3 text-sm text-slate-500">42GB / 100GB 已使用</p>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <div className="flex h-[76px] items-center gap-4 px-5 lg:px-8">
              <form onSubmit={handleSearch} className="relative min-w-0 flex-1 max-w-4xl">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="h-14 w-full rounded-full border border-slate-200 bg-slate-100 pl-14 pr-5 text-base font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="搜索文件、文档、知识库或 AI 会话"
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
                  onClick={() => toggleUtility("help")}
                  className="hidden h-11 items-center gap-2 rounded-full px-3 font-bold text-slate-700 transition hover:bg-slate-100 xl:flex"
                >
                  <CircleHelp className="h-5 w-5" />
                  帮助中心
                </button>
                <button
                  type="button"
                  onClick={() => toggleUtility("feedback")}
                  className="hidden h-11 items-center gap-2 rounded-full px-3 font-bold text-slate-700 transition hover:bg-slate-100 xl:flex"
                >
                  <Smile className="h-5 w-5" />
                  满意度
                </button>
                <button
                  type="button"
                  onClick={() => toggleUtility("preferences")}
                  className="grid h-11 w-11 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100"
                  aria-label="偏好设置"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
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
                  className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                  aria-label="通知"
                >
                  <Bell className="h-5 w-5" />
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

          <main className="mx-auto max-w-[1680px] px-5 py-8 lg:px-8">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">{title}</h1>
                {subtitle ? <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </div>

            <div className={cn("grid min-w-0 gap-6", rightPanel ? "2xl:grid-cols-[minmax(0,1fr)_420px]" : "")}>
              <div className="min-w-0">{children}</div>
              {rightPanel ? <div className="min-w-0">{rightPanel}</div> : null}
            </div>
          </main>
        </section>
      </div>

      {!utilityCollapsed ? (
        <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col overflow-hidden rounded-full border border-slate-200 bg-white shadow-xl shadow-slate-300/40 lg:flex">
          {[
            { kind: "help" as const, icon: CircleHelp, label: "帮助中心" },
            { kind: "feedback" as const, icon: Smile, label: "满意度评价" },
            { kind: "preferences" as const, icon: Settings, label: "偏好设置" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.kind}
                type="button"
                onClick={() => toggleUtility(item.kind)}
                className={cn(
                  "group relative grid h-12 w-12 place-items-center border-b border-slate-100 text-slate-600 transition last:border-b-0 hover:bg-blue-50 hover:text-blue-600",
                  activeUtility === item.kind && "bg-blue-50 text-blue-600",
                )}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setUtilityCollapsed(true);
              setActiveUtility(null);
            }}
            className="grid h-12 w-12 place-items-center text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="收起右侧工具栏"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setUtilityCollapsed(false)}
          className="fixed right-4 top-1/2 z-40 hidden h-12 w-9 -translate-y-1/2 place-items-center rounded-l-2xl border border-r-0 border-slate-200 bg-white text-slate-600 shadow-xl shadow-slate-300/40 transition hover:text-blue-600 lg:grid"
          aria-label="展开右侧工具栏"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

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
