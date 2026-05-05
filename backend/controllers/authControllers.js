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
      address, // fixed spelling
      gender,
    } = req.body;

    // prevent empty update from clearing existing fields
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // only update fields that were actually sent — never overwrite with undefined
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName  !== undefined) user.lastName  = lastName;
    if (email     !== undefined) user.email     = email;
    if (phone     !== undefined) user.phone     = phone;
    if (address   !== undefined) user.address   = address;
    if (gender    !== undefined) user.gender    = gender;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user,
    });
  } catch (error) {
    console.error("updateCustomerDetails error:", error);
    res.status(500).json({
      success: false,
      message: "User details update failed",
    });
  }
};


export const deleteCustomerAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true, isActive: false },
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
    console.error("deleteCustomerAccount error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate account",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password, confirmPasword } = req.body;

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
    console.error("changePassword error:", error);
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
      address, // fixed spelling
      gender,
    } = req.body;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // only update fields that were actually sent
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName  !== undefined) user.lastName  = lastName;
    if (email     !== undefined) user.email     = email;
    if (phone     !== undefined) user.phone     = phone;
    if (address   !== undefined) user.address   = address;
    if (gender    !== undefined) user.gender    = gender;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Admin details updated successfully",
      user,
    });
  } catch (error) {
    console.error("updateAdmin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update admin user",
    });
  }
};


export const deleteCustomerByAdmin = async (req, res) => {
  try {
    const { customerEmail } = req.body;

    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Customer email is required",
      });
    }

    // fixed: query by email field, not a non-existent customerEmail field
    const customer = await User.findOne({ email: customerEmail });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // prevent admin from accidentally deactivating another admin
    if (customer.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate an admin account this way",
      });
    }

    customer.isDeleted = true;
    customer.isActive  = false;
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer deactivated successfully",
    });
  } catch (error) {
    console.error("deleteCustomerByAdmin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate customer",
    });
  }
};
