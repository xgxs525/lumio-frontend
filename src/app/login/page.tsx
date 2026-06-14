"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, CheckCircle2, Code2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getStoredAuth, saveStoredAuth } from "@/lib/auth";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/workspace";
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/workspace";
  return next;
}

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
    <div className="mx-auto grid min-h-[calc(100vh-160px)] max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative overflow-hidden rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-slate-950 via-blue-950/80 to-violet-950/70 p-8 shadow-[0_28px_90px_rgba(15,23,42,0.35)]">
        <div className="absolute right-12 top-10 h-56 w-56 rounded-full bg-cyan-300/16 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-blue-500/14 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-2 text-sm font-semibold text-cyan-50">
            <Sparkles className="h-4 w-4" />
            AI 原生办公平台
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight text-white">
            回到你的 Lumio 工作空间
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300/82">
            登录后可继续访问云盘、文档、知识库、AI 助手和团队工作台。未登录用户将无法直接进入操作页。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["文件资产", "统一管理上传、处理结果和共享资料。"],
              ["知识沉淀", "把文档、SOP 和项目资料变成可问答知识。"],
              ["权限保护", "登录态校验后才可进入核心工作台。"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <ShieldCheck className="mb-4 h-5 w-5 text-cyan-200" />
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300/75">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-300 text-slate-950">
                <Bot className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white">示例：帮我总结这份 PDF，并生成下一步行动清单。</p>
                <p className="mt-1 text-sm text-slate-400">登录后可继续使用 AI 助手处理文件、文档和知识库内容。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-white/12 bg-white/[0.07]">
        <CardHeader>
          <CardTitle className="text-3xl">登录 Lumio</CardTitle>
          <CardDescription className="text-base">
            支持邮箱或手机号登录。登录成功后会自动返回你刚才访问的工作台页面。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-white">
                邮箱 / 手机号
                <Input
                  autoComplete="username"
                  onChange={(event) => setAccount(event.target.value)}
                  placeholder="请输入邮箱或手机号"
                  value={account}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-white">
                密码
                <Input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                  type="password"
                  value={password}
                />
              </label>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  checked={remember}
                  className="h-4 w-4 rounded border-white/20 bg-white/10"
                  onChange={(event) => setRemember(event.target.checked)}
                  type="checkbox"
                />
                记住我
              </label>
              <Link href="/#" className="font-semibold text-cyan-200 hover:underline">
                忘记密码？
              </Link>
            </div>

            {error && (
              <div className="rounded-lg border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 hover:from-cyan-200 hover:to-blue-400"
              disabled={loading || !account || !password}
            >
              {loading ? "正在登录..." : "登录"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-white/10" />
            其他方式登录
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="secondary">
              <Mail className="h-4 w-4" />
              微信登录
            </Button>
            <Button type="button" variant="secondary">
              <Code2 className="h-4 w-4" />
              QQ 登录
            </Button>
          </div>

          <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
            {["登录态会同步到顶部导航", "未登录时自动拦截工作台页面", "退出登录后清除本地访问凭证"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                {item}
              </span>
            ))}
          </div>

          <p className="mt-5 text-center text-sm text-slate-400">
            还没有账号？{" "}
            <Link href="/register" className="font-semibold text-cyan-200 hover:underline">
              免费注册
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
