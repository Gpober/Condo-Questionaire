"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import TopBar from "@/components/TopBar";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/search";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = getBrowserClient();

      // DEMO mode: no keys -> accept any non-empty credentials.
      if (!supabase) {
        if (!email || !password) throw new Error("Enter an email and password.");
        localStorage.setItem("cq_auth", "1");
        router.replace(next);
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If email confirmation is required, there's no session yet.
        if (!data.session) {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      router.replace(next);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar showLogout={false} />
      <div className="center-screen">
        <form className="card login-card" onSubmit={onSubmit}>
          <h1>{mode === "signin" ? "Sign in" : "Create account"}</h1>
          <p className="sub">Access the cached condo questionnaire database.</p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
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
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>}
          {info && <div className="banner demo" style={{ marginBottom: 12 }}>{info}</div>}

          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>

          <p className="hint" style={{ textAlign: "center", marginTop: 14 }}>
            {mode === "signin" ? "Need an account? " : "Already have an account? "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setError(null);
                setInfo(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </a>
          </p>

          {!isSupabaseConfigured && (
            <p className="hint">Demo mode: any email + password works. Connect Supabase to enable real auth.</p>
          )}
        </form>
      </div>
    </>
  );
}
