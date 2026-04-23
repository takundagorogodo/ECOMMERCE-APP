import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/UserModel.js";

export const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists");
      return; // ❌ DO NOT EXIT
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "Admin@123",
      Number(process.env.HASH_KEY) || 10
    );

    const admin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      isActive: true,
    });

    console.log("✅ Admin created:", admin.email);

  } catch (error) {
    console.error("❌ Admin seeding failed:", error);
  }
};