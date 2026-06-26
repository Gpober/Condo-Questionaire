"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setRecordReviewAction } from "@/app/actions/reviews";
import { RecordReview, ReviewStatus } from "@/lib/reviews";

// Admin-only panel to mark a condo record as verified or needs-fixing while
// auditing. Rendered only for admins on the project page.
export default function RecordReviewPanel({
  projectId,
  initial,
}: {
  projectId: string;
  initial: RecordReview | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ReviewStatus | null>(initial?.status ?? null);
  const [note, setNote] = useState(initial?.note ?? "");
  const [by, setBy] = useState<string | null>(initial?.reviewed_by ?? null);
  const [at, setAt] = useState<string | null>(initial?.reviewed_at ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(next: ReviewStatus | "clear") {
    setBusy(next);
    setError(null);
    const res = await setRecordReviewAction(projectId, next, note);
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Could not save.");
      return;
    }
    if (next === "clear") {
      setStatus(null);
      setBy(null);
      setAt(null);
      setNote("");
    } else {
      setStatus(next);
      setAt(new Date().toISOString());
    }
    router.refresh();
  }

  const when = at
    ? new Date(at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div className="card review-panel">
      <h3 style={{ marginTop: 0 }}>Admin review</h3>

      <div className="review-status-line">
        {status === "verified" ? (
          <span className="review-pill verified">✓ Verified</span>
        ) : status === "needs_fixing" ? (
          <span className="review-pill needs">⚠ Needs fixing</span>
        ) : (
          <span className="review-pill none">Not yet reviewed</span>
        )}
        {status && (when || by) && (
          <span className="review-meta">
            {by ? `by ${by}` : ""}{by && when ? " · " : ""}{when ?? ""}
          </span>
        )}
      </div>

      <textarea
        className="review-note"
        placeholder="Optional note (what's wrong, what you checked, etc.)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />

      {error && <div className="banner danger" style={{ marginTop: 10 }}>{error}</div>}

      <div className="review-actions">
        <button
          className={`btn sm ${status === "verified" ? "" : "secondary"}`}
          onClick={() => save("verified")}
          disabled={busy !== null}
        >
          {busy === "verified" ? "Saving…" : "Mark verified ✓"}
        </button>
        <button
          className={`btn sm ${status === "needs_fixing" ? "" : "secondary"}`}
          onClick={() => save("needs_fixing")}
          disabled={busy !== null}
        >
          {busy === "needs_fixing" ? "Saving…" : "Needs fixing ⚠"}
        </button>
        {status && (
          <button
            className="btn sm ghost"
            onClick={() => save("clear")}
            disabled={busy !== null}
          >
            {busy === "clear" ? "Clearing…" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
}
