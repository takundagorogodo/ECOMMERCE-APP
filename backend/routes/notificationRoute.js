import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { allowRoles } from "../middlewares/roleMiddleware";
import { deleteAllNotifications, deleteNotification, getAllNotifications, markAllAsRead, markAsRead } from "../controllers/notificationControllers";

const router = express.Router();

router.get("/all",authenticate,allowRoles("admin"),getAllNotifications);
router.delete("/delete",authenticate,deleteAllNotifications);
router.delete("/delete/:notificationId",authenticate,deleteNotification);
router.patch("/read-all",authenticate,markAllAsRead);
router.patch("/read/:notificationId",authenticate,markAsRead);
router.get("/read/:notificationId",authenticate,markAsRead);

export default router;