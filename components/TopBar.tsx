"use client";

import { useRouter } from "next/navigation";

export default function TopBar({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();
  return (
    <div className="topbar">
      <div className="brand">
        Condo<span>Questionnaire</span> Hub
      </div>
      {showLogout && (
        <button
          className="btn secondary"
          onClick={() => {
            localStorage.removeItem("cq_auth");
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
