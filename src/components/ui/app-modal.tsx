"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

type AppModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeClass;
  onClose: () => void;
  contentClassName?: string;
};

export function AppModal({
  open,
  title,
  description,
  children,
  footer,
  size = "md",
  onClose,
  contentClassName,
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] isolate flex items-center justify-center overflow-hidden overscroll-contain bg-slate-950/72 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden overscroll-contain rounded-3xl border border-white/10 bg-[#0b1630] shadow-[0_32px_100px_rgba(0,0,0,0.45)] sm:max-h-[calc(100dvh-40px)]",
          sizeClass[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
            {description && <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>}
          </div>
          <button
            aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5", contentClassName)}>{children}</div>
        {footer && <div className="shrink-0 border-t border-white/10 bg-slate-950/25 px-5 py-3 sm:px-6 sm:py-4">{footer}</div>}
      </div>
    </div>
  );
}
