const mongoose = require('mongoose');

/**
 * Submission Model
 *
 * Records every flag submission attempt (both correct and incorrect).
 * The submitted flag text is NOT stored — only the outcome.
 *
 * Design decisions:
 * - No unique index on {userId, challengeId}: a user can submit multiple
 *   wrong attempts. Duplicate correct submission prevention is handled
 *   at the application layer in ctf.routes.js.
 * - pointsAwarded: 0 for wrong, challenge.points for first correct.
 */
const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },

    isCorrect: {
      type: Boolean,
      required: true,
    },

    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt = submission timestamp
  }
);

// Fast lookup: "has this user already solved this challenge?"
submissionSchema.index({ userId: 1, challengeId: 1 });

// Database constraint: enforce one correct submission per user per challenge
submissionSchema.index(
  { userId: 1, challengeId: 1 },
  { name: 'unique_correct_submission', unique: true, partialFilterExpression: { isCorrect: true } }
);

// Fast aggregation for score queries
submissionSchema.index({ userId: 1, isCorrect: 1 });

// Fast aggregation for leaderboard
submissionSchema.index({ isCorrect: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
