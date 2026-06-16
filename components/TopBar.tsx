"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/next-steps", label: "What's Next" },
  { href: "/#pricing", label: "Pricing" },
];

export default function TopBar({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSignedIn(localStorage.getItem("cq_auth") === "1");
      return;
    }
    const supabase = getBrowserClient()!;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("is_admin");
      setAdmin(Boolean(data));
    };
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      if (data.session) checkAdmin();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session));
      if (session) checkAdmin();
      else setAdmin(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getBrowserClient();
    if (supabase) await supabase.auth.signOut();
    else localStorage.removeItem("cq_auth");
    router.replace("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/#.*$/, "")) && href !== "/#pricing";

  return (
    <nav className="nav">
      <Link href="/" className="brand">
        <span className="logo" />
        HOA&nbsp;<span>Daddy</span>
      </Link>

      <div className="tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`tab ${isActive(t.href) ? "active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="spacer" />

      {showLogout && (
        <div className="actions">
          {signedIn ? (
            <>
              {admin && <Link href="/admin" className="tab">Admin</Link>}
              <Link href="/account" className="tab">Account</Link>
              <button className="btn secondary" onClick={signOut}>Sign out</button>
            </>
          ) : signedIn === false ? (
            <Link href="/login" className="btn">Sign in</Link>
          ) : null}
        </div>
      )}
    </nav>
  );
}
