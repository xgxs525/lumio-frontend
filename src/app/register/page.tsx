"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, FileSearch, Sparkles, Zap } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { getStoredAuth, saveStoredAuth } from "@/lib/auth";

const capabilities = [
  ["多模型对话", "在一个入口里使用不同 AI 模型。"],
  ["智能推荐", "根据任务类型推荐更合适的模型。"],
  ["文件理解", "上传文件后，让 AI 总结、分析和提取重点。"],
];

export default function RegisterPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredAuth()?.token) {
      router.replace("/workspace");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    if (!agreed) {
      toast.error("请先阅读并同意用户协议和隐私政策");
      return;
    }
    setLoading(true);
    try {
      const result = await api.register({ account, password, name: "" });
      saveStoredAuth(result.data);
      router.push("/workspace");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "注册失败，请稍后重试");
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
            一个账号，使用多个 AI 模型
          </h1>
          <p className="mt-4 max-w-md text-lg leading-8 text-slate-500">
            序光整合多种 AI 模型能力，你可以根据任务选择模型，也可以让序光智能推荐更合适的模型。支持对话、写作、翻译、编程、分析、文件理解、图像制作和视频创作。
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {capabilities.map(([title, desc], i) => {
              const icons = [Zap, Brain, FileSearch];
              const colors = ["text-blue-600 bg-blue-50", "text-emerald-600 bg-emerald-50", "text-violet-600 bg-violet-50"];
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

        {/* ── Right: registration form ── */}
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">创建序光账号</h2>
            <p className="mt-3 text-base leading-7 text-slate-500">
              注册后即可进入序光，使用多个 AI 模型进行对话、写作、翻译、编程、分析、文件理解、图像制作和视频创作。
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
                autoComplete="new-password"
                className="border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位密码"
                type="password"
                value={password}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              确认密码
              <Input
                autoComplete="new-password"
                className="border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入密码"
                type="password"
                value={confirmPassword}
              />
            </label>

            <label className="flex items-start gap-2 text-sm leading-6 text-slate-500">
              <input
                checked={agreed}
                className="mt-1 h-4 w-4 rounded border-slate-300"
                onChange={(event) => setAgreed(event.target.checked)}
                type="checkbox"
              />
              <span>
                我已阅读并同意{" "}
                <Link href="/help/terms" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-700">
                  用户协议
                </Link>{" "}
                和{" "}
                <Link href="/help/privacy" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-700">
                  隐私政策
                </Link>
              </span>
            </label>

            <Button
              className="h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-none transition hover:bg-slate-800"
              disabled={loading || !account || !password || !confirmPassword}
            >
              {loading ? "正在创建..." : "免费开始"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            已有账号？{" "}
            <Link href="/login" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-700">
              登录
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
