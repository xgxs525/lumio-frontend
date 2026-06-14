import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteChrome } from "@/components/layout/site-chrome";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumio 序光 - AI 原生办公平台",
  description: "上传、管理和处理办公文件，用 AI 聊天、云盘、在线文档和知识库提升个人与团队效率。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
