import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passport Atlas | 探索世界护照的力量",
  description: "比较全球护照实力，直观探索免签范围与旅行自由度。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
