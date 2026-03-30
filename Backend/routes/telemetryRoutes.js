const express = require("express");
const router = express.Router();
const {
  storeTelemetry,
  getLatestTelemetry,
  getTelemetryByRange,
  getTelemetryStats,
} = require("../controllers/telemetryController");

// Base path: /api/telemetry

router.post("/", storeTelemetry);
router.get("/", getTelemetryByRange);
router.get("/latest", getLatestTelemetry);
router.get("/stats", getTelemetryStats);

module.exports = router;
