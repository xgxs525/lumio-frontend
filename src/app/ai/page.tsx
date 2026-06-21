"use client";

import { useEffect, useState } from "react";
import { Bot, FileText, Loader2, Paperclip, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

type Message = { role: "user" | "assistant"; content: string };
type ConversationRecord = Record<string, unknown>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatDate(value: unknown) {
  const raw = asText(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const initialMessage: Message = {
  role: "assistant",
  content: "你好，我是序光 AI 办公助手。可以帮你总结文件、分析资料、整理文档要点，也可以围绕知识库进行问答。",
};

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadConversations() {
    try {
      const result = await api.listAIConversations();
      setConversations(result.data);
    } catch {
      setConversations([]);
    }
  }

  useEffect(() => {
    void loadConversations();
  }, []);

  async function selectConversation(id: string) {
    setConversationId(id);
    setError("");
    try {
      const result = await api.listAIMessages(id);
      const restored = result.data
        .map((item) => ({
          role: asText(item.role) === "user" ? "user" : "assistant",
          content: asText(item.content),
        }))
        .filter((item) => item.content) as Message[];
      setMessages(restored.length > 0 ? restored : [initialMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "会话加载失败");
    }
  }

  function startNewConversation() {
    setConversationId("");
    setMessages([initialMessage]);
    setInput("");
    setError("");
  }

  async function handleSend() {
    if (!input.trim()) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const result = await api.chat(nextMessages, {
        conversationId: conversationId || undefined,
        sourceType: "workspace",
        title: input.trim(),
      });
      if (result.data.conversationId) setConversationId(result.data.conversationId);
      setMessages([...nextMessages, { role: "assistant", content: result.data.content }]);
      await loadConversations();
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI 请求失败";
      setError(message);
      setMessages([...nextMessages, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <WorkspaceShell
      active="AI 助手"
      title="AI 聊天"
      subtitle="像使用 ChatGPT 一样提问，但上下文来自你的文件、文档和知识库。"
      rightPanel={
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <FileText className="mb-4 h-6 w-6 text-sky-600" />
            <h2 className="text-lg font-black text-slate-950">可接入上下文</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">当前会话会保存到后端，后续可继续接入文件、在线文档和知识库来源。</p>
            <div className="mt-4 grid gap-2">
              {["云盘文件", "在线文档", "知识库索引"].map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
            <Sparkles className="mb-4 h-5 w-5 text-sky-600" />
            <h3 className="font-black text-slate-950">快捷提示词</h3>
            <div className="mt-4 grid gap-2">
              {["总结这个文件", "提取关键数据", "生成下一步行动"].map((item) => (
                <button
                  key={item}
                  className="rounded-xl bg-white px-3 py-3 text-left text-sm text-slate-700 shadow-sm"
                  onClick={() => setInput(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Button className="mb-4 w-full" onClick={startNewConversation}>新建聊天</Button>
          <div className="grid gap-2">
            {conversations.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">还没有历史会话。</div>
            ) : (
              conversations.map((item) => {
                const id = asText(item.id);
                const active = id === conversationId;
                return (
                  <button
                    key={id}
                    className={`rounded-xl p-3 text-left text-sm transition ${
                      active ? "bg-sky-100 text-sky-900" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => void selectConversation(id)}
                  >
                    <span className="block truncate font-bold">{asText(item.title, "新会话")}</span>
                    <span className="mt-1 block text-xs opacity-70">{formatDate(item.updatedAt) || "刚刚"}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                <Bot className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-950">{conversationId ? "已保存会话" : "新会话"}</h2>
                <p className="text-sm text-slate-500">消息会保存到 ai_conversations 和 ai_messages。</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                  message.role === "user" ? "ml-auto bg-sky-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                序光正在思考...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" type="button">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="问序光，或者让它处理你的文件..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleSend();
                }}
              />
              <Button disabled={loading || !input.trim()} onClick={() => void handleSend()}>
                {loading ? "思考中" : "发送"}
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
