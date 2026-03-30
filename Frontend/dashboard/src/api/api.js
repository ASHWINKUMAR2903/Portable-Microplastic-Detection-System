// ─── API Configuration ────────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://portable-microplastic-detection-system-1.onrender.com";

// ─── Helper: fetch with error handling ────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorBody}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error("Request timed out — server may be waking up. Try again in 30s.");
    }

    throw err;
  }
}

// ─── API Methods ──────────────────────────────────────────────────────
export async function getLatestTelemetry() {
  return apiFetch("/api/telemetry/latest");
}

export async function getTelemetry(from, to) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  return apiFetch(`/api/telemetry?${params.toString()}`);
}

export async function getTelemetryStats() {
  return apiFetch("/api/telemetry/stats");
}

export async function checkHealth() {
  return apiFetch("/health");
}