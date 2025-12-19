const BASE_URL = "https://ac914f54d5be.ngrok-free.app";

const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true"
};

//https://<NGROK-URL>/api/telemetry?from=2025-01-01 00:00:00&to=2025-12-31 23:59:59
export async function getLatestTelemetry() {
  const res = await fetch(`${BASE_URL}/api/telemetry/latest`, {headers: NGROK_HEADERS});
  return res.json();
}

export async function getTelemetry(from, to) {
  const res = await fetch(`${BASE_URL}/api/telemetry?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    {headers: NGROK_HEADERS});
  return res.json();
}