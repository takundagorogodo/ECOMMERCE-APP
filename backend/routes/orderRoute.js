import express from "express";
import { updateOrderStatus } from "../controllers/orderController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.put("/order-status", authenticate ,allowRoles("worker"),updateOrderStatus);

export default router
