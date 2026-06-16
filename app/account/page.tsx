import TopBar from "@/components/TopBar";
import AccountClient from "@/components/AccountClient";
import { getBalance } from "@/lib/credits";
import { CREDIT_PACKS, isStripeConfigured } from "@/lib/stripe/config";

export default async function AccountPage() {
  const balance = await getBalance();

  return (
    <>
      <TopBar />
      <div className="container">
        <h1 style={{ marginTop: 0 }}>Your account</h1>
        <p className="muted" style={{ marginTop: -8 }}>
          Credits are spent when you open a condo&apos;s cached record (1 credit each).
        </p>
        <AccountClient
          balance={balance}
          packs={CREDIT_PACKS}
          stripeReady={isStripeConfigured}
        />
      </div>
    </>
  );
}
