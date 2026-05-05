import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      required: true,
      enum: ["card", "paypal", "bank_transfer", "cash", "wallet", "upi"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "success", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    gateway: {
      name: {
        type: String,
        trim: true,
      },
      transactionId: {
        type: String,
        trim: true,
      },
      gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    refund: {
      amount: {
        type: Number,
        default: null,
        min: 0,
      },
      reason: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },
      refundedAt: {
        type: Date,
        default: null,
      },
    },
    paidAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

paymentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "success" && !this.paidAt) {
      this.paidAt = new Date();
    }
    if (this.status === "refunded" && this.refund?.amount && !this.refund.refundedAt) {
      this.refund.refundedAt = new Date();
    }
  }
  next();
});

paymentSchema.index({ "gateway.transactionId": 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
