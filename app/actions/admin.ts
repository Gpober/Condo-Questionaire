"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, setLeadStatus } from "@/lib/admin";
import { LeadStatus } from "@/lib/types";

export async function updateLeadStatusAction(
  id: number,
  status: LeadStatus
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  const ok = await setLeadStatus(id, status);
  if (ok) revalidatePath("/admin");
  return { ok };
}
