"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { redeemAction } from "@/app/actions/credits";

export default function Paywall({
  projectId,
  projectName,
  balance,
}: {
  projectId: string;
  projectName: string;
  balance: number;
}) {
  const router = useRouter();
  const [bal, setBal] = useState(balance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    setLoading(true);
    setError(null);
    try {
      const res = await redeemAction(projectId);
      if (res.status === "unlocked" || res.status === "already_unlocked") {
        router.refresh(); // record is now visible
        return;
      }
      if (res.status === "insufficient") {
        setBal(res.balance);
        setError("You're out of credits. Buy more to view this record.");
      } else {
        setError("Please sign in to view this record.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <h3 style={{ marginTop: 0 }}>Unlock this record</h3>
      <p className="muted" style={{ fontSize: 14 }}>
        Viewing the full cached questionnaire for <strong>{projectName}</strong> costs{" "}
        <strong>1 credit</strong>. You can view it again later for free.
      </p>
      <p style={{ fontSize: 14 }}>
        Your balance: <strong>{bal}</strong> credit{bal === 1 ? "" : "s"}
      </p>

      {error && <div className="banner danger" style={{ marginTop: 8 }}>{error}</div>}

      <div className="actions" style={{ justifyContent: "flex-start", marginTop: 16 }}>
        {bal > 0 ? (
          <button className="btn" onClick={unlock} disabled={loading}>
            {loading ? "Unlocking…" : "Spend 1 credit to view"}
          </button>
        ) : (
          <Link href="/account" className="btn">Buy credits</Link>
        )}
        <Link href="/search" className="btn secondary">Back to search</Link>
      </div>
    </div>
  );
}
