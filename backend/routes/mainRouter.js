import express from "express";
import companyRoute from "./companyRoute.js";
import userRoute from "./userRoute.js";
import orderRoute from "./orderRoute.js";
import cartRoute from "./cartRoute.js;"

const router = express.Router();

router.use("/cart",cartRoute)
router.use("/company",companyRoute);
router.use("/user",userRoute);
router.use("/order",orderRoute);

export default router;

