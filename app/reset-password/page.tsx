"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import TopBar from "@/components/TopBar";
import BeachScene from "@/components/BeachScene";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false); // recovery session present?
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true); // demo mode
      return;
    }
    const supabase = getBrowserClient()!;
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    // A recovery link may land here just before the session is registered.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Use at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      const supabase = getBrowserClient();
      if (!supabase) {
        setDone(true);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => {
        router.replace("/search");
        router.refresh();
      }, 1400);
    } catch (err: any) {
      setError(err?.message ?? "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar showLogout={false} />
      <div className="center-screen has-scene">
        <BeachScene />
        <div className="card login-card">
          <h1>Set a new password</h1>

          {done ? (
            <>
              <p className="sub">✅ Your password has been updated. Redirecting you to search…</p>
              <Link href="/search" className="btn" style={{ width: "100%", justifyContent: "center" }}>
                Continue
              </Link>
            </>
          ) : !ready ? (
            <>
              <p className="sub">
                Open the password reset link from your email to set a new password. If you got here
                by mistake, the link may have expired.
              </p>
              <Link href="/login" className="btn secondary" style={{ width: "100%", justifyContent: "center" }}>
                Back to sign in
              </Link>
            </>
          ) : (
            <form onSubmit={onSubmit}>
              <p className="sub">Choose a new password for your account.</p>

              <div className="field">
                <label htmlFor="np">New password</label>
                <div className="password-wrap">
                  <input
                    id="np"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    title={show ? "Hide password" : "Show password"}
                  >
                    {show ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="cp">Confirm new password</label>
                <input
                  id="cp"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {error && <p style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>}

              <button
                className="btn"
                type="submit"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
