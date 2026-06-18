"use client";

import { useEffect, useState } from "react";
import { ReferralInfo } from "@/lib/referrals";

const REWARD_REFERRER = 2; // credits the referrer earns per signup
const REWARD_REFERRED = 1; // credits the new user gets

export default function ReferralCard({ info }: { info: ReferralInfo }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!info.code) return;
    const origin = window.location.origin;
    setLink(`${origin}/login?ref=${encodeURIComponent(info.code)}`);
  }, [info.code]);

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the input is selectable as a fallback */
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>Invite a colleague, earn credits</h3>
      <p className="muted" style={{ marginTop: 0, fontSize: 14.5 }}>
        Share your link. When someone signs up through it, you get{" "}
        <strong>{REWARD_REFERRER} credits</strong> and they get{" "}
        <strong>{REWARD_REFERRED}</strong> to start.
      </p>

      {info.code ? (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            <input
              type="text"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              style={{ flex: "1 1 240px" }}
            />
            <button className="btn" type="button" onClick={copy} disabled={!link}>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>

          <div className="stat-grid" style={{ marginTop: 16 }}>
            <div>
              <div className="k">Friends referred</div>
              <div className="v">{info.referredCount}</div>
            </div>
            <div>
              <div className="k">Credits earned</div>
              <div className="v">{info.creditsEarned}</div>
            </div>
            <div>
              <div className="k">Your code</div>
              <div className="v">{info.code}</div>
            </div>
          </div>
        </>
      ) : (
        <p className="muted" style={{ fontSize: 14 }}>
          Your referral link will appear here once referrals are enabled on the database.
        </p>
      )}

      {!info.configured && (
        <p className="hint" style={{ marginTop: 12 }}>
          Run <code>referrals-setup.sql</code> in Supabase to enable referrals.
        </p>
      )}
    </div>
  );
}
