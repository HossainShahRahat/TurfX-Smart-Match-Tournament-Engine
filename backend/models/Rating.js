import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    raterPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      index: true,
    },
    ratedPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    note: {
      type: String,
      default: null,
      trim: true,
      maxlength: 240,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
  }
);

ratingSchema.index(
  { matchId: 1, raterPlayerId: 1, ratedPlayerId: 1 },
  { unique: true, name: "unique_match_player_rating" }
);

const Rating = mongoose.models.Rating || mongoose.model("Rating", ratingSchema);

export default Rating;
