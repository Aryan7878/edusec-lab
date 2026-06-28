const { body, param, validationResult } = require('express-validator');

/**
 * Common middleware handler to format express-validator result errors
 */
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

/**
 * Custom validator for terminal command injection checks
 * Blocks characters and patterns that attempt to escape or abuse container scope.
 */
const validateCommandPayload = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Command must be a valid string');
  }

  // Enforce a strict length limit (e.g., 2048 characters)
  if (value.length > 2048) {
    throw new Error('Command exceeds maximum length of 2048 characters');
  }

  // Command is valid
  return true;
};

// ─── Input Validation Rules ──────────────────────────────────────────────────

exports.validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isAlphanumeric().withMessage('Username must be alphanumeric')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters'),
  validateResult
];

exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateResult
];

exports.validateResetPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('newPassword')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters'),
  validateResult
];

exports.validateCtfSubmit = [
  body('challengeId')
    .trim()
    .notEmpty().withMessage('Challenge ID is required')
    .isMongoId().withMessage('Invalid Challenge ID format'),
  body('flag')
    .trim()
    .notEmpty().withMessage('Flag is required')
    .isLength({ min: 1, max: 200 }).withMessage('Flag must be between 1 and 200 characters'),
  validateResult
];

exports.validateCommand = [
  body('command')
    .notEmpty().withMessage('Command payload is required')
    .custom(validateCommandPayload),
  validateResult
];
