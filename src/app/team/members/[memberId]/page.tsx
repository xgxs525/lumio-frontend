"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export default function TeamMemberDetailPage() {
  const params = useParams<{ memberId: string }>();
  const memberId = params.memberId;
  const [member, setMember] = useState<RecordMap>({});
  const [roles, setRoles] = useState<RecordMap[]>([]);
  const [departments, setDepartments] = useState<RecordMap[]>([]);
  const [form, setForm] = useState({ role_code: "member", department_id: "", status: "active" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
    setError("");
    setLoading(true);
    try {
      const [memberResult, roleResult, departmentResult] = await Promise.all([
        api.getTeamMember(memberId),
        api.listRoles(),
        api.listDepartments(),
      ]);
      setMember(memberResult.data);
      setRoles(roleResult.data);
      setDepartments(departmentResult.data);
      setForm({
        role_code: text(memberResult.data.roleCode, "member"),
        department_id: text(memberResult.data.departmentId),
        status: text(memberResult.data.status, "active"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "成员详情加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [memberId]);

  async function saveMember() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.updateTeamMember(memberId, {
        role_code: form.role_code,
        department_id: form.department_id || "",
        status: form.status,
      });
      setMember(result.data);
      setNotice("成员信息已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="团队"
      title="成员详情"
      subtitle="调整成员角色、所属部门和账号状态。"
      actions={
        <Button variant="secondary" asChild>
          <Link href="/team">
            <ArrowLeft className="h-4 w-4" />
            返回团队
          </Link>
        </Button>
      }
      rightPanel={
        <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
          <UserRound className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="text-xl font-black text-white">权限提示</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            角色决定成员可访问的云盘、知识库、文档和后台能力。后续可继续细化到资源级权限。
          </p>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">{notice}</div>}

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            正在加载成员...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="min-w-0 rounded-2xl bg-slate-950/35 p-5">
              <p className="text-sm text-slate-400">成员</p>
              <h2 className="mt-2 break-words text-3xl font-black text-white">{text(member.name, "未命名成员")}</h2>
              <p className="mt-3 break-all text-sm text-slate-400">{text(member.email, "未绑定邮箱")}</p>
            </div>
            <div className="min-w-0 space-y-4">
              <label className="block text-sm font-bold text-white">
                角色
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-slate-950/35 px-3 text-white outline-none"
                  value={form.role_code}
                  onChange={(event) => setForm((old) => ({ ...old, role_code: event.target.value }))}
                >
                  {roles.map((role) => (
                    <option className="bg-slate-950" key={text(role.id)} value={text(role.code)}>
                      {text(role.name, "成员")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-white">
                部门
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-slate-950/35 px-3 text-white outline-none"
                  value={form.department_id}
                  onChange={(event) => setForm((old) => ({ ...old, department_id: event.target.value }))}
                >
                  <option className="bg-slate-950" value="">
                    未分配
                  </option>
                  {departments.map((department) => (
                    <option className="bg-slate-950" key={text(department.id)} value={text(department.id)}>
                      {text(department.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-white">
                状态
                <Input value={form.status} onChange={(event) => setForm((old) => ({ ...old, status: event.target.value }))} />
              </label>
              <Button onClick={() => void saveMember()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存成员
              </Button>
            </div>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
