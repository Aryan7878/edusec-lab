const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ctf/challenges
// ─────────────────────────────────────────────────────────────────────────────
exports.listChallenges = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category)   filter.category   = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const challenges = await Challenge.find(filter)
      .select('-flag')
      .sort({ difficulty: 1, points: 1 })
      .lean();

    const challengeIds = challenges.map(c => c._id);
    const solvedSubmissions = await Submission.find({
      userId:      req.user._id,
      challengeId: { $in: challengeIds },
      isCorrect:   true,
    }).select('challengeId').lean();

    const solvedSet = new Set(solvedSubmissions.map(s => s.challengeId.toString()));

    const result = challenges.map(ch => ({
      ...ch,
      isSolved: solvedSet.has(ch._id.toString()),
    }));

    res.json(result);
  } catch (err) {
    console.error('CTF list challenges error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ctf/challenges/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getChallenge = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    const challenge = await Challenge.findOne({
      _id:      req.params.id,
      isActive: true,
    }).select('-flag').lean();

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const solved = await Submission.findOne({
      userId:      req.user._id,
      challengeId: challenge._id,
      isCorrect:   true,
    }).lean();

    res.json({ ...challenge, isSolved: !!solved });
  } catch (err) {
    console.error('CTF get challenge error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ctf/challenges [ADMIN]
// ─────────────────────────────────────────────────────────────────────────────
exports.createChallenge = async (req, res) => {
  try {
    const { title, description, category, difficulty, points, flag, hint } = req.body;

    if (!title || !description || !category || !difficulty || !points || !flag) {
      return res.status(400).json({
        message: 'title, description, category, difficulty, points, and flag are all required.',
      });
    }

    if (typeof flag !== 'string' || flag.trim().length === 0) {
      return res.status(400).json({ message: 'Flag must be a non-empty string.' });
    }

    const flagHash = await bcrypt.hash(flag.trim(), 10);

    const challenge = await Challenge.create({
      title:       title.trim(),
      description: description.trim(),
      category,
      difficulty,
      points:      Number(points),
      flag:        flagHash,
      hint:        hint ? hint.trim() : '',
    });

    const { flag: _removed, ...safeChallenge } = challenge.toObject();
    res.status(201).json(safeChallenge);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A challenge with that title already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('CTF create challenge error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/ctf/challenges/:id [ADMIN]
// ─────────────────────────────────────────────────────────────────────────────
exports.updateChallenge = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    const updates = { ...req.body };

    if (updates.flag) {
      if (typeof updates.flag !== 'string' || updates.flag.trim().length === 0) {
        return res.status(400).json({ message: 'Flag must be a non-empty string.' });
      }
      updates.flag = await bcrypt.hash(updates.flag.trim(), 10);
    }

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-flag');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('CTF update challenge error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/ctf/challenges/:id [ADMIN]
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteChallenge = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    ).select('-flag');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json({ success: true, message: 'Challenge deactivated.', challenge });
  } catch (err) {
    console.error('CTF delete challenge error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ctf/submit
// ─────────────────────────────────────────────────────────────────────────────
exports.submitFlag = async (req, res) => {
  try {
    const { challengeId, flag } = req.body;

    if (!challengeId || typeof challengeId !== 'string') {
      return res.status(400).json({ message: 'challengeId is required.' });
    }
    if (!mongoose.isValidObjectId(challengeId)) {
      return res.status(400).json({ message: 'Invalid challengeId.' });
    }
    if (!flag || typeof flag !== 'string' || flag.trim().length === 0) {
      return res.status(400).json({ message: 'Flag is required and cannot be empty.' });
    }
    if (flag.length > 500) {
      return res.status(400).json({ message: 'Flag is too long.' });
    }

    const challenge = await Challenge.findOne({
      _id:      challengeId,
      isActive: true,
    }).select('+flag');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found.' });
    }

    const existingCorrect = await Submission.findOne({
      userId:      req.user._id,
      challengeId: challenge._id,
      isCorrect:   true,
    });

    if (existingCorrect) {
      return res.json({
        correct:       true,
        alreadySolved: true,
        pointsAwarded: 0,
        message:       'You already solved this challenge! 🎉',
      });
    }

    const isCorrect = await bcrypt.compare(flag.trim(), challenge.flag);

    // Save submission
    await Submission.create({
      userId:        req.user._id,
      challengeId:   challenge._id,
      isCorrect,
      pointsAwarded: isCorrect ? challenge.points : 0,
    });

    if (isCorrect) {
      return res.json({
        correct:       true,
        alreadySolved: false,
        pointsAwarded: challenge.points,
        message:       `Correct! You earned ${challenge.points} points! 🚩`,
      });
    }

    return res.json({
      correct:       false,
      alreadySolved: false,
      pointsAwarded: 0,
      message:       'Incorrect flag. Keep trying!',
    });
  } catch (err) {
    console.error('CTF submit error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ctf/leaderboard
// ─────────────────────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const top20 = await Submission.aggregate([
      { $match: { isCorrect: true } },
      {
        $group: {
          _id:         '$userId',
          totalPoints: { $sum: '$pointsAwarded' },
          solved:      { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1, solved: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id:         0,
          userId:      '$_id',
          username:    '$userInfo.username',
          totalPoints: 1,
          solved:      1,
        },
      },
    ]);

    const myScoreAgg = await Submission.aggregate([
      { $match: { userId: req.user._id, isCorrect: true } },
      {
        $group: {
          _id:         null,
          totalPoints: { $sum: '$pointsAwarded' },
          solved:      { $sum: 1 },
        },
      },
    ]);
    const myPoints = myScoreAgg[0]?.totalPoints ?? 0;
    const mySolved = myScoreAgg[0]?.solved ?? 0;

    const rankAgg = await Submission.aggregate([
      { $match: { isCorrect: true } },
      { $group: { _id: '$userId', totalPoints: { $sum: '$pointsAwarded' } } },
      { $match: { totalPoints: { $gt: myPoints } } },
      { $count: 'usersAhead' },
    ]);
    const myRank = (rankAgg[0]?.usersAhead ?? 0) + 1;

    res.json({
      leaderboard: top20,
      myStats: {
        rank:        myRank,
        totalPoints: myPoints,
        solved:      mySolved,
        username:    req.user.username,
      },
    });
  } catch (err) {
    console.error('CTF leaderboard error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ctf/score
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyScore = async (req, res) => {
  try {
    const totalAgg = await Submission.aggregate([
      { $match: { userId: req.user._id, isCorrect: true } },
      {
        $group: {
          _id:         null,
          totalPoints: { $sum: '$pointsAwarded' },
          solved:      { $sum: 1 },
        },
      },
    ]);

    const breakdownAgg = await Submission.aggregate([
      { $match: { userId: req.user._id, isCorrect: true } },
      {
        $lookup: {
          from:         'challenges',
          localField:   'challengeId',
          foreignField: '_id',
          as:           'challenge',
        },
      },
      { $unwind: '$challenge' },
      {
        $group: {
          _id:    '$challenge.difficulty',
          count:  { $sum: 1 },
          points: { $sum: '$pointsAwarded' },
        },
      },
    ]);

    const breakdown = { easy: 0, medium: 0, hard: 0 };
    breakdownAgg.forEach(b => {
      if (breakdown.hasOwnProperty(b._id)) {
        breakdown[b._id] = b.count;
      }
    });

    res.json({
      totalPoints: totalAgg[0]?.totalPoints ?? 0,
      solved:      totalAgg[0]?.solved ?? 0,
      breakdown,
    });
  } catch (err) {
    console.error('CTF score error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ctf/my-submissions
// ─────────────────────────────────────────────────────────────────────────────
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user._id })
      .populate('challengeId', 'title category difficulty points')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(submissions);
  } catch (err) {
    console.error('CTF my-submissions error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
