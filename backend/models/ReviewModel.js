import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const recalcProductRatings = async (productId) => {
  const Product = mongoose.model("Product");
  const result = await mongoose.model("Review").aggregate([
    { $match: { product: productId, isDeleted: false } },
    {
      $group: {
        _id: "$product",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      "ratings.average": Math.round(result[0].average * 10) / 10,
      "ratings.count": result[0].count,
    });
    return;
  }

  await Product.findByIdAndUpdate(productId, {
    "ratings.average": 0,
    "ratings.count": 0,
  });
};

reviewSchema.post("save", async function () {
  await recalcProductRatings(this.product);
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  await recalcProductRatings(doc.product);
});

export default mongoose.model("Review", reviewSchema);
