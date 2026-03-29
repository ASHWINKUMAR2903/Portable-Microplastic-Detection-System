const express = require("express");
const router = express.Router();
const {
  storeTelemetry,
  getLatestTelemetry,
  getTelemetryByRange
} = require("../controllers/telemetryController");

// Base path: /api/telemetry

router.post("/", storeTelemetry);
router.get("/", getTelemetryByRange);
router.get("/latest", getLatestTelemetry);

module.exports = router;
