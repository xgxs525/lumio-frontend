"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export default function KnowledgeMembersPage() {
  const params = useParams<{ knowledgeBaseId: string }>();
  const knowledgeBaseId = params.knowledgeBaseId;
  const [knowledge, setKnowledge] = useState<RecordMap>({});
  const [members, setMembers] = useState<RecordMap[]>([]);
  const [error, setError] = useState("");

  async function loadData() {
    setError("");
    try {
      const [kbResult, memberResult] = await Promise.all([
        api.getKnowledgeBase(knowledgeBaseId),
        api.listTeamMembers(),
      ]);
      setKnowledge(kbResult.data);
      setMembers(memberResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "成员加载失败");
    }
  }

  useEffect(() => {
    void loadData();
  }, [knowledgeBaseId]);

  return (
    <WorkspaceShell
      active="知识库"
      title="知识库成员"
      subtitle="查看可访问当前知识库的团队成员。"
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
          <ShieldCheck className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="text-xl font-black text-white">访问范围</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            当前知识库可见性为：{text(knowledge.visibility, "workspace")}。一期先继承工作空间成员，后续可扩展为单知识库成员授权。
          </p>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-cyan-200" />
            <div>
              <h2 className="text-xl font-black text-white">成员列表</h2>
              <p className="mt-1 text-sm text-slate-400">共 {members.length} 位成员。</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[minmax(180px,1fr)_180px_180px_120px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-bold text-slate-500">
              <span>成员</span>
              <span>角色</span>
              <span>部门</span>
              <span>权限</span>
            </div>
            <div className="divide-y divide-white/10">
              {members.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">暂无成员。</div>
              ) : (
                members.map((member) => (
                  <div key={text(member.id)} className="grid grid-cols-[minmax(180px,1fr)_180px_180px_120px] gap-4 px-5 py-4 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{text(member.name, "未命名成员")}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{text(member.email, "未绑定邮箱")}</p>
                    </div>
                    <span className="truncate text-slate-300">{text(member.role, "成员")}</span>
                    <span className="truncate text-slate-400">{text(member.department, "未分配")}</span>
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-center text-xs font-bold text-cyan-100">可访问</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
