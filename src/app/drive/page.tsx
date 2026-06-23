"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Cloud,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";

import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type DriveRecord = Record<string, unknown>;
type PreviewRecord = {
  kind: "text" | "image" | "pdf" | "download";
  file: DriveRecord;
  content: string;
  truncated: boolean;
  downloadUrl: string;
};

const fileTypes = [
  { label: "文档", extension: ".md", mimeType: "text/markdown", hint: "在线写作、总结和协作", content: "# 新文档\n\n" },
  { label: "表格", extension: ".csv", mimeType: "text/csv", hint: "数据录入、清洗和分析", content: "字段1,字段2\n" },
  { label: "多维表格", extension: ".json", mimeType: "application/json", hint: "项目、客户、库存和流程管理", content: "{\n  \"fields\": []\n}\n" },
  { label: "文本", extension: ".txt", mimeType: "text/plain", hint: "轻量笔记和纯文本资料", content: "" },
  { label: "PPT", extension: ".pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", hint: "汇报、演示和方案输出", content: "" },
  { label: "文件夹", extension: "", mimeType: "", hint: "整理团队资料和处理结果", content: "" },
];

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function formatBytes(value: unknown) {
  const bytes = asNumber(value);
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "刚刚";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fileName(file: DriveRecord) {
  return asText(file.originalName, asText(file.name, "未命名文件"));
}

export default function DrivePage() {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [overview, setOverview] = useState<DriveRecord>({});
  const [folders, setFolders] = useState<DriveRecord[]>([]);
  const [files, setFiles] = useState<DriveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(fileTypes[0]);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<PreviewRecord | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiFile, setAiFile] = useState<DriveRecord | null>(null);
  const [question, setQuestion] = useState("请总结这个文件的核心内容和下一步行动。");
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null);
  const [shareFile, setShareFile] = useState<DriveRecord | null>(null);
  const [shareResult, setShareResult] = useState<DriveRecord | null>(null);

  async function loadDrive() {
    setLoading(true);
    try {
      const [overviewResult, folderResult, fileResult] = await Promise.all([
        api.driveOverview(),
        api.listDriveFolders(),
        api.listDriveFiles(),
      ]);
      setOverview(overviewResult.data);
      setFolders(folderResult.data);
      setFiles(fileResult.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "云盘数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDrive();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (selectedType.label === "文件夹") {
        await api.createDriveFolder(name.trim());
      } else {
        await api.createDriveFile({
          name: name.trim(),
          extension: selectedType.extension,
          mime_type: selectedType.mimeType,
          content: selectedType.content,
        });
      }
      setName("");
      setSelectedType(fileTypes[0]);
      setIsCreateOpen(false);
      toast.success("创建成功，已保存到当前工作空间。");
      await loadDrive();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      await api.uploadDriveFile(file);
      toast.success("上传成功，文件已进入云盘并可用于 AI 处理。");
      await loadDrive();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function handlePreview(fileId: string) {
    setBusy(true);
    try {
      const result = await api.previewDriveFile(fileId);
      setPreview(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "预览失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(fileId: string) {
    setBusy(true);
    try {
      await api.deleteDriveFile(fileId);
      toast.success("文件已删除。");
      await loadDrive();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(fileId: string) {
    setBusy(true);
    try {
      const result = await api.downloadDriveFile(fileId);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "下载失败");
    } finally {
      setBusy(false);
    }
  }

  function openAi(file: DriveRecord) {
    setAiFile(file);
    setAiResult(null);
    setQuestion("请总结这个文件的核心内容和下一步行动。");
    setAiOpen(true);
  }

  async function runFileAi(mode: "index" | "summary" | "ask" | "clean") {
    if (!aiFile) return;
    const fileId = asText(aiFile.id);
    setBusy(true);
    try {
      const result =
        mode === "index"
          ? await api.indexDriveFileAsync(fileId)
          : mode === "summary"
            ? await api.summarizeDriveFileAsync(fileId)
            : mode === "clean"
              ? await api.cleanDriveTableAsync(fileId)
              : await api.askDriveFileAsync(fileId, { question });
      setAiResult(result.data);
      const job = (result.data.job || {}) as Record<string, unknown>;
      toast.success(`文件 AI 异步任务已提交${asText(job.id) ? `，任务 ID：${asText(job.id)}` : ""}。可到任务中心查看状态。`);
      if (mode === "clean") await loadDrive();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "文件 AI 处理失败");
    } finally {
      setBusy(false);
    }
  }

  function openShare(file: DriveRecord) {
    setShareFile(file);
    setShareResult(null);
  }

  async function createShareLink() {
    if (!shareFile) return;
    setBusy(true);
    try {
      const result = await api.createFileShare(asText(shareFile.id), {
        share_type: "link",
        permission: "view",
      });
      setShareResult(result.data);
      toast.success("文件分享链接已生成。");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建分享链接失败");
    } finally {
      setBusy(false);
    }
  }

  async function copyShareLink() {
    const raw = asText(shareResult?.shareUrl);
    if (!raw) return;
    const url = raw.startsWith("http") ? raw : `${window.location.origin}${raw}`;
    await navigator.clipboard.writeText(url);
    toast.info("分享链接已复制。");
  }

  const storageUsed = asNumber(overview.storageUsed);
  const storageQuota = asNumber(overview.storageQuota, 100 * 1024 * 1024 * 1024);
  const storageRate = storageQuota ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0;

  return (
    <WorkspaceShell
      active="云盘"
      title="云盘"
      subtitle="统一存储文件、文档、模板、知识库附件和处理结果，支持预览、AI 索引、总结与团队共享。"
      actions={
        <>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            新建
          </Button>
          <Button variant="secondary" onClick={() => uploadRef.current?.click()} disabled={busy}>
            <Upload className="h-4 w-4" />
            上传文件
          </Button>
          <Button variant="ghost" onClick={() => void loadDrive()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/drive/trash">
              <Trash2 className="h-4 w-4" />
              回收站
            </Link>
          </Button>
          <input
            ref={uploadRef}
            className="hidden"
            type="file"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
        </>
      }
      rightPanel={
        <div className="space-y-4 2xl:sticky 2xl:top-24">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <Cloud className="mb-4 h-6 w-6 text-cyan-200" />
            <h2 className="text-xl font-black text-white">空间概览</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              已使用 {formatBytes(storageUsed)}，当前共有 {asNumber(overview.fileCount)} 个文件和 {asNumber(overview.folderCount)} 个文件夹。
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${storageRate}%` }} />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <Brain className="mb-4 h-5 w-5 text-cyan-200" />
            <h3 className="font-bold text-white">文件 AI</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              PDF、Word、表格、TXT 和 Markdown 可解析为片段，建立向量索引后支持问答、总结和知识库引用。
            </p>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["全部文件", String(asNumber(overview.fileCount))],
          ["文件夹", String(asNumber(overview.folderCount))],
          ["已用空间", formatBytes(storageUsed)],
          ["空间占用", `${storageRate}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 break-words text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {folders.map((folder) => (
          <div key={asText(folder.id)} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <FolderOpen className="mb-5 h-8 w-8 text-cyan-200" />
            <h2 className="break-words text-lg font-black text-white">{asText(folder.name, "未命名文件夹")}</h2>
            <p className="mt-2 text-sm text-slate-400">创建于 {formatDate(folder.createdAt)}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white">文件列表</h2>
            <p className="mt-1 text-sm text-slate-400">上传、创建和 AI 处理后的文件都会保存到当前工作空间。</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void loadDrive()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(240px,1.4fr)_120px_120px_140px_340px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>文件名</span>
              <span>类型</span>
              <span>大小</span>
              <span>更新时间</span>
              <span className="text-right">操作</span>
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">正在加载文件...</div>
              ) : files.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">还没有文件，点击上方“上传文件”或“新建”。</div>
              ) : (
                files.map((file) => {
                  const fileId = asText(file.id);
                  return (
                    <div key={fileId} className="grid grid-cols-[minmax(240px,1.4fr)_120px_120px_140px_340px] items-center gap-4 px-5 py-4 text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                          <FileText className="h-5 w-5" />
                        </span>
                        <Link
                          className="min-w-0 truncate font-semibold text-white hover:text-cyan-100"
                          href={`/drive/files/${fileId}`}
                          title={fileName(file)}
                        >
                          {fileName(file)}
                        </Link>
                      </div>
                      <span className="truncate text-slate-300">{asText(file.extension, "文件") || "文件"}</span>
                      <span className="text-slate-400">{formatBytes(file.size)}</span>
                      <span className="text-slate-400">{formatDate(file.updatedAt || file.createdAt)}</span>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/drive/files/${fileId}`}>
                          <Eye className="h-4 w-4" />
                          预览
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openAi(file)}>
                          <Sparkles className="h-4 w-4" />
                          AI
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openShare(file)}>
                          <Share2 className="h-4 w-4" />
                          分享
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDownload(fileId)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(fileId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              取消
            </Button>
            <Button disabled={!name.trim() || busy} onClick={() => void handleCreate()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </div>
        }
        open={isCreateOpen}
        size="lg"
        title="新建文件"
        description="选择文件类型，并为新文件自定义名称。弹窗会固定在当前页面上方，背景页面不会跟随滚动。"
        onClose={() => setIsCreateOpen(false)}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {fileTypes.map((type) => (
            <button
              key={type.label}
              className={`min-w-0 rounded-3xl border p-5 text-left transition ${
                selectedType.label === type.label
                  ? "border-cyan-200/60 bg-cyan-300/12"
                  : "border-white/10 bg-white/[0.05] hover:border-cyan-200/35"
              }`}
              onClick={() => setSelectedType(type)}
              type="button"
            >
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950">
                {type.label.slice(0, 1)}
              </span>
              <h3 className="font-black text-white">{type.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{type.hint}</p>
            </button>
          ))}
        </div>
        <label className="mt-5 grid gap-2 text-sm font-semibold text-white">
          名称
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：AI 资料、项目启动方案、销售数据表" />
        </label>
      </AppModal>

      <AppModal open={Boolean(preview)} size="lg" title="文件预览" onClose={() => setPreview(null)}>
        {preview && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="break-words text-lg font-black text-white">{fileName(preview.file)}</p>
              <p className="mt-1 text-sm text-slate-400">{preview.kind === "download" ? "当前文件类型暂不支持在线预览，可下载查看。" : "预览内容来自后端文件预览接口。"}</p>
            </div>
            {preview.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={fileName(preview.file)} className="max-h-[60vh] w-full rounded-2xl object-contain" src={api.driveFileDownloadUrl(asText(preview.file.id))} />
            ) : preview.kind === "pdf" ? (
              <iframe className="h-[60vh] w-full rounded-2xl border border-white/10 bg-white" src={api.driveFileDownloadUrl(asText(preview.file.id))} title={fileName(preview.file)} />
            ) : preview.kind === "text" ? (
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-200">
                {preview.content}
              </pre>
            ) : null}
          </div>
        )}
      </AppModal>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setShareFile(null)}>
              关闭
            </Button>
            {shareResult ? (
              <Button onClick={() => void copyShareLink()}>
                复制链接
              </Button>
            ) : (
              <Button disabled={!shareFile || busy} onClick={() => void createShareLink()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                创建分享链接
              </Button>
            )}
          </div>
        }
        open={Boolean(shareFile)}
        size="md"
        title="文件分享"
        description={shareFile ? fileName(shareFile) : undefined}
        onClose={() => setShareFile(null)}
      >
        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
            <p className="font-bold text-white">分享权限</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              当前创建的是只读链接，适合发送给团队成员预览文件。后续可在团队权限中扩展评论、编辑和到期时间。
            </p>
          </div>
          {shareResult ? (
            <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
              <p className="font-bold text-white">分享链接</p>
              <p className="mt-3 break-all rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm leading-6 text-cyan-50">
                {asText(shareResult.shareUrl).startsWith("http")
                  ? asText(shareResult.shareUrl)
                  : `${typeof window !== "undefined" ? window.location.origin : ""}${asText(shareResult.shareUrl)}`}
              </p>
            </div>
          ) : null}
        </div>
      </AppModal>

      <AppModal
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" disabled={!aiFile || busy} onClick={() => void runFileAi("index")}>
              建立索引
            </Button>
            <Button variant="secondary" disabled={!aiFile || busy} onClick={() => void runFileAi("summary")}>
              文件总结
            </Button>
            <Button variant="secondary" disabled={!aiFile || busy} onClick={() => void runFileAi("clean")}>
              <Wand2 className="h-4 w-4" />
              表格清洗
            </Button>
            <Button disabled={!aiFile || !question.trim() || busy} onClick={() => void runFileAi("ask")}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              提问
            </Button>
          </div>
        }
        open={aiOpen}
        size="lg"
        title="文件 AI"
        description={aiFile ? fileName(aiFile) : undefined}
        onClose={() => setAiOpen(false)}
      >
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-white">
            问题或处理要求
            <textarea
              className="min-h-28 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-cyan-300"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="例如：请找出这个文件里的关键结论、风险和待办事项"
            />
          </label>
          {aiResult && (
            <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
              <h3 className="mb-3 font-black text-white">处理结果</h3>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-cyan-50">
                {asText(aiResult.answer, asText(aiResult.summary, JSON.stringify(aiResult, null, 2)))}
              </pre>
            </div>
          )}
        </div>
      </AppModal>
    </WorkspaceShell>
  );
}
