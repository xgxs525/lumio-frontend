"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown) {
  return value === true;
}

function rolePermissionCodes(role: RecordMap | undefined) {
  const permissions = Array.isArray(role?.permissions) ? (role?.permissions as RecordMap[]) : [];
  return permissions.map((item) => text(item.code)).filter(Boolean);
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RecordMap[]>([]);
  const [permissions, setPermissions] = useState<RecordMap[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [checked, setChecked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selected = roles.find((item) => text(item.id) === selectedId);
  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, RecordMap[]>>((groups, item) => {
      const moduleName = text(item.module, "general");
      groups[moduleName] = groups[moduleName] || [];
      groups[moduleName].push(item);
      return groups;
    }, {});
  }, [permissions]);

  async function loadRoles(nextId?: string) {
    setError("");
    setLoading(true);
    try {
      const [roleResult, permissionResult] = await Promise.all([api.listRoles(), api.listPermissions()]);
      setRoles(roleResult.data);
      setPermissions(permissionResult.data);
      const role = roleResult.data.find((item) => text(item.id) === nextId) || roleResult.data[0];
      if (role) selectRole(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "角色权限加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoles();
  }, []);

  function selectRole(role: RecordMap) {
    setCreating(false);
    setSelectedId(text(role.id));
    setForm({ name: text(role.name), code: text(role.code), description: text(role.description) });
    setChecked(rolePermissionCodes(role));
    setNotice("");
    setError("");
  }

  function startCreate() {
    setCreating(true);
    setSelectedId("");
    setForm({ name: "", code: "", description: "" });
    setChecked([]);
  }

  function togglePermission(code: string) {
    setChecked((old) => (old.includes(code) ? old.filter((item) => item !== code) : [...old, code]));
  }

  async function saveRole() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (creating) {
        if (!form.code.trim()) {
          setError("请填写角色编码。");
          return;
        }
        const result = await api.createRole({
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          permission_codes: checked,
        });
        setNotice("角色已创建。");
        await loadRoles(text(result.data.id));
      } else if (selectedId) {
        const result = await api.updateRole(selectedId, {
          name: form.name.trim(),
          description: form.description.trim(),
          permission_codes: checked,
        });
        setNotice("角色已保存。");
        await loadRoles(text(result.data.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存角色失败");
    } finally {
      setSaving(false);
    }
  }

  async function removeRole() {
    if (!selectedId || bool(selected?.isSystem)) return;
    const ok = window.confirm("确定删除这个自定义角色吗？相关成员会变为未绑定角色。");
    if (!ok) return;
    setSaving(true);
    try {
      await api.deleteRole(selectedId);
      setNotice("角色已删除。");
      await loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除角色失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="团队"
      title="角色权限"
      subtitle="管理团队角色和权限点，作为文件、文档、知识库和后台能力的统一权限入口。"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href="/team">
              <ArrowLeft className="h-4 w-4" />
              返回团队
            </Link>
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            新建角色
          </Button>
        </>
      }
      rightPanel={
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <ShieldCheck className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="text-xl font-black text-white">权限策略</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            系统角色只能修改说明和权限；自定义角色可新建、删除。所有权限变更会写入审计日志。
          </p>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="grid gap-3">
            {loading ? (
              <div className="rounded-2xl bg-slate-950/35 p-5 text-sm text-slate-400">正在加载...</div>
            ) : (
              roles.map((role) => (
                <button
                  key={text(role.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedId === text(role.id)
                      ? "border-cyan-300/60 bg-cyan-300/15"
                      : "border-white/10 bg-slate-950/35 hover:border-white/20"
                  }`}
                  onClick={() => selectRole(role)}
                  type="button"
                >
                  <p className="break-words font-black text-white">{text(role.name)}</p>
                  <p className="mt-1 text-xs text-slate-500">{text(role.code)}</p>
                  {bool(role.isSystem) && <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-100">系统角色</span>}
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-white">
              角色名称
              <Input value={form.name} onChange={(event) => setForm((old) => ({ ...old, name: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white">
              角色编码
              <Input
                disabled={!creating}
                value={form.code}
                onChange={(event) => setForm((old) => ({ ...old, code: event.target.value }))}
                placeholder="例如 operation_admin"
              />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold text-white">
            角色说明
            <textarea
              className="min-h-24 rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
              value={form.description}
              onChange={(event) => setForm((old) => ({ ...old, description: event.target.value }))}
            />
          </label>

          <div className="mt-6 space-y-5">
            {Object.entries(groupedPermissions).map(([moduleName, items]) => (
              <div key={moduleName} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <h3 className="mb-3 text-sm font-black text-cyan-100">{moduleName}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((item) => {
                    const code = text(item.code);
                    return (
                      <label key={code} className="flex min-w-0 items-start gap-3 rounded-xl bg-white/[0.04] p-3 text-sm text-slate-200">
                        <input
                          checked={checked.includes(code)}
                          className="mt-1"
                          onChange={() => togglePermission(code)}
                          type="checkbox"
                        />
                        <span className="min-w-0">
                          <span className="block break-words font-bold text-white">{text(item.name, code)}</span>
                          <span className="mt-1 block break-all text-xs text-slate-500">{code}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={saving || !form.name.trim() || (creating && !form.code.trim())} onClick={() => void saveRole()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存角色
            </Button>
            {!creating && selectedId && !bool(selected?.isSystem) && (
              <Button variant="secondary" disabled={saving} onClick={() => void removeRole()}>
                <Trash2 className="h-4 w-4" />
                删除角色
              </Button>
            )}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
