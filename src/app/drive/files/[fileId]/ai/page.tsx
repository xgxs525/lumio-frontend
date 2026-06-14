"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bot, FileSearch, Loader2, MessageSquareText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { api } from "@/lib/api";

type RecordMap = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asArray(value: unknown): RecordMap[] {
  return Array.isArray(value) ? value.filter((item): item is RecordMap => Boolean(item) && typeof item === "object") : [];
}

export default function FileAiPage() {
  const params = useParams<{ fileId: string }>();
  const fileId = params.fileId;
  const [file, setFile] = useState<RecordMap>({});
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [summary, setSummary] = useState("");
  const [sources, setSources] = useState<RecordMap[]>([]);
  const [job, setJob] = useState<RecordMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState("");
  const [error, setError] = useState("");

  async function loadFile() {
    setLoading(true);
    setError("");
    try {
      const result = await api.previewDriveFile(fileId);
      setFile(result.data.file || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件信息加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFile();
  }, [fileId]);

  async function runIndex() {
    setRunning("index");
    setError("");
    try {
      const result = await api.indexDriveFileAsync(fileId);
      setJob(result.data.job as RecordMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建解析任务失败");
    } finally {
      setRunning("");
    }
  }

  async function runSummary() {
    setRunning("summary");
    setError("");
    try {
      const result = await api.summarizeDriveFile(fileId);
      setSummary(text(result.data.summary, "暂时没有生成摘要。"));
      setSources(asArray(result.data.sources));
      if (result.data.job && typeof result.data.job === "object") setJob(result.data.job as RecordMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件总结失败");
    } finally {
      setRunning("");
    }
  }

  async function askFile() {
    if (!question.trim()) return;
    setRunning("ask");
    setError("");
    try {
      const result = await api.askDriveFile(fileId, { question: question.trim() });
      setAnswer(text(result.data.answer, "暂时没有回答。"));
      setSources(asArray(result.data.sources));
      if (result.data.job && typeof result.data.job === "object") setJob(result.data.job as RecordMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件问答失败");
    } finally {
      setRunning("");
    }
  }

  return (
    <WorkspaceShell
      active="云盘"
      title="文件 AI"
      subtitle="围绕单个文件进行解析、索引、总结和问答。"
      actions={
        <Button variant="secondary" asChild>
          <Link href="/drive">
            <ArrowLeft className="h-4 w-4" />
            返回云盘
          </Link>
        </Button>
      }
      rightPanel={
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <FileSearch className="mb-4 h-7 w-7 text-cyan-200" />
          <h2 className="break-words text-xl font-black text-white">{text(file.name, loading ? "加载中..." : "当前文件")}</h2>
          <p className="mt-3 break-all text-sm leading-7 text-slate-300">
            文件 ID：{fileId}
          </p>
          {job && (
            <div className="mt-4 rounded-2xl bg-slate-950/35 p-4 text-sm text-slate-300">
              <p className="font-bold text-white">最近任务</p>
              <p className="mt-2">状态：{text(job.status, "pending")}</p>
              <p>进度：{String(job.progress ?? 0)}%</p>
            </div>
          )}
        </div>
      }
    >
      {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <Bot className="mb-5 h-8 w-8 text-cyan-200" />
          <h2 className="text-2xl font-black text-white">处理动作</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            先解析和建立索引，再进行总结和问答。大文件后续可切换为队列任务执行。
          </p>
          <div className="mt-6 grid gap-3">
            <Button disabled={Boolean(running)} onClick={() => void runIndex()}>
              {running === "index" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              解析并建立索引
            </Button>
            <Button variant="secondary" disabled={Boolean(running)} onClick={() => void runSummary()}>
              {running === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              总结文件
            </Button>
          </div>
          {summary && (
            <div className="mt-6 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4">
              <p className="font-black text-white">文件摘要</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{summary}</p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <MessageSquareText className="mb-5 h-8 w-8 text-cyan-200" />
          <h2 className="text-2xl font-black text-white">文件问答</h2>
          <textarea
            className="mt-5 min-h-32 w-full rounded-2xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="例如：总结这个文件的核心结论，并列出风险点。"
            value={question}
          />
          <Button className="mt-3" disabled={!question.trim() || Boolean(running)} onClick={() => void askFile()}>
            {running === "ask" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            提问
          </Button>
          {answer && (
            <div className="mt-6 rounded-2xl bg-slate-950/35 p-4">
              <p className="font-black text-white">回答</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{answer}</p>
            </div>
          )}
          {sources.length > 0 && (
            <div className="mt-6 grid gap-3">
              <p className="font-black text-white">引用来源</p>
              {sources.slice(0, 6).map((source, index) => (
                <div key={`${text(source.id)}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
                  <p className="font-bold text-cyan-100">片段 {index + 1}</p>
                  <p className="mt-2 break-words leading-7 text-slate-300">{text(source.content, text(source.text, "暂无片段内容"))}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceShell>
  );
}
