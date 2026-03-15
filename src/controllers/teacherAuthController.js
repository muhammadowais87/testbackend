import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";
import SubUser from "../models/SubUser.js";

const createToken = (account) => {
  return jwt.sign(
    {
      id: account.id,
      email: account.email,
      role: account.role,
      ...(account.instituteId ? { instituteId: account.instituteId } : {}),
      ...(account.instituteName ? { instituteName: account.instituteName } : {}),
    },
    process.env.JWT_SECRET || "dev_jwt_secret",
    { expiresIn: "7d" }
  );
};

export const teacherLogin = async (req, res) => {
  try {
    const emailRaw = req.body?.email ?? "";
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const teacher = await Teacher.findOne({ email });

    if (teacher && teacher.isActive) {
      const isPasswordValid = await teacher.comparePassword(password);

      if (isPasswordValid) {
        const token = createToken({
          id: teacher._id,
          email: teacher.email,
          role: "teacher",
        });

        return res.status(200).json({
          message: "Login successful",
          accountType: "teacher",
          token,
          teacher: {
            id: teacher._id,
            name: teacher.name,
            email: teacher.email,
          },
        });
      }
    }

    const subUser = await SubUser.findOne({ email }).populate("institute", "name");
    if (!subUser || !subUser.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isSubUserPasswordValid = await subUser.comparePassword(password);
    if (!isSubUserPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const instituteName = subUser.institute?.name || "Institute";
    const token = createToken({
      id: subUser._id,
      email: subUser.email,
      role: "sub-user",
      instituteId: String(subUser.institute?._id || ""),
      instituteName,
    });

    return res.status(200).json({
      message: "Login successful",
      accountType: "sub-user",
      token,
      subUser: {
        id: subUser._id,
        name: subUser.name,
        email: subUser.email,
        schoolName: instituteName,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.status(200).json({
      teacher: {
        ...teacher.toObject(),
        portalSettings: teacher.portalSettings || {},
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

const clean = (value) => (typeof value === "string" ? value.trim() : "");

export const updateTeacherSettings = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const portalSettings = req.body?.portalSettings && typeof req.body.portalSettings === "object"
      ? req.body.portalSettings
      : {};

    teacher.portalSettings = {
      ...(teacher.portalSettings || {}),
      schoolName: clean(portalSettings.schoolName ?? teacher.portalSettings?.schoolName),
      schoolAddress: clean(portalSettings.schoolAddress ?? teacher.portalSettings?.schoolAddress),
      logoUrl: clean(portalSettings.logoUrl ?? teacher.portalSettings?.logoUrl),
      principalName: clean(portalSettings.principalName ?? teacher.portalSettings?.principalName),
      email: clean(portalSettings.email ?? teacher.portalSettings?.email),
      phone: clean(portalSettings.phone ?? teacher.portalSettings?.phone),
      monogramHeight: clean(portalSettings.monogramHeight ?? teacher.portalSettings?.monogramHeight),
      monogramWidth: clean(portalSettings.monogramWidth ?? teacher.portalSettings?.monogramWidth),
      schoolNameColor: clean(portalSettings.schoolNameColor ?? teacher.portalSettings?.schoolNameColor),
      footerColor: clean(portalSettings.footerColor ?? teacher.portalSettings?.footerColor),
      fontStyle: clean(portalSettings.fontStyle ?? teacher.portalSettings?.fontStyle),
      schoolNameSize: clean(portalSettings.schoolNameSize ?? teacher.portalSettings?.schoolNameSize),
      schoolNameStretch: clean(portalSettings.schoolNameStretch ?? teacher.portalSettings?.schoolNameStretch),
      footerSize: clean(portalSettings.footerSize ?? teacher.portalSettings?.footerSize),
      footerStretch: clean(portalSettings.footerStretch ?? teacher.portalSettings?.footerStretch),
      watermarkMode: clean(portalSettings.watermarkMode ?? teacher.portalSettings?.watermarkMode),
      watermarkHeight: clean(portalSettings.watermarkHeight ?? teacher.portalSettings?.watermarkHeight),
      watermarkWidth: clean(portalSettings.watermarkWidth ?? teacher.portalSettings?.watermarkWidth),
      watermarkOpacity: clean(portalSettings.watermarkOpacity ?? teacher.portalSettings?.watermarkOpacity),
      watermarkText: clean(portalSettings.watermarkText ?? teacher.portalSettings?.watermarkText),
    };

    await teacher.save();

    return res.status(200).json({
      message: "Settings updated successfully",
      teacher: {
        ...teacher.toObject(),
        portalSettings: teacher.portalSettings || {},
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
};

export const changeTeacherPassword = async (req, res) => {
  try {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const teacher = await Teacher.findById(req.teacher.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const isCurrentValid = await teacher.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const isSamePassword = await teacher.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    teacher.password = newPassword;
    await teacher.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update password", error: error.message });
  }
};

export const getSubUserProfile = async (req, res) => {
  try {
    const subUser = await SubUser.findById(req.subUser.id).select("-password").populate("institute", "name");

    if (!subUser) {
      return res.status(404).json({ message: "Sub user not found" });
    }

    return res.status(200).json({
      subUser: {
        subUserId: subUser.subUserId,
        name: subUser.name,
        email: subUser.email,
        phone: subUser.phone,
        subject: subUser.subject,
        assignedSubjects: subUser.assignedSubjects || [],
        schoolName: subUser.institute?.name || req.subUser.instituteName || "Institute",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch sub user profile", error: error.message });
  }
};

export const changeSubUserPassword = async (req, res) => {
  try {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const subUser = await SubUser.findById(req.subUser.id);
    if (!subUser) {
      return res.status(404).json({ message: "Sub user not found" });
    }

    const isCurrentValid = await subUser.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const isSamePassword = await subUser.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    subUser.password = newPassword;
    await subUser.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update password", error: error.message });
  }
};
