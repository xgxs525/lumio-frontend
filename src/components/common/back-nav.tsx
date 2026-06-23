"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function BackNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [backLabel, setBackLabel] = useState("返回首页");
  const [backHref, setBackHref] = useState("/");

  useEffect(() => {
    const fromWorkspace = searchParams.get("from") === "workspace";
    if (fromWorkspace) {
      setBackLabel("返回工作台");
      setBackHref("/workspace");
    } else {
      setBackLabel("返回首页");
      setBackHref("/");
    }
  }, [searchParams]);

  return (
    <div className="mb-10">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 hover:shadow"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </button>
    </div>
  );
}
