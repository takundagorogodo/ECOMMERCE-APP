import Order from "../models/OrderModel.js";
import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";
import Inventory from "../models/InventoryModel.js";
import Notification from "../models/NotificationModel.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required",
      });
    }

    const cart = await Cart.findOne({
      user: userId,
      isCheckedOut: false,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive || product.isDeleted) {
        return res.status(400).json({
          success: false,
          message: `"${product?.name || "A product"}" is no longer available. Please update your cart.`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) of "${product.name}" are available but you ordered ${item.quantity}`,
        });
      }
    }


    const orderItems = cart.items.map((item) => ({
      product:          item.product._id,
      quantity:         item.quantity,
      priceAtOrderTime: item.priceAtAddedTime,
    }));

    const order = await Order.create({
      user:            userId,
      items:           orderItems,
      totalPrice:      cart.totalPrice,
      shippingAddress,
      paymentMethod,
      status:          "pending",
    });

    for (const item of cart.items) {
      const inventory = await Inventory.findOne({ product: item.product._id });

      if (inventory) {
        inventory.currentStock -= item.quantity;
        inventory.updatedBy = userId;
        inventory.movements.push({
          type:        "sale",
          quantity:    -item.quantity,
          note:        `Order ${order._id}`,
          performedBy: userId,
        });
        await inventory.save();
       
      }
    }

    cart.isCheckedOut = true;
    await cart.save();

    await Notification.create({
      user:    userId,
      type:    "order_placed",
      title:   "Order placed successfully",
      message: `Your order #${order._id} has been placed and is being processed.`,
      reference: {
        model:      "Order",
        documentId: order._id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
    });
  }
};

export const getOrder = async (req, res) => {
  try {
    const userId   = req.user._id;
    const userRole = req.user.role;
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user",          "firstName lastName email phone")
      .populate("items.product", "name category images price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isOwner = order.user._id.toString() === userId.toString();
    const isStaff = ["admin", "worker"].includes(userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("getOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = { user: userId };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("items.product", "name images price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (error) {
    console.error("getUserOrders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your orders",
    });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 20,
      status,           // ?status=pending
      sortBy = "createdAt",
      order  = "desc",
    } = req.query;

    const skip      = (Number(page) - 1) * Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user",          "firstName lastName email phone")
        .populate("items.product", "name category price")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (error) {
    console.error("getAllOrders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

const STATUS_TRANSITIONS = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["shipped",   "cancelled"],
  shipped:    ["delivered", "cancelled"],
  delivered:  [],
  cancelled:  [],  // terminal state — no further changes allowed
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "orderId and status are required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

  
    const allowedNext = STATUS_TRANSITIONS[order.status];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition order from "${order.status}" to "${status}". Allowed: ${allowedNext.length ? allowedNext.join(", ") : "none — this order is in a terminal state"}`,
      });
    }

    order.status = status;

    if (status === "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    const notificationTypeMap = {
      confirmed: "order_confirmed",
      shipped:   "order_shipped",
      delivered: "order_delivered",
      cancelled: "order_cancelled",
    };

    const notificationMessageMap = {
      confirmed: `Your order #${order._id} has been confirmed and is being prepared.`,
      shipped:   `Your order #${order._id} is on its way! You will receive it soon.`,
      delivered: `Your order #${order._id} has been delivered. Enjoy your purchase!`,
      cancelled: `Your order #${order._id} has been cancelled.`,
    };

    if (notificationTypeMap[status]) {
      await Notification.create({
        user:    order.user,
        type:    notificationTypeMap[status],
        title:   `Order ${status}`,
        message: notificationMessageMap[status],
        reference: {
          model:      "Order",
          documentId: order._id,
        },
      });
    }

    await order.populate("items.product", "name images price");

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
      order,
    });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId   = req.user._id;
    const userRole = req.user.role;
    const { orderId } = req.params;
    const { reason }  = req.body;

    const order = await Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isOwner = order.user.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this order",
      });
    }

    const cancellableByCustomer = ["pending"];
    const cancellableByAdmin    = ["pending", "confirmed"];

    const cancellable = isAdmin ? cancellableByAdmin : cancellableByCustomer;

    if (!cancellable.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled at "${order.status}" stage`,
      });
    }

    order.status           = "cancelled";
    order.cancellationReason = reason || "No reason provided";
    order.cancelledAt      = new Date();
    await order.save();

    for (const item of order.items) {
      const inventory = await Inventory.findOne({ product: item.product._id });

      if (inventory) {
        inventory.currentStock += item.quantity;
        inventory.updatedBy = userId;
        inventory.movements.push({
          type:        "return",
          quantity:    +item.quantity,
          note:        `Order ${order._id} cancelled`,
          performedBy: userId,
        });
        await inventory.save();
    
      }
    }

    await Notification.create({
      user:    order.user,
      type:    "order_cancelled",
      title:   "Order cancelled",
      message: `Your order #${order._id} has been cancelled. ${reason ? `Reason: ${reason}` : ""}`,
      reference: {
        model:      "Order",
        documentId: order._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("cancelOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};