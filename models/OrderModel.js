import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        productId: String,
        quantity: Number,
      },
    ],

    totalAmount: Number,

    deliveryStatus: {
      type: String,
      enum: ["placed", "packed", "onTransit", "delivered"],
      default: "placed",
    },

    address: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    paymentStatus:{
      type:String,
      enum:["pay on delivery","payed"],
      default:"pay on delivery",
    }

  },
  { timestamps: true }
);

export default mongoose.model('Order',orderSchema);