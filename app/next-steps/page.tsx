import TopBar from "@/components/TopBar";
import LeadForm from "@/components/LeadForm";

export default function NextStepsPage() {
  return (
    <>
      <TopBar />

      <section className="hero" style={{ paddingBottom: 24 }}>
        <span className="eyebrow">See your condo on the list?</span>
        <h1>
          Here&apos;s what&apos;s <span className="grad">next</span>.
        </h1>
        <p className="lede">
          If your project is on the list and approved, you don&apos;t have to start from scratch.
          Get matched with a recommended mortgage agent who offers competitive pricing — and can
          waive the condo questionnaire entirely.
        </p>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="grid-3" style={{ marginBottom: 34 }}>
          <div className="feature">
            <div className="ic">🤝</div>
            <h3>Recommended agent</h3>
            <p>We connect you with a vetted mortgage agent who knows warrantable condo financing.</p>
          </div>
          <div className="feature">
            <div className="ic">💰</div>
            <h3>Competitive pricing</h3>
            <p>Sharp rates and pricing — without the runaround.</p>
          </div>
          <div className="feature">
            <div className="ic">🚫</div>
            <h3>Questionnaire waived</h3>
            <p>If your project is on the list and approved, the condo questionnaire can be waived
              entirely — saving the fee and the wait.</p>
          </div>
        </div>

        <div className="container narrow" style={{ padding: 0 }}>
          <h2 style={{ textAlign: "center" }}>Get matched in minutes</h2>
          <p className="sub">Tell us a little about your purchase and we&apos;ll take it from there.</p>
          <LeadForm />
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} HOA Daddy · hoadaddy.com · Reuse condo questionnaires, lower costs.
      </footer>
    </>
  );
}
