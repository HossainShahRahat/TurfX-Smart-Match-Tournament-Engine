import mongoose from "mongoose";

import { TOURNAMENT_STATUS, TOURNAMENT_TYPES } from "@/config/constants";

const tournamentTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    playerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        required: true,
      },
    ],
    group: {
      type: String,
      default: null,
      trim: true,
    },
    seed: {
      type: Number,
      default: null,
      min: 1,
    },
  },
  {
    _id: true,
  }
);

const tournamentPairingSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
    },
    homeTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    awayTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    winnerTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const tournamentRoundSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String,
      required: true,
      trim: true,
    },
    roundNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    pairings: [tournamentPairingSchema],
  },
  {
    _id: true,
  }
);

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(TOURNAMENT_TYPES),
      required: true,
      index: true,
    },
    teams: [tournamentTeamSchema],
    matches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_STATUS),
      default: TOURNAMENT_STATUS.UPCOMING,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rules: {
      winPoints: {
        type: Number,
        default: 3,
      },
      drawPoints: {
        type: Number,
        default: 1,
      },
      lossPoints: {
        type: Number,
        default: 0,
      },
      qualifiersPerGroup: {
        type: Number,
        default: 2,
        min: 1,
      },
      tieBreakers: {
        type: [String],
        default: ["points", "goalDifference", "goalsFor"],
      },
    },
    stages: {
      leagueGenerated: {
        type: Boolean,
        default: false,
      },
      knockoutGenerated: {
        type: Boolean,
        default: false,
      },
      rounds: [tournamentRoundSchema],
    },
  },
  {
    timestamps: true,
  }
);

const Tournament =
  mongoose.models.Tournament || mongoose.model("Tournament", tournamentSchema);

export default Tournament;
