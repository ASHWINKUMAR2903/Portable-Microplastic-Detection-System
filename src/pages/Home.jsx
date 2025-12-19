import { Link } from "react-router-dom";
import "../styles/dashboard.css";

export default function Home() {
  return (
    <div className="home">
      <h1>Microplastic Detection System</h1>
      <p>Real-time water quality monitoring using ESP32</p>

      <Link to="/dashboard" className="btn">
        View Dashboard
      </Link>
    </div>
  );
}