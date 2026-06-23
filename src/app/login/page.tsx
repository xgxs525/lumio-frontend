"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, History, ShieldCheck, Sparkles, Star } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { getStoredAuth, saveStoredAuth } from "@/lib/auth";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/workspace";
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/workspace";
  return next;
}

const benefits = [
  ["历史会话", "继续之前的 AI 对话和任务。"],
  ["模型偏好", "保留你常用的模型和使用习惯。"],
  ["安全访问", "登录后同步你的会话和使用记录。"],
];

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredAuth()?.token) {
      router.replace(getSafeNextPath());
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api.login({ account, password, remember });
      saveStoredAuth(result.data);
      router.push(getSafeNextPath());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-var(--site-header-height))] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1fr_1fr]">

        {/* ── Left: brand introduction ── */}
        <section className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            <Sparkles className="h-4 w-4 text-blue-600" />
            序光 · 多模型 AI 平台
          </div>
          <h1 className="mt-6 max-w-md text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            回到你的多模型 AI 空间
          </h1>
          <p className="mt-4 max-w-md text-lg leading-8 text-slate-500">
            登录后继续使用不同 AI 模型，恢复你的历史会话、文件理解记录和模型偏好。支持对话、写作、翻译、编程、分析、图像制作和视频创作。
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {benefits.map(([title, desc], i) => {
              const icons = [History, Star, ShieldCheck];
              const colors = ["text-blue-600 bg-blue-50", "text-amber-600 bg-amber-50", "text-emerald-600 bg-emerald-50"];
              const Icon = icons[i];
              return (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${colors[i]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-slate-950">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Right: login form ── */}
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">登录序光</h2>
            <p className="mt-3 text-base leading-7 text-slate-500">
              继续使用你的多模型 AI 入口，进行对话、写作、翻译、编程、分析、文件理解、图像制作和视频创作。
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
              <label className="flex items-center gap-2 text-slate-500">
                <input
                  checked={remember}
                  className="h-4 w-4 rounded border-slate-300"
                  onChange={(event) => setRemember(event.target.checked)}
                  type="checkbox"
                />
                记住我
              </label>
              <Link href="/help/account" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-700">
                忘记密码？
              </Link>
            </div>

            <Button
              className="h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-none transition hover:bg-slate-800"
              disabled={loading || !account || !password}
            >
              {loading ? "正在登录..." : "登录"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            还没有账号？{" "}
            <Link href="/register" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-700">
              创建序光账号
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
