/**
 * Canonical site origin for client-side auth redirects.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL (set this in Vercel for production)
 *  2. window.location.origin (browser fallback — dev + previews)
 *
 * NOTE: Supabase additionally validates redirect URLs against the
 * "Site URL" + "Redirect URLs" allow-list in Auth → URL configuration.
 * If a redirect_to value isn't in that list, Supabase silently swaps it
 * for the Site URL — that's how "login redirects to localhost" happens
 * in production. Setting this env var alone won't fix it; the Supabase
 * dashboard must also list the production origin.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function authCallbackUrl(next: string): string {
  const base = siteUrl();
  const params = new URLSearchParams({ next });
  return `${base}/auth/callback?${params.toString()}`;
}
