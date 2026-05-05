import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
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
      default: 1,
    },
    priceAtAddedTime: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCheckedOut: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

cartSchema.pre("save", function (next) {
  this.totalPrice = this.items.reduce((sum, item) => {
    return sum + item.priceAtAddedTime * item.quantity;
  }, 0);
  next();
});

export default mongoose.model("Cart", cartSchema);
