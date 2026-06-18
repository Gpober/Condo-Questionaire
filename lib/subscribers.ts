import { getServerClient } from "./supabase/server";

export interface Subscriber {
  id: number;
  email: string;
  source: string | null;
  created_at: string;
}

// Marketing list, newest first. RLS returns rows only to admins.
export async function getSubscribers(): Promise<Subscriber[]> {
  const supabase = getServerClient();
  if (!supabase) {
    return [
      { id: 1, email: "demo.lead@example.com", source: "search", created_at: new Date().toISOString() },
    ];
  }
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getSubscribers failed:", error.message);
    return [];
  }
  return (data ?? []) as Subscriber[];
}
