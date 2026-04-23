import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { createWorker, deleteWorkerByAdmin, updateWorkerByAdmin, updateWorkerByWorker } from "../controllers/workerController.js";
import { updateAdmin } from "../controllers/authControllers.js";

const router =express.Router();

router.post("/create",authenticate,allowRoles("admin"),createWorker);
router.patch("/update",authenticate,allowRoles("worker"),updateWorkerByWorker);
router.put("/delete",authenticate,allowRoles("admin"),deleteWorkerByAdmin);
router.patch("/admin/update",authenticate,allowRoles("admin"),updateWorkerByAdmin);


export default router;