"use client";

import { scorePassword, PASSWORD_HINT } from "@/lib/password";

const LABELS = ["Too weak", "Weak", "Okay", "Strong", "Very strong"];
const COLORS = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"];

// Live password strength meter + the policy hint. Shows nothing until typing.
export default function PasswordStrength({ value }: { value: string }) {
  if (!value) {
    return <p className="pw-hint">{PASSWORD_HINT}</p>;
  }
  const s = scorePassword(value);
  return (
    <div className="pw-strength">
      <div className="pw-strength-track">
        <div
          className="pw-strength-bar"
          style={{ width: `${((s + 1) / 5) * 100}%`, background: COLORS[s] }}
        />
      </div>
      <span className="pw-strength-label" style={{ color: COLORS[s] }}>{LABELS[s]}</span>
    </div>
  );
}
