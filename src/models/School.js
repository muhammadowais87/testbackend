import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const monthlyPaymentSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    monthLabel: { type: String, required: true },
    plan: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    paymentDate: { type: String, default: null },
  },
  { _id: true }
);

const schoolSchema = new mongoose.Schema(
  {
    schoolId: {
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
    principalName: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    phonePrimary: {
      type: String,
      default: "",
      trim: true,
    },
    phoneSecondary: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    monthlyPayments: {
      type: [monthlyPaymentSchema],
      default: [],
    },
    portalSettings: {
      logoUrl: { type: String, default: "", trim: true },
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

schoolSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

schoolSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const School = mongoose.model("School", schoolSchema);

export default School;
