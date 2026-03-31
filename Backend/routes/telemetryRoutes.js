const express = require("express");
const router = express.Router();
const {
  storeTelemetry,
  getLatestTelemetry,
  getRecentTelemetry,
  getTelemetryByRange,
  getTelemetryStats,
} = require("../controllers/telemetryController");

// Base path: /api/telemetry

router.post("/", storeTelemetry);
router.get("/", getTelemetryByRange);
router.get("/latest", getLatestTelemetry);
router.get("/recent", getRecentTelemetry);
router.get("/stats", getTelemetryStats);

module.exports = router;
