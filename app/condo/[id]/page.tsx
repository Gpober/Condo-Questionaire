import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TopBar from "@/components/TopBar";
import EmailCapture from "@/components/EmailCapture";
import { getPublicCondo } from "@/lib/publicCondos";
import { statusLabel, statusBadgeClass } from "@/lib/status";
import { PublicCondo } from "@/lib/types";

// Queries the database per request (no static params enumerated).
export const dynamic = "force-dynamic";

// Public, indexable summary pages — the top of the SEO funnel. They reveal only
// name, location, and a coarse warrantability badge; the full cached record
// stays behind the credit paywall on /project/[id].

function locationLine(p: PublicCondo): string {
  return [p.county && `${p.county} County`, p.state, p.zip_code]
    .filter(Boolean)
    .join(" · ");
}

function statusSentence(p: PublicCondo): string {
  switch (p.status) {
    case "warrantable":
      return `${p.project_name} is currently listed as warrantable in our cached condo database.`;
    case "non_warrantable":
      return `${p.project_name} is currently flagged as non-warrantable in our cached condo database.`;
    case "blacklisted":
      return `${p.project_name} appears on a lender blacklist in our cached condo database.`;
    default:
      return `Check the warrantability status of ${p.project_name} in our cached condo database.`;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const p = await getPublicCondo(params.id);
  if (!p) return { title: "Condo not found — HOA Daddy" };

  const loc = [p.county, p.state].filter(Boolean).join(", ");
  const title = `Is ${p.project_name} warrantable?${loc ? ` (${loc})` : ""} — HOA Daddy`;
  const description = statusSentence(p);
  const url = `/condo/${p.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicCondoPage({
  params,
}: {
  params: { id: string };
}) {
  const p = await getPublicCondo(params.id);
  if (!p) notFound();

  const badgeCls = statusBadgeClass(p.status);
  const loc = locationLine(p);

  // Structured data so the warrantability answer can surface in search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Question",
    name: `Is ${p.project_name} a warrantable condo?`,
    acceptedAnswer: {
      "@type": "Answer",
      text: statusSentence(p),
    },
  };

  return (
    <>
      <TopBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container narrow">
        <Link href="/search" className="muted">← Search all condos</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{p.project_name}</h1>
          <span className={`badge ${badgeCls}`}>{statusLabel(p.status)}</span>
        </div>
        {loc && <p className="muted" style={{ marginTop: 4 }}>{loc} · Condo ID {p.id}</p>}

        <div className="card" style={{ marginTop: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Is {p.project_name} warrantable?</h2>
          <p style={{ marginTop: 0 }}>{statusSentence(p)}</p>
          <p className="muted" style={{ fontSize: 14 }}>
            The full cached questionnaire — review date, budget &amp; insurance expirations,
            questionnaire validity, and source documents — is available to signed-in users for
            1 credit. View it once, reuse it on every loan.
          </p>
          <div className="actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
            <Link href={`/project/${p.id}`} className="btn">See the full record</Link>
            <Link href="/next-steps" className="btn secondary">Get matched with an agent</Link>
          </div>
        </div>

        {p.status !== "non_warrantable" && p.status !== "blacklisted" && (
          <div className="cta-band" style={{ marginTop: 24 }}>
            <h2>On the list and approved?</h2>
            <p>Get matched with a recommended mortgage agent who can waive the questionnaire entirely.</p>
            <Link href="/next-steps" className="btn secondary lg">See what&apos;s next</Link>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <EmailCapture
            source={`condo:${p.id}`}
            title={`Track ${p.project_name}`}
            blurb="Get an email if this project's warrantability status changes. Free, no spam."
          />
        </div>

        <p className="hint" style={{ textAlign: "center", marginTop: 24 }}>
          Looking for a different building? <Link href="/search">Search the full condo database →</Link>
        </p>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} HOA Daddy · hoadaddy.com · Reuse condo questionnaires, lower costs.
      </footer>
    </>
  );
}
