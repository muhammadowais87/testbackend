import School from "../models/School.js";
import SubUser from "../models/SubUser.js";

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const todayIso = () => new Date().toISOString().slice(0, 10);

const normalizeSchool = (school, teacherCount = 0) => ({
  id: school.schoolId,
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
  isActive: school.isActive,
  createdAt: school.createdAt,
  updatedAt: school.updatedAt,
});

const getNextSchoolId = async () => {
  const lastSchool = await School.findOne().sort({ schoolId: -1 }).select("schoolId");
  return (lastSchool?.schoolId || 0) + 1;
};

const ensureSchoolId = async (school, fallbackId) => {
  if (school.schoolId) {
    return school.schoolId;
  }

  const nextId = typeof fallbackId === "number" ? fallbackId : await getNextSchoolId();
  school.schoolId = nextId;
  await school.save();
  return nextId;
};

const buildFirstPayment = ({ subscriptionDate, plan, amount, status, lastPaymentDate }) => {
  const date = new Date(subscriptionDate);
  const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

  return {
    month,
    monthLabel,
    plan,
    amount,
    status,
    paymentDate: status === "Paid" ? lastPaymentDate : null,
  };
};

const getCurrentMonthInfo = () => {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthLabel = now.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return { month, monthLabel };
};

const upsertCurrentMonthPayment = (school) => {
  const { month, monthLabel } = getCurrentMonthInfo();
  const paymentDate = school.status === "Paid"
    ? (school.lastPaymentDate || todayIso())
    : null;

  const entry = {
    month,
    monthLabel,
    plan: school.plan,
    amount: school.amount,
    status: school.status,
    paymentDate,
  };

  if (!Array.isArray(school.monthlyPayments)) {
    school.monthlyPayments = [];
  }

  const index = school.monthlyPayments.findIndex((payment) => payment.month === month);
  if (index >= 0) {
    school.monthlyPayments[index] = {
      ...school.monthlyPayments[index],
      ...entry,
    };
  } else {
    school.monthlyPayments.push(entry);
  }
};

