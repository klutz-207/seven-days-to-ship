import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "七天之后",
  description: "半实时 AI 路径偏移型 Hackathon 模拟游戏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
