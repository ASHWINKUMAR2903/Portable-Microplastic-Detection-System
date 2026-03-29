const Telemetry = require("../models/Telemetry");

// Store new telemetry
const storeTelemetry = async (req, res) => {
  console.log("RAW BODY:", req.body);
  try {
    const telemetry = new Telemetry(req.body);
    await telemetry.save();
    console.log("Stored effectively in MongoDB:", req.body);
    res.json({ status: "stored" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to store data" });
  }
};

// Get the latest telemetry record
const getLatestTelemetry = async (req, res) => {
  try {
    const latest = await Telemetry.findOne().sort({ created_at: -1 });
    res.json(latest || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
};

// Get multiple telemetry records by date range
const getTelemetryByRange = async (req, res) => {
  const { from, to } = req.query;
  try {
    // MongoDB handles standard ISO strings out of the box so we can check if they exist
    const query = {};
    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) query.created_at.$lte = new Date(to);
    }

    const results = await Telemetry.find(query).sort({ created_at: 1 });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data range" });
  }
};

module.exports = {
  storeTelemetry,
  getLatestTelemetry,
  getTelemetryByRange
};
