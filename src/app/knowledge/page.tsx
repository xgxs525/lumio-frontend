"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Database, Loader2, MoreHorizontal, Pencil, Plus, Search, Settings, Trash2, Upload, X } from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type Rec = Record<string, unknown>;
function asText(v: unknown, fallback = "") { return typeof v === "string" ? v : fallback; }
function asNum(v: unknown, fallback = 0) { return typeof v === "number" ? v : fallback; }

const { format, formatDistanceToNow, parseISO } = (() => {
  try {
    const df = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    function fmt(d: Date) { return df.format(d); }
    function dist(d: Date) {
      if (Number.isNaN(d.getTime())) return "—";
      const ms = Date.now() - d.getTime();
      const min = Math.floor(ms / 60000);
      if (min < 1) return "刚刚";
      if (min < 60) return `${min} 分钟前`;
      const hrs = Math.floor(min / 60);
      if (hrs < 24) return `${hrs} 小时前`;
      const days = Math.floor(hrs / 24);
      if (days < 30) return `${days} 天前`;
      return fmt(d);
    }
    return { format: fmt, formatDistanceToNow: dist, parseISO: (s: string) => new Date(s) };
  } catch {
    const fallback = (d: Date) => d.toLocaleString("zh-CN");
    return { format: fallback, formatDistanceToNow: fallback as (d: Date) => string, parseISO: (s: string) => new Date(s) };
  }
})();

const visibilityLabel: Record<string, string> = { private: "私有", workspace: "成员可见", public: "公开" };
const visibilityHint: Record<string, string> = { private: "仅你自己可见", workspace: "成员可见，适合团队共享", public: "公开范围内可访问" };
const statusLabel: Record<string, string> = { active: "正常", processing: "处理中", disabled: "已停用", error: "异常" };

type Filter = "全部" | "私有" | "成员可见" | "公开" | "已停用";

export default function KnowledgePage() {
  const router = useRouter();
  const [bases, setBases] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("全部");
  const [sort, setSort] = useState<"updated" | "created" | "sources" | "name">("updated");
  const [menuId, setMenuId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", visibility: "private" });
  const [formTouched, setFormTouched] = useState(false);

  const [editTarget, setEditTarget] = useState<Rec | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", visibility: "private" });

  const [deleteTarget, setDeleteTarget] = useState<Rec | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");
  const [deleteInput, setDeleteInput] = useState("");

  function openDeleteModal(b: Rec) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setDeleteConfirmCode(code);
    setDeleteInput("");
    setMenuId("");
    setDeleteTarget(b);
  }

  function openEditModal(b: Rec) {
    setEditTarget(b);
    setEditForm({
      name: asText(b.name),
      description: asText(b.description),
      visibility: asText(b.visibility, "private"),
    });
    setMenuId("");
  }

  const expectedDeleteInput = deleteTarget ? deleteConfirmCode + asText(deleteTarget.name) : "";

  async function loadBases() {
    setLoading(true);
    try {
      const r = await api.listKnowledgeBases();
      setBases(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBases(); }, []);

  async function createBase() {
    setFormTouched(true);
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await api.createKnowledgeBase({ name: form.name.trim(), description: form.description.trim(), visibility: form.visibility });
      setBases((prev) => [r.data, ...prev]);
      setCreateOpen(false);
      const newId = (r.data as Rec).id as string;
      setForm({ name: "", description: "", visibility: "private" });
      if (newId) {
        router.push(`/knowledge/${newId}/add-source`);
        return;
      }
      toast.success("知识库已创建。");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveEditBase() {
    if (!editTarget || !editForm.name.trim()) return;
    setSaving(true);
    try {
      const r = await api.updateKnowledgeBase(asText(editTarget.id), {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        visibility: editForm.visibility,
      });
      const updated = r.data as Rec;
      setBases((prev) => prev.map((base) => asText(base.id) === asText(editTarget.id) ? { ...base, ...updated } : base));
      setEditTarget(null);
      toast.success("知识库信息已更新。");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBase() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.deleteKnowledgeBase(asText(deleteTarget.id));
      setBases((prev) => prev.filter((b) => asText(b.id) !== asText(deleteTarget.id)));
      setDeleteTarget(null);
      toast.success("知识库已删除。");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function copyBaseLink(b: Rec) {
    const url = `${window.location.origin}/knowledge/${asText(b.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制。");
    } catch {
      toast.error("复制失败");
    } finally {
      setMenuId("");
    }
  }

  function unavailable(label: string) {
    toast.error(`${label}暂未开放`);
    setMenuId("");
  }

  const filtered = useMemo(() => {
    let items = [...bases];
    if (filter !== "全部") {
      if (filter === "已停用") {
        items = items.filter((b) => asText(b.status) === "disabled");
      } else {
        const visKey = filter === "私有" ? "private" : filter === "成员可见" ? "workspace" : "public";
        items = items.filter((b) => asText(b.visibility, "private") === visKey && asText(b.status, "active") !== "disabled");
      }
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((b) => asText(b.name).toLowerCase().includes(q) || asText(b.description).toLowerCase().includes(q));
    }
    items.sort((a, b) => {
      if (sort === "name") return asText(a.name).localeCompare(asText(b.name), "zh-CN");
      if (sort === "sources") return asNum(b.sourceCount) - asNum(a.sourceCount);
      const aDate = sort === "created" ? asText(a.createdAt) : asText(a.updatedAt);
      const bDate = sort === "created" ? asText(b.createdAt) : asText(b.updatedAt);
      return (bDate || "").localeCompare(aDate || "");
    });
    return items;
  }, [bases, filter, search, sort]);

  const totalSources = bases.reduce((s, b) => s + asNum(b.sourceCount), 0);
  const totalChunks = bases.reduce((s, b) => s + asNum(b.chunkCount), 0);
  const latestUpdate = bases.length ? (() => {
    const dates = bases.map((b) => asText(b.updatedAt)).filter(Boolean).sort().reverse();
    return dates[0] ? format(parseISO(dates[0])) : "—";
  })() : "—";

  return (
    <WorkspaceShell
      active="知识库"
      title="知识库"
      subtitle="把文件、文档、文本和网页链接整理成 AI 可以检索、总结和问答的知识来源。"
      actions={<Button onClick={() => { setCreateOpen(true); setFormTouched(false); }}><Plus className="h-4 w-4" />新建知识库</Button>}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["知识库", String(bases.length), "个"],
          ["内容数量", String(totalSources), "条"],
          ["索引片段", String(totalChunks), "个"],
          ["最近更新", latestUpdate, ""],
        ].map(([label, value, unit]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
            {unit && <p className="text-[11px] text-slate-400">{unit}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="搜索知识库" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 border-slate-200 bg-white pl-10 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["全部", "私有", "成员可见", "公开", "已停用"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${filter === f ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{f}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 outline-none">
          <option value="updated">最近更新</option>
          <option value="created">创建时间</option>
          <option value="sources">内容数量</option>
          <option value="name">名称</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-sm text-slate-500">加载知识库...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center py-16 text-center">
          <Database className="h-10 w-10 text-slate-300" />
          <h3 className="mt-4 font-bold text-slate-500">还没有知识库</h3>
          <p className="mt-1 text-sm text-slate-400">创建知识库后，你可以添加文件、文档、文本或链接，让 AI 基于这些资料回答问题。</p>
          <Button className="mt-4" onClick={() => { setCreateOpen(true); setFormTouched(false); }}><Plus className="h-4 w-4" />新建知识库</Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => {
            const id = asText(b.id);
            const vis = asText(b.visibility, "private");
            const st = asText(b.status, "active");
            return (
              <article key={id} className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold text-slate-950">{asText(b.name, "未命名")}</h3>
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700" title={visibilityHint[vis]}>{visibilityLabel[vis] || vis}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">{asText(b.description, "整理资料，让 AI 基于内容回答。")}</p>
                  </div>
                  <button
                    type="button"
                    title="更多操作"
                    onClick={() => setMenuId(menuId === id ? "" : id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {menuId === id && (
                  <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg">
                    <MenuLink href={`/knowledge/${id}`} label="打开" onClick={() => setMenuId("")} />
                    <MenuLink href={`/knowledge/${id}/add-source`} label="添加资料" onClick={() => setMenuId("")} />
                    <MenuLink href={`/knowledge/${id}?settings=1`} label="知识库设置" onClick={() => setMenuId("")} />
                    <button onClick={() => copyBaseLink(b)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" />复制链接</button>
                    <button onClick={() => unavailable("停用知识库")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-500 hover:bg-slate-50">停用知识库</button>
                    <div className="my-1 border-t border-slate-100" />
                    <button onClick={() => openDeleteModal(b)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />删除知识库</button>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{asNum(b.sourceCount)} 条内容</span>
                  {st !== "active" && <span className="text-amber-600">{statusLabel[st] || st}</span>}
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  最近更新：{asText(b.updatedAt) ? formatDistanceToNow(parseISO(asText(b.updatedAt))) : "—"}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" asChild><Link href={`/knowledge/${id}`}>打开</Link></Button>
                  <Button size="sm" variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" asChild>
                    <Link href={`/knowledge/${id}/add-source`}><Upload className="h-3.5 w-3.5" />添加资料</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setCreateOpen(false); setFormTouched(false); } }}>
          <div className="w-full max-w-[480px] rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between gap-4 px-7 pb-5 pt-7">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-950">新建知识库</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">创建一个知识库，用来整理文件、文档、文本或链接，方便后续检索和问答。</p>
              </div>
              <button onClick={() => { setCreateOpen(false); setFormTouched(false); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-7 pb-7">
              <TextField label="知识库名称" value={form.name} placeholder="例如：AI 技术资料、抖音选题库、学习笔记" error={formTouched && !form.name.trim()} onChange={(value) => { setForm({ ...form, name: value }); setFormTouched(true); }} />
              <TextField label="简介" value={form.description} placeholder="一句话说明这个知识库的内容和用途" onChange={(value) => setForm({ ...form, description: value })} />
              <VisibilityPicker value={form.visibility} onChange={(visibility) => setForm({ ...form, visibility })} />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => { setCreateOpen(false); setFormTouched(false); }} className="h-[44px] min-w-[80px] rounded-[14px] border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">取消</button>
                <button onClick={createBase} disabled={saving || !form.name.trim()} className={`h-[44px] min-w-[120px] whitespace-nowrap rounded-[14px] px-6 text-sm font-semibold transition ${saving || !form.name.trim() ? "cursor-not-allowed bg-blue-100 text-blue-300" : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"}`}>
                  {saving ? "创建中..." : "创建知识库"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AppModal open={!!editTarget} onClose={() => setEditTarget(null)} title="编辑知识库">
        <div className="space-y-4">
          <TextField label="知识库名称" value={editForm.name} placeholder="知识库名称" error={!editForm.name.trim()} onChange={(value) => setEditForm({ ...editForm, name: value })} />
          <TextField label="简介" value={editForm.description} placeholder="一句话说明这个知识库" onChange={(value) => setEditForm({ ...editForm, description: value })} />
          <VisibilityPicker value={editForm.visibility} onChange={(visibility) => setEditForm({ ...editForm, visibility })} />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setEditTarget(null)}>取消</Button>
          <Button onClick={saveEditBase} disabled={saving || !editForm.name.trim()} className="bg-blue-600 text-white hover:bg-blue-700">{saving ? "保存中..." : "保存"}</Button>
        </div>
      </AppModal>

      <AppModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="确认删除知识库">
        <p className="text-sm text-slate-600">
          确定要删除 <strong className="text-red-600">{asText(deleteTarget?.name)}</strong> 吗？此操作不可撤销。
        </p>
        <p className="mt-2 text-xs text-slate-400">删除后，知识库中的知识内容、索引片段和问答记录将无法恢复。</p>
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50/50 p-4">
          <p className="mb-3 text-xs font-semibold text-red-700">请输入以下文字以确认删除：</p>
          <div className="mb-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-center">
            <code className="select-all text-base font-bold tracking-wider text-red-600">{deleteConfirmCode}{asText(deleteTarget?.name)}</code>
          </div>
          <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="输入上面的确认文字" className="h-[44px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50" />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button onClick={deleteBase} disabled={saving || deleteInput !== expectedDeleteInput} className={deleteInput === expectedDeleteInput ? "bg-red-600 text-white hover:bg-red-700" : "cursor-not-allowed bg-slate-200 text-slate-400"}>
            {saving ? "删除中..." : "确认删除"}
          </Button>
        </div>
      </AppModal>
    </WorkspaceShell>
  );
}

function MenuLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50">
      {label}
    </Link>
  );
}

function TextField({ label, value, placeholder, error, onChange }: { label: string; value: string; placeholder: string; error?: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-[48px] w-full rounded-[14px] border px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-4 ${error ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-50" : "border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white focus:ring-blue-50"}`}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">这里不能为空</p>}
    </div>
  );
}

function VisibilityPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">可见范围</label>
      <div className="flex gap-2">
        {Object.entries(visibilityLabel).map(([k, v]) => (
          <button key={k} type="button" onClick={() => onChange(k)} className={`min-w-[90px] flex-1 whitespace-nowrap rounded-[14px] border py-2.5 text-xs font-medium transition ${value === k ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{v}</button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">{visibilityHint[value] || visibilityHint.private}</p>
    </div>
  );
}
