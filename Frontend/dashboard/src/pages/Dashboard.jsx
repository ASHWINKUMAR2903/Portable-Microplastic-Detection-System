import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getLatestTelemetry, getTelemetry, getTelemetryStats, checkHealth } from "../api/api";
import "../styles/dashboard.css";

const POLL_INTERVAL = 10000; // 10 seconds

export default function Dashboard() {
  // ─── State ──────────────────────────────────────────────────────
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rangeData, setRangeData] = useState([]);
  const [rangeStats, setRangeStats] = useState(null);
  const [latest, setLatest] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [serverStatus, setServerStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const pollRef = useRef(null);

  // ─── Initial Load & Polling ────────────────────────────────────
  const fetchLatest = useCallback(async () => {
    try {
      const [latestData, stats, _health] = await Promise.all([
        getLatestTelemetry(),
        getTelemetryStats(),
        checkHealth(),
      ]);

      setLatest(latestData?.data !== null ? latestData : latestData);
      setGlobalStats(stats);
      setServerStatus("online");
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err.message);
      setServerStatus("offline");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
    pollRef.current = setInterval(fetchLatest, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchLatest]);

  // ─── Range Query ───────────────────────────────────────────────
  const fetchRangeData = async () => {
    if (!from || !to) {
      setError("Please select both From and To dates.");
      return;
    }

    setFetching(true);
    setError(null);

    try {
      const fromISO = new Date(from).toISOString();
      const toDate = new Date(to);
      toDate.setSeconds(59);
      toDate.setMilliseconds(999);
      const toISO = toDate.toISOString();

      const result = await getTelemetry(fromISO, toISO);

      // Handle both old format (array) and new format ({data, pagination})
      const records = Array.isArray(result) ? result : result.data || [];

      setRangeData(records);

      if (records.length > 0) {
        const voltages = records
          .map((d) => d.light_voltage)
          .filter((v) => typeof v === "number" && !isNaN(v));

        if (voltages.length > 0) {
          const sum = voltages.reduce((a, b) => a + b, 0);
          setRangeStats({
            count: records.length,
            min: Math.min(...voltages),
            max: Math.max(...voltages),
            avg: sum / voltages.length,
            events: records.filter((d) => d.event_detected).length,
          });
        } else {
          setRangeStats({ count: records.length, min: 0, max: 0, avg: 0, events: 0 });
        }
      } else {
        setRangeStats(null);
      }
    } catch (err) {
      setError(err.message);
      setRangeData([]);
      setRangeStats(null);
    } finally {
      setFetching(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="dashboard-page">
      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <h1>🔬 MicroPlastic Dashboard</h1>
          <p>Real-time water quality monitoring & analytics</p>
        </div>
        <div className="dash-header-right">
          <div className={`status-indicator ${serverStatus}`}>
            <span
              className={`status-dot ${
                serverStatus === "online" ? "green" : serverStatus === "offline" ? "red" : "yellow"
              }`}
            ></span>
            {serverStatus === "online"
              ? "Server Online"
              : serverStatus === "offline"
              ? "Server Offline"
              : "Connecting…"}
          </div>
          <Link to="/" className="btn-back">
            ← Home
          </Link>
        </div>
      </header>

      {/* ─── Error Banner ──────────────────────────────────────── */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <div className="error-text">
            <strong>Connection Issue</strong>
            {error}
          </div>
        </div>
      )}

      {/* ─── Loading State ─────────────────────────────────────── */}
      {loading ? (
        <div className="state-message">
          <div className="spinner"></div>
          <div className="state-title">Connecting to Server</div>
          <div className="state-desc">
            If the server was sleeping, this may take up to 30 seconds on Render&apos;s free tier…
          </div>
        </div>
      ) : (
        <>
          {/* ─── Live Stats ──────────────────────────────────── */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">⚡</div>
              <div className="stat-label">Latest Voltage</div>
              <div className="stat-value">
                {latest?.light_voltage != null
                  ? latest.light_voltage.toFixed(6)
                  : "—"}
                <span className="stat-unit">V</span>
              </div>
            </div>

            <div className="stat-card emerald">
              <div className="stat-icon">🔔</div>
              <div className="stat-label">Event Count</div>
              <div className="stat-value">{latest?.event_count ?? "—"}</div>
            </div>

            <div className="stat-card cyan">
              <div className="stat-icon">📟</div>
              <div className="stat-label">Device</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>
                {latest?.device_id ?? "—"}
              </div>
            </div>

            <div className="stat-card violet">
              <div className="stat-icon">📊</div>
              <div className="stat-label">Total Records</div>
              <div className="stat-value">{globalStats?.totalRecords ?? "—"}</div>
            </div>

            <div className="stat-card amber">
              <div className="stat-icon">📈</div>
              <div className="stat-label">Avg Voltage</div>
              <div className="stat-value">
                {globalStats?.voltage?.avg != null
                  ? globalStats.voltage.avg.toFixed(6)
                  : "—"}
                <span className="stat-unit">V</span>
              </div>
            </div>

            <div className="stat-card rose">
              <div className="stat-icon">🚨</div>
              <div className="stat-label">Detections</div>
              <div className="stat-value">
                {globalStats?.events?.detectionRecords ?? "—"}
              </div>
            </div>
          </div>

          {/* ─── Range Query Controls ────────────────────────── */}
          <section className="controls-panel">
            <h3>🔍 Query Historical Data</h3>
            <div className="controls-row">
              <div className="control-group">
                <label>From</label>
                <input
                  type="datetime-local"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="control-group">
                <label>To</label>
                <input
                  type="datetime-local"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <button
                className="btn-fetch"
                onClick={fetchRangeData}
                disabled={fetching}
              >
                {fetching ? "⏳ Fetching…" : "🔎 Fetch Data"}
              </button>
            </div>
          </section>

          {/* ─── Range Stats ─────────────────────────────────── */}
          {rangeStats && (
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-label">Records Found</div>
                <div className="stat-value">{rangeStats.count}</div>
              </div>
              <div className="stat-card emerald">
                <div className="stat-label">Min Voltage</div>
                <div className="stat-value">
                  {rangeStats.min.toFixed(6)}
                  <span className="stat-unit">V</span>
                </div>
              </div>
              <div className="stat-card cyan">
                <div className="stat-label">Max Voltage</div>
                <div className="stat-value">
                  {rangeStats.max.toFixed(6)}
                  <span className="stat-unit">V</span>
                </div>
              </div>
              <div className="stat-card amber">
                <div className="stat-label">Avg Voltage</div>
                <div className="stat-value">
                  {rangeStats.avg.toFixed(6)}
                  <span className="stat-unit">V</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Data Table ──────────────────────────────────── */}
          <section className="table-panel">
            <h3>
              📋 Sensor Data
              {rangeData.length > 0 && (
                <span className="record-count">
                  {rangeData.length} record{rangeData.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>

            {rangeData.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Voltage (V)</th>
                      <th>Baseline (V)</th>
                      <th>Event</th>
                      <th>Event Count</th>
                      <th>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rangeData.map((row, idx) => (
                      <tr key={row._id || idx}>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                        <td>
                          {typeof row.light_voltage === "number"
                            ? row.light_voltage.toFixed(6)
                            : "N/A"}
                        </td>
                        <td>
                          {typeof row.baseline === "number"
                            ? row.baseline.toFixed(6)
                            : "—"}
                        </td>
                        <td>
                          <span
                            className={`event-badge ${
                              row.event_detected ? "detected" : "clear"
                            }`}
                          >
                            {row.event_detected ? "⚠ Detected" : "✓ Clear"}
                          </span>
                        </td>
                        <td>{row.event_count ?? "—"}</td>
                        <td>{row.device_id ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="state-message">
                <div className="state-icon">📭</div>
                <div className="state-title">No Data Yet</div>
                <div className="state-desc">
                  Use the date range controls above to query historical sensor data from the database.
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}