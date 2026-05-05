import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { createProduct, deleteProduct, getAllProducts, getProduct, getProductsByCategory, searchProducts, updateProduct } from "../controllers/productController.js";

const router = express.Router();

router.post("/create",authenticate,allowRoles("admin"),createProduct);
router.get("/search",searchProducts);
router.get("/category/:category",getProductsByCategory);
router.get("/",getAllProducts);
router.patch("/update/:productId",authenticate,allowRoles("admin"),updateProduct)
router.put("/delete/:productId",authenticate,allowRoles("admin"),deleteProduct);
router.get("/:productId",getProduct);

export default router;