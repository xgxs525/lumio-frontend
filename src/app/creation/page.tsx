"use client";

import Link from "next/link";
import { Film, ImageIcon, Sparkles } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function CreationPage() {
  return (
    <WorkspaceShell
      active="创作空间"
      title="创作空间"
      subtitle="图像生成、视频创作和视觉素材，一站式内容创作。"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          href="/creation/image"
          className="group flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md"
        >
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 text-purple-600 transition group-hover:from-violet-100 group-hover:to-purple-200">
            <ImageIcon className="h-8 w-8" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">图像生成</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              输入画面描述，选择风格和比例，生成封面图、海报、插画和视觉素材。
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            开始创作
          </span>
        </Link>

        <Link
          href="/creation/video"
          className="group flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md"
        >
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 text-blue-600 transition group-hover:from-sky-100 group-hover:to-blue-200">
            <Film className="h-8 w-8" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">视频创作</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              选择视频模型，输入提示词或上传参考素材，生成短视频和分镜动画。
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            开始创作
          </span>
        </Link>
      </div>
    </WorkspaceShell>
  );
}
