import Payment from "../models/PaymentModel.js";
import Order from "../models/OrderModel.js";
import Notification from "../models/NotificationModel.js";


const VALID_METHODS = ["card", "paypal", "bank_transfer", "cash", "wallet", "upi"];


export const initiatePayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId, method, currency = "USD" } = req.body;

    if (!orderId || !method) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment method are required",
      });
    }

    if (!VALID_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        message: `Payment method must be one of: ${VALID_METHODS.join(", ")}`,
      });
    }

    // verify the order exists and belongs to this customer
    const order = await Order.findOne({
      _id:    orderId,
      user:   userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // only confirmed orders can be paid — not pending or cancelled
    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot initiate payment for a cancelled order",
      });
    }

    // prevent duplicate payment records for the same order
    const existingPayment = await Payment.findOne({ order: orderId });

    if (existingPayment) {
      // if previous attempt failed let them try again
      // but if already succeeded block it
      if (existingPayment.status === "success") {
        return res.status(400).json({
          success: false,
          message: "This order has already been paid",
        });
      }

      // reset failed/cancelled payment for a fresh attempt
      existingPayment.status   = "pending";
      existingPayment.method   = method;
      existingPayment.currency = currency.toUpperCase();
      existingPayment.gateway  = {}; // clear previous gateway data
      await existingPayment.save();

      return res.status(200).json({
        success: true,
        message:  "Payment re-initiated. Please complete your payment.",
        payment:  existingPayment,
        // in a real integration you would return the gateway
        // session/client_secret here for the frontend to complete payment
        // e.g: clientSecret: stripeSession.client_secret
      });
    }

    const payment = await Payment.create({
      user:     userId,
      order:    orderId,
      amount:   order.totalPrice,
      currency: currency.toUpperCase(),
      method,
      status:   "pending",
    });

    res.status(201).json({
      success: true,
      message: "Payment initiated successfully. Please complete your payment.",
      payment,
     
    });
  } catch (error) {
    console.error("initiatePayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
    });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const {
      transactionId, 
      orderId,
      gatewayName,
      status,       
      gatewayResponse,
    } = req.body;

    if (!transactionId || !orderId || !status || !gatewayName) {
      return res.status(400).json({
        success: false,
        message: "transactionId, orderId, gatewayName and status are required",
      });
    }

    const validStatuses = ["success", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const payment = await Payment.findOne({ order: orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this order",
      });
    }

    if (payment.status === "success") {
      return res.status(400).json({
        success: false,
        message: "Payment already verified and confirmed",
      });
    }

    payment.status  = status;
    payment.gateway = {
      name:            gatewayName,
      transactionId,
      gatewayResponse: gatewayResponse || {},
    };

    await payment.save();
    // pre-save hook auto-sets paidAt when status === "success"

    if (status === "success") {
  
      await Order.findByIdAndUpdate(orderId, { status: "confirmed" });

      await Notification.create({
        user:    payment.user,
        type:    "payment_success",
        title:   "Payment successful",
        message: `Your payment of ${payment.currency} ${(payment.amount / 100).toFixed(2)} for order #${orderId} was successful.`,
        reference: {
          model:      "Payment",
          documentId: payment._id,
        },
      });
    } else {

      await Notification.create({
        user:    payment.user,
        type:    "payment_failed",
        title:   "Payment failed",
        message: `Your payment for order #${orderId} failed. Please try again or use a different payment method.`,
        reference: {
          model:      "Payment",
          documentId: payment._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment ${status === "success" ? "verified successfully" : "marked as failed"}`,
      payment,
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

export const getPayment = async (req, res) => {
  try {
    const userId   = req.user._id;
    const userRole = req.user.role;
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("user",  "firstName lastName email")
      .populate("order", "status totalPrice items shippingAddress");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const isOwner = payment.user._id.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment",
      });
    }

    if (!isAdmin) {
      payment.gateway.gatewayResponse = undefined;
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("getPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
    });
  }
};


export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = { user: userId };
    if (status) filter.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("order", "status totalPrice createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-gateway.gatewayResponse"), 
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      payments,
    });
  } catch (error) {
    console.error("getUserPayments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your payments",
    });
  }
};


export const getAllPayments = async (req, res) => {
  try {
    const {
      page    = 1,
      limit   = 20,
      status,          
      method,          
      sortBy  = "createdAt",
      order   = "desc",
    } = req.query;

    const skip      = (Number(page) - 1) * Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("user",  "firstName lastName email")
        .populate("order", "status totalPrice")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    const revenueData = await Payment.aggregate([
      { $match: { ...filter, status: "success" } },
      {
        $group: {
          _id:          null,
          totalRevenue: { $sum: "$amount" },
          totalOrders:  { $sum: 1 },
        },
      },
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, totalOrders: 0 };

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      totalRevenue: revenue.totalRevenue,
      successfulPayments: revenue.totalOrders,
      payments,
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};


export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { refundAmount, reason } = req.body;

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid refund amount is required",
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "success") {
      return res.status(400).json({
        success: false,
        message: `Cannot refund a payment with status "${payment.status}". Only successful payments can be refunded`,
      });
    }

    if (payment.refund.amount !== null) {
      return res.status(400).json({
        success: false,
        message: "This payment has already been refunded",
      });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: `Refund amount (${refundAmount}) cannot exceed the original payment amount (${payment.amount})`,
      });
    }

    payment.status       = "refunded";
    payment.refund       = {
      amount:     refundAmount,
      reason:     reason || "No reason provided",
      refundedAt: null,
    };

    await payment.save();

    if (refundAmount === payment.amount) {
      await Order.findByIdAndUpdate(payment.order, {
        status:             "cancelled",
        cancellationReason: reason || "Full refund issued",
        cancelledAt:        new Date(),
      });
    }

    await Notification.create({
      user:    payment.user,
      type:    "payment_success", 
      title:   "Refund initiated",
      message: `A refund of ${payment.currency} ${(refundAmount / 100).toFixed(2)} for order #${payment.order} has been initiated. It may take 3-7 business days to reflect.`,
      reference: {
        model:      "Payment",
        documentId: payment._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      payment,
    });
  } catch (error) {
    console.error("refundPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
    });
  }
};