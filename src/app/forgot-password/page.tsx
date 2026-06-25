"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetData, setResetData] = useState<{ token: string; code: string; expiresIn: number } | null>(null);
  const [codeInput, setCodeInput] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api.forgotPassword({ account });
      const data = result.data;
      if (data.sent) {
        // Real email was sent — guide user to check their inbox
        setEmailSent(true);
      } else if (data.token && data.code) {
        // Dev mode — show code inline
        setResetData({ token: data.token, code: data.code, expiresIn: data.expiresIn });
      }
      setSent(true);
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function goToReset(token: string, code: string) {
    router.push(`/reset-password?token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            返回登录
          </Link>

          <div className="mt-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
              {sent ? "验证码已发送" : "忘记密码"}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-500">
              {sent
                ? `一封包含重置信息的邮件已发送至 ${account}`
                : "输入注册时使用的邮箱或手机号，我们会向您发送密码重置链接。"}
            </p>
          </div>

          {!sent ? (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                邮箱 / 手机号
                <Input
                  autoComplete="username"
                  className="h-9 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                  onChange={(event) => setAccount(event.target.value)}
                  placeholder="请输入邮箱或手机号"
                  value={account}
                />
              </label>

              <Button
                className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-none transition hover:bg-slate-800"
                disabled={loading || !account}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "发送重置链接"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="mt-8 space-y-5">
              {resetData ? (
                <>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-sm font-semibold text-blue-800">开发模式 — 重置信息</p>
                    <div className="mt-3 space-y-2 text-sm text-blue-700">
                      <p>
                        <span className="font-medium">验证码：</span>
                        <code className="ml-1 rounded bg-blue-100 px-2 py-0.5 font-mono text-base font-bold tracking-widest">
                          {resetData.code}
                        </code>
                      </p>
                      <p className="text-xs text-blue-500">
                        验证码 {Math.floor(resetData.expiresIn / 60)} 分钟内有效
                      </p>
                    </div>
                  </div>

                  <label className="grid gap-2 text-sm font-semibold text-slate-800">
                    输入验证码
                    <Input
                      className="h-9 border-slate-300 bg-white text-slate-950 text-center text-lg font-mono tracking-widest placeholder:text-slate-400"
                      maxLength={6}
                      onChange={(event) => setCodeInput(event.target.value)}
                      placeholder="000000"
                      value={codeInput}
                    />
                  </label>

                  <Button
                    className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-none transition hover:bg-slate-800"
                    disabled={codeInput.length < 6}
                    onClick={() => goToReset(resetData.token, codeInput)}
                  >
                    验证并重置密码
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : emailSent ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">邮件已发送</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    请检查您的邮箱，点击邮件中的链接或使用邮件中的验证码重置密码。验证码 15 分钟内有效。
                  </p>
                  <p className="mt-3 text-xs text-emerald-600">
                    如果未收到邮件，请检查垃圾邮件箱。
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">重置链接已发送</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    请检查您的联系方式获取重置信息。
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setResetData(null);
                  setEmailSent(false);
                  setCodeInput("");
                }}
                className="w-full text-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                未收到？重新发送
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            想起密码了？{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-700"
            >
              返回登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
