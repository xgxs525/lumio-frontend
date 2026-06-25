"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { type FormEvent, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const codeFromUrl = searchParams.get("code") ?? "";

  const [code, setCode] = useState(codeFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isValid = Boolean(token);
  const canSubmit = isValid && newPassword.length >= 6 && newPassword === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({
        token,
        code: code || undefined,
        new_password: newPassword,
      });
      setDone(true);
      toast.success("密码已重置，请使用新密码登录。");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mt-6">
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${done ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"}`}>
              {done ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
              {done ? "密码已重置" : "设置新密码"}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-500">
              {done
                ? "您的密码已成功重置，现在可以使用新密码登录了。"
                : "请输入新密码，建议使用至少 8 位包含字母、数字和符号的组合。"}
            </p>
          </div>

          {!done ? (
            !isValid ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-800">链接无效</p>
                <p className="mt-2 text-sm leading-6 text-red-700">
                  密码重置链接无效或已过期，请重新申请重置密码。
                </p>
                <Link
                  href="/forgot-password"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-900"
                >
                  重新申请
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {!codeFromUrl ? (
                  <label className="grid gap-2 text-sm font-semibold text-slate-800">
                    验证码
                    <Input
                      className="h-9 border-slate-300 bg-white text-slate-950 text-center text-lg font-mono tracking-widest placeholder:text-slate-400"
                      maxLength={6}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="000000"
                      value={code}
                    />
                  </label>
                ) : null}

                <label className="grid gap-2 text-sm font-semibold text-slate-800">
                  新密码
                  <Input
                    autoComplete="new-password"
                    className="h-9 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="至少 6 位密码"
                    type="password"
                    value={newPassword}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-800">
                  确认新密码
                  <Input
                    autoComplete="new-password"
                    className="h-9 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="再次输入密码"
                    type="password"
                    value={confirmPassword}
                  />
                </label>

                <Button
                  className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-none transition hover:bg-slate-800"
                  disabled={loading || !canSubmit}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "重置密码"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )
          ) : (
            <div className="mt-8 space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">密码修改成功</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  所有设备上的登录会话已失效，请使用新密码重新登录。
                </p>
              </div>
              <Link href="/login">
                <Button className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-none transition hover:bg-slate-800">
                  前往登录
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
