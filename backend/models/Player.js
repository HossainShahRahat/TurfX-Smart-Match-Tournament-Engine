import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    totalGoals: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMatches: {
      type: Number,
      default: 0,
      min: 0,
    },
    skillRating: {
      type: Number,
      default: 0,
      min: 0,
    },
    averagePeerRating: {
      type: Number,
      default: 0,
      min: 0,
    },
    peerRatingSum: {
      type: Number,
      default: 0,
      min: 0,
    },
    peerRatingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    manOfTheMatchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

playerSchema.index({ skillRating: -1 });
playerSchema.index({ userId: 1 }, { unique: true, sparse: true });

const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);

export default Player;
