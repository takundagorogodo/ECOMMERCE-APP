import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { getAllPayments, getPayment, getUserPayments, initiatePayment, refundPayment, verifyPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/initiate",authenticate,allowRoles("customer"),initiatePayment);
router.post("/verify",authenticate,allowRoles("customer"),verifyPayment);
router.get("/my-payments",authenticate,allowRoles("customer"),getUserPayments);
router.get("/",authenticate,allowRoles("admin"),getAllPayments);
router.patch("/refund/:paymentId",authenticate,allowRoles("customer"),refundPayment);
router.get("/:paymentId",authenticate,allowRoles("customer","admin"),getPayment);

export default router;