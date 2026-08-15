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
  {/*!--<head>
    <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.5.0/kakao.min.js" integrity="sha384-kYPsUbBPlktXsY6/oNHSUDZoTX6+YI51f63jCPEIPFP09ttByA" crossOrigin="anonymous"></script>
  </head>*/}
  <body className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
    <div className="w-[289px] h-[514px] bg-[#ffffff] flex flex-col relative shadow-2xl overflow-hidden rounded-[30px]">
      <AuthProvider>{children}</AuthProvider>
    </div>
  </body>
</html>
  );
}
