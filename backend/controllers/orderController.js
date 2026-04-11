import Order from "../models/OrderModel.js";

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, deliveryStatus } = req.body;

    if (!orderId || !deliveryStatus) {
      return res.status(400).json({
        success: false,
        message: "orderId and deliveryStatus required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { deliveryStatus },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
    });
  }
};