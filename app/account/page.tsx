import TopBar from "@/components/TopBar";
import AccountClient from "@/components/AccountClient";
import ReferralCard from "@/components/ReferralCard";
import { getBalance } from "@/lib/credits";
import { getReferralInfo } from "@/lib/referrals";
import { CREDIT_PACKS, isStripeConfigured } from "@/lib/stripe/config";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { purchase?: string };
}) {
  const balance = await getBalance();
  const referral = await getReferralInfo();
  const purchase = searchParams.purchase;

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>Your account</h1>
          <p>Credits are spent when you open a condo&apos;s cached record (1 credit each).</p>
        </div>

        {purchase === "success" && (
          <div className="banner demo" style={{ background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>
            ✅ Payment received. Your credits will appear within a few seconds — refresh if needed.
          </div>
        )}
        {purchase === "cancel" && (
          <div className="banner demo">Checkout canceled — no charge was made.</div>
        )}

        <ReferralCard info={referral} />

        <AccountClient
          balance={balance}
          packs={CREDIT_PACKS}
          stripeReady={isStripeConfigured}
        />
      </div>
    </>
  );
}
