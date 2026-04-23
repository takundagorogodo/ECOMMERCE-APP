import express from "express";
import { cancelOrder, createOrder, getAllOrders, getOrder, getUserOrders, updateOrderStatus } from "../controllers/orderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/create",authenticate,allowRoles("customer"),createOrder);
router.get("/:orderId",authenticate,getOrder);
router.get("/my-orders",authenticate,allowRoles("custoner"),getUserOrders);
router.get("/",authenticate,allowRoles("customer","worker"),getAllOrders);
router.patch("/update-status",authenticate,allowRoles("customer","worker"),updateOrderStatus);
router.patch("/cancel/:orderId",authenticate,allowRoles("customer","admin","worker"),cancelOrder);

export default router