export const getSchools = async (_req, res) => {
  try {
    const schools = await School.find().sort({ schoolId: -1, createdAt: -1 });
    let nextId = await getNextSchoolId();

    for (const school of schools) {
      if (!school.schoolId) {
        await ensureSchoolId(school, nextId);
        nextId += 1;
      }
    }

    // aggregate sub-user counts per school in one query
    const counts = await SubUser.aggregate([
      { $group: { _id: "$institute", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const c of counts) {
      countMap[String(c._id)] = c.count;
    }

    return res.status(200).json({
      schools: schools.map((s) => normalizeSchool(s, countMap[String(s._id)] || 0)),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch schools", error: error.message });
  }
};

export const createSchool = async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const principalName = clean(req.body?.principalName);
    const city = clean(req.body?.city);
    const address = clean(req.body?.address);
    const phonePrimary = clean(req.body?.phonePrimary);
    const phoneSecondary = clean(req.body?.phoneSecondary);
    const email = clean(req.body?.email).toLowerCase();
    const password = clean(req.body?.password);
    const plan = clean(req.body?.plan) || "Basic";
    const amount = Number(req.body?.amount) || 5000;
    const status = clean(req.body?.status) || "Pending";
    const subscriptionDate = clean(req.body?.subscriptionDate) || todayIso();
    const lastPaymentDate = clean(req.body?.lastPaymentDate) || subscriptionDate;

    if (!name || !principalName || !city || !address || !phonePrimary || !email || !password) {
      return res.status(400).json({ message: "Name, principal name, city, address, primary phone, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingSchool = await School.findOne({ email });
    if (existingSchool) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const schoolId = await getNextSchoolId();

    const school = await School.create({
      schoolId,
      name,
      principalName,
      city,
      address,
      phonePrimary,
      phoneSecondary,
      email,
      password,
      plan,
      amount,
      status,
      subscriptionDate,
      lastPaymentDate,
      monthlyPayments: [buildFirstPayment({ subscriptionDate, plan, amount, status, lastPaymentDate })],
    });

    return res.status(201).json({
      message: "School created successfully",
      school: normalizeSchool(school),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create school", error: error.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    const school = await School.findOne({ schoolId });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const name = clean(req.body?.name);
    const principalName = clean(req.body?.principalName);
    const city = clean(req.body?.city);
    const address = clean(req.body?.address);
    const phonePrimary = clean(req.body?.phonePrimary);
    const phoneSecondary = clean(req.body?.phoneSecondary);
    const email = clean(req.body?.email).toLowerCase();
    const password = clean(req.body?.password);
    const plan = clean(req.body?.plan);
    const status = clean(req.body?.status);
    const subscriptionDate = clean(req.body?.subscriptionDate);
    const lastPaymentDate = clean(req.body?.lastPaymentDate);

    if (name) school.name = name;
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "principalName")) {
      if (!principalName) {
        return res.status(400).json({ message: "Principal name cannot be empty" });
      }
      school.principalName = principalName;
    }
    if (city) school.city = city;
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "address")) {
      if (!address) {
        return res.status(400).json({ message: "Address cannot be empty" });
      }
      school.address = address;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "phonePrimary")) {
      if (!phonePrimary) {
        return res.status(400).json({ message: "Primary phone cannot be empty" });
      }
      school.phonePrimary = phonePrimary;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "phoneSecondary")) {
      school.phoneSecondary = phoneSecondary;
    }

    if (plan) school.plan = plan;
    if (status) school.status = status;
    if (subscriptionDate) school.subscriptionDate = subscriptionDate;
    if (lastPaymentDate) school.lastPaymentDate = lastPaymentDate;

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "amount")) {
      const amount = Number(req.body.amount);
      if (!Number.isNaN(amount) && amount > 0) {
        school.amount = amount;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "email")) {
      if (!email) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }

      const existingSchool = await School.findOne({ email, schoolId: { $ne: schoolId } });
      if (existingSchool) {
        return res.status(409).json({ message: "Email is already in use" });
      }
      school.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      school.password = password;
    }

    upsertCurrentMonthPayment(school);
    await school.save();

    const teacherCount = await SubUser.countDocuments({ institute: school._id });
    return res.status(200).json({
      message: "School updated successfully",
      school: normalizeSchool(school, teacherCount),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update school", error: error.message });
  }
};

export const getSchoolSubUsers = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    const school = await School.findOne({ schoolId }).select("_id");
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    const subUsers = await SubUser.find({ institute: school._id })
      .select("-password")
      .sort({ subUserId: -1, createdAt: -1 });
    return res.status(200).json({
      subUsers: subUsers.map((u) => ({
        id: u.subUserId,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        subject: u.subject,
        assignedSubjects: Array.isArray(u.assignedSubjects) && u.assignedSubjects.length
          ? u.assignedSubjects
          : [u.subject],
        isActive: u.isActive,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch sub users", error: error.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    const school = await School.findOneAndDelete({ schoolId });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    return res.status(200).json({ message: "School deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete school", error: error.message });
  }
};

export const updateSchoolPlan = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    const plan = clean(req.body?.plan);
    const amount = Number(req.body?.amount);

    if (!plan || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid plan and amount are required" });
    }

    const school = await School.findOne({ schoolId });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    school.plan = plan;
    school.amount = amount;
    upsertCurrentMonthPayment(school);
    await school.save();

    return res.status(200).json({ school: normalizeSchool(school) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update plan", error: error.message });
  }
};

export const updateSchoolStatus = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    const status = clean(req.body?.status);

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const school = await School.findOne({ schoolId });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    school.status = status;
    if (status === "Paid") {
      school.lastPaymentDate = todayIso();
    }
    upsertCurrentMonthPayment(school);
    await school.save();

    return res.status(200).json({ school: normalizeSchool(school) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

export const deleteSchoolPayment = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    const month = clean(req.params.month);

    const school = await School.findOne({ schoolId });
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    school.monthlyPayments = (school.monthlyPayments || []).filter((payment) => payment.month !== month);
    await school.save();

    return res.status(200).json({ school: normalizeSchool(school) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete payment", error: error.message });
  }
};
