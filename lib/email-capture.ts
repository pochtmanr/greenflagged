export type LeadSource = "hero-drop" | "final-cta" | "newsletter";

export async function submitLead(payload: {
  email: string;
  source: LeadSource;
  fileName?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Unknown error" }));
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
