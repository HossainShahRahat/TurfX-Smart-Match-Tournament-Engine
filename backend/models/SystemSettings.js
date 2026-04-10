import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

systemSettingsSchema.index({ updatedAt: -1 });

const SystemSettings =
  mongoose.models.SystemSettings ||
  mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;

