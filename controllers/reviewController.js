import Review from "../models/ReviewModel.js";
import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";

export const createReview = async(req,res)=>{
      try {
            
            const userId = req.user._id;

            if(!userId){
                  return  res.status(400).json({
                  success:false,
                  message:"login to proceed"
            });
            }

            const {productId,rating,title,cooment} = req.body;

            if(!productId || !rating){
                  return  res.status(400).json({
                  success:false,
                  message:"product id and rating are required"
            });
            }

            if(rating < 1 || rating > 5){
                  return  res.status(400).json({
                  success:false,
                  message:"rating must be between 1 and 5"
            });
            }

            const product = await Product.findOne({
                  _id:productId,
                  isActive:true,
                  isDeleted:false
            });

            if(!product){
                  return  res.status(404).json({
                  success:false,
                  message:"product not found"
            });
            }

            const existingReview = await Review.findOne({
                  user:userId,
                  product:productId,
                  isDeleted:false
            });

            if(existingReview){
                  return  res.status(400).json({
                  success:false,
                  message:"you have already gave a review"
            });
            }

            const verifiedorder = await Order.findOne({
                  user:userId,
                  status:"delivered",
                  "items.product":productId
            });

            const review = await Review.create({
                  user:userId,
                  product:productId,
                  rating,
                  title:title || "",
                  isVerifiedPurchase: !!verifiedorder,
                  review
            });
      } catch (error) {
            if(error.code ===11000){
                  return  res.status(400).json({
                  success:false,
                  message:"you have already revied this product"
            });
            }
            console.error("createReview Error :",error);
            res.status(500).json({
                  success:false,
                  message:"failed to create review"
            });
      }
}

export const getProductReviews = async(req,res)=>{
      try {
            const {productId} = req.params;
            const {
                  page=1,
                  limit = 10,
                  sortBy="createdAt",
                  order=desc,
                  rating
            } = req.query;

            const skip = (Number(page) - 1) * Number(limit);

            const sortOrder = order === "asc" ? 1 :-1;

            const filter ={
                  product:productId,
                  isDeleted:false
            };

            if(rating){
                  const parsedrating = Number(rating);
                  if(parsedrating >= 1 && parsedrating <=5){
                        filter.rating = parsedrating
                  }
            }
            const {reviews,total} = await Promise.all([
                  Review.find(filter)
                    .populate("user","firstName lastName")
                    .sort({[sortBy]:sortOrder})
                    .skip(skip)
                    .limit(Number(limit)),
                  Review.countDocuments(filter),
            ]);

            const ratingBreakDown = await Review.aggregate([
                  {$match :{product: productId , isDeleted:false}},
                  {
                        $group:{
                              _id:"$rating",
                              count:{$sum:1},
                        },
                  },
            ]);

            const breakdown = { 1: 0,2 : 0,3 : 0,4 : 0,5:0};
            ratingBreakDown.forEach((r) =>{
                  breakdown[r , _id] = r.count;
            });

            res.status(200).json({
                  success:true,
                  total,
                  page:Number(page),
                  pages:Math.ceil(total/Number(limit)),
                  breakdown,//for satr review
                  reviews
            });
      } catch (error) {
            console.error("getProductRevies Error :",error);
             res.status(500).json({
                  success:false,
                  message:"failed to fetch productReviews"
            });
      }
};

export const getUserReviews = async(req,res)=>{
      try {
            
            const userId = req.userId;

            const {page = 1 , limit =10} =req.query;

            const skip = (Number(page) - 1)* Number(limit);

            const [reviews,total] = await Promise.all([
                   Review.find({ user: userId, isDeleted: false })
                        .populate("product", "name category images price")
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(Number(limit)),
                  Review.countDocuments({ user: userId, isDeleted: false }),
            ]);
            
            res.status(200).json({
                  success:true,
                  total,
                  page:Number(page),
                  pages:Math.ceil(total / Number(limit)),
                  reviews,
                  message:"user reviews fetched successfully"
            });
            
      } catch (error) {
            console.error("getUserReviews error : ",error);
            return  res.status(400).json({
                  success:false,
                  message:"failed to fetch user reviews"
            });
      }
}

export const updateReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
 
    if (!rating && !title && !comment) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }
 
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }
 
    const review = await Review.findOne({
      _id: reviewId,
      isDeleted: false,
    });
 
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }
 
       if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this review",
      });
    }
 
    if (rating)  review.rating  = rating;
    if (title)   review.title   = title;
    if (comment) review.comment = comment;
 
    await review.save();
    
    await review.populate("user", "firstName lastName");
 
    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("updateReview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { reviewId } = req.params;
 
    const review = await Review.findOne({
      _id: reviewId,
      isDeleted: false,
    });
 
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }
    
    const isOwner = review.user.toString() === userId.toString();
    const isAdmin = userRole === "admin";
 
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }
 
    await Review.findOneAndDelete({ _id: reviewId });
 
    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("deleteReview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};