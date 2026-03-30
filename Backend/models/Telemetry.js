const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    default: "esp32-001",
  },
  timestamp: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
  window_ms: {
    type: Number,
    default: 10000,
  },
  light_voltage: {
    type: Number,
    default: null,
  },
  event_count_recent: {
    type: Number,
    default: 0,
  },
  baseline: {
    type: Number,
    default: null,
  },
  noise_std: {
    type: Number,
    default: null,
  },
  event_count: {
    type: Number,
    default: 0,
  },
  event_detected: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for query performance
telemetrySchema.index({ created_at: -1 });
telemetrySchema.index({ device_id: 1, created_at: -1 });

module.exports = mongoose.model("Telemetry", telemetrySchema);
