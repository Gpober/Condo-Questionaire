import { requireServerClient } from "./supabase/server";

export type RedeemStatus =
  | "unlocked"
  | "already_unlocked"
  | "insufficient"
  | "unauthenticated";

export interface RedeemResult {
  status: RedeemStatus;
  balance: number;
}

// Current signed-in user's id (or null).
export async function getUserId(): Promise<string | null> {
  const supabase = requireServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Credit balance for the signed-in user (0 if none / not signed in).
export async function getBalance(): Promise<number> {
  const supabase = requireServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("credit_balance")
    .maybeSingle();
  if (error) {
    console.error("getBalance failed:", error.message);
    return 0;
  }
  return data?.credit_balance ?? 0;
}

// Has the signed-in user already unlocked this project?
export async function isUnlocked(projectId: string): Promise<boolean> {
  const supabase = requireServerClient();
  const { data, error } = await supabase
    .from("lookups")
    .select("id")
    .eq("project_id", Number(projectId))
    .maybeSingle();
  if (error) {
    console.error("isUnlocked failed:", error.message);
    return false;
  }
  return Boolean(data);
}

// Spend 1 credit to unlock a project (atomic, server-side via RPC).
export async function redeemCredit(projectId: string): Promise<RedeemResult> {
  const supabase = requireServerClient();
  const { data, error } = await supabase.rpc("redeem_credit", {
    p_project_id: Number(projectId),
  });
  if (error) {
    console.error("redeemCredit failed:", error.message);
    return { status: "insufficient", balance: 0 };
  }
  return data as RedeemResult;
}

// TEMPORARY: grant test credits to the current user (until Stripe is live).
export async function grantTestCredits(amount: number): Promise<number> {
  const supabase = requireServerClient();
  const { data, error } = await supabase.rpc("grant_test_credits", {
    p_amount: amount,
  });
  if (error) {
    console.error("grantTestCredits failed:", error.message);
    return 0;
  }
  return (data as number) ?? 0;
}
