"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, DatabaseZap, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export default function KnowledgeSettingsPage() {
  const params = useParams<{ knowledgeBaseId: string }>();
  const knowledgeBaseId = params.knowledgeBaseId;
  const [form, setForm] = useState({ name: "", description: "", visibility: "workspace" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadKnowledge() {
    setLoading(true);
    setError("");
    try {
      const result = await api.getKnowledgeBase(knowledgeBaseId);
      const data = result.data as RecordMap;
      setForm({
        name: text(data.name),
        description: text(data.description),
        visibility: text(data.visibility, "workspace"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "知识库设置加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadKnowledge();
  }, [knowledgeBaseId]);

  async function saveKnowledge() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.updateKnowledgeBase(knowledgeBaseId, {
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
      });
      setNotice("知识库设置已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      active="知识库"
      title="知识库设置"
      subtitle="管理知识库基础信息、可见范围和后续资料治理策略。"
      actions={
        <Button variant="secondary" asChild>
          <Link href={`/knowledge/${knowledgeBaseId}`}>
            <ArrowLeft className="h-4 w-4" />
            返回知识库
          </Link>
        </Button>
      }
      rightPanel={
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <DatabaseZap className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="text-xl font-black text-white">治理建议</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            企业知识库建议按主题或部门拆分，资料来源保持可追溯，关键知识库启用成员权限和审计日志。
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
            正在加载...
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">
            <label className="grid gap-2 text-sm font-bold text-white">
              名称
              <Input value={form.name} onChange={(event) => setForm((old) => ({ ...old, name: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white">
              简介
              <textarea
                className="min-h-32 rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
                value={form.description}
                onChange={(event) => setForm((old) => ({ ...old, description: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white">
              可见范围
              <select
                className="h-11 rounded-lg border border-white/15 bg-slate-950/35 px-3 text-white outline-none"
                value={form.visibility}
                onChange={(event) => setForm((old) => ({ ...old, visibility: event.target.value }))}
              >
                <option className="bg-slate-950" value="private">仅知识库成员可见</option>
                <option className="bg-slate-950" value="workspace">当前工作空间可见</option>
                <option className="bg-slate-950" value="public">公开可见</option>
              </select>
            </label>
            <Button disabled={!form.name.trim() || saving} onClick={() => void saveKnowledge()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存知识库
            </Button>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
