"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Demo auth guard. In production, replace the localStorage check with a
// Supabase session check (supabase.auth.getSession()).
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("cq_auth") === "1") {
      setOk(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
