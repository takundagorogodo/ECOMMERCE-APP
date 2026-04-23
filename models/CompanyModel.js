import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street:  { type: String, trim: true },
    town:    { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zip:     { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyEmail: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    since: {
      type: Date,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: addressSchema,

    // ✅ Fixed: a company has MANY users — must be an array of refs
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ✅ Added: track which admin registered this company
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Company", companySchema);