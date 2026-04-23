import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180 // auto delete after 3 minutes
  }
});

export default mongoose.model("OTP", otpSchema);