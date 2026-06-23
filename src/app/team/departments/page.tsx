"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatDate(value: unknown) {
  const raw = text(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString("zh-CN");
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<RecordMap[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = departments.find((item) => text(item.id) === selectedId);

  async function loadDepartments(nextId?: string) {
    setLoading(true);
    try {
      const result = await api.listDepartments();
      setDepartments(result.data);
      const firstId = nextId || text(result.data[0]?.id);
      setSelectedId(firstId);
      setName(text(result.data.find((item) => text(item.id) === firstId)?.name, text(result.data[0]?.name)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "部门加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDepartments();
  }, []);

  function selectDepartment(item: RecordMap) {
    setSelectedId(text(item.id));
    setName(text(item.name));
  }

  async function createDepartment() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const result = await api.createDepartment({ name: newName.trim() });
      setNewName("");
      toast.success("部门已创建。");
      await loadDepartments(text(result.data.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建部门失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveDepartment() {
    if (!selectedId || !name.trim()) return;
    setSaving(true);
    try {
      const result = await api.updateDepartment(selectedId, { name: name.trim() });
      toast.success("部门已保存。");
      await loadDepartments(text(result.data.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存部门失败");
    } finally {
      setSaving(false);
    }
  }

  async function removeDepartment() {
    if (!selectedId) return;
    const ok = window.confirm("删除部门后，相关成员会变为未分配。确定删除吗？");
    if (!ok) return;
    setSaving(true);
    try {
      await api.deleteDepartment(selectedId);
      toast.success("部门已删除。");
      await loadDepartments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除部门失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="团队"
      title="部门管理"
      subtitle="维护团队组织结构，后续可继续接入成员归属、部门权限和审批策略。"
      actions={
        <Button variant="secondary" asChild>
          <Link href="/team">
            <ArrowLeft className="h-4 w-4" />
            返回团队
          </Link>
        </Button>
      }
      rightPanel={
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <Building2 className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="text-xl font-black text-white">部门权限</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            当前先完成部门档案和成员归属入口，后续可按部门绑定云盘、知识库和工作流权限。
          </p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="mb-4 flex gap-2">
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="新部门名称" />
            <Button disabled={!newName.trim() || saving} onClick={() => void createDepartment()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3">
            {loading ? (
              <div className="rounded-2xl bg-slate-950/35 p-5 text-sm text-slate-400">正在加载...</div>
            ) : departments.length === 0 ? (
              <div className="rounded-2xl bg-slate-950/35 p-5 text-sm text-slate-400">还没有部门，先创建一个。</div>
            ) : (
              departments.map((item) => (
                <button
                  key={text(item.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedId === text(item.id)
                      ? "border-cyan-300/60 bg-cyan-300/15"
                      : "border-white/10 bg-slate-950/35 hover:border-white/20"
                  }`}
                  onClick={() => selectDepartment(item)}
                  type="button"
                >
                  <p className="break-words font-black text-white">{text(item.name)}</p>
                  <p className="mt-2 text-xs text-slate-500">创建于 {formatDate(item.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
          {selected ? (
            <div className="max-w-2xl">
              <p className="text-sm text-slate-400">当前部门</p>
              <h2 className="mt-2 break-words text-3xl font-black text-white">{text(selected.name)}</h2>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-white">
                  部门名称
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={saving || !name.trim()} onClick={() => void saveDepartment()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存部门
                  </Button>
                  <Button variant="secondary" disabled={saving} onClick={() => void removeDepartment()}>
                    <Trash2 className="h-4 w-4" />
                    删除部门
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/35 p-8 text-sm text-slate-400">请选择左侧部门。</div>
          )}
        </section>
      </div>
    </WorkspaceShell>
  );
}
