import { getServerClient } from "./supabase/server";

export interface ReferralInfo {
  code: string;
  referredCount: number;
  creditsEarned: number;
  configured: boolean; // false in demo mode / before the RPC is deployed
}

// Referral code + tally for the signed-in user. The RPC lazily generates a code
// the first time it's requested, so this always returns a usable code.
export async function getReferralInfo(): Promise<ReferralInfo> {
  const supabase = getServerClient();
  if (!supabase) {
    return { code: "DEMOREF7", referredCount: 0, creditsEarned: 0, configured: false };
  }
  const { data, error } = await supabase.rpc("get_referral_info");
  if (error || !data || (data as any).status !== "ok") {
    if (error) console.error("getReferralInfo failed:", error.message);
    return { code: "", referredCount: 0, creditsEarned: 0, configured: false };
  }
  const d = data as any;
  return {
    code: d.code as string,
    referredCount: Number(d.referred_count ?? 0),
    creditsEarned: Number(d.credits_earned ?? 0),
    configured: true,
  };
}

// Apply a referral code on behalf of the caller (the invited user). Returns the
// RPC status string: applied | already_referred | invalid_code | self | no_code.
export async function applyReferral(code: string): Promise<string> {
  const supabase = getServerClient();
  if (!supabase) return "demo";
  const { data, error } = await supabase.rpc("apply_referral", { p_code: code });
  if (error) {
    console.error("applyReferral failed:", error.message);
    return "error";
  }
  return ((data as any)?.status as string) ?? "error";
}
