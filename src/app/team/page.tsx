"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Building2, Loader2, Plus, ShieldCheck, UserPlus, Users } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function TeamPage() {
  const [overview, setOverview] = useState<RecordMap>({});
  const [members, setMembers] = useState<RecordMap[]>([]);
  const [departments, setDepartments] = useState<RecordMap[]>([]);
  const [roles, setRoles] = useState<RecordMap[]>([]);
  const [auditLogs, setAuditLogs] = useState<RecordMap[]>([]);
  const [usage, setUsage] = useState<RecordMap[]>([]);
  const [selectedMember, setSelectedMember] = useState<RecordMap | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role_code: "member", department_id: "" });
  const [departmentName, setDepartmentName] = useState("");

  const usageTotal = useMemo(
    () => usage.reduce((sum, item) => sum + asNumber(item.quantity), 0),
    [usage],
  );

  async function loadTeam() {
    setLoading(true);
    try {
      const [overviewResult, memberResult, departmentResult, roleResult, auditResult, usageResult] = await Promise.all([
        api.teamOverview(),
        api.listTeamMembers(),
        api.listDepartments(),
        api.listRoles(),
        api.listAuditLogs(),
        api.teamUsage(),
      ]);
      setOverview(overviewResult.data);
      setMembers(memberResult.data);
      setDepartments(departmentResult.data);
      setRoles(roleResult.data);
      setAuditLogs(auditResult.data);
      setUsage(usageResult.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "团队数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTeam();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function inviteMember() {
    if (!inviteForm.email.trim()) return;
    setSaving(true);
    try {
      await api.inviteTeamMember({
        email: inviteForm.email.trim(),
        role_code: inviteForm.role_code,
        department_id: inviteForm.department_id || undefined,
      });
      setInviteForm({ email: "", role_code: "member", department_id: "" });
      setInviteOpen(false);
      toast.success("成员邀请已记录。");
      await loadTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "邀请成员失败");
    } finally {
      setSaving(false);
    }
  }

  async function createDepartment() {
    if (!departmentName.trim()) return;
    setSaving(true);
    try {
      await api.createDepartment({ name: departmentName.trim() });
      setDepartmentName("");
      setDepartmentOpen(false);
      toast.success("部门已创建。");
      await loadTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建部门失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="团队"
      title="团队"
      subtitle="管理团队空间、成员邀请、部门、角色权限、审计日志和团队用量统计。"
      actions={
        <>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            邀请成员
          </Button>
          <Button variant="secondary" onClick={() => setDepartmentOpen(true)}>
            <Plus className="h-4 w-4" />
            新建部门
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/team/departments">部门管理</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/team/roles">角色权限</Link>
          </Button>
        </>
      }
      rightPanel={
        <div className="space-y-4 2xl:sticky 2xl:top-24">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <ShieldCheck className="mb-4 h-6 w-6 text-cyan-200" />
            <h2 className="text-xl font-black text-white">权限策略</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              建议按部门配置云盘、知识库、文档和数据权限，关键资料启用管理员审批与审计追踪。
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <Activity className="mb-4 h-5 w-5 text-cyan-200" />
            <h3 className="font-bold text-white">团队用量</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">累计用量记录：{usageTotal.toFixed(0)}。后续可按模型、任务和成员拆分账单。</p>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Users, label: "团队成员", value: asNumber(overview.memberCount, members.length) },
          { icon: Building2, label: "部门", value: asNumber(overview.departmentCount, departments.length) },
          { icon: ShieldCheck, label: "角色", value: asNumber(overview.roleCount, roles.length) },
          { icon: Activity, label: "审计日志", value: asNumber(overview.auditCount, auditLogs.length) },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <Icon className="mb-4 h-5 w-5 text-cyan-200" />
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            </div>
          );
        })}
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-black text-white">成员列表</h2>
          <p className="mt-1 text-sm text-slate-400">邮箱和权限范围放到详情里，列表保持紧凑不撑爆空间。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[minmax(180px,1.2fr)_120px_minmax(160px,1fr)_120px_100px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>成员</span>
              <span>角色</span>
              <span>部门</span>
              <span>状态</span>
              <span className="text-right">操作</span>
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">正在加载成员...</div>
              ) : members.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">暂无团队成员。</div>
              ) : (
                members.map((member) => (
                  <div
                    key={asText(member.id)}
                    className="grid grid-cols-[minmax(180px,1.2fr)_120px_minmax(160px,1fr)_120px_100px] items-center gap-4 px-5 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{asText(member.name, "未命名成员")}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{asText(member.email, "待绑定邮箱")}</p>
                    </div>
                    <span className="truncate text-cyan-100">{asText(member.role, "成员")}</span>
                    <span className="truncate text-slate-400">{asText(member.department, "未分配")}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-center text-xs text-slate-200">{asText(member.status, "active")}</span>
                    <span className="flex justify-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/team/members/${asText(member.id)}`}>详情</Link>
                      </Button>
                      <Button className="hidden" variant="ghost" size="sm" onClick={() => setSelectedMember(member)}>
                        详情
                      </Button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-white">部门管理</h2>
            <Button variant="secondary" size="sm" onClick={() => setDepartmentOpen(true)}>
              新建
            </Button>
          </div>
          <div className="grid gap-3">
            {departments.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-400">还没有部门。</div>
            ) : (
              departments.map((department) => (
                <div key={asText(department.id)} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="font-bold text-white">{asText(department.name)}</p>
                  <p className="mt-1 text-xs text-slate-500">创建于 {formatDate(department.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <h2 className="text-xl font-black text-white">角色权限</h2>
          <div className="mt-4 grid gap-3">
            {roles.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-400">暂无角色。</div>
            ) : (
              roles.map((role) => (
                <div key={asText(role.id)} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="font-bold text-white">{asText(role.name, "未命名角色")}</p>
                  <p className="mt-1 text-xs text-slate-500">{asText(role.code)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-black text-white">审计日志</h2>
          <p className="mt-1 text-sm text-slate-400">展示最近 100 条团队操作记录。</p>
        </div>
        <div className="divide-y divide-white/10">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">暂无审计日志。</div>
          ) : (
            auditLogs.slice(0, 8).map((log) => (
              <div key={asText(log.id)} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[180px_minmax(0,1fr)_160px]">
                <span className="font-semibold text-white">{asText(log.action)}</span>
                <span className="min-w-0 truncate text-slate-400">{asText(log.resourceType)} · {asText(log.resourceId)}</span>
                <span className="text-slate-500">{formatDate(log.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              取消
            </Button>
            <Button disabled={!inviteForm.email.trim() || saving} onClick={() => void inviteMember()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              发送邀请
            </Button>
          </div>
        }
        open={inviteOpen}
        size="md"
        title="邀请成员"
        onClose={() => setInviteOpen(false)}
      >
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-white">
            成员邮箱
            <Input value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} placeholder="name@company.com" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white">
            角色
            <select
              className="h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
              value={inviteForm.role_code}
              onChange={(event) => setInviteForm({ ...inviteForm, role_code: event.target.value })}
            >
              <option className="bg-slate-950" value="member">成员</option>
              <option className="bg-slate-950" value="admin">管理员</option>
              <option className="bg-slate-950" value="owner">所有者</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white">
            部门
            <select
              className="h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
              value={inviteForm.department_id}
              onChange={(event) => setInviteForm({ ...inviteForm, department_id: event.target.value })}
            >
              <option className="bg-slate-950" value="">不分配</option>
              {departments.map((department) => (
                <option className="bg-slate-950" key={asText(department.id)} value={asText(department.id)}>
                  {asText(department.name)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </AppModal>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setDepartmentOpen(false)}>
              取消
            </Button>
            <Button disabled={!departmentName.trim() || saving} onClick={() => void createDepartment()}>
              创建部门
            </Button>
          </div>
        }
        open={departmentOpen}
        size="sm"
        title="新建部门"
        onClose={() => setDepartmentOpen(false)}
      >
        <label className="grid gap-2 text-sm font-semibold text-white">
          部门名称
          <Input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="例如：运营部、财务部、产品部" />
        </label>
      </AppModal>

      <AppModal open={Boolean(selectedMember)} size="sm" title="成员详情" onClose={() => setSelectedMember(null)}>
        {selectedMember && (
          <div className="grid gap-4 text-sm">
            {[
              ["成员名称", asText(selectedMember.name)],
              ["角色", asText(selectedMember.role)],
              ["账号邮箱", asText(selectedMember.email, "待绑定邮箱")],
              ["部门", asText(selectedMember.department, "未分配")],
              ["状态", asText(selectedMember.status)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 break-all font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}
      </AppModal>
    </WorkspaceShell>
  );
}
