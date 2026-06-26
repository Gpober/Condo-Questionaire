import Link from "next/link";

// Shared site footer with the legal links. Used across the main pages so Terms
// and Privacy are reachable everywhere.
export default function SiteFooter() {
  return (
    <footer className="footer">
      <div>
        © {new Date().getFullYear()} HOA Daddy · hoadaddy.com · Reuse condo questionnaires, lower costs.
      </div>
      <div className="footer-links">
        <Link href="/terms">Terms of Service</Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy">Privacy Policy</Link>
      </div>
    </footer>
  );
}
