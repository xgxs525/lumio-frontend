"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { clearStoredAuth, getStoredAuth, updateStoredIdentity } from "@/lib/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authenticated" | "anonymous">("checking");

  const nextPath = useMemo(() => {
    const current = pathname || "/workspace";
    return `/login?next=${encodeURIComponent(current)}`;
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAuth() {
      const stored = getStoredAuth();
      if (!stored?.token) {
        setStatus("anonymous");
        router.replace(nextPath);
        return;
      }

      try {
        const result = await api.me(stored.token);
        if (cancelled) return;
        updateStoredIdentity(result.data);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        clearStoredAuth();
        setStatus("anonymous");
        router.replace(nextPath);
      }
    }

    verifyAuth();
    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  if (status !== "authenticated") return null;

  return children;
}
