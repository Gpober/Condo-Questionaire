"use client";

import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

export default function TopBar({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();

  async function signOut() {
    const supabase = getBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("cq_auth");
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="topbar">
      <div className="brand">
        Condo<span>Questionnaire</span> Hub
      </div>
      {showLogout && (
        <button className="btn secondary" onClick={signOut}>
          Sign out
        </button>
      )}
    </div>
  );
}
