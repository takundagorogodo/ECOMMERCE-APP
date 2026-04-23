import bcrypt from "bcrypt";
import User from "../models/UserModel.js";

export const updateCustomerDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      firstName,
      lastName,
      email,
      phone,
      adress,
      gender,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        phone,
        adress,
        gender,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user,
    });
  } catch (error) {
    console.error("Failed to update user details", error);
    res.status(500).json({
      success: false,
      message: "User details update failed",
    });
  }
};

export const deleteCustomerAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not logged in",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        isActive: false,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });

  } catch (error) {
    console.error("Soft delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate account",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { password, confirmPasword } = req.body;

    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Login to change password",
      });
    }

    if (!password || !confirmPasword) {
      return res.status(400).json({
        success: false,
        message: "Both fields are required",
      });
    }

    if (password !== confirmPasword) {
      return res.status(400).json({
        success: false,
        message: "Both passwords must be the same",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.HASH_KEY) || 10
    );

    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Failed to change password", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      firstName,
      lastName,
      phone,
      email,
      adress,
      gender,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Login to update details",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        phone,
        adress,
        gender,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Admin details updated successfully",
      user,
    });
  } catch (error) {
    console.error("Failed to update admin details", error);
    res.status(500).json({
      success: false,
      message: "Failed to update admin user",
    });
  }
};

export const deleteCustomerByAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { customerEmail} = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not logged in",
      });
    }

    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: "employeeId required",
      });
    }

    const customer = await User.findOne({customerEmail});

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 🔥 SOFT DELETE INSTEAD OF HARD DELETE
    customer.isDeleted = true;
    customer.isActive = false;

    await customer.save();

    res.status(200).json({
      success: true,
      message: "customer deactivated successfully",
    });

  } catch (error) {
    console.error("Soft delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate customer",
    });
  }
};

