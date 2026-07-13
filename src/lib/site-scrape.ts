import "server-only";

/**
 * Fetch a lead's current website and return its readable text, so the AI can
 * build the proposal from the business's own real content (not invented copy).
 * Best-effort: returns null on any failure (bad URL, timeout, blocked host).
 */
export async function fetchSiteText(
  website: string | null,
  maxChars = 4000
): Promise<string | null> {
  if (!website) return null;
  const url = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  try {
    // Guard against hanging on slow sites.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadForgeBot/1.0; +proposal-preview)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) return null;

    const html = await res.text();
    const text = htmlToText(html);
    return text ? text.slice(0, maxChars) : null;
  } catch {
    return null;
  }
}

/** Crude but dependency-free HTML → text: drop scripts/styles, keep visible words. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
