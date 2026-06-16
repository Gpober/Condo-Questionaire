"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function TopBar({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSignedIn(localStorage.getItem("cq_auth") === "1");
      return;
    }
    const supabase = getBrowserClient()!;
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session))
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getBrowserClient();
    if (supabase) await supabase.auth.signOut();
    else localStorage.removeItem("cq_auth");
    router.replace("/search");
    router.refresh();
  }

  return (
    <div className="topbar">
      <Link href="/search" className="brand" style={{ color: "#fff" }}>
        Condo<span>Questionnaire</span> Hub
      </Link>

      {showLogout && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {signedIn ? (
            <>
              <Link href="/account" className="btn secondary">Account</Link>
              <button className="btn secondary" onClick={signOut}>Sign out</button>
            </>
          ) : signedIn === false ? (
            <Link href="/login" className="btn secondary">Sign in</Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
