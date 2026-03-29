const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
  device_id: String,
  timestamp: Number,
  window_ms: Number,
  light_voltage: Number,
  event_count_recent: Number,
  baseline: Number,
  noise_std: Number,
  event_count: Number,
  event_detected: Boolean,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Telemetry", telemetrySchema);
