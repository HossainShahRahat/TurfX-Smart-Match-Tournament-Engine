import mongoose from "mongoose";

import { MATCH_STATUS } from "@/config/constants";

const matchSchema = new mongoose.Schema(
  {
    teamA: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        required: true,
      },
    ],
    teamB: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(MATCH_STATUS),
      default: MATCH_STATUS.PENDING,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      default: null,
      index: true,
    },
    tournamentStage: {
      type: String,
      default: null,
      trim: true,
    },
    tournamentRound: {
      type: Number,
      default: null,
      min: 1,
    },
    tournamentGroup: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.models.Match || mongoose.model("Match", matchSchema);

export default Match;
