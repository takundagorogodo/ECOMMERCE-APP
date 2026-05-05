import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
      houseNo:  { type: String, trim: true },
      street:   { type: String, trim: true },
      town:     { type: String, trim: true },
      city:     { type: String, trim: true },
      state:    { type: String, trim: true },
      zip:      { type: String, trim: true },
      country:  { type: String, trim: true },
}, { _id: false });

const userSchema = new mongoose.Schema(
      {
            role: {
                  type: String,
                  enum: ["customer", "worker", "admin"],
                  default: "customer",
                  required: true,
            },
            salary:{
                  type:String,
                   validate: {
                        validator: function (v) {
                              return this.role === "worker" ? !!v : !v;
                        },
                        message: "workerRole should only exist for workers",
                  },
            },

            workerRole: {
                  type: String,
                  enum: ["manager", "deliveryGuy", "warehouser", "generalWorker"],
                  validate: {
                        validator: function (v) {
                              return this.role === "worker" ? !!v : !v;
                        },
                        message: "workerRole should only exist for workers",
                  },
            },

            // ── Worker-only ───────────────────────────────────────
            employeeId: {
                  type: String,
                  trim: true,
                  sparse: true,
                  unique: true,      // each worker gets a unique employee ID
            },

            registeredBy: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User",
                  default: null,     // filled when admin creates a worker
            },

            assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

            // ── Customer-only ─────────────────────────────────────
            cart: [
                  {
                        product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                        quantity: { type: Number, default: 1 },
                  },
            ],
            orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
            company: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "Company",
                  default: null,
            },

            // ── Shared identity ───────────────────────────────────
            firstName: { type: String, trim: true },
            lastName:  { type: String, trim: true },

            email: {
                  type: String,
                  lowercase: true,
                  trim: true,
                  sparse: true,
                  unique: true,
            },
            phone: {
                  type: String,
                  trim: true,
                  sparse: true,
                  unique: true,
            },

            password:   { type: String },
            gender:     { type: String, enum: ["male", "female", "other"] },
            address:    addressSchema,

            isVerified: { type: Boolean, default: false },
            isActive:   { type: Boolean, default: true },
            isDeleted: { type:Boolean, default :false}
      },
      { timestamps: true }
);

// Only one admin allowed
userSchema.pre("save", async function () {
      if (this.role === "admin" && this.isNew) {
            const exists = await mongoose.model("User").findOne({ role: "admin" });
            if (exists) throw new Error("An admin already exists.");
      }
});

export default mongoose.model("User", userSchema);