import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { deleteAllNotifications, deleteNotification, getAllNotifications, getMyNotifications, markAllAsRead, markAsRead } from "../controllers/notificationControllers.js";

const router = express.Router();

router.get("/all",authenticate,allowRoles("admin"),getAllNotifications);
router.get("/my",authenticate,getMyNotifications);
router.delete("/delete",authenticate,deleteAllNotifications);
router.delete("/delete/:notificationId",authenticate,deleteNotification);
router.patch("/read-all",authenticate,markAllAsRead);
router.patch("/read/:notificationId",authenticate,markAsRead);

export default router;