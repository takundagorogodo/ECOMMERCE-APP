import bcrypt from "bcrypt";
import User from "../models/UserModel.js";


export const createWorker = async (req, res) => {
  try {
    const adminId = req.user._id;

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

    // fixed: removed duplicate !password check
    if (!employeeId || !firstName || !lastName || !workerRole || !password) {
      return res.status(400).json({
        success: false,
        message: "employeeId, firstName, lastName, workerRole and password are required",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
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
      role:         "worker",
      workerRole,
      employeeId,
      firstName,
      lastName,
      email:        email    || undefined,
      phone:        phone    || undefined,
      password:     hashedPassword,
      gender:       gender   || undefined,
      address:      address  || undefined,
      salary:       salary   || undefined,
      isVerified:   true,       // admin-created → already trusted
      registeredBy: adminId,
    });

    // never send the password back in the response
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
    const userId = req.user._id;

    // email intentionally excluded — workers cannot change their own email
    // without verification (security risk — use a dedicated change-email flow)
    const {
      firstName,
      lastName,
      phone,
      gender,
      address,
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
        message: "Worker not found",
      });
    }

    // only update fields that were actually sent — never overwrite with undefined
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName  !== undefined) user.lastName  = lastName;
    if (phone     !== undefined) user.phone     = phone;
    if (gender    !== undefined) user.gender    = gender;
    if (address   !== undefined) user.address   = address;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Worker details updated successfully",
      user,
    });
  } catch (error) {
    console.error("updateWorkerByWorker error:", error);
    res.status(500).json({
      success: false,
      message: "Worker details failed to update",
    });
  }
};


export const deleteWorkerByAdmin = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    const employee = await User.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.isDeleted = true;
    employee.isActive  = false;
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
    });
  } catch (error) {
    console.error("deleteWorkerByAdmin error:", error);
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

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required to identify the target worker",
      });
    }

    if (!Object.keys(req.body).filter((k) => k !== "employeeId").length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const worker = await User.findOne({ employeeId });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Employee with that ID not found",
      });
    }

    // only update fields that were actually sent
    if (isActive    !== undefined) worker.isActive    = isActive;
    if (isDeleted   !== undefined) worker.isDeleted   = isDeleted;
    if (workerRole  !== undefined) worker.workerRole  = workerRole;
    if (salary      !== undefined) worker.salary      = salary;

    await worker.save();

    res.status(200).json({
      success: true,
      message: "Worker details updated successfully",
      user: worker,
    });
  } catch (error) {
    console.error("updateWorkerByAdmin error:", error);
    res.status(500).json({
      success: false,
      message: "Worker details failed to update",
    });
  }
};
