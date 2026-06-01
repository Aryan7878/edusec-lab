const mongoose = require('mongoose');

/**
 * Challenge Model
 *
 * Represents a CTF challenge. The `flag` field is stored as a bcrypt hash
 * and MUST NEVER be returned in API responses — use .select('-flag') on all queries.
 *
 * To create a challenge programmatically:
 *   const hash = await bcrypt.hash('EDUSEC{my_flag}', 10);
 *   await Challenge.create({ ..., flag: hash });
 */
const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      unique: true,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      required: [true, 'Challenge description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Web Security', 'Network Security', 'Cryptography', 'Forensics', 'OSINT'],
        message: '{VALUE} is not a valid category',
      },
    },

    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: '{VALUE} is not a valid difficulty',
      },
    },

    points: {
      type: Number,
      required: [true, 'Points are required'],
      min: [1, 'Points must be at least 1'],
      max: [1000, 'Points cannot exceed 1000'],
    },

    /**
     * flag — stored as a bcrypt hash (cost factor 10).
     * NEVER returned in API responses (use .select('-flag')).
     * Comparison: bcrypt.compare(submittedFlag.trim(), challenge.flag)
     */
    flag: {
      type: String,
      required: [true, 'Flag is required'],
      select: false, // excluded from query results by default
    },

    hint: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Hint cannot exceed 500 characters'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Indexes for common filter queries
challengeSchema.index({ category: 1 });
challengeSchema.index({ difficulty: 1 });
challengeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
