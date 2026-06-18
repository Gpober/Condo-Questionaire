"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requireBrowserClient } from "@/lib/supabase/client";
import { applyReferralAction } from "@/app/actions/referrals";
import TopBar from "@/components/TopBar";
import BeachScene from "@/components/BeachScene";

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
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Stash an incoming referral code so we can credit both users after the
  // invited person completes their first real sign-in.
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("cq_ref", ref);
      setMode("signup");
    }
  }, [searchParams]);

  async function redeemPendingReferral() {
    const code = localStorage.getItem("cq_ref");
    if (!code) return;
    try {
      await applyReferralAction(code);
    } catch {
      /* non-fatal: the user is signed in regardless */
    } finally {
      localStorage.removeItem("cq_ref");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = requireBrowserClient();

      if (mode === "signup") {
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });
        if (error) throw error;
        // If email confirmation is required, there's no session yet.
        if (!data.session) {
          setInfo("Account created! Check your email and click the confirmation link to finish signing in.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      // Session is established now — apply any referral the user arrived with.
      await redeemPendingReferral();

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
      <div className="center-screen has-scene">
        <BeachScene />
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
        </form>
      </div>
    </>
  );
}
