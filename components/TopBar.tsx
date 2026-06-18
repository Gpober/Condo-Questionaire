"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { requireBrowserClient } from "@/lib/supabase/client";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = requireBrowserClient();
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
    await requireBrowserClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/#.*$/, "")) && href !== "/#pricing";

  return (
    <nav className="nav">
      <Link href="/" className="brand" aria-label="HOA Daddy home">
        <span className="logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--brand-start)" />
                <stop offset="1" stopColor="var(--brand-end)" />
              </linearGradient>
            </defs>
            {/* taller condo tower */}
            <rect x="5" y="9" width="11" height="19" rx="1.6" fill="url(#logoGrad)" />
            {/* shorter front building */}
            <rect x="14.5" y="14" width="12.5" height="14" rx="1.6" fill="#ffffff" fillOpacity="0.92" stroke="url(#logoGrad)" strokeWidth="1.6" />
            {/* tower windows */}
            <g fill="#ffffff" fillOpacity="0.92">
              <rect x="8" y="12.5" width="2.2" height="2.2" rx="0.5" />
              <rect x="11.8" y="12.5" width="2.2" height="2.2" rx="0.5" />
              <rect x="8" y="16.5" width="2.2" height="2.2" rx="0.5" />
              <rect x="11.8" y="16.5" width="2.2" height="2.2" rx="0.5" />
              <rect x="8" y="20.5" width="2.2" height="2.2" rx="0.5" />
              <rect x="11.8" y="20.5" width="2.2" height="2.2" rx="0.5" />
            </g>
            {/* checkmark on front building — nods to the questionnaire */}
            <path d="M17.6 21.3l2.1 2.1 4.1-4.3" stroke="url(#logoGrad)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
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

      {/* Mobile hamburger */}
      <button
        className="hamburger"
        aria-label="Menu"
        onClick={() => setMobileOpen((o) => !o)}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile dropdown menu */}
      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={isActive(t.href) ? "active" : ""}
            onClick={() => setMobileOpen(false)}
          >
            {t.label}
          </Link>
        ))}
        {showLogout && signedIn && (
          <>
            {admin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            <Link href="/account" onClick={() => setMobileOpen(false)}>Account</Link>
            <button onClick={() => { setMobileOpen(false); signOut(); }}>Sign out</button>
          </>
        )}
        {showLogout && signedIn === false && (
          <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
        )}
      </div>
    </nav>
  );
}
