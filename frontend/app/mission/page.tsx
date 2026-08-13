"use client";
   import { useAuth } from "@/lib/auth/AuthProvider";

   export default function MissionPage() {
     const { accessToken, isLoading, error, onboardingCompleted } = useAuth();

     if (isLoading) return <div>로그인 중...</div>;
     if (error) return <div>{error}</div>;

     return (
       <div>
         <p>토큰: {accessToken}</p>
         <p>온보딩 완료 여부: {String(onboardingCompleted)}</p>
       </div>
     );
   }

