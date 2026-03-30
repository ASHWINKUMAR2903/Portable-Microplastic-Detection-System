const Telemetry = require("../models/Telemetry");

// ─── Store new telemetry ──────────────────────────────────────────────
const storeTelemetry = async (req, res) => {
  try {
    const body = req.body;

    // Basic validation
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "Request body is empty" });
    }

    const telemetry = new Telemetry(body);
    await telemetry.save();

    console.log("✅ Stored in MongoDB:", {
      device: body.device_id,
      voltage: body.light_voltage,
      events: body.event_count,
    });

    res.status(201).json({
      status: "stored",
      id: telemetry._id,
      created_at: telemetry.created_at,
    });
  } catch (err) {
    console.error("❌ Store error:", err.message);
    res.status(500).json({ error: "Failed to store data", details: err.message });
  }
};

// ─── Get the latest telemetry record ──────────────────────────────────
const getLatestTelemetry = async (req, res) => {
  try {
    const latest = await Telemetry.findOne().sort({ created_at: -1 }).lean();

    if (!latest) {
      return res.json({ message: "No telemetry data found", data: null });
    }

    res.json(latest);
  } catch (err) {
    console.error("❌ Latest fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
};

// ─── Get telemetry records by date range ──────────────────────────────
const getTelemetryByRange = async (req, res) => {
  try {
    const { from, to, limit, offset } = req.query;

    const query = {};
    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) query.created_at.$lte = new Date(to);
    }

    const maxLimit = Math.min(parseInt(limit) || 500, 1000);
    const skip = parseInt(offset) || 0;

    const [results, totalCount] = await Promise.all([
      Telemetry.find(query).sort({ created_at: -1 }).limit(maxLimit).skip(skip).lean(),
      Telemetry.countDocuments(query),
    ]);

    res.json({
      data: results,
      pagination: {
        total: totalCount,
        limit: maxLimit,
        offset: skip,
        hasMore: skip + results.length < totalCount,
      },
    });
  } catch (err) {
    console.error("❌ Range fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch data range" });
  }
};

// ─── Get summary statistics ───────────────────────────────────────────
const getTelemetryStats = async (req, res) => {
  try {
    const totalRecords = await Telemetry.countDocuments();
    const latestRecord = await Telemetry.findOne().sort({ created_at: -1 }).lean();
    const oldestRecord = await Telemetry.findOne().sort({ created_at: 1 }).lean();

    // Aggregate stats
    const aggResult = await Telemetry.aggregate([
      {
        $match: { light_voltage: { $ne: null, $exists: true } },
      },
      {
        $group: {
          _id: null,
          avgVoltage: { $avg: "$light_voltage" },
          minVoltage: { $min: "$light_voltage" },
          maxVoltage: { $max: "$light_voltage" },
          totalEvents: { $sum: "$event_count" },
          detections: {
            $sum: { $cond: [{ $eq: ["$event_detected", true] }, 1, 0] },
          },
        },
      },
    ]);

    const agg = aggResult[0] || {};

    // Unique devices
    const devices = await Telemetry.distinct("device_id");

    res.json({
      totalRecords,
      devices,
      voltage: {
        avg: agg.avgVoltage ?? null,
        min: agg.minVoltage ?? null,
        max: agg.maxVoltage ?? null,
      },
      events: {
        totalEventCount: agg.totalEvents ?? 0,
        detectionRecords: agg.detections ?? 0,
      },
      timeRange: {
        oldest: oldestRecord?.created_at ?? null,
        newest: latestRecord?.created_at ?? null,
      },
    });
  } catch (err) {
    console.error("❌ Stats error:", err.message);
    res.status(500).json({ error: "Failed to compute statistics" });
  }
};

module.exports = {
  storeTelemetry,
  getLatestTelemetry,
  getTelemetryByRange,
  getTelemetryStats,
};
