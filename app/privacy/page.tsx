import TopBar from "@/components/TopBar";

export const metadata = {
  title: "Privacy Policy — HOA Daddy",
};

// NOTE FOR THE SITE OWNER: this is a reasonable, plain-language starting point —
// not legal advice. Have an attorney review and tailor it to your actual data
// practices and the laws that apply to you (e.g. CAN-SPAM, TCPA, CCPA/CPRA,
// GDPR) before relying on it.
export default function PrivacyPage() {
  return (
    <>
      <TopBar />
      <div className="container narrow legal">
        <div className="page-head">
          <h1>Privacy Policy</h1>
          <p>Last updated: June 26, 2026</p>
        </div>

        <p>
          This Privacy Policy explains how HOA Daddy (&quot;we&quot;) collects, uses, and shares
          information when you use our website and services. By using the Service you agree to this
          Policy and to our <a href="/terms">Terms of Service</a>.
        </p>

        <h2>1. Information we collect</h2>
        <p>
          We collect the information you provide when you create an account (such as your first and
          last name and email address, and a phone number if you choose to provide one), your credit
          purchases and which records you unlock, and standard technical data such as IP address,
          device, and usage information collected automatically.
        </p>

        <h2>2. How we use information</h2>
        <p>
          We use your information to operate and improve the Service, process payments and credits,
          provide customer support, and to send you marketing, promotional, and informational
          communications about HOA Daddy and related offerings, consistent with your consent and
          applicable law.
        </p>

        <h2>3. How we share information</h2>
        <p>
          With your consent, we share contact information with the mortgage, lending, and real-estate
          professionals (&quot;Partners&quot;) we match you with so they can contact you about their
          products and services. We also share information with service providers who help us run the
          Service (for example, hosting, authentication, and payment processing), and when required by
          law or to protect our rights. We do not sell your information for cash, though some sharing
          with Partners may be considered a &quot;sale&quot; or &quot;sharing&quot; under certain state
          laws — see your choices below.
        </p>

        <h2>4. Marketing and your choices</h2>
        <p>
          You can opt out of marketing emails using the unsubscribe link in any message, opt out of
          texts by replying STOP, and ask us to stop sharing your information with Partners by
          contacting us. Depending on where you live, you may have rights to access, correct, delete,
          or limit the use of your personal information, and to opt out of certain sharing. To exercise
          these rights, contact us at the address below.
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use cookies and similar technologies to keep you signed in, remember preferences, and
          understand usage. You can control cookies through your browser settings.
        </p>

        <h2>6. Data retention and security</h2>
        <p>
          We keep personal information for as long as needed to provide the Service and for legitimate
          business or legal purposes, and we use reasonable safeguards to protect it. No method of
          transmission or storage is completely secure.
        </p>

        <h2>7. Changes</h2>
        <p>
          We may update this Policy from time to time; material changes will be reflected by updating
          the date above.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions or privacy requests? Contact us at{" "}
          <a href="mailto:gozalo@therateoutlet.com">gozalo@therateoutlet.com</a>.
        </p>
      </div>
    </>
  );
}
