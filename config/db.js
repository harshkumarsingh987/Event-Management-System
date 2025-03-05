const mongoose =require("mongoose");
const MONGO_URL = "mongodb://127.0.0.1:27017/event-management";
const connectDB = async () => {
    try {
      await mongoose.connect(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
      console.error("❌ MongoDB Connection Failed:", error);
      process.exit(1); // Stop process if DB fails
    }
  };
  
  module.exports = connectDB;