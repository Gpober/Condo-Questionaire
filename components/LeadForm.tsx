"use client";

import { useState } from "react";
import { submitLeadAction, LeadInput } from "@/app/actions/leads";
import { US_STATES } from "@/lib/states";

const EMPTY: LeadInput = {
  full_name: "",
  email: "",
  phone: "",
  project_name: "",
  state: "",
  notes: "",
};

export default function LeadForm() {
  const [form, setForm] = useState<LeadInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof LeadInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await submitLeadAction(form);
      if (res.ok) setDone(true);
      else setError(res.error);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card glow" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <h3 style={{ marginTop: 0 }}>You&apos;re all set!</h3>
        <p className="muted">
          Thanks, {form.full_name.split(" ")[0] || "there"} — a recommended mortgage agent will reach
          out shortly to walk you through next steps and confirm whether your questionnaire can be waived.
        </p>
      </div>
    );
  }

  return (
    <form className="card glow" onSubmit={onSubmit}>
      <div className="form-grid">
        <div>
          <label>Full name *</label>
          <input type="text" value={form.full_name} onChange={set("full_name")} placeholder="Jane Doe" />
        </div>
        <div>
          <label>Email *</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" />
        </div>
        <div>
          <label>Phone</label>
          <input type="text" value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" />
        </div>
        <div>
          <label>State</label>
          <select value={form.state} onChange={set("state")}>
            <option value="">Select</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Condo / project name</label>
          <input type="text" value={form.project_name} onChange={set("project_name")} placeholder="The project you're buying in" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Anything else?</label>
          <input type="text" value={form.notes} onChange={set("notes")} placeholder="Timeline, price range, questions…" />
        </div>
      </div>

      {error && <div className="banner danger" style={{ marginTop: 14 }}>{error}</div>}

      <button className="btn lg" type="submit" disabled={loading} style={{ marginTop: 18, width: "100%" }}>
        {loading ? "Submitting…" : "Connect me with an agent"}
      </button>
      <p className="hint" style={{ textAlign: "center" }}>
        No obligation. We&apos;ll only share your info with a recommended mortgage agent.
      </p>
    </form>
  );
}
