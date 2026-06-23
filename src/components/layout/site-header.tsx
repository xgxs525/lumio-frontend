"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
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
    { href: "/billing", label: "账单与额度", icon: CreditCard },
    { href: "/settings", label: "账号设置", icon: Settings },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
                <div className="my-3 border-t border-slate-200" />
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">登录</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-bold text-white hover:bg-blue-700">免费开始</Link>
              </nav>
            </div>
          </div>
        </div>
      ) : null}

    </header>
  );
}
