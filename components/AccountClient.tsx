"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buyCreditsAction, grantTestCreditsAction } from "@/app/actions/credits";
import { CreditPack, formatUSD } from "@/lib/stripe/config";

export default function AccountClient({
  balance,
  packs,
  stripeReady,
}: {
  balance: number;
  packs: CreditPack[];
  stripeReady: boolean;
}) {
  const router = useRouter();
  const [bal, setBal] = useState(balance);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packId: string) {
    setBusy(packId);
    setError(null);
    try {
      const { url, error } = await buyCreditsAction(packId);
      if (url) {
        window.location.href = url; // off to Stripe Checkout
        return;
      }
      setError(error ?? "Could not start checkout.");
    } finally {
      setBusy(null);
    }
  }

  async function grantTest(amount: number) {
    setBusy("test");
    try {
      const newBal = await grantTestCreditsAction(amount);
      setBal(newBal);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="k">Current balance</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>
          {bal} <span style={{ fontSize: 16, fontWeight: 400 }} className="muted">credits</span>
        </div>
      </div>

      {error && <div className="banner danger" style={{ marginBottom: 16 }}>{error}</div>}

      <h3 style={{ marginBottom: 16 }}>Buy credits</h3>
      <div className="price-grid">
        {packs.map((pack, i) => (
          <div key={pack.id} className={`price-card ${i === packs.length - 1 ? "featured" : ""}`}>
            {i === packs.length - 1 && <div className="tag">Best value</div>}
            <div className="muted" style={{ fontWeight: 700 }}>{pack.label}</div>
            <div className="amt">{formatUSD(pack.price)}</div>
            <div className="per">{formatUSD(Math.round(pack.price / pack.credits))} per credit</div>
            <div className="credits">{pack.credits} credit{pack.credits === 1 ? "" : "s"}</div>
            <button
              className="btn"
              onClick={() => buy(pack.id)}
              disabled={busy !== null}
              style={{ width: "100%" }}
            >
              {busy === pack.id ? "…" : "Buy"}
            </button>
          </div>
        ))}
      </div>

      {!stripeReady && (
        <div className="banner demo" style={{ marginTop: 20 }}>
          <strong>Payments aren&apos;t connected yet.</strong> Add your Stripe keys to enable real
          checkout. Meanwhile, grant yourself test credits to try the flow:
          <div style={{ marginTop: 10 }}>
            <button className="btn secondary" onClick={() => grantTest(5)} disabled={busy !== null}>
              + 5 test credits
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
