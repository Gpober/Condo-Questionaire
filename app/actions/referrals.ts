"use server";

import { revalidatePath } from "next/cache";
import { applyReferral } from "@/lib/referrals";

// Called once after a referred user signs in for the first time. Idempotent:
// the RPC refuses to credit the same user twice.
export async function applyReferralAction(
  code: string
): Promise<{ status: string }> {
  const status = await applyReferral(code);
  if (status === "applied") {
    revalidatePath("/account");
  }
  return { status };
}
