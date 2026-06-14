"use client";

import type { ReactNode } from "react";
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
  Home,
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
import { useEffect, useMemo, useState } from "react";

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

function WorkspaceLogo() {
  return (
    <Link href="/workspace" className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 grid-cols-3 gap-1 rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 p-1.5 shadow-[0_0_24px_rgba(34,211,238,0.3)]">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="rounded-[3px] bg-white/85" />
        ))}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-black text-white">Lumio</span>
        <span className="block truncate text-xs font-semibold text-cyan-100/70">序光工作台</span>
      </span>
    </Link>
  );
}

function isSameSection(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
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
        // 本地退出优先，避免接口异常阻塞用户离开。
      }
    }
    clearStoredAuth();
    router.push("/");
  }

  if (status !== "authenticated" || !auth) return null;

  const profileLinks = [
    { href: "/", label: "官网首页", icon: Home },
    { href: "/workspace", label: "工作台", icon: LayoutDashboard },
    { href: "/settings", label: "账号设置", icon: Settings },
    { href: "/drive", label: "云盘", icon: Cloud },
  ].filter((item) => !isSameSection(pathname, item.href));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#061024] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:block">
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
                      ? "bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.24)]"
                      : "text-slate-300 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold text-white">存储空间</span>
              <span className="text-slate-400">42%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
            </div>
            <p className="mt-3 text-xs text-slate-400">42GB / 100GB 已使用</p>
          </div>
        </aside>

        <section className="min-w-0 overflow-x-hidden">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061024]/88 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5 lg:px-8">
              <div className="min-w-0 lg:hidden">
                <WorkspaceLogo />
              </div>
              <div className="hidden min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-400 md:flex">
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
                <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="group/profile relative">
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-black text-slate-950">
                    {getAvatarInitial(auth.user)}
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 w-64 pt-3 opacity-0 transition group-hover/profile:visible group-hover/profile:opacity-100">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/96 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
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
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]",
                              index === 0 && "mt-2",
                            )}
                            href={item.href}
                          >
                            <Icon className="h-4 w-4 text-cyan-200" />
                            {item.label}
                          </Link>
                        );
                      })}
                      <button
                        className="block w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-100 hover:bg-red-500/10"
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

          <div
            className={cn(
              "grid min-w-0 gap-6 px-4 py-8 sm:px-5 lg:px-8",
              rightPanel ? "2xl:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1",
            )}
          >
            <main className="min-w-0">
              <div className="mb-8 flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <h1 className="break-words text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
                  {subtitle && <p className="mt-3 max-w-3xl break-words leading-7 text-slate-300/78">{subtitle}</p>}
                </div>
                {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
              </div>
              <div className="min-w-0">{children}</div>
            </main>
            {rightPanel && <aside className="min-w-0">{rightPanel}</aside>}
          </div>
        </section>
      </div>
    </div>
  );
}
