import express from "express";
import companyRoute from "./companyRoute.js";
import userRoute from "./userRoute.js";
import orderRoute from "./orderRoute.js";
import cartRoutes from "./cartRoutes.js";
import reviewRoute from "./reviewRoute.js";
import workerRoute from "./workerRoute.js";
import inventoryRoute from "./inventoryRoute.js";
import notificationRoute from "./notificationRoute.js";
import paymentRoute from "./paymentRoute.js";
import productRoute from "./productRoute.js";

const router = express.Router();

router.use("/cart",cartRoutes)
router.use("/company",companyRoute);
router.use("/inventory",inventoryRoute);
router.use("/notification",notificationRoute);
router.use("/order",orderRoute);
router.use("/payment",paymentRoute);
router.use("/product",productRoute);
router.use("/review",reviewRoute);
router.use("/users",userRoute);
router.use("/worker",workerRoute);


export default router;

