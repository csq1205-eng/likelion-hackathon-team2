import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export const metadata: Metadata = {
  title: "WEDIT",
  description: "AI 웰니스 미션 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-100 font-sans">
        <div className="min-h-screen w-full bg-white">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}