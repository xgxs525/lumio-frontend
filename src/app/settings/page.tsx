"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, KeyRound, ShieldAlert, Smartphone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";
import {
  AUTH_CHANGED_EVENT,
  clearStoredAuth,
  getAvatarInitial,
  getStoredAuth,
  updateStoredIdentity,
  type StoredAuth,
} from "@/lib/auth";

const menuItems = ["个人资料", "安全设置", "绑定账号", "账号注销"];

export default function SettingsPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmAccount, setConfirmAccount] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    toast.success("头像预览已更新，保存资料后生效");
  }

  function syncAuth() {
    const stored = getStoredAuth();
    setAuth(stored);
    const user = stored?.user ?? {};
    setName(typeof user.name === "string" ? user.name : "");
    setPhone(typeof user.phone === "string" ? user.phone : "");
    setAvatarUrl(typeof user.avatarUrl === "string" ? user.avatarUrl : "");
  }

  useEffect(() => {
    const timer = window.setTimeout(syncAuth, 0);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
    };
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const result = await api.updateProfile({
        name,
        phone,
        avatarUrl,
        locale: "zh-CN",
        timezone: "Asia/Shanghai",
      });
      updateStoredIdentity(result.data);
      toast.success("个人资料已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存资料失败");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("密码已修改，下次登录请使用新密码");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "修改密码失败");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.deleteAccount({
        confirmation: confirmAccount,
        currentPassword: deletePassword,
      });
      clearStoredAuth();
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "注销账号失败");
    } finally {
      setDeleting(false);
    }
  }

  const user = auth?.user ?? {};
  const email = typeof user.email === "string" ? user.email : "";

  return (
    <WorkspaceShell
      active="账号设置"
      title="账号与安全"
      subtitle="集中管理个人资料、登录安全、绑定账号、数据记录和账号注销。"
    >
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-max rounded-3xl border border-white/10 bg-white/[0.06] p-3">
          {menuItems.map((item, index) => (
            <a
              key={item}
              className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                index === 0 ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
              href={`#${item}`}
            >
              {item}
            </a>
          ))}
        </aside>

        <div className="min-w-0 space-y-6">
          <section id="个人资料" className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <label className="group relative cursor-pointer">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-cyan-300 to-blue-500 text-2xl font-black text-slate-950 transition group-hover:opacity-80">
                    {user.avatarUrl && typeof user.avatarUrl === "string" && user.avatarUrl.startsWith("http") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl as string} alt="头像" className="h-full w-full rounded-3xl object-cover" />
                    ) : (
                      getAvatarInitial(user)
                    )}
                    <span className="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-950/40 opacity-0 transition group-hover:opacity-100">
                      <Camera className="h-5 w-5 text-white" />
                    </span>
                  </div>
                </label>
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-cyan-200" />
                    <h2 className="text-2xl font-black text-white">个人资料</h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">用于工作台显示、协作成员识别和系统通知。</p>
                </div>
              </div>
              <Button variant="secondary" type="button" onClick={syncAuth}>
                恢复当前资料
              </Button>
            </div>

            <form className="grid gap-5" onSubmit={handleProfileSubmit}>
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-white">
                  昵称
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入昵称" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-white">
                  邮箱
                  <Input value={email} disabled />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-white">
                  手机号
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="可选，绑定手机号" />
                </label>
              </div>
              <div>
                <Button disabled={savingProfile} type="submit">
                  {savingProfile ? "保存中..." : "保存资料"}
                </Button>
              </div>
            </form>
          </section>

          <section id="安全设置" className="grid gap-6 lg:grid-cols-2">
            <form className="rounded-3xl border border-white/10 bg-white/[0.06] p-6" onSubmit={handlePasswordSubmit}>
              <div className="mb-6 flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-cyan-200" />
                <div>
                  <h2 className="text-2xl font-black text-white">安全设置</h2>
                  <p className="mt-1 text-sm text-slate-400">定期更新密码，保护你的工作空间。</p>
                </div>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-white">
                  当前密码
                  <Input
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="请输入当前密码"
                    type="password"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-white">
                  新密码
                  <Input
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="至少 6 位"
                    type="password"
                  />
                </label>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button disabled={savingPassword} type="submit">
                  {savingPassword ? "修改中..." : "修改密码"}
                </Button>
                <Button variant="secondary" type="button">
                  登录保护
                </Button>
              </div>
            </form>

            <div id="绑定账号" className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
              <div className="mb-6 flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-cyan-200" />
                <div>
                  <h2 className="text-2xl font-black text-white">绑定账号</h2>
                  <p className="mt-1 text-sm text-slate-400">管理已绑定的登录方式，支持邮箱、手机号、微信和 QQ。</p>
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  { label: "邮箱账号", value: email || "未绑定", type: "email" },
                  { label: "手机号", value: phone || "未绑定", type: "phone" },
                  { label: "微信登录", value: "未绑定", type: "wechat" },
                  { label: "QQ 登录", value: "未绑定", type: "qq" },
                ].map(({ label, value, type }) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3">
                    <span className="font-semibold text-white">{label}</span>
                    <div className="flex items-center gap-3">
                      {value !== "未绑定" ? (
                        <>
                          <span className="text-sm text-slate-400">{value}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info(`${label}解绑功能即将上线`)}
                            className="h-7 rounded-lg text-xs text-slate-400 hover:text-red-400"
                          >
                            解绑
                          </Button>
                        </>
                      ) : type === "wechat" || type === "qq" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toast.info(`${label}接入中，后续将支持扫码绑定`)}
                          className="h-8 rounded-lg text-xs"
                        >
                          绑定
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">{value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="账号注销" className="rounded-3xl border border-red-400/25 bg-white/[0.06] p-6">
            <div className="mb-5 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-200" />
              <div>
                <h2 className="text-2xl font-black text-white">注销账号</h2>
                <p className="mt-1 text-sm text-slate-300">这是高风险操作，请谨慎确认。</p>
              </div>
            </div>
            <p className="max-w-3xl leading-7 text-slate-300">
              注销后当前账号将无法继续登录。系统会撤销所有登录会话，并释放邮箱与手机号。个人空间数据清理和团队资产移交后续可接入异步任务。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-white">
                当前密码 *
                <Input
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="必填，用于确认身份"
                  type="password"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-white">
                输入账号名称确认 *
                <Input
                  value={confirmAccount}
                  onChange={(e) => setConfirmAccount(e.target.value)}
                  placeholder={`输入「${email}」以确认注销`}
                />
              </label>
            </div>
            <Button
              className="mt-5 border border-red-300/40 bg-red-500/20 text-red-100 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={deleting || !deletePassword || confirmAccount !== email}
              onClick={handleDeleteAccount}
              type="button"
            >
              {deleting ? "正在注销..." : "确认注销账号"}
            </Button>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
