"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Cloud,
  CreditCard,
  DatabaseZap,
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

const sidebarItems = [
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

function isSameSection(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function WorkspaceLogo() {
  return (
    <Link
      href="/"
      aria-label="前往官网"
      className="group/logo relative flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-100"
    >
      <span className="grid h-11 w-11 shrink-0 grid-cols-3 gap-1 rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 p-1.5 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
        {Array.from({ length: 9 }).map((_, index) => (
          <span key={index} className="rounded-[3px] bg-white/88" />
        ))}
      </span>
      <span className="min-w-0 truncate text-xl font-black text-slate-950">序光</span>
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 opacity-0 shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition-opacity duration-75 group-hover/logo:opacity-100">
        前往官网
      </span>
    </Link>
  );
}

export function WorkspaceShell({
  active,
  title,
  subtitle,
  children,
  actions,
  rightPanel,
}: {
  active: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  rightPanel?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [status, setStatus] = useState<"checking" | "authenticated" | "anonymous">("checking");

  const nextPath = useMemo(() => {
    const current = pathname || "/workspace";
    return `/login?next=${encodeURIComponent(current)}`;
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAuth() {
      const stored = getStoredAuth();
      if (!stored?.token) {
        setStatus("anonymous");
        router.replace(nextPath);
        return;
      }

      try {
        const result = await api.me(stored.token);
        if (cancelled) return;
        updateStoredIdentity(result.data);
        setAuth(getStoredAuth());
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        clearStoredAuth();
        setAuth(null);
        setStatus("anonymous");
        router.replace(nextPath);
      }
    }

    verifyAuth();
    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  async function handleLogout() {
    const token = auth?.token;
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // 退出不能被临时网络错误卡住。
      }
    }
    clearStoredAuth();
    router.push("/");
  }

  if (status !== "authenticated" || !auth) return null;

  const profileLinks = [
    { href: "/settings", label: "账号设置", icon: Settings },
    { href: "/drive", label: "云盘", icon: Cloud },
  ].filter((item) => !isSameSection(pathname, item.href));

  return (
    <div className="xuguang-workspace-light min-h-screen overflow-x-hidden bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 border-r border-slate-200 bg-white p-5 shadow-[8px_0_28px_rgba(15,23,42,0.04)] lg:block">
          <WorkspaceLogo />
          <nav className="mt-8 grid gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isSameSection(pathname, item.href) || active === item.label || active === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                    isActive
                      ? "border border-blue-100 bg-blue-50 text-blue-700 shadow-[0_8px_18px_rgba(37,99,235,0.08)]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-950">存储空间</span>
              <span className="text-slate-500">42%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
            </div>
            <p className="mt-3 text-xs text-slate-500">42GB / 100GB 已使用</p>
          </div>
        </aside>

        <section className="min-w-0 overflow-x-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_230px,#f5f7fb_100%)]">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5 lg:px-8">
              <div className="min-w-0 lg:hidden">
                <WorkspaceLogo />
              </div>
              <div className="hidden min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 md:flex">
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate">搜索文件、文档、知识库或 AI 会话</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/docs">
                    <Plus className="h-4 w-4" />
                    新建
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/drive">
                    <Upload className="h-4 w-4" />
                    上传
                  </Link>
                </Button>
                <button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="group/profile relative">
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-black text-slate-950">
                    {getAvatarInitial(auth.user)}
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 w-64 pt-3 opacity-0 transition group-hover/profile:visible group-hover/profile:opacity-100 group-focus-within/profile:visible group-focus-within/profile:opacity-100">
                    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                      <div className="border-b border-slate-200 px-3 py-3">
                        <p className="truncate text-sm font-bold text-slate-950">{getDisplayName(auth.user)}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {typeof auth.workspace.name === "string" ? auth.workspace.name : "个人工作空间"}
                        </p>
                      </div>
                      {profileLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                            href={item.href}
                          >
                            <Icon className="h-4 w-4 text-blue-600" />
                            {item.label}
                          </Link>
                        );
                      })}
                      <button
                        className="mt-2 block w-full rounded-xl border-t border-slate-200 px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                        type="button"
                      >
                        <LogOut className="mr-2 inline h-4 w-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
            </div>

            <div className={cn("grid min-w-0 gap-6", rightPanel ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "")}>
              <div className="min-w-0">{children}</div>
              {rightPanel ? <aside className="min-w-0">{rightPanel}</aside> : null}
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
