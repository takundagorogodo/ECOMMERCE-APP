import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { addToCart, clearCart, removeCartItem, updateCartItem } from "../controllers/cartControllers";

const router = express.Router();

router.delete("/clear",authenticate , allowRoles("customer"),clearCart);
router.delete("/remove/:productId",authenticate,allowRoles("customer"),removeCartItem);
router.patch("/update",authenticate,allowRoles("customer"),updateCartItem);
router.post("/add",authenticate,allowRoles("customer"),addToCart);

export default router;