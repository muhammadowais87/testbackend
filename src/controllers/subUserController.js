import SubUser from "../models/SubUser.js";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeSubUser = (subUser) => ({
  id: subUser.subUserId,
  name: subUser.name,
  email: subUser.email,
  phone: subUser.phone || "",
  subject: subUser.subject,
  assignedSubjects: Array.isArray(subUser.assignedSubjects) && subUser.assignedSubjects.length
    ? subUser.assignedSubjects
    : [subUser.subject],
  isActive: subUser.isActive,
  createdAt: subUser.createdAt,
  updatedAt: subUser.updatedAt,
});

const getNextSubUserId = async () => {
  const lastSubUser = await SubUser.findOne().sort({ subUserId: -1 }).select("subUserId");
  return (lastSubUser?.subUserId || 0) + 1;
};

export const getInstituteSubUsers = async (req, res) => {
  try {
    const subUsers = await SubUser.find({ institute: req.institute.id }).sort({ subUserId: -1, createdAt: -1 });
    return res.status(200).json({ subUsers: subUsers.map(normalizeSubUser) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch sub users", error: error.message });
  }
};

export const createInstituteSubUser = async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const email = clean(req.body?.email).toLowerCase();
    const phone = clean(req.body?.phone);
    const subject = clean(req.body?.subject);
    const password = clean(req.body?.password);
    const assignedSubjects = Array.isArray(req.body?.assignedSubjects)
      ? req.body.assignedSubjects.map((item) => clean(item)).filter(Boolean)
      : [];

    if (!name || !email || !subject || !password) {
      return res.status(400).json({ message: "Name, email, subject and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await SubUser.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const subUserId = await getNextSubUserId();
    const subUser = await SubUser.create({
      subUserId,
      institute: req.institute.id,
      name,
      email,
      phone,
      subject,
      assignedSubjects: assignedSubjects.length ? assignedSubjects : [subject],
      password,
      isActive: req.body?.isActive ?? true,
    });

    return res.status(201).json({ subUser: normalizeSubUser(subUser) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create sub user", error: error.message });
  }
};

export const updateInstituteSubUser = async (req, res) => {
  try {
    const subUserId = Number(req.params.id);
    const subUser = await SubUser.findOne({ institute: req.institute.id, subUserId });

    if (!subUser) {
      return res.status(404).json({ message: "Sub user not found" });
    }

    const name = clean(req.body?.name);
    const email = clean(req.body?.email).toLowerCase();
    const phone = clean(req.body?.phone);
    const subject = clean(req.body?.subject);
    const password = clean(req.body?.password);

    if (name) subUser.name = name;
    if (phone || Object.prototype.hasOwnProperty.call(req.body || {}, "phone")) subUser.phone = phone;
    if (subject) subUser.subject = subject;

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "assignedSubjects")) {
      const assignedSubjects = Array.isArray(req.body.assignedSubjects)
        ? req.body.assignedSubjects.map((item) => clean(item)).filter(Boolean)
        : [];
      subUser.assignedSubjects = assignedSubjects.length ? assignedSubjects : [subUser.subject];
      if (!subUser.assignedSubjects.includes(subUser.subject)) {
        subUser.subject = subUser.assignedSubjects[0];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "email")) {
      if (!email) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      const existing = await SubUser.findOne({ email, subUserId: { $ne: subUserId } });
      if (existing) {
        return res.status(409).json({ message: "Email already exists" });
      }
      subUser.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "isActive")) {
      subUser.isActive = Boolean(req.body.isActive);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      subUser.password = password;
    }

    await subUser.save();
    return res.status(200).json({ subUser: normalizeSubUser(subUser) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update sub user", error: error.message });
  }
};

export const deleteInstituteSubUser = async (req, res) => {
  try {
    const subUserId = Number(req.params.id);
    const subUser = await SubUser.findOneAndDelete({ institute: req.institute.id, subUserId });

    if (!subUser) {
      return res.status(404).json({ message: "Sub user not found" });
    }

    return res.status(200).json({ message: "Sub user deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete sub user", error: error.message });
  }
};

export const toggleInstituteSubUserActive = async (req, res) => {
  try {
    const subUserId = Number(req.params.id);
    const isActive = Boolean(req.body?.isActive);

    const subUser = await SubUser.findOneAndUpdate(
      { institute: req.institute.id, subUserId },
      { isActive },
      { new: true }
    );

    if (!subUser) {
      return res.status(404).json({ message: "Sub user not found" });
    }

    return res.status(200).json({ subUser: normalizeSubUser(subUser) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update account status", error: error.message });
  }
};

export const assignInstituteSubUserSubjects = async (req, res) => {
  try {
    const subUserId = Number(req.params.id);
    const subjects = Array.isArray(req.body?.subjects)
      ? req.body.subjects.map((item) => clean(item)).filter(Boolean)
      : [];

    const subUser = await SubUser.findOne({ institute: req.institute.id, subUserId });
    if (!subUser) {
      return res.status(404).json({ message: "Sub user not found" });
    }

    const assignedSubjects = subjects.length ? subjects : [subUser.subject];
    subUser.assignedSubjects = assignedSubjects;
    subUser.subject = assignedSubjects[0];
    await subUser.save();

    return res.status(200).json({ subUser: normalizeSubUser(subUser) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign subjects", error: error.message });
  }
};
