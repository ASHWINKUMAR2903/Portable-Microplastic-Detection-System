import { Link } from "react-router-dom";
import "../styles/dashboard.css";

export default function Home() {
  return (
    <div className="home-page">

      <section className="main-ctnt">
        <h1>Microplastic Detection System</h1>
        <p>
          IoT-Based Real-Time Water Quality Monitoring using ESP32 and Optical Sensing
        </p>

        <Link to="/dashboard" className="primary-btn">
          Launch Dashboard
        </Link>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>📡 Real-Time Monitoring</h3>
          <p>
            Continuous data acquisition from ESP32-based optical sensor
            for instant microplastic detection.
          </p>
        </div>

        <div className="feature-card">
          <h3>📊 Data Analytics</h3>
          <p>
            Time-based filtering, statistical summaries, and structured
            data presentation for research and analysis.
          </p>
        </div>

        <div className="feature-card">
          <h3>🔒 Secure & Scalable</h3>
          <p>
            Node.js backend with PostgreSQL database ensuring
            reliable and scalable data storage.
          </p>
        </div>
      </section>

      <section className="overview">
        <h2>System Architecture</h2>
        <p>
          The system integrates an ESP32 microcontroller with an optical
          sensor module to detect microplastic disturbances in water.
          Sensor data is transmitted via WiFi to a Node.js backend server,
          stored in PostgreSQL, and visualized through a web-based dashboard.
        </p>
      </section>

    </div>
  );
}