"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2, Save, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<RecordMap>({});
  const [form, setForm] = useState({ name: "", locale: "zh-CN", timezone: "Asia/Shanghai" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadWorkspace() {
    setError("");
    setLoading(true);
    try {
      const result = await api.currentWorkspace();
      setWorkspace(result.data.workspace);
      setForm({
        name: text(result.data.workspace.name, "序光工作空间"),
        locale: text(result.data.workspace.locale, "zh-CN"),
        timezone: text(result.data.workspace.timezone, "Asia/Shanghai"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "工作空间加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  async function saveWorkspace() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.updateCurrentWorkspace({
        name: form.name.trim(),
        locale: form.locale,
        timezone: form.timezone,
      });
      setWorkspace(result.data.workspace);
      setNotice("工作空间设置已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="/workspace"
      title="工作空间设置"
      subtitle="配置当前空间名称、语言、时区和基础协作策略。"
      actions={
        <Button variant="secondary" asChild>
          <Link href="/workspace">
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </Link>
        </Button>
      }
      rightPanel={
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Building2 className="mb-4 h-7 w-7 text-cyan-600" />
            <h2 className="text-xl font-black text-slate-950">当前空间</h2>
            <p className="mt-3 break-words text-sm leading-7 text-slate-600">{text(workspace.name, "序光工作空间")}</p>
            <p className="mt-2 break-all text-xs text-slate-400">{text(workspace.slug)}</p>
          </div>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">{notice}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            正在加载设置...
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Settings2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-slate-950">基础信息</h2>
                <p className="text-sm text-slate-500">这些信息会影响工作台、通知和后续团队协作默认值。</p>
              </div>
            </div>
            <label className="grid gap-2 text-sm font-bold text-slate-950">
              工作空间名称
              <Input value={form.name} onChange={(event) => setForm((old) => ({ ...old, name: event.target.value }))} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-950">
                默认语言
                <select
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-950 outline-none"
                  value={form.locale}
                  onChange={(event) => setForm((old) => ({ ...old, locale: event.target.value }))}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-950">
                默认时区
                <select
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-950 outline-none"
                  value={form.timezone}
                  onChange={(event) => setForm((old) => ({ ...old, timezone: event.target.value }))}
                >
                  <option value="Asia/Shanghai">Asia/Shanghai</option>
                  <option value="UTC">UTC</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                </select>
              </label>
            </div>
            <Button disabled={!form.name.trim() || saving} onClick={() => void saveWorkspace()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存设置
            </Button>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
