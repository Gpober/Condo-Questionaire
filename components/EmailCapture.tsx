"use client";

import { useState } from "react";
import { subscribeAction } from "@/app/actions/subscribe";

export default function EmailCapture({
  source = "search",
  title = "Get warrantability updates",
  blurb = "We'll email you when projects you care about change status — and share new condo data as it lands. No spam.",
  cta = "Notify me",
}: {
  source?: string;
  title?: string;
  blurb?: string;
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await subscribeAction(email, source);
      if (res.ok) setDone(true);
      else setError(res.error);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card glow" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>📬</div>
        <h3 style={{ margin: "0 0 4px" }}>You&apos;re on the list</h3>
        <p className="muted" style={{ margin: 0 }}>
          Thanks — we&apos;ll be in touch with condo warrantability updates.
        </p>
      </div>
    );
  }

  return (
    <form className="card glow" onSubmit={onSubmit}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h3>
      <p className="muted" style={{ marginTop: 0, fontSize: 14.5 }}>{blurb}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          style={{ flex: "1 1 220px" }}
        />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "…" : cta}
        </button>
      </div>
      {error && <div className="banner danger" style={{ marginTop: 12 }}>{error}</div>}
    </form>
  );
}
