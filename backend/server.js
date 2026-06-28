const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edusec-labs')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Lab = require('./models/Lab');
const Progress = require('./models/Progress');

// Services
const LabManager = require('./services/labManager');
const VMManager  = require('./services/vmManager');

// Routes
const ctfRoutes  = require('./routes/ctf.routes');
const {
  validateRegister,
  validateLogin,
  validateResetPassword,
  validateCommand
} = require('./middleware/inputValidator');

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edusec-secret');
    req.user = await User.findById(decoded.userId).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Register
app.post('/api/auth/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'edusec-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'edusec-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        badges: user.badges
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
app.post('/api/auth/reset-password', validateResetPassword, async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get labs
app.get('/api/labs', auth, async (req, res) => {
  try {
    const labs = await Lab.find({});
    const userProgress = await Progress.find({ userId: req.user._id });

    // Reconcile persisted progress with actual container status
    const labsWithProgress = await Promise.all(labs.map(async (lab) => {
      const existing = userProgress.find(p => p.labId.toString() === lab._id.toString());
      let reconciled = existing ? { ...existing.toObject() } : { status: 'not_started', score: 0 };

      try {
        const status = await LabManager.getStatus({ labId: lab._id, userId: req.user._id });
        if (!status || status.status !== 'running') {
          reconciled.status = 'not_started';
        } else {
          reconciled.status = 'in_progress';
        }
      } catch (_) {
        reconciled.status = 'not_started';
      }

      return {
        ...lab.toObject(),
        userProgress: reconciled
      };
    }));

    res.json(labsWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start lab (launches docker container and returns access URL)
app.post('/api/labs/:id/start', auth, async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    let progress = await Progress.findOne({
      userId: req.user._id,
      labId: lab._id
    });

    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        labId: lab._id,
        status: 'in_progress',
        startedAt: new Date()
      });
    } else {
      progress.status = 'in_progress';
      progress.startedAt = new Date();
    }

    await progress.save();

    // Start or reuse a container for this user+lab
    if (!lab.dockerImage) {
      return res.status(400).json({ message: 'Lab is not containerized yet' });
    }

    const details = await LabManager.startLabContainer({ lab, userId: req.user._id });

    res.json({
      message: 'Lab started successfully',
      lab: {
        labId: lab._id,
        status: details.status,
        accessUrl: details.accessUrl,
        hostPort: details.hostPort,
        containerName: details.containerName
      },
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Stop lab container
app.post('/api/labs/:id/stop', auth, async (req, res) => {
  try {
    await LabManager.stopLabContainer({ labId: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Heartbeat — keeps a running lab container alive (resets idle timer)
// Frontend calls this every 3 minutes while the lab tab is open.
app.post('/api/labs/:id/heartbeat', auth, async (req, res) => {
  try {
    const touched = LabManager.touchActivity(req.user._id, req.params.id);
    if (!touched) {
      return res.status(404).json({ message: 'Lab not running' });
    }
    const remainingMs = LabManager.getRemainingTime(req.user._id, req.params.id);
    res.json({ success: true, remainingMs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Lab status
app.get('/api/labs/:id/status', auth, async (req, res) => {
  try {
    const status = await LabManager.getStatus({ labId: req.params.id, userId: req.user._id });
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Execute command in lab container
app.post('/api/labs/:id/execute', auth, validateCommand, async (req, res) => {
  try {
    const { command } = req.body;

    const result = await LabManager.executeCommand({
      labId: req.params.id,
      userId: req.user._id,
      command
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Docker health check
app.get('/api/vm/docker-health', auth, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const dockerCmd = process.platform === 'win32'
      ? (process.env.ProgramFiles + '\\Docker\\Docker\\resources\\bin\\docker.exe')
      : 'docker';

    try {
      await execPromise(`"${dockerCmd}" version`, { timeout: 5000 });
      res.json({ healthy: true, message: 'Docker is running' });
    } catch (error) {
      res.json({ healthy: false, message: 'Docker Desktop is not running. Please start it and try again.' });
    }
  } catch (error) {
    res.status(500).json({ healthy: false, message: error.message });
  }
});

// VM control endpoints
app.get('/api/vm/status', auth, async (req, res) => {
  try {
    const status = await VMManager.getVMStatus(req.user._id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/vm/start', auth, async (req, res) => {
  try {
    const vm = await VMManager.startKaliVM(req.user._id);
    res.json({ vm });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/vm/stop', auth, async (req, res) => {
  try {
    await VMManager.stopKaliVM(req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Execute command in VM container
app.post('/api/vm/execute', auth, validateCommand, async (req, res) => {
  try {
    const { command } = req.body;

    const result = await VMManager.executeCommand(req.user._id, command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CTF Engine routes
app.use('/api/ctf', auth, ctfRoutes);

// AI Assistant endpoint (uses optional model + offline KB)
const { generateTutorResponse } = require('./services/aiTutor');
app.post('/api/ai/assist', auth, async (req, res) => {
  try {
    const { message, labId, context } = req.body || {};

    // Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required and must be a non-empty string' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message is too long (max 2000 characters)' });
    }
    const result = await generateTutorResponse({ message, labId, context });
    res.json({
      response: result.response,
      usedModel: result.usedModel,
      usedKB: result.usedKB,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve static assets in production
const path = require('path');
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start idle-container sweeper (stops labs inactive for > 30 min)
  LabManager.startSweeper();
});
