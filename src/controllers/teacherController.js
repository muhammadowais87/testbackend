import Teacher from "../models/Teacher.js";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeTeacher = (teacher) => ({
  id: teacher.teacherId,
  name: teacher.name,
  city: teacher.city,
  phone: teacher.phone,
  email: teacher.email || "",
  subject: teacher.subject,
  assignedSubjects: teacher.assignedSubjects?.filter(Boolean)?.length
    ? teacher.assignedSubjects.filter(Boolean)
    : (teacher.subject ? [teacher.subject] : []),
  isActive: teacher.isActive,
  plan: teacher.plan,
  amount: teacher.amount,
  status: teacher.status,
  subscriptionDate: teacher.subscriptionDate,
  lastPaymentDate: teacher.lastPaymentDate,
  monthlyPayments: teacher.monthlyPayments || [],
  createdAt: teacher.createdAt,
  updatedAt: teacher.updatedAt,
});

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

const todayIso = () => new Date().toISOString().slice(0, 10);

const upsertCurrentMonthPayment = (teacher) => {
  const { month, monthLabel } = getCurrentMonthInfo();
  const paymentDate = teacher.status === "Paid"
    ? (teacher.lastPaymentDate || todayIso())
    : null;

  const entry = {
    month,
    monthLabel,
    plan: teacher.plan,
    amount: teacher.amount,
    status: teacher.status,
    paymentDate,
  };

  if (!Array.isArray(teacher.monthlyPayments)) {
    teacher.monthlyPayments = [];
  }

  const index = teacher.monthlyPayments.findIndex((payment) => payment.month === month);
  if (index >= 0) {
    teacher.monthlyPayments[index] = {
      ...teacher.monthlyPayments[index],
      ...entry,
    };
  } else {
    teacher.monthlyPayments.push(entry);
  }
};

const getNextTeacherId = async () => {
  const lastTeacher = await Teacher.findOne().sort({ teacherId: -1 }).select("teacherId");
  return (lastTeacher?.teacherId || 0) + 1;
};

const ensureTeacherId = async (teacher, fallbackId) => {
  if (teacher.teacherId) {
    return teacher.teacherId;
  }

  const nextId = typeof fallbackId === "number" ? fallbackId : await getNextTeacherId();
  teacher.teacherId = nextId;
  await teacher.save();
  return nextId;
};

