import express from "express";
import { sendOtp, verifyOtp, completeRegistration } from "../controllers/otpController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles }   from "../middlewares/roleMiddleware.js";
import { loginUser } from "../controllers/loginController.js";
import { changePassword, deleteCustomerAccount, deleteCustomerByAdmin, updateAdmin, updateCustomerDetails } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/send-otp",    sendOtp);
router.post("/verify-otp",  verifyOtp);
router.post("/login", loginUser);

router.patch("/change-password", authenticate ,changePassword);

router.patch("/admin/update", authenticate ,allowRoles("admin"),updateAdmin);
router.patch("/admin/delete-customer", authenticate ,allowRoles("admin"),deleteCustomerByAdmin);

router.patch("/customer/update",authenticate,allowRoles("customer"),updateCustomerDetails);
router.delete("/customer/delete",authenticate, allowRoles("customer"),deleteCustomerAccount);
router.post("/customer/complete-registration", authenticate,allowRoles("customer"), completeRegistration);

export default router;