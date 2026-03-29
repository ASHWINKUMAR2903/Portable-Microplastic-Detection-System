require('dotenv').config();
const mongoose = require('mongoose');
const Telemetry = require('./models/Telemetry'); // Assumes this is run from Backend folder

const sampleData = [
  { 
    device_id: "test-device", 
    light_voltage: 0.0023, 
    event_detected: false, 
    event_count: 5, 
    created_at: new Date("2025-12-16T18:43:48.220Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: null, 
    event_detected: null, 
    event_count: 0, 
    created_at: new Date("2025-12-16T19:18:45.498Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: 0.18905, 
    event_detected: false, 
    event_count: 0, 
    created_at: new Date("2025-12-16T22:11:11.482Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: -0.246625, 
    event_detected: false, 
    event_count: 0, 
    created_at: new Date("2025-12-16T22:11:21.458Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: 0.183913, 
    event_detected: false, 
    event_count: 0, 
    created_at: new Date("2025-12-16T22:11:31.462Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: 0.18405, 
    event_detected: false, 
    event_count: 0, 
    created_at: new Date("2025-12-16T22:11:41.452Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: 0.1962, 
    event_detected: true, 
    event_count: 10, 
    created_at: new Date("2025-12-16T22:34:19.456Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: -0.09795, 
    event_detected: true, 
    event_count: 42, 
    created_at: new Date("2025-12-16T22:34:29.428Z") 
  },
  { 
    device_id: "esp32-001", 
    light_voltage: 0.184663, 
    event_detected: false, 
    event_count: 0, 
    created_at: new Date("2025-12-16T22:40:17.144Z") 
  }
];

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected Successfully!");

    console.log("Uploading test data...");
    await Telemetry.insertMany(sampleData);
    
    console.log("Success! Data uploaded.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error uploading data:", error);
  }
}

seedDatabase();
