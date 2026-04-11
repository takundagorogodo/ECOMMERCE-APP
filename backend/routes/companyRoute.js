import express from "express";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { createCompany, editCompanyDetails } from "../controllers/companyController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ FIXED
router.post("/", authenticate, allowRoles("admin"), createCompany);

// ❌ ALSO FIX THIS ROUTE
router.put("/:id", authenticate, allowRoles("admin"), editCompanyDetails);

export default router;