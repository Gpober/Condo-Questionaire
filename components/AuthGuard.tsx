"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireBrowserClient } from "@/lib/supabase/client";

// Client-side guard. It checks the real Supabase session; the middleware also
// protects these routes server-side.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      const supabase = requireBrowserClient();
      const { data } = await supabase.auth.getSession();
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
