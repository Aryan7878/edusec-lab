const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const ctfController = require('../controllers/ctf.controller');

// ─── Admin-Only Middleware ────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

// ─── Rate Limiter for Flag Submissions ─────────────────────────────────────────
// Restricts brute-forcing flag guesses. Allows 30 submissions per 15 minutes.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 submissions per windowMs
  message: {
    message: 'Too many flag submissions from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// ─── Routes ──────────────────────────────────────────────────────────────────
router.get('/challenges',        ctfController.listChallenges);
router.get('/challenges/:id',    ctfController.getChallenge);
router.post('/challenges',       adminOnly, ctfController.createChallenge);
router.put('/challenges/:id',    adminOnly, ctfController.updateChallenge);
router.delete('/challenges/:id', adminOnly, ctfController.deleteChallenge);

// Apply rate limiting middleware to the submit endpoint
router.post('/submit',           submitLimiter, ctfController.submitFlag);

router.get('/leaderboard',       ctfController.getLeaderboard);
router.get('/score',             ctfController.getMyScore);
router.get('/my-submissions',    ctfController.getMySubmissions);

module.exports = router;
