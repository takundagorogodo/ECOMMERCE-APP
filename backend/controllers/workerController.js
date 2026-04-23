import bcrypt from "bcrypt";
import User from "../models/UserModel.js";

export const createWorker = async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      password,
      workerRole,
      gender,
      address,
      salary,
    } = req.body;

    const adminId = req.user._id;

    if (!employeeId || !firstName || !lastName || !workerRole || !password || !password) {
      return res.status(400).json({
        success: false,
        message: "employeeId, name, workerRole and password are required",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone required",
      });
    }

    const duplicate = await User.findOne({
      $or: [
        { employeeId },
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "employeeId, email or phone already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.HASH_KEY) || 10
    );

    const worker = await User.create({
      role: "worker",
      workerRole,
      employeeId,
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      password: hashedPassword,
      gender: gender || undefined,
      address: address || undefined,
      isVerified: true,
      registeredBy: adminId,
      salary,
    });

    const { password: _, ...workerData } = worker.toObject();

    res.status(201).json({
      success: true,
      message: "Worker created successfully",
      worker: workerData,
    });
  } catch (error) {
    console.error("createWorker error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create worker",
    });
  }
};

export const updateWorkerByWorker = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      address,
    } = req.body;

    const userId = req.user._id;

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
        gender,
        address,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Worker details updated successfully",
      user,
    });
  } catch (error) {
    console.error("Failed to update worker details", error);
    res.status(500).json({
      success: false,
      message: "Worker details failed to update",
    });
  }
};

export const deleteWorkerByAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { employeeId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not logged in",
      });
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId required",
      });
    }

    const employee = await User.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // 🔥 SOFT DELETE INSTEAD OF HARD DELETE
    employee.isDeleted = true;
    employee.isActive = false;

    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
    });

  } catch (error) {
    console.error("Soft delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate employee",
    });
  }
};

export const updateWorkerByAdmin = async (req, res) => {
  try {
    const {
      employeeId,
      isActive,
      isDeleted,
      workerRole,
      salary,
    } = req.body;

    const adminId = req.user._id;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Login to update details",
      });
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId required to identify the target worker",
      });
    }

    const worker = await User.findOne({ employeeId });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Employee with that ID not found",
      });
    }

    const user = await User.findByIdAndUpdate(
      worker._id,
      {
        isActive,
        isDeleted,
        workerRole,
        salary,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Worker details updated successfully",
      user,
    });
  } catch (error) {
    console.error("Failed to update worker details", error);
    res.status(500).json({
      success: false,
      message: "Worker details failed to update",
    });
  }
};