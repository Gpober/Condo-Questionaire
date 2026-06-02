"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import TopBar from "@/components/TopBar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // DEMO mode: accept any non-empty credentials.
        if (!email || !password) throw new Error("Enter an email and password.");
      }
      localStorage.setItem("cq_auth", "1");
      router.replace("/search");
    } catch (err: any) {
      setError(err.message ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar showLogout={false} />
      <div className="center-screen">
        <form className="card login-card" onSubmit={onSubmit}>
          <h1>Sign in</h1>
          <p className="sub">Access the cached condo questionnaire database.</p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@lender.com"
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>}

          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {!isSupabaseConfigured && (
            <p className="hint">Demo mode: any email + password works. Connect Supabase to enable real auth.</p>
          )}
        </form>
      </div>
    </>
  );
}
