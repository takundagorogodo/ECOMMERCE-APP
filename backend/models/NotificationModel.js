import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "order_placed",
        "order_confirmed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "payment_success",
        "payment_failed",
        "low_stock",
        "out_of_stock",
        "review_posted",
        "account_update",
        "general",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    reference: {
      model: {
        type: String,
        enum: ["Order", "Product", "Payment", "Review", null],
        default: null,
      },
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.pre("save", function (next) {
  if (this.isModified("isRead") && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
