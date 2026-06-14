"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileText, RefreshCw, Trash2, UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";

type TemplateItem = {
  id: string;
  name: string;
  size?: number;
  createdAt?: string | null;
};

function asTemplate(item: Record<string, unknown>): TemplateItem {
  return {
    id: String(item.id),
    name: String(item.name || item.filename || "未命名模板"),
    size: typeof item.size === "number" ? item.size : undefined,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
  };
}

function formatSize(size?: number) {
  if (!size) return "未知大小";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string | null) {
  if (!value) return "刚刚保存";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚保存";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function TemplatesPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [publicTemplates, setPublicTemplates] = useState<TemplateItem[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auth = useMemo(() => getStoredAuth(), []);
  const isLoggedIn = Boolean(auth?.token);

  function resetUploadForm() {
    setSelectedFile(null);
    setTemplateName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    setMessage(null);
    resetUploadForm();
    try {
      const publicResult = await api.listTemplates();
      setPublicTemplates(publicResult.templates.map(asTemplate));

      if (isLoggedIn) {
        const mineResult = await api.listMyTemplates();
        setMyTemplates(mineResult.templates.map(asTemplate));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "模板加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTemplates();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file && !templateName) {
      setTemplateName(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("请先选择一个模板文件");
      return;
    }
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.uploadTemplate(selectedFile, templateName);
      setMyTemplates((items) => [asTemplate(result.template), ...items]);
      resetUploadForm();
      setMessage("模板已上传到“我的模板”");
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(item: TemplateItem) {
    const token = getStoredAuth()?.token;
    if (!token) {
      setError("请先登录后再下载模板");
      return;
    }
    setError(null);
    try {
      const response = await fetch(api.templateDownloadUrl(item.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "下载失败");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "下载失败");
    }
  }

  async function handleDelete(item: TemplateItem) {
    setError(null);
    setMessage(null);
    try {
      await api.deleteTemplate(item.id);
      setMyTemplates((items) => items.filter((current) => current.id !== item.id));
      setMessage("模板已删除");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <div className="min-h-screen bg-[#061024] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 space-y-4">
          <Badge>模板中心</Badge>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">沉淀可复用的办公模板</h1>
              <p className="mt-3 max-w-3xl leading-7 text-slate-300/78">
                支持表格、文档、PPT、PDF 和文本模板上传。登录后可保存到“我的模板”，后续在工作台中复用。
              </p>
            </div>
            <Button variant="secondary" onClick={loadTemplates} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              刷新列表
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-white/10 bg-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white">上传新模板</CardTitle>
            <CardDescription className="text-slate-300/72">
              支持 .xlsx、.xls、.csv、.docx、.pptx、.pdf、.txt、.md 等常用办公文件。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoggedIn ? (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,1fr)_auto]">
                <Input ref={fileInputRef} type="file" onChange={handleFileChange} />
                <Input
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="模板名称，例如：月度经营分析"
                />
                <Button onClick={handleUpload} disabled={uploading}>
                  <UploadCloud className="h-4 w-4" />
                  {uploading ? "上传中..." : "上传模板"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-cyan-50/82">登录后可以上传、下载和删除自己的模板。</p>
                <Button asChild>
                  <Link href="/login?next=/templates">登录后管理模板</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {message && <div className="mb-5 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}
        {error && <div className="mb-5 rounded-lg border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}

        {isLoggedIn && (
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-black">我的模板</h2>
            {myTemplates.length === 0 ? (
              <Card className="border-white/10 bg-white/[0.05]">
                <CardContent className="p-6 text-slate-300/72">还没有上传模板。选择上方文件后，会保存到这里。</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {myTemplates.map((item) => (
                  <Card key={item.id} className="border-white/10 bg-white/[0.06]">
                    <CardHeader>
                      <div className="mb-2 grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
                        <FileText className="h-5 w-5" />
                      </div>
                      <CardTitle className="truncate text-white">{item.name}</CardTitle>
                      <CardDescription className="text-slate-300/70">
                        {formatSize(item.size)} · {formatDate(item.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                      <Button className="flex-1" onClick={() => handleDownload(item)}>
                        <Download className="h-4 w-4" />
                        下载
                      </Button>
                      <Button
                        className="border border-red-300/30 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                        onClick={() => handleDelete(item)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-4 text-2xl font-black">公开模板</h2>
          {loading ? (
            <Card className="border-white/10 bg-white/[0.05]">
              <CardContent className="p-6 text-slate-300/72">正在加载模板...</CardContent>
            </Card>
          ) : publicTemplates.length === 0 ? (
            <Card className="border-white/10 bg-white/[0.05]">
              <CardContent className="p-6 text-slate-300/72">暂无公开模板，后续可接入官方模板库。</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {publicTemplates.map((item) => (
                <Card key={item.id} className="border-white/10 bg-white/[0.06]">
                  <CardHeader>
                    <CardTitle className="truncate text-white">{item.name}</CardTitle>
                    <CardDescription className="text-slate-300/70">{formatSize(item.size)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" onClick={() => handleDownload(item)}>
                      <Download className="h-4 w-4" />
                      下载模板
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