export const getTeachers = async (_req, res) => {
  try {
    const teachers = await Teacher.find().sort({ teacherId: -1, createdAt: -1 });
    let nextId = await getNextTeacherId();

    for (const teacher of teachers) {
      if (!teacher.teacherId) {
        await ensureTeacherId(teacher, nextId);
        nextId += 1;
      }
    }

    return res.status(200).json({ teachers: teachers.map(normalizeTeacher) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const city = clean(req.body?.city);
    const phone = clean(req.body?.phone);
    const email = clean(req.body?.email).toLowerCase();
    const password = clean(req.body?.password);
    const subject = clean(req.body?.subject);
    const plan = clean(req.body?.plan) || "Basic";
    const amount = Number(req.body?.amount) || 5000;
    const status = clean(req.body?.status) || "Pending";
    const subscriptionDate = clean(req.body?.subscriptionDate) || new Date().toISOString().slice(0, 10);
    const lastPaymentDate = clean(req.body?.lastPaymentDate) || subscriptionDate;

    if (!name || !city || !phone || !email || !subject || !password) {
      return res.status(400).json({ message: "Name, city, phone, email, subject, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (email) {
      const existingEmailTeacher = await Teacher.findOne({ email });
      if (existingEmailTeacher) {
        return res.status(409).json({ message: "Email is already in use" });
      }
    }

    const existingPhoneTeacher = await Teacher.findOne({ phone });
    if (existingPhoneTeacher) {
      return res.status(409).json({ message: "Phone number is already in use" });
    }

    const teacherId = await getNextTeacherId();
    const assignedSubjects = Array.isArray(req.body?.assignedSubjects) && req.body.assignedSubjects.length
      ? req.body.assignedSubjects.map((item) => clean(item)).filter(Boolean)
      : [subject];

    const teacher = await Teacher.create({
      teacherId,
      name,
      city,
      phone,
      email: email || undefined,
      password,
      subject,
      assignedSubjects,
      isActive: req.body?.isActive ?? true,
      plan,
      amount,
      status,
      subscriptionDate,
      lastPaymentDate,
      monthlyPayments: [buildFirstPayment({ subscriptionDate, plan, amount, status, lastPaymentDate })],
    });

    return res.status(201).json({
      message: "Teacher created successfully",
      teacher: normalizeTeacher(teacher),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create teacher", error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const teacher = await Teacher.findOne({ teacherId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const name = clean(req.body?.name);
    const city = clean(req.body?.city);
    const phone = clean(req.body?.phone);
    const email = clean(req.body?.email).toLowerCase();
    const password = clean(req.body?.password);
    const subject = clean(req.body?.subject);
    const plan = clean(req.body?.plan);
    const status = clean(req.body?.status);
    const subscriptionDate = clean(req.body?.subscriptionDate);
    const lastPaymentDate = clean(req.body?.lastPaymentDate);

    if (name) teacher.name = name;
    if (city) teacher.city = city;
    if (phone) {
      const existingPhoneTeacher = await Teacher.findOne({ phone, teacherId: { $ne: teacherId } });
      if (existingPhoneTeacher) {
        return res.status(409).json({ message: "Phone number is already in use" });
      }
      teacher.phone = phone;
    }
    if (subject) teacher.subject = subject;
    if (plan) teacher.plan = plan;
    if (status) teacher.status = status;
    if (subscriptionDate) teacher.subscriptionDate = subscriptionDate;
    if (lastPaymentDate) teacher.lastPaymentDate = lastPaymentDate;

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "amount")) {
      const amount = Number(req.body.amount);
      if (!Number.isNaN(amount) && amount > 0) {
        teacher.amount = amount;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "isActive")) {
      teacher.isActive = Boolean(req.body.isActive);
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "assignedSubjects")) {
      const assignedSubjects = Array.isArray(req.body.assignedSubjects)
        ? req.body.assignedSubjects.map((item) => clean(item)).filter(Boolean)
        : [];
      teacher.assignedSubjects = assignedSubjects.length ? assignedSubjects : [teacher.subject];
      if (!assignedSubjects.includes(teacher.subject)) {
        teacher.subject = teacher.assignedSubjects[0];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "email")) {
      if (email) {
        const existingEmailTeacher = await Teacher.findOne({ email, teacherId: { $ne: teacherId } });
        if (existingEmailTeacher) {
          return res.status(409).json({ message: "Email is already in use" });
        }
        teacher.email = email;
      } else {
        teacher.email = undefined;
      }
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      teacher.password = password;
    }

    upsertCurrentMonthPayment(teacher);

    await teacher.save();

    return res.status(200).json({
      message: "Teacher updated successfully",
      teacher: normalizeTeacher(teacher),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update teacher", error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const teacher = await Teacher.findOneAndDelete({ teacherId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.status(200).json({ message: "Teacher deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete teacher", error: error.message });
  }
};

export const updateTeacherPlan = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const plan = clean(req.body?.plan);
    const amount = Number(req.body?.amount);

    if (!plan || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid plan and amount are required" });
    }

    const teacher = await Teacher.findOne({ teacherId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.plan = plan;
    teacher.amount = amount;
    upsertCurrentMonthPayment(teacher);
    await teacher.save();

    return res.status(200).json({ teacher: normalizeTeacher(teacher) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update plan", error: error.message });
  }
};

export const updateTeacherStatus = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const status = clean(req.body?.status);

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const teacher = await Teacher.findOne({ teacherId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.status = status;
    if (status === "Paid") {
      teacher.lastPaymentDate = todayIso();
    }
    upsertCurrentMonthPayment(teacher);
    await teacher.save();

    return res.status(200).json({ teacher: normalizeTeacher(teacher) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

export const toggleTeacherActive = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const isActive = Boolean(req.body?.isActive);

    const teacher = await Teacher.findOneAndUpdate(
      { teacherId },
      { isActive },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.status(200).json({ teacher: normalizeTeacher(teacher) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update account status", error: error.message });
  }
};

export const assignTeacherSubjects = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const subjects = Array.isArray(req.body?.subjects)
      ? req.body.subjects.map((item) => clean(item)).filter(Boolean)
      : [];

    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const assignedSubjects = subjects.length ? subjects : [teacher.subject];
    teacher.assignedSubjects = assignedSubjects;
    teacher.subject = assignedSubjects[0];
    await teacher.save();

    return res.status(200).json({ teacher: normalizeTeacher(teacher) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign subjects", error: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const month = clean(req.params.month);

    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.monthlyPayments = (teacher.monthlyPayments || []).filter((payment) => payment.month !== month);
    await teacher.save();

    return res.status(200).json({ teacher: normalizeTeacher(teacher) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete payment", error: error.message });
  }
};
