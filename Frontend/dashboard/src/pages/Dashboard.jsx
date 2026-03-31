import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  getLatestTelemetry, getRecentTelemetry, getTelemetry,
  getTelemetryStats, checkHealth, SOCKET_URL
} from "../api/api";
import "../styles/dashboard.css";

const MAX_CHART_POINTS = 60;

// ─── Custom Recharts Tooltip ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-time">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <strong>{typeof entry.value === "number" ? entry.value.toFixed(6) : entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  // ─── State ──────────────────────────────────────────────────────
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rangeData, setRangeData] = useState([]);
  const [rangeStats, setRangeStats] = useState(null);
  const [latest, setLatest] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [serverStatus, setServerStatus] = useState("loading");
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // Chart data
  const [voltageData, setVoltageData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const socketRef = useRef(null);

  // ─── Format time for chart labels ──────────────────────────────
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // ─── Transform telemetry record → chart point ─────────────────
  const toChartPoint = (record) => ({
    time: formatTime(record.created_at),
    voltage: record.light_voltage,
    baseline: record.baseline,
    events: record.event_count_recent ?? record.event_count ?? 0,
    detected: record.event_detected ? 1 : 0,
  });

  // ─── Initial Load ──────────────────────────────────────────────
  const fetchInitialData = useCallback(async () => {
    try {
      const [latestData, recentData, stats, _health] = await Promise.all([
        getLatestTelemetry(),
        getRecentTelemetry(MAX_CHART_POINTS),
        getTelemetryStats(),
        checkHealth(),
      ]);

      setLatest(latestData?.data !== null ? latestData : latestData);
      setGlobalStats(stats);
      setServerStatus("online");
      setError(null);

      // Populate chart data from recent records
      if (Array.isArray(recentData) && recentData.length > 0) {
        const chartPoints = recentData.map(toChartPoint);
        setVoltageData(chartPoints);
        setEventData(chartPoints);
      }
    } catch (err) {
      console.error("Fetch error:", err.message);
      setServerStatus("offline");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── WebSocket Connection ──────────────────────────────────────
  useEffect(() => {
    fetchInitialData();

    // Connect Socket.IO
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 WebSocket connected:", socket.id);
      setSocketStatus("connected");
      setServerStatus("online");
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected:", reason);
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("🔌 WebSocket error:", err.message);
      setSocketStatus("error");
    });

    // ─── Real-time data handler ─────────────────────────────
    socket.on("newTelemetry", (data) => {
      console.log("📡 Live data:", data);

      // Update latest
      setLatest(data);

      // Append to chart data
      const point = toChartPoint(data);

      setVoltageData((prev) => {
        const updated = [...prev, point];
        return updated.length > MAX_CHART_POINTS
          ? updated.slice(updated.length - MAX_CHART_POINTS)
          : updated;
      });

      setEventData((prev) => {
        const updated = [...prev, point];
        return updated.length > MAX_CHART_POINTS
          ? updated.slice(updated.length - MAX_CHART_POINTS)
          : updated;
      });

      // Update total records count
      setGlobalStats((prev) =>
        prev ? { ...prev, totalRecords: (prev.totalRecords || 0) + 1 } : prev
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchInitialData]);

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
          <div className={`status-indicator ${socketStatus === "connected" ? "online" : serverStatus === "online" ? "online" : "offline"}`}>
            <span className={`status-dot ${socketStatus === "connected" ? "green" : serverStatus === "online" ? "yellow" : "red"}`}></span>
            {socketStatus === "connected"
              ? "Live — WebSocket"
              : serverStatus === "online"
              ? "Polling Mode"
              : "Server Offline"}
          </div>
          <Link to="/" className="btn-back">← Home</Link>
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
                {latest?.light_voltage != null ? latest.light_voltage.toFixed(6) : "—"}
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
                {globalStats?.voltage?.avg != null ? globalStats.voltage.avg.toFixed(6) : "—"}
                <span className="stat-unit">V</span>
              </div>
            </div>
            <div className="stat-card rose">
              <div className="stat-icon">🚨</div>
              <div className="stat-label">Detections</div>
              <div className="stat-value">{globalStats?.events?.detectionRecords ?? "—"}</div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              CHARTS SECTION
              ═══════════════════════════════════════════════════ */}
          <div className="charts-grid">
            {/* ─── Voltage Line Chart ──────────────────────── */}
            <section className="chart-panel">
              <div className="chart-header">
                <h3>⚡ Light Voltage — Real-Time</h3>
                <span className="chart-badge">
                  {voltageData.length} points
                </span>
              </div>
              {voltageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={voltageData}>
                    <defs>
                      <linearGradient id="voltageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(v) => v.toFixed(3)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="voltage"
                      name="Voltage"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: "#3b82f6", stroke: "#1e293b", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    {voltageData[0]?.baseline != null && (
                      <Line
                        type="monotone"
                        dataKey="baseline"
                        name="Baseline"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                        dot={false}
                        isAnimationActive={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <p>Waiting for sensor data…</p>
                </div>
              )}
            </section>

            {/* ─── Voltage Area Chart ──────────────────────── */}
            <section className="chart-panel">
              <div className="chart-header">
                <h3>📈 Voltage Trend</h3>
                <span className="chart-badge live-badge">
                  <span className="pulse-dot-sm"></span> LIVE
                </span>
              </div>
              {voltageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={voltageData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(v) => v.toFixed(3)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="voltage"
                      name="Voltage"
                      stroke="#06b6d4"
                      fill="url(#areaGrad)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty"><p>No data yet</p></div>
              )}
            </section>

            {/* ─── Event Count Bar Chart ───────────────────── */}
            <section className="chart-panel full-width">
              <div className="chart-header">
                <h3>🔔 Detection Events per Window</h3>
                <span className="chart-badge">
                  {eventData.filter((d) => d.events > 0).length} active
                </span>
              </div>
              {eventData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={eventData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                    <Bar
                      dataKey="events"
                      name="Events"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty"><p>No event data</p></div>
              )}
            </section>
          </div>

          {/* ─── Range Query Controls ────────────────────────── */}
          <section className="controls-panel">
            <h3>🔍 Query Historical Data</h3>
            <div className="controls-row">
              <div className="control-group">
                <label>From</label>
                <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="control-group">
                <label>To</label>
                <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <button className="btn-fetch" onClick={fetchRangeData} disabled={fetching}>
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
                <div className="stat-value">{rangeStats.min.toFixed(6)}<span className="stat-unit">V</span></div>
              </div>
              <div className="stat-card cyan">
                <div className="stat-label">Max Voltage</div>
                <div className="stat-value">{rangeStats.max.toFixed(6)}<span className="stat-unit">V</span></div>
              </div>
              <div className="stat-card amber">
                <div className="stat-label">Avg Voltage</div>
                <div className="stat-value">{rangeStats.avg.toFixed(6)}<span className="stat-unit">V</span></div>
              </div>
            </div>
          )}

          {/* ─── Data Table ──────────────────────────────────── */}
          <section className="table-panel">
            <h3>
              📋 Sensor Data
              {rangeData.length > 0 && (
                <span className="record-count">{rangeData.length} record{rangeData.length !== 1 ? "s" : ""}</span>
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
                        <td>{typeof row.light_voltage === "number" ? row.light_voltage.toFixed(6) : "N/A"}</td>
                        <td>{typeof row.baseline === "number" ? row.baseline.toFixed(6) : "—"}</td>
                        <td>
                          <span className={`event-badge ${row.event_detected ? "detected" : "clear"}`}>
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
                <div className="state-desc">Use the date range controls above to query historical sensor data.</div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}