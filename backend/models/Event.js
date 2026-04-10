import mongoose from "mongoose";

import { MATCH_EVENT_TYPES } from "@/config/constants";

const eventSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(MATCH_EVENT_TYPES),
      required: true,
      index: true,
    },
    minute: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
  }
);

eventSchema.index(
  { matchId: 1, playerId: 1, type: 1, minute: 1 },
  { unique: true, name: "unique_match_event" }
);

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;
