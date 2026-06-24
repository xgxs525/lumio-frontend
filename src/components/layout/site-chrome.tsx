"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const workspacePrefixes = [
  "/workspace",
  "/ai",
  "/drive",
  "/docs",
  "/knowledge",
  "/billing",
  "/settings",
  "/models",
  "/file-understand",
  "/history",
  "/image-gen",
  "/video",
  "/video-gen",
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = workspacePrefixes.some((prefix) => pathname.startsWith(prefix));

  return (
    <>
      {!isWorkspace && <SiteHeader />}
      <main className={!isWorkspace ? "site-main" : undefined}>{children}</main>
      {!isWorkspace && <SiteFooter />}
    </>
  );
}
