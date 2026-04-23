import Notification from "../models/NotificationModel.js";

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page   = 1,
      limit  = 20,
      isRead,       // ?isRead=false → only unread
      type,         // ?type=order_placed
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);


    const filter = {
      user:      userId,
      isDeleted: false,
    };

    // isRead comes in as a string from query params
    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    if (type) {
      filter.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      // always return total unread count regardless of current filter
      Notification.countDocuments({ user: userId, isRead: false, isDeleted: false }),
    ]);

    res.status(200).json({
      success: true,
      total,
      unreadCount,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      notifications,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const userId             = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id:       notificationId,
      user:      userId,       // user can only mark their own notifications
      isDeleted: false,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.isRead) {
      return res.status(200).json({
        success: true,
        message: "Notification already marked as read",
        notification,
      });
    }

    notification.isRead = true;
    await notification.save();
    // pre-save hook on NotificationModel auto-sets readAt timestamp

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("markAsRead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};


export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      {
        user:      userId,
        isRead:    false,
        isDeleted: false,
      },
      {
        isRead: true,
        readAt: new Date(), // set timestamp in bulk since pre-save hook doesn't run on updateMany
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
    });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};


export const deleteNotification = async (req, res) => {
  try {
    const userId             = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id:       notificationId,
      user:      userId, // user can only delete their own notifications
      isDeleted: false,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isDeleted = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("deleteNotification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};


export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { user: userId, isDeleted: false },
      { isDeleted: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) deleted`,
    });
  } catch (error) {
    console.error("deleteAllNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notifications",
    });
  }
};


export const getAllNotifications = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 20,
      type,
      isRead,
      sortBy = "createdAt",
      order  = "desc",
    } = req.query;

    const skip      = (Number(page) - 1) * Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const filter = { isDeleted: false };

    if (type)            filter.type   = type;
    if (isRead !== undefined) filter.isRead = isRead === "true";

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("user", "firstName lastName email role")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      notifications,
    });
  } catch (error) {
    console.error("getAllNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all notifications",
    });
  }
};