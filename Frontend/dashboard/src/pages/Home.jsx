import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkHealth } from "../api/api";
import "../styles/dashboard.css";

export default function Home() {
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    checkHealth()
      .then(() => setServerStatus("online"))
      .catch(() => setServerStatus("offline"));
  }, []);

  return (
    <div className="home-page">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            IoT-Powered Water Analysis
          </div>

          <h1>
            <span className="accent">Microplastic</span> Detection
            <br />
            System
          </h1>

          <p>
            Real-time water quality monitoring using ESP32 optical sensing.
            Detect microplastic contamination with precision and visualize
            data through a cloud-connected analytics dashboard.
          </p>

          <div className="hero-actions">
            <Link to="/dashboard" className="btn-primary">
              🔬 Launch Dashboard
            </Link>
            <a href="#architecture" className="btn-secondary">
              📐 System Architecture
            </a>
          </div>

          <div
            className={`server-status ${serverStatus}`}
            title="Backend server status"
          >
            <span
              className={`pulse-dot`}
              style={{
                background:
                  serverStatus === "online"
                    ? "var(--accent-emerald)"
                    : serverStatus === "offline"
                    ? "var(--accent-rose)"
                    : "var(--accent-amber)",
              }}
            ></span>
            {serverStatus === "online"
              ? "Backend Server Online"
              : serverStatus === "offline"
              ? "Backend Server Offline — may need to wake up"
              : "Checking server status…"}
          </div>
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────────────────── */}
      <section className="features-section">
        <div className="section-header">
          <h2>Key Capabilities</h2>
          <p>
            A complete IoT pipeline from sensor to cloud dashboard
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon blue">📡</div>
            <h3>Real-Time Monitoring</h3>
            <p>
              Continuous data acquisition from ESP32-based optical sensor
              with 100ms sampling intervals for instant microplastic
              detection.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon cyan">📊</div>
            <h3>Data Analytics</h3>
            <p>
              Time-based filtering, statistical summaries, and structured
              data presentation for research and analysis.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon emerald">☁️</div>
            <h3>Cloud Infrastructure</h3>
            <p>
              Node.js backend on Render with MongoDB Atlas database ensuring
              reliable, scalable, 24/7 data storage and retrieval.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon violet">🔒</div>
            <h3>Secure & Scalable</h3>
            <p>
              HTTPS encrypted communication, CORS-protected API endpoints,
              and cloud-native deployment for production readiness.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Architecture Section ──────────────────────────────────── */}
      <section className="architecture-section" id="architecture">
        <div className="section-header">
          <h2>System Architecture</h2>
          <p>End-to-end data flow from sensor to dashboard</p>
        </div>

        <div className="arch-flow">
          <div className="arch-node">
            <span className="icon">🔬</span>
            <span className="label">BPW34 Sensor</span>
            <span className="sublabel">Optical Detection</span>
          </div>
          <span className="arch-arrow">→</span>
          <div className="arch-node">
            <span className="icon">📟</span>
            <span className="label">ESP32 + ADS1115</span>
            <span className="sublabel">ADC Sampling</span>
          </div>
          <span className="arch-arrow">→</span>
          <div className="arch-node">
            <span className="icon">☁️</span>
            <span className="label">Render API</span>
            <span className="sublabel">Node.js + Express</span>
          </div>
          <span className="arch-arrow">→</span>
          <div className="arch-node">
            <span className="icon">🗄️</span>
            <span className="label">MongoDB Atlas</span>
            <span className="sublabel">Cloud Database</span>
          </div>
          <span className="arch-arrow">→</span>
          <div className="arch-node">
            <span className="icon">📊</span>
            <span className="label">Vercel Dashboard</span>
            <span className="sublabel">React Frontend</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="footer">
        Microplastic Detection System &copy; {new Date().getFullYear()} — Built with ESP32, React & MongoDB
      </footer>
    </div>
  );
}