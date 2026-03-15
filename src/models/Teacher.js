import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const teacherSchema = new mongoose.Schema(
  {
    teacherId: {
      type: Number,
      unique: true,
      index: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: undefined,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    assignedSubjects: {
      type: [String],
      default: [],
    },
    plan: {
      type: String,
      default: "Basic",
      trim: true,
    },
    amount: {
      type: Number,
      default: 5000,
    },
    status: {
      type: String,
      default: "Pending",
      trim: true,
    },
    subscriptionDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    lastPaymentDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    monthlyPayments: {
      type: [
        {
          month: { type: String, required: true },
          monthLabel: { type: String, required: true },
          plan: { type: String, required: true },
          amount: { type: Number, required: true },
          status: { type: String, required: true },
          paymentDate: { type: String, default: null },
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    portalSettings: {
      schoolName: { type: String, default: "", trim: true },
      schoolAddress: { type: String, default: "", trim: true },
      logoUrl: { type: String, default: "", trim: true },
      principalName: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      monogramHeight: { type: String, default: "50", trim: true },
      monogramWidth: { type: String, default: "50", trim: true },
      schoolNameColor: { type: String, default: "#000000", trim: true },
      footerColor: { type: String, default: "#000000", trim: true },
      fontStyle: { type: String, default: "Times New Roman", trim: true },
      schoolNameSize: { type: String, default: "20", trim: true },
      schoolNameStretch: { type: String, default: "1.4", trim: true },
      footerSize: { type: String, default: "10", trim: true },
      footerStretch: { type: String, default: "1", trim: true },
      watermarkMode: { type: String, default: "image", trim: true },
      watermarkHeight: { type: String, default: "200", trim: true },
      watermarkWidth: { type: String, default: "200", trim: true },
      watermarkOpacity: { type: String, default: "0.3", trim: true },
      watermarkText: { type: String, default: "THE HOPE SCIENCE ACADEMY", trim: true },
    },
  },
  { timestamps: true }
);

teacherSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

teacherSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;
