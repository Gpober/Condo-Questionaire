import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import type { EmailOtpType } from "@supabase/supabase-js";

// Completes the email-confirmation link from a sign-up. Supabase sends the user
// here after they click the link; we exchange the one-time code/token for a real
// session (setting auth cookies) and then drop them into the app. Without this
// route the link lands on a page that shows an error even though the account was
// actually confirmed.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/search";

  // We mutate this response's cookies as Supabase sets the session.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // PKCE flow uses ?code=...; the older email-OTP flow uses ?token_hash & type.
  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: { message: "Missing confirmation token." } as { message: string } };

  if (result.error) {
    const loginUrl = new URL(`${origin}/login`);
    loginUrl.searchParams.set("error", "We couldn't confirm that link. Please sign in.");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
