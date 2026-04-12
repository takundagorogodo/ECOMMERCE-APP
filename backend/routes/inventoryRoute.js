import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { getOutOfStock } from "../controllers/inventoryController.js";
import { createInventory, getAllInventory, getInventory, getLowStock, updateStock } from "../controllers/inventoryController.js";

const router = express.Router();

router.post("/create",authenticate,allowRoles("admin","worker"),createInventory);
router.get("/:productId",authenticate,allowRoles("worker","admin"),getInventory);
router.get("/",authenticate,allowRoles("admin","worker"),getAllInventory);
router.patch("/update-stock",authenticate,allowRoles("worker","admin",updateStock));
router.get("/low-stock",authenticate,allowRoles("worker","admin"),getLowStock);
router.get("/out-of-stock",authenticate,allowRoles("admin","worker"),getOutOfStock);

export default router;