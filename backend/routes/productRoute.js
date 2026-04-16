import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { allowRoles } from "../middlewares/roleMiddleware";

const router = express.Router();

router.post("/create",authenticate,allowRoles("admin"),)
router.get("/:productId",);
router.get("/",);
router.patch("/update/:productId",authenticate,allowRoles("admin"),)
router.put("/delete/:productId",authenticate,allowRoles("admin"),);
router.get("/category/:category",);
router.get("/search?q=keyword",);
export default router;