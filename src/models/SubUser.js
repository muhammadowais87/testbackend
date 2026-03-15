import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const subUserSchema = new mongoose.Schema(
  {
    subUserId: {
      type: Number,
      unique: true,
      index: true,
      sparse: true,
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    assignedSubjects: {
      type: [String],
      default: [],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subUserSchema.index({ institute: 1, email: 1 }, { unique: true });
subUserSchema.index({ email: 1 }, { unique: true });

subUserSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

subUserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const SubUser = mongoose.model("SubUser", subUserSchema);

export default SubUser;
