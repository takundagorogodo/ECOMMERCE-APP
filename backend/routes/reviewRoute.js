import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { createReview, deleteReview, getProductReviews, getUserReviews, updateReview } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/create",authenticate,allowRoles("customer"),createReview);
router.get("/product/:productId",authenticate,getProductReviews);
router.get("/my-reviews",authenticate,allowRoles("customer"),getUserReviews);
router.delete("/delete/:reviewId",authenticate,allowRoles("customer","admin"),deleteReview);
router.patch("/update/reviewId",authenticate,allowRoles("customer"),updateReview);

export default router;