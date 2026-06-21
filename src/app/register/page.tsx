"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Code2, Mail, Sparkles, Upload } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getStoredAuth, saveStoredAuth } from "@/lib/auth";

const onboardingSteps = [
  ["1", "选择用途", "个人办公、团队协作、文件处理、内容创作或企业知识库。"],
  ["2", "创建工作空间", "注册后自动创建个人工作区，后续可邀请团队成员。"],
  ["3", "上传第一个文件", "支持 PDF、表格、Word、PPT、图片等主流办公文件。"],
  ["4", "进入 AI 问答", "让序光总结、提取、分析，并生成下一步行动。"],
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getStoredAuth()?.token) {
      router.replace("/workspace");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!agreed) {
      setError("请先阅读并同意用户协议和隐私政策");
      return;
    }
    setLoading(true);
    try {
      const result = await api.register({ account, password, name });
      saveStoredAuth(result.data);
      router.push("/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_44%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-var(--site-header-height))] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-blue-100" />
          <div className="absolute bottom-8 right-16 h-72 w-72 rounded-full border border-blue-100" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" />
              序光
            </div>
            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950">
              创建你的 AI 原生办公空间
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              注册后会自动创建个人工作区，并引导你完成第一次文件上传、文档创建或 AI 问答。
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {onboardingSteps.map(([step, title, description]) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-500 font-black text-slate-950">
                    {step}
                  </span>
                  <h3 className="font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
                  <Upload className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-slate-950">第一步从上传一个文件开始</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    序光会根据内容提供总结、问答、提取、转换和自动处理能力。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">免费注册</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              使用邮箱或手机号创建账号，注册后可进入工作台管理文件、文档和知识库。
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              姓名
              <Input
                className="border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                onChange={(event) => setName(event.target.value)}
                placeholder="请输入姓名"
                value={name}
              />
            </label>
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

            <label className="flex items-start gap-2 text-sm leading-6 text-slate-600">
              <input
                checked={agreed}
                className="mt-1 h-4 w-4 rounded border-slate-300"
                onChange={(event) => setAgreed(event.target.checked)}
                type="checkbox"
              />
              <span>
                我已阅读并同意{" "}
                <Link href="/help/terms" className="font-semibold text-blue-600 hover:text-blue-700">
                  用户协议
                </Link>{" "}
                和{" "}
                <Link href="/help/privacy" className="font-semibold text-blue-600 hover:text-blue-700">
                  隐私政策
                </Link>
              </span>
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 shadow-[0_16px_34px_rgba(37,99,235,0.2)] hover:from-cyan-200 hover:to-blue-400"
              disabled={loading || !account || !password || !confirmPassword}
            >
              {loading ? "正在创建..." : "创建账号"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            其他方式注册
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-50">
              <Mail className="h-4 w-4" />
              微信注册
            </Button>
            <Button type="button" variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-50">
              <Code2 className="h-4 w-4" />
              QQ 注册
            </Button>
          </div>

          <div className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {["自动创建个人工作区", "后续可邀请团队成员", "支持升级为团队或企业方案"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                {item}
              </span>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            已有账号？{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              去登录
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
