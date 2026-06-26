"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Mode = "signup" | "signin";

// Popup login/sign-up used to gate the search results list. Mirrors the
// /login page's Supabase flow (email + password + email confirmation) but adds
// first/last name on sign-up. `onSignedIn` fires only when a real session
// exists (i.e. confirmation isn't required, or in demo mode); when Supabase
// requires email confirmation we show a "check your email" message instead and
// the list unblurs once the user returns via the confirmation link.
export default function AuthModal({
  initialMode = "signup",
  next = "/search",
  onClose,
  onSignedIn,
}: {
  initialMode?: Mode;
  next?: string;
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
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

      // DEMO mode: no keys -> accept any non-empty credentials and unlock.
      if (!supabase) {
        if (!email || !password) throw new Error("Enter an email and password.");
        if (mode === "signup" && (!firstName || !lastName))
          throw new Error("Enter your first and last name.");
        if (mode === "signup" && !agreed)
          throw new Error("Please check the box to agree before creating your account.");
        localStorage.setItem("cq_auth", "1");
        if (firstName) localStorage.setItem("cq_name", `${firstName} ${lastName}`.trim());
        onSignedIn();
        return;
      }

      if (mode === "signup") {
        if (!firstName || !lastName) throw new Error("Enter your first and last name.");
        if (!agreed) throw new Error("Please check the box to agree before creating your account.");
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) throw error;
        // If email confirmation is required, there's no session yet.
        if (!data.session) {
          setInfo(
            "Account created! Check your email and click the confirmation link to unlock the list.",
          );
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      onSignedIn();
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === "signup" ? "Create your free account" : "Sign in"}</h3>
        <p className="muted" style={{ fontSize: 14, marginTop: 0, marginBottom: 18 }}>
          {mode === "signup"
            ? "It's free to see the full list. Open a record later for 1 credit."
            : "Welcome back — sign in to view the list."}
        </p>

        <form onSubmit={onSubmit}>
          {mode === "signup" && (
            <div className="form-grid" style={{ marginBottom: 0 }}>
              <div className="field">
                <label htmlFor="am-first">First name</label>
                <input
                  id="am-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoComplete="given-name"
                />
              </div>
              <div className="field">
                <label htmlFor="am-last">Last name</label>
                <input
                  id="am-last"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="am-email">Email</label>
            <input
              id="am-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="am-password">Password</label>
            <div className="password-wrap">
              <input
                id="am-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // eye-off
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // eye
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <label className="consent-check">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and I
                consent to receive marketing, promotional, and informational communications —
                including emails and, where I provide a number, calls or texts — from HOA Daddy and the
                mortgage and real-estate partners I&apos;m matched with. Consent is not a condition of
                any purchase; message frequency varies and message/data rates may apply. I can
                unsubscribe or opt out at any time.
              </span>
            </label>
          )}

          {error && <p style={{ color: "var(--danger)", fontSize: 14, margin: "4px 0 0" }}>{error}</p>}
          {info && <div className="banner demo" style={{ marginTop: 12 }}>{info}</div>}

          <button
            className="btn"
            type="submit"
            disabled={loading || (mode === "signup" && !agreed)}
            style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
          >
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="hint" style={{ textAlign: "center", marginTop: 14 }}>
          {mode === "signup" ? "Already have an account? " : "Need an account? "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setError(null);
              setInfo(null);
              setMode(mode === "signup" ? "signin" : "signup");
            }}
          >
            {mode === "signup" ? "Sign in" : "Sign up"}
          </a>
        </p>

        {!isSupabaseConfigured && (
          <p className="hint" style={{ textAlign: "center" }}>
            Demo mode: any details work. Connect Supabase to enable real auth.
          </p>
        )}
      </div>
    </div>
  );
}
