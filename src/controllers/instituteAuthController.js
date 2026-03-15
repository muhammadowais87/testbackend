import jwt from "jsonwebtoken";
import School from "../models/School.js";
import SubUser from "../models/SubUser.js";

const createToken = (school) => {
  return jwt.sign(
    {
      id: school._id,
      schoolId: school.schoolId,
      email: school.email,
      role: "institute",
    },
    process.env.JWT_SECRET || "dev_jwt_secret",
    { expiresIn: "7d" }
  );
};

export const instituteLogin = async (req, res) => {
  try {
    const emailRaw = req.body?.email ?? "";
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const school = await School.findOne({ email });

    if (!school || !school.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await school.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(school);

    return res.status(200).json({
      message: "Login successful",
      token,
      institute: {
        id: school.schoolId,
        name: school.name,
        principalName: school.principalName || "",
        email: school.email,
        city: school.city,
        address: school.address || "",
        phonePrimary: school.phonePrimary || "",
        phoneSecondary: school.phoneSecondary || "",
        plan: school.plan,
        status: school.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getInstituteProfile = async (req, res) => {
  try {
    const school = await School.findById(req.institute.id).select("-password");

    if (!school) {
      return res.status(404).json({ message: "Institute not found" });
    }

    const teacherCount = await SubUser.countDocuments({ institute: school._id });

    return res.status(200).json({
      institute: {
        schoolId: school.schoolId,
        name: school.name,
        principalName: school.principalName || "",
        city: school.city,
        address: school.address || "",
        phonePrimary: school.phonePrimary || "",
        phoneSecondary: school.phoneSecondary || "",
        email: school.email,
        plan: school.plan,
        amount: school.amount,
        status: school.status,
        subscriptionDate: school.subscriptionDate,
        lastPaymentDate: school.lastPaymentDate,
        teachers: teacherCount,
        monthlyPayments: school.monthlyPayments || [],
        portalSettings: school.portalSettings || {},
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

const clean = (value) => (typeof value === "string" ? value.trim() : "");

export const updateInstituteSettings = async (req, res) => {
  try {
    const school = await School.findById(req.institute.id);
    if (!school) {
      return res.status(404).json({ message: "Institute not found" });
    }

    const schoolName = clean(req.body?.schoolName);
    const schoolAddress = clean(req.body?.schoolAddress);
    const principalName = clean(req.body?.principalName);
    const email = clean(req.body?.email).toLowerCase();
    const phonePrimary = clean(req.body?.phonePrimary);
    const phoneSecondary = clean(req.body?.phoneSecondary);
    const portalSettings = req.body?.portalSettings && typeof req.body.portalSettings === "object"
      ? req.body.portalSettings
      : {};

    if (schoolName) {
      school.name = schoolName;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "principalName")) {
      school.principalName = principalName;
    }
    if (schoolAddress) {
      school.address = schoolAddress;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "phonePrimary")) {
      school.phonePrimary = phonePrimary;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "phoneSecondary")) {
      school.phoneSecondary = phoneSecondary;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "email")) {
      if (!email) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      const existingSchool = await School.findOne({ email, _id: { $ne: school._id } });
      if (existingSchool) {
        return res.status(409).json({ message: "Email is already in use" });
      }
      school.email = email;
    }

    school.portalSettings = {
      ...(school.portalSettings || {}),
      logoUrl: clean(portalSettings.logoUrl ?? school.portalSettings?.logoUrl),
      monogramHeight: clean(portalSettings.monogramHeight ?? school.portalSettings?.monogramHeight),
      monogramWidth: clean(portalSettings.monogramWidth ?? school.portalSettings?.monogramWidth),
      schoolNameColor: clean(portalSettings.schoolNameColor ?? school.portalSettings?.schoolNameColor),
      footerColor: clean(portalSettings.footerColor ?? school.portalSettings?.footerColor),
      fontStyle: clean(portalSettings.fontStyle ?? school.portalSettings?.fontStyle),
      schoolNameSize: clean(portalSettings.schoolNameSize ?? school.portalSettings?.schoolNameSize),
      schoolNameStretch: clean(portalSettings.schoolNameStretch ?? school.portalSettings?.schoolNameStretch),
      footerSize: clean(portalSettings.footerSize ?? school.portalSettings?.footerSize),
      footerStretch: clean(portalSettings.footerStretch ?? school.portalSettings?.footerStretch),
      watermarkMode: clean(portalSettings.watermarkMode ?? school.portalSettings?.watermarkMode),
      watermarkHeight: clean(portalSettings.watermarkHeight ?? school.portalSettings?.watermarkHeight),
      watermarkWidth: clean(portalSettings.watermarkWidth ?? school.portalSettings?.watermarkWidth),
      watermarkOpacity: clean(portalSettings.watermarkOpacity ?? school.portalSettings?.watermarkOpacity),
      watermarkText: clean(portalSettings.watermarkText ?? school.portalSettings?.watermarkText),
    };

    await school.save();

    const teacherCount = await SubUser.countDocuments({ institute: school._id });

    return res.status(200).json({
      message: "Settings updated successfully",
      institute: {
        schoolId: school.schoolId,
        name: school.name,
        principalName: school.principalName || "",
        city: school.city,
        address: school.address || "",
        phonePrimary: school.phonePrimary || "",
        phoneSecondary: school.phoneSecondary || "",
        email: school.email,
        plan: school.plan,
        amount: school.amount,
        status: school.status,
        subscriptionDate: school.subscriptionDate,
        lastPaymentDate: school.lastPaymentDate,
        teachers: teacherCount,
        monthlyPayments: school.monthlyPayments || [],
        portalSettings: school.portalSettings || {},
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
};

export const changeInstitutePassword = async (req, res) => {
  try {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const school = await School.findById(req.institute.id);
    if (!school) {
      return res.status(404).json({ message: "Institute not found" });
    }

    const isCurrentValid = await school.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const isSamePassword = await school.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    school.password = newPassword;
    await school.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update password", error: error.message });
  }
};
