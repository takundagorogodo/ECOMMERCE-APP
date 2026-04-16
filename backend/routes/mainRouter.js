import express from "express";
import companyRoute from "./companyRoute.js";
import userRoute from "./userRoute.js";
import orderRoute from "./orderRoute.js";
import cartRoutes from "./cartRoutes.js"
import reviewRoute from "./reviewRoute.js"

const router = express.Router();

router.use("/cart",cartRoutes)
router.use("/company",companyRoute);
router.use("/user",userRoute);
router.use("/order",orderRoute);
router.use("/review",reviewRoute);

export default router;

