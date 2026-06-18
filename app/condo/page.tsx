import Link from "next/link";
import type { Metadata } from "next";
import TopBar from "@/components/TopBar";
import EmailCapture from "@/components/EmailCapture";
import { listPublicCondoSummaries } from "@/lib/publicCondos";

export const metadata: Metadata = {
  title: "Condo warrantability directory — HOA Daddy",
  description:
    "Browse cached condo warrantability records. Check if a condo project is warrantable before you order a questionnaire.",
  alternates: { canonical: "/condo" },
};

// Crawlable index so search engines can discover the individual condo pages,
// and humans can browse. Capped to keep the page light.
const MAX = 500;

export default async function CondoDirectoryPage() {
  const all = await listPublicCondoSummaries(MAX);

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>Condo directory</h1>
          <p>
            Browse cached condo projects, or{" "}
            <Link href="/search">search by name, county, state, or zip</Link>.
          </p>
        </div>

        {all.length === 0 ? (
          <p className="muted">No condo records to show yet.</p>
        ) : (
          <div style={{ marginBottom: 28 }}>
            {all.map((c) => (
              <Link key={c.id} href={`/condo/${c.id}`} className="result-row" style={{ textDecoration: "none" }}>
                <div>
                  <div className="name">{c.project_name}</div>
                  <div className="addr">
                    {[c.county && `${c.county} County`, c.state, c.zip_code].filter(Boolean).join(" · ")}
                    {`  ·  ID ${c.id}`}
                  </div>
                </div>
                <span className="chev">→</span>
              </Link>
            ))}
          </div>
        )}

        <EmailCapture source="directory" />
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} HOA Daddy · hoadaddy.com · Reuse condo questionnaires, lower costs.
      </footer>
    </>
  );
}
