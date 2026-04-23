import mongoose from "mongoose";
import { seedAdmin } from "./seedAdmin.js"; // ✅ IMPORT

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("✅ Database Connected");

    await seedAdmin(); // ✅ SAFE CALL

  } catch (error) {
    console.error("❌ Database Connection failed", error.message);
    process.exit(1);
  }
};