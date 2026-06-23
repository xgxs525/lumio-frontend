"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function CrossLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const to = from ? `${href}?from=${from}` : href;

  return (
    <Link href={to} className={className}>
      {children}
    </Link>
  );
}
