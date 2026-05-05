import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtOrderTime: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    houseNo: { type: String, trim: true },
    street: { type: String, trim: true },
    town: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "bank_transfer", "cash", "wallet", "upi"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
