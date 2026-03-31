require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const telemetryRoutes = require("./routes/telemetryRoutes");

// Initialize Express App
const app = express();
const server = http.createServer(app);

// ─── CORS Configuration ───────────────────────────────────────────────
const allowedOrigins = [
  "https://portable-microplastic-detection-sys.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, ESP32)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight for all routes
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
  } else {
    next();
  }
});

// ─── Socket.IO Setup ──────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Track connected clients
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
  });
});

// Make io accessible to controllers via req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Middleware ────────────────────────────────────────────────────────
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  if (req.method === "POST") {
    console.log("  Body:", JSON.stringify(req.body).slice(0, 200));
  }
  next();
});

// ─── Database ─────────────────────────────────────────────────────────
connectDB();

// ─── API Routes ───────────────────────────────────────────────────────
app.use("/api/telemetry", telemetryRoutes);

// ─── Root & Health ────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Microplastic Detection API",
    version: "3.0.0",
    websocket: true,
    connectedClients: io.engine.clientsCount,
    endpoints: {
      health: "/health",
      telemetry: "/api/telemetry",
      latest: "/api/telemetry/latest",
      stats: "/api/telemetry/stats",
      recent: "/api/telemetry/recent",
      websocket: "ws://<host> (Socket.IO)",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    websocketClients: io.engine.clientsCount,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// ─── Start Server (use `server.listen` for Socket.IO) ─────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket ready`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
});