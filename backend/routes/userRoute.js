import express from "express";
import { sendOtp, verifyOtp, completeRegistration } from "../controllers/otpController.js";
import { createWorker, deleteWorkerByAdmin, updateWorkerByAdmin, updateWorkerByWorker } from "../controllers/workerController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles }   from "../middlewares/roleMiddleware.js";
import { loginUser } from "../controllers/loginController.js";
import { changePassword, deleteCustomerAccount, deleteCustomerByAdmin, updateAdmin, updateCustomerDetails } from "../controllers/authControllers.js";

const router = express.Router();


router.post("/send-otp",    sendOtp);
router.post("/verify-otp",  verifyOtp);
router.post("/login", loginUser);

router.put("/change-password", authenticate ,changePassword);

router.post("/create-worker", authenticate, allowRoles("admin"), createWorker);
router.put("/updateAdmin", authenticate ,allowRoles("admin"),updateAdmin);
router.put("/update-workerbyadmin", authenticate ,allowRoles("admin"),updateWorkerByAdmin);
router.put("/delete-worker", authenticate ,allowRoles("admin"),deleteWorkerByAdmin);
router.put("/delete-customer", authenticate ,allowRoles("admin"),deleteCustomerByAdmin);

router.put("/update-worker", authenticate ,allowRoles("worker"),updateWorkerByWorker);


router.put("/update-customer",authenticate , allowRoles("customer"),updateCustomerDetails)
router.put("/delete-customer",authenticate, allowRoles("customer"),deleteCustomerAccount);
router.post("/complete-registration", authenticate,allowRoles("customer"), completeRegistration);

export default router;