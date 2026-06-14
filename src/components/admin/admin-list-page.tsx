"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type AdminKind =
  | "users"
  | "workspaces"
  | "orders"
  | "payments"
  | "models"
  | "storage"
  | "audit"
  | "system";

type RecordMap = Record<string, unknown>;

type Column = {
  key: string;
  label: string;
};

function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function toRows(data: unknown): RecordMap[] {
  if (Array.isArray(data)) return data.filter((item): item is RecordMap => Boolean(item) && typeof item === "object");
  if (data && typeof data === "object") {
    return Object.entries(data as RecordMap).map(([key, value]) => ({
      key,
      value,
      detail: typeof value === "object" ? JSON.stringify(value) : value,
    }));
  }
  return [];
}

async function loadByKind(kind: AdminKind) {
  switch (kind) {
    case "users":
      return (await api.adminUsers()).data;
    case "workspaces":
      return (await api.adminWorkspaces()).data;
    case "orders":
      return (await api.adminOrders()).data;
    case "payments":
      return (await api.adminPayments()).data;
    case "models":
      return (await api.adminModelConfigs()).data;
    case "storage":
      return (await api.adminStorage()).data;
    case "audit":
      return (await api.adminAuditLogs()).data;
    case "system":
      return (await api.adminSystem()).data;
    default:
      return [];
  }
}

export function AdminListPage({
  kind,
  title,
  subtitle,
  columns,
}: {
  kind: AdminKind;
  title: string;
  subtitle: string;
  columns: Column[];
}) {
  const [rows, setRows] = useState<RecordMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRows() {
    setError("");
    setLoading(true);
    try {
      const data = await loadByKind(kind);
      setRows(toRows(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "后台数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [kind]);

  return (
    <WorkspaceShell
      active="后台管理"
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              返回后台
            </Link>
          </Button>
          <Button variant="secondary" disabled={loading} onClick={() => void loadRows()}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </>
      }
      rightPanel={
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <h2 className="text-xl font-black text-white">运营说明</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            当前页面提供一期后台查看能力，配置写入、风控策略和更细的审批流需要接入正式运营后台后继续扩展。
          </p>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-black text-white">数据列表</h2>
          <p className="mt-1 text-sm text-slate-400">共 {rows.length} 条记录。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div
              className="grid gap-4 border-b border-white/10 px-5 py-3 text-xs font-bold text-slate-500"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(140px, 1fr))` }}
            >
              {columns.map((column) => (
                <span key={column.key}>{column.label}</span>
              ))}
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  正在加载...
                </div>
              ) : rows.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">暂无数据。</div>
              ) : (
                rows.map((row, index) => (
                  <div
                    key={text(row.id, text(row.key, String(index)))}
                    className="grid gap-4 px-5 py-4 text-sm text-slate-300"
                    style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(140px, 1fr))` }}
                  >
                    {columns.map((column) => (
                      <span key={column.key} className="min-w-0 break-words">
                        {text(row[column.key])}
                      </span>
                    ))}
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
