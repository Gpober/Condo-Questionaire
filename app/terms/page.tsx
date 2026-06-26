import TopBar from "@/components/TopBar";

export const metadata = {
  title: "Terms of Service — HOA Daddy",
};

// NOTE FOR THE SITE OWNER: this is a reasonable, plain-language starting point —
// not legal advice. Have an attorney review and tailor it (especially the
// marketing-consent, arbitration, and liability sections) for your business and
// the states you operate in before relying on it.
export default function TermsPage() {
  return (
    <>
      <TopBar />
      <div className="container narrow legal">
        <div className="page-head">
          <h1>Terms of Service</h1>
          <p>Last updated: June 26, 2026</p>
        </div>

        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the HOA Daddy
          website and services (the &quot;Service&quot;). By creating an account or using the Service,
          you agree to these Terms and to our{" "}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the Service.
        </p>

        <h2>1. The Service</h2>
        <p>
          HOA Daddy lets you search a database of condominium projects and, where available, open a
          cached condo questionnaire / warrantability record. Search is free; opening a full record
          may require credits. Information is provided for convenience and may be incomplete or out of
          date. It is not a guarantee of a project&apos;s warrantability, eligibility, or financing
          outcome, and is not lending, legal, or financial advice.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You must provide accurate information when you register and keep it current. You are
          responsible for activity under your account and for keeping your credentials secure.
        </p>

        <h2>3. Credits and payments</h2>
        <p>
          Credits are purchased and spent to unlock records. Unless required by law, purchased credits
          are non-refundable. Prices and pack sizes may change. Payments are processed by our
          third-party payment processor; we do not store full card details.
        </p>

        <h2>4. Marketing communications and partner contact</h2>
        <p>
          By creating an account, you consent to receive marketing, promotional, and informational
          communications from HOA Daddy and from the mortgage, lending, and real-estate professionals
          we may match you with (&quot;Partners&quot;). These communications may be sent by email and,
          if you provide a phone number, by phone call or text/SMS, including through automated means.
          Consent to marketing is not a condition of purchasing anything. Message frequency varies and
          message and data rates may apply. You can withdraw consent at any time by using the
          unsubscribe link in an email, replying STOP to texts, or contacting us at the address below;
          opting out of marketing does not stop transactional messages about your account.
        </p>

        <h2>5. Acceptable use</h2>
        <p>
          You agree not to scrape, resell, or redistribute the database or records, attempt to bypass
          paywalls or access controls, or use the Service unlawfully or to infringe others&apos;
          rights.
        </p>

        <h2>6. Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
          any kind, whether express or implied, including merchantability, fitness for a particular
          purpose, and non-infringement. We do not warrant that records are accurate, complete, or
          current.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, HOA Daddy and its Partners will not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or for any lost profits or
          data, arising from your use of the Service. Our total liability for any claim will not exceed
          the amount you paid us in the twelve months before the claim.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these Terms from time to time. Material changes will be reflected by updating
          the date above. Your continued use of the Service after changes take effect constitutes
          acceptance.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about these Terms? Contact us at{" "}
          <a href="mailto:gozalo@therateoutlet.com">gozalo@therateoutlet.com</a>.
        </p>
      </div>
    </>
  );
}
