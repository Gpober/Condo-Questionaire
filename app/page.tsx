import Link from "next/link";
import TopBar from "@/components/TopBar";
import FlyoverScene from "@/components/FlyoverScene";
import { CREDIT_PACKS, formatUSD } from "@/lib/stripe/config";

export default function Home() {
  return (
    <>
      <TopBar />

      {/* Hero */}
      <section className="hero">
        <FlyoverScene />
        <div className="hero-inner">
          <span className="eyebrow">Condo warrantability, instantly</span>
          <h1>
            Know if it&apos;s <span className="grad">approved</span> — before you&apos;re in contract.
          </h1>
          <p className="lede">
            Stop taking chances on condo questionnaires. Check a project&apos;s warrantability in
            seconds and save the money, escrow, and time a dead deal costs.
          </p>
          <div className="cta">
            <Link href="/search" className="btn lg">Search condos</Link>
            <Link href="/#pricing" className="btn secondary lg">View pricing</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2>Why teams use it</h2>
        <p className="sub">Faster decisions, lower costs, fewer dead deals.</p>
        <div className="grid-3">
          <div className="feature">
            <div className="ic">⚡</div>
            <h3>Instant reuse</h3>
            <p>Pull a cached questionnaire in seconds instead of waiting days or weeks on the HOA.</p>
          </div>
          <div className="feature">
            <div className="ic">💸</div>
            <h3>Lower cost per loan</h3>
            <p>Pay once per project, then reuse it across every loan — no repeat HOA fees.</p>
          </div>
          <div className="feature">
            <div className="ic">🛡️</div>
            <h3>Avoid bad projects</h3>
            <p>Blacklist flags and expiration dates surface non-warrantable projects before you spend.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <h2>How it works</h2>
        <p className="sub">Three steps from search to answer.</p>
        <div className="steps">
          <div className="step">
            <div className="num">1</div>
            <h3>Search</h3>
            <p className="muted">Find a condo project by name, county, state, or zip — free and unlimited.</p>
          </div>
          <div className="step">
            <div className="num">2</div>
            <h3>Unlock</h3>
            <p className="muted">Spend 1 credit to open the full cached record. View it again anytime, free.</p>
          </div>
          <div className="step">
            <div className="num">3</div>
            <h3>Decide</h3>
            <p className="muted">See the review status, expirations, and blacklist flags at a glance.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing">
        <h2>Simple credit pricing</h2>
        <p className="sub">1 credit unlocks 1 condo record. The more you buy, the less each costs.</p>
        <div className="price-grid">
          {CREDIT_PACKS.map((pack, i) => (
            <div key={pack.id} className={`price-card ${i === CREDIT_PACKS.length - 1 ? "featured" : ""}`}>
              {i === CREDIT_PACKS.length - 1 && <div className="tag">Best value</div>}
              <div className="muted" style={{ fontWeight: 700 }}>{pack.label}</div>
              <div className="amt">{formatUSD(pack.price)}</div>
              <div className="per">{formatUSD(Math.round(pack.price / pack.credits))} per credit</div>
              <div className="credits">{pack.credits} credit{pack.credits === 1 ? "" : "s"}</div>
              <Link href="/account" className="btn" style={{ width: "100%" }}>Get started</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <h2>Ready to lower your questionnaire costs?</h2>
        <p>Search the database now — browsing is free.</p>
        <Link href="/search" className="btn secondary lg">Search condos</Link>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} HOA Daddy · hoadaddy.com · Reuse condo questionnaires, lower costs.
      </footer>
    </>
  );
}
