"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, CheckCircle2, Code2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getStoredAuth, saveStoredAuth } from "@/lib/auth";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/workspace";
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/workspace";
  return next;
}

const benefits = [
  ["统一资料", "继续访问云盘、文档、知识库和任务中心。"],
  ["AI 助手", "围绕文件、文档和团队资料继续提问。"],
  ["安全访问", "登录校验后才能进入核心工作区。"],
];

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getStoredAuth()?.token) {
      router.replace(getSafeNextPath());
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.login({ account, password, remember });
      saveStoredAuth(result.data);
      router.push(getSafeNextPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[radial-gradient(circle_at_16%_12%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#edf4fb_48%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-var(--site-header-height))] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100" />
          <div className="absolute bottom-0 right-8 h-56 w-56 rounded-full border border-blue-100" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" />
              AI 原生办公平台
            </div>
            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950">
              回到你的序光工作空间
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              登录后可继续访问云盘、在线文档、知识库、AI 助手和团队工作台。未登录用户会被拦截到登录页，避免资料被误访问。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {benefits.map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck className="mb-4 h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
                  <Bot className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-slate-950">示例：帮我总结这份 PDF，并生成下一步行动清单。</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    登录后，序光会根据你的工作空间资料继续完成总结、问答、提取和自动处理任务。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">登录序光</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              支持邮箱或手机号登录。登录成功后会自动回到你刚才访问的工作台页面。
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              邮箱 / 手机号
              <Input
                autoComplete="username"
                className="border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                onChange={(event) => setAccount(event.target.value)}
                placeholder="请输入邮箱或手机号"
                value={account}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              密码
              <Input
                autoComplete="current-password"
                className="border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                type="password"
                value={password}
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  checked={remember}
                  className="h-4 w-4 rounded border-slate-300"
                  onChange={(event) => setRemember(event.target.checked)}
                  type="checkbox"
                />
                记住我
              </label>
              <Link href="/help/account" className="font-semibold text-blue-600 hover:text-blue-700">
                忘记密码？
              </Link>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 shadow-[0_16px_34px_rgba(37,99,235,0.2)] hover:from-cyan-200 hover:to-blue-400"
              disabled={loading || !account || !password}
            >
              {loading ? "正在登录..." : "登录"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            其他方式登录
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-50">
              <Mail className="h-4 w-4" />
              微信登录
            </Button>
            <Button type="button" variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-50">
              <Code2 className="h-4 w-4" />
              QQ 登录
            </Button>
          </div>

          <div className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {["登录态会同步到顶部导航", "未登录时会自动拦截工作台页面", "退出登录后清除本地访问凭证"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                {item}
              </span>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            还没有账号？{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              免费注册
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
