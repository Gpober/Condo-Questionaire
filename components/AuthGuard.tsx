"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Client-side guard. With Supabase configured it checks the real session;
// the middleware also protects these routes server-side. In demo mode it falls
// back to the localStorage flag set by the login page.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      if (!isSupabaseConfigured) {
        if (localStorage.getItem("cq_auth") === "1") setOk(true);
        else router.replace("/login");
        return;
      }
      const supabase = getBrowserClient();
      const { data } = await supabase!.auth.getSession();
      if (!active) return;
      if (data.session) setOk(true);
      else router.replace("/login");
    }

    check();
    return () => {
      active = false;
    };
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
