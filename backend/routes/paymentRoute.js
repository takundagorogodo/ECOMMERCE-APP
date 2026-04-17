import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { allowRoles } from "../middlewares/roleMiddleware";
import { getAllPayments, getPayment, getUserPayments, initiatePayment, refundPayment, verifyPayment } from "../controllers/paymentController";

const router = express.Router();

router.post("/initiate",authenticate,allowRoles("customer"),initiatePayment);
router.post("/verify",authenticate,allowRoles("customer"),verifyPayment);
router.get("/:paymentId",authenticate,allowRoles("customer","admin"),getPayment);
router.get("/my-payments",authenticate,allowRoles("customer"),getUserPayments);
router.get("/",authenticate,allowRoles("admin"),getAllPayments);
router.patch("/refund/:paymentId",authenticate,allowRoles("customer"),refundPayment);

export default router;