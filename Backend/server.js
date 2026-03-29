require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const telemetryRoutes = require("./routes/telemetryRoutes");

// Initialize Express App
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://portable-microplastic-detection-sys.vercel.app', 
    'https://portable-microplastic-detection-sys.vercel.app/dashboard'
  ]
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/telemetry", telemetryRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("API is running");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});