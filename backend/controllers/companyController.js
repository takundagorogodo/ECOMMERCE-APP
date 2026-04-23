import Company from "../models/CompanyModel.js";
import User from "../models/UserModel.js";
import Notification from "../models/NotificationModel.js";

export const createCompany = async (req, res) => {
  try {
    const adminId = req.user._id;
    const {
      companyName,
      companyEmail,
      phone,
      since,
      address,
    } = req.body;

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    // check for duplicate company name — case insensitive
    const duplicateName = await Company.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
      isDeleted: false,
    });

    if (duplicateName) {
      return res.status(400).json({
        success: false,
        message: "A company with this name already exists",
      });
    }

    // check for duplicate email if provided
    if (companyEmail) {
      const duplicateEmail = await Company.findOne({
        companyEmail: companyEmail.toLowerCase(),
        isDeleted: false,
      });

      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: "A company with this email already exists",
        });
      }
    }

    const company = await Company.create({
      companyName,
      companyEmail:  companyEmail || undefined,
      phone:         phone        || undefined,
      since:         since        || undefined,
      address:       address      || undefined,
      registeredBy:  adminId,
      users:         [adminId], // admin is the first member of the company
    });

    // link this company back to the admin's user record — bidirectional sync
    await User.findByIdAndUpdate(adminId, { company: company._id });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    console.error("createCompany error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create company",
    });
  }
};


export const getCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findOne({
      _id: companyId,
      isDeleted: false,
    })
      .populate("users",        "firstName lastName email role phone")
      .populate("registeredBy", "firstName lastName email");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("getCompany error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company",
    });
  }
};


export const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // only allow safe fields — never expose users or registeredBy to updates
    const {
      companyName,
      companyEmail,
      phone,
      since,
      address,
      isActive,
    } = req.body;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const company = await Company.findOne({
      _id: companyId,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // check new name doesn't clash with another company
    if (companyName && companyName !== company.companyName) {
      const duplicate = await Company.findOne({
        companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
        isDeleted: false,
        _id: { $ne: companyId }, // exclude current company from the check
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "A company with this name already exists",
        });
      }
    }

    // check new email doesn't clash with another company
    if (companyEmail && companyEmail !== company.companyEmail) {
      const duplicate = await Company.findOne({
        companyEmail: companyEmail.toLowerCase(),
        isDeleted: false,
        _id: { $ne: companyId },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "A company with this email already exists",
        });
      }
    }

    // only update fields that were actually sent
    if (companyName  !== undefined) company.companyName  = companyName;
    if (companyEmail !== undefined) company.companyEmail = companyEmail;
    if (phone        !== undefined) company.phone        = phone;
    if (since        !== undefined) company.since        = since;
    if (address      !== undefined) company.address      = address;
    if (isActive     !== undefined) company.isActive     = isActive;

    await company.save();

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    console.error("updateCompany error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update company details",
    });
  }
};


export const addUserToCompany = async (req, res) => {
  try {
    const adminId       = req.user._id;
    const { companyId } = req.params;
    const { userId }    = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const [company, user] = await Promise.all([
      Company.findOne({ _id: companyId, isDeleted: false }),
      User.findOne({ _id: userId, isDeleted: false }),
    ]);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // check user isn't already in this company
    const alreadyAdded = company.users.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyAdded) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this company",
      });
    }

    // check user doesn't already belong to a different company
    if (user.company && user.company.toString() !== companyId.toString()) {
      return res.status(400).json({
        success: false,
        message: "User already belongs to another company",
      });
    }

    // add user to company.users and link company to user — both sides in sync
    company.users.push(userId);
    await company.save();

    await User.findByIdAndUpdate(userId, { company: companyId });

    // notify the user they were added
    await Notification.create({
      user:    userId,
      type:    "account_update",
      title:   "Added to company",
      message: `You have been added to ${company.companyName} by the admin.`,
      reference: { model: null, documentId: null },
    });

    await company.populate("users", "firstName lastName email role");

    res.status(200).json({
      success: true,
      message: `User added to ${company.companyName} successfully`,
      company,
    });
  } catch (error) {
    console.error("addUserToCompany error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add user to company",
    });
  }
};


export const removeUserFromCompany = async (req, res) => {
  try {
    const adminId       = req.user._id;
    const { companyId } = req.params;
    const { userId }    = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // admin cannot remove themselves
    if (userId.toString() === adminId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself from the company",
      });
    }

    const [company, user] = await Promise.all([
      Company.findOne({ _id: companyId, isDeleted: false }),
      User.findOne({ _id: userId, isDeleted: false }),
    ]);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userIndex = company.users.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (userIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this company",
      });
    }

    // remove from company and unlink from user — both sides in sync
    company.users.splice(userIndex, 1);
    await company.save();

    await User.findByIdAndUpdate(userId, { company: null });

    // notify the user they were removed
    await Notification.create({
      user:    userId,
      type:    "account_update",
      title:   "Removed from company",
      message: `You have been removed from ${company.companyName}.`,
      reference: { model: null, documentId: null },
    });

    await company.populate("users", "firstName lastName email role");

    res.status(200).json({
      success: true,
      message: `User removed from ${company.companyName} successfully`,
      company,
    });
  } catch (error) {
    console.error("removeUserFromCompany error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove user from company",
    });
  }
};


export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findOne({
      _id: companyId,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    company.isDeleted = true;
    company.isActive  = false;
    await company.save();

    // unlink all users from this company in one query
    await User.updateMany({ company: companyId }, { company: null });

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("deleteCompany error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete company",
    });
  }
};