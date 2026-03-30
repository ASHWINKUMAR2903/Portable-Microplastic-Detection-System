const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI environment variable is NOT SET!");
    console.error("   Set it in Render Dashboard → Environment → Add Variable");
    return;
  }

  const connect = async () => {
    try {
      await mongoose.connect(uri);
      console.log("✅ MongoDB Atlas Connected");
    } catch (err) {
      console.error("❌ MongoDB Connection Failed:", err.message);
      console.log("   Retrying in 5 seconds...");
      setTimeout(connect, 5000);
    }
  };

  await connect();
};

module.exports = connectDB;
