import { useEffect, useState } from "react";
import { getLatestTelemetry,getTelemetry } from "../api/api";
import "../styles/dashboard.css";

function Dashboard() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [data2,setdata2] = useState([]);

  useEffect(() => {
    getLatestTelemetry().then(d => {
      if (d) setdata2([d]);
    });
  }, []);
  const latest = data2.length > 0 ? data2[0] : null;


  const fetchData2 = async () => {
    if (!from || !to) {
      alert('Please select From and To dates');
      return;
    }
    /*const res = await fetch(
      `http://localhost:3000/api/telemetry?from=${from}&to=${to}`
    );
    const json = await res.json();*/
    const fromPg = toPostgresTimestamp(from);
    const toPg = toPostgresTimestamp(to);

    const json = await getTelemetry(fromPg, toPg);
    setData(json);

    if (json.length > 0) {
      const voltages = json.map(d => d.light_voltage).filter(v => typeof v === 'number');
      if (voltages.length === 0) {
        setStats(null);
        return;
      }
      const sum = voltages.reduce((a, b) => a + b, 0);

      setStats({
        count: json.length,
        min: Math.min(...voltages),
        max: Math.max(...voltages),
        avg: sum / voltages.length
      });
    } 
    else {
      setStats(null);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <h1>Microplastic Detection System</h1>
        <p>Water Quality Monitoring Dashboard</p>
      </header>

      {latest && (
        <div className="stats">
          <div className="card">
            <h4>Voltage</h4>
            <p>{latest.light_voltage?.toFixed(6)} V</p>
          </div>

          <div className="card">
            <h4>Event Count</h4>
            <p>{latest.event_count ?? "N/A"}</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="card-row">
          <StatCard title="Total Records" value={stats.count} />
          <StatCard title="Min Voltage" value={stats.min.toFixed(6)} />
          <StatCard title="Max Voltage" value={stats.max.toFixed(6)} />
          <StatCard title="Average Voltage" value={stats.avg.toFixed(6)} />
        </div>
      )}

      {/* Controls */}
      <section className="controls">
        <div className="control">
          <label>From</label>
          <input
            type="datetime-local"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>

        <div className="control">
          <label>To</label>
          <input
            type="datetime-local"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>

        <button onClick={fetchData2}>Fetch Data</button>
      </section>

      {/* Data Table */}
      <section className="table-section">
        <h3>Sensor Data</h3>

        {data.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Voltage</th>
                <th>Event</th>
                <th>Event Count</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                  <td>
                    {typeof row.light_voltage === 'number'
                      ? row.light_voltage.toFixed(6)
                      : 'N/A'}
                  </td>
                  <td>{row.event_detected ? 'Yes' : 'No'}</td>
                  <td>{row.event_count ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No data available for selected range.</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
}

function toPostgresTimestamp(dt, isEnd = false) {
  if (!dt) return null;
  const base = dt.replace("T", " ");
  return isEnd
    ? `${base}:59.999999`  // end of that minute
    : `${base}:00`;        // start of that minute
}


export default Dashboard;