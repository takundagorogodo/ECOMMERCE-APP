import express from "express";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { addUserToCompany, createCompany, deleteCompany, getCompany, removeUserFromCompany, updateCompany } from "../controllers/companyController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.delete("/delete:/companyId", authenticate, allowRoles("admin"),deleteCompany);
router.patch("/:companyId/remove-use",authenticate,allowRoles("admin"),removeUserFromCompany);
router.patch("/update/:companyId",authenticate,allowRoles("admin"),updateCompany);
router.get("/:companyId",authenticate,allowRoles("admin"),getCompany);
router.post("/create",authenticate,allowRoles("admin"),createCompany);
router.patch("/company/:companyId/add-user",authenticate,allowRoles("admin"),addUserToCompany);

export default router;