import mongoose from "mongoose";

import { MATCH_STATUS } from "@/config/constants";

const matchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    teamALabel: {
      type: String,
      required: true,
      trim: true,
      default: "Team A",
    },
    teamBLabel: {
      type: String,
      required: true,
      trim: true,
      default: "Team B",
    },
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
    score: {
      teamA: {
        type: Number,
        default: 0,
        min: 0,
      },
      teamB: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    completedAt: {
      type: Date,
      default: null,
    },
    manOfTheMatchPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    manOfTheMatchReason: {
      type: String,
      default: null,
      trim: true,
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
