export const ALLOWED_CATEGORIES = ["Sales", "Support", "Billing", "Other"];

// Calls the mock AI service from the backend only.
// Never throws: returns { ok: true, category } or { ok: false, reason }.
export async function categorize({ id, message }) {
  const url = process.env.MOCK_AI_URL || "http://127.0.0.1:8787/categorize";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 5000;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enquiryId: id, message }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    if (!res.ok) return { ok: false, reason: `service returned HTTP ${res.status}` };

    const data = await res.json();
    if (!ALLOWED_CATEGORIES.includes(data?.category)) {
      return { ok: false, reason: "invalid category returned" };
    }
    return { ok: true, category: data.category };
  } catch (err) {
    const reason = err?.name === "TimeoutError" ? "timeout" : "service unreachable";
    return { ok: false, reason };
  }
}