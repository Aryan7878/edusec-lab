const { exec, execFile } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);

// How long (ms) a container can sit idle before being auto-stopped.
// Defaults to 30 minutes; override with LAB_TIMEOUT_MINUTES env var.
const LAB_TIMEOUT_MS = (parseInt(process.env.LAB_TIMEOUT_MINUTES, 10) || 30) * 60 * 1000;

/**
 * Manages lifecycle of lab containers (per user, per lab).
 * Each running container is tracked in-memory. On process restart,
 * the map resets, but docker containers (if any) can still be stopped manually.
 *
 * Idle-timeout: containers are auto-stopped after LAB_TIMEOUT_MS of inactivity.
 * Activity is refreshed by calling touchActivity() (via the /heartbeat endpoint).
 */
class LabManager {
  constructor() {
    // key: `${userId}:${labId}` -> details
    this.activeLabs = new Map();
    this.baseHttpPort = 8082; // starting range for host port mappings
    this.dockerCmd = this._resolveDockerCmd();
    this.dockerPath = this._resolveDockerPath();
  }

  _resolveDockerCmd() {
    // Prefer PATH 'docker', else try common Docker Desktop locations on Windows
    const isWindows = process.platform === 'win32';
    if (!isWindows) return 'docker';

    const candidates = [
      process.env.ProgramFiles + '\\Docker\\Docker\\resources\\bin\\docker.exe',
      process.env.ProgramFiles + '\\Docker\\Docker\\resources\\docker.exe',
      process.env.ProgramFiles + '\\Docker\\Docker\\bin\\docker.exe'
    ].filter(Boolean);

    for (const cand of candidates) {
      try {
        const fs = require('fs');
        if (fs.existsSync(cand)) return `"${cand}"`;
      } catch (_) { }
    }
    return 'docker';
  }

  _resolveDockerPath() {
    const isWindows = process.platform === 'win32';
    if (!isWindows) return 'docker';

    const candidates = [
      process.env.ProgramFiles + '\\Docker\\Docker\\resources\\bin\\docker.exe',
      process.env.ProgramFiles + '\\Docker\\Docker\\resources\\docker.exe',
      process.env.ProgramFiles + '\\Docker\\Docker\\bin\\docker.exe'
    ].filter(Boolean);

    for (const cand of candidates) {
      try {
        const fs = require('fs');
        if (fs.existsSync(cand)) return cand;
      } catch (_) { }
    }
    return 'docker';
  }

  async _findFreeHttpPort() {
    let port = this.baseHttpPort + Math.floor(Math.random() * 1000);
    while ([...this.activeLabs.values()].some(v => v.hostPort === port)) {
      port++;
    }
    return port;
  }

  /**
   * Best-effort guess of exposed internal port for known images.
   * Falls back to 80 for generic web apps.
   */
  _inferInternalPort(dockerImage) {
    const image = (dockerImage || '').toLowerCase();
    if (image.includes('juice-shop')) return 3000;
    if (image.includes('dvwa')) return 80;
    if (image.includes('metasploitable')) return 80; // many ports; expose 80 for UI
    return 80;
  }

  _containerName(labId, userId) {
    return `edusec_lab_${String(labId)}_${String(userId)}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  /**
   * Refresh the last-activity timestamp for a running container.
   * Called by the /heartbeat endpoint every ~3 minutes from the frontend.
   * @returns {boolean} true if the key was found and updated, false if not tracked
   */
  touchActivity(userId, labId) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);
    if (!info) return false;
    info.lastActivityAt = new Date();
    return true;
  }

  /**
   * Returns remaining idle time in milliseconds for a running container.
   * Returns null if the container is not tracked.
   */
  getRemainingTime(userId, labId) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);
    if (!info) return null;
    const elapsed = Date.now() - new Date(info.lastActivityAt).getTime();
    return Math.max(0, LAB_TIMEOUT_MS - elapsed);
  }

  async startLabContainer({ lab, userId }) {
    if (!lab || !lab.dockerImage) {
      throw new Error('This lab is not containerized or dockerImage is missing');
    }

    const key = `${userId}:${lab._id}`;
    if (this.activeLabs.has(key)) {
      // Refresh activity on re-start
      this.activeLabs.get(key).lastActivityAt = new Date();
      return this.activeLabs.get(key);
    }

    const internalPort = this._inferInternalPort(lab.dockerImage);
    // Always choose a free host port to avoid clashes with any pre-run Compose stacks
    const hostPort = await this._findFreeHttpPort();
    const containerName = this._containerName(lab._id, userId);

    // Ensure image exists locally
    try {
      await execPromise(`${this.dockerCmd} image inspect ${lab.dockerImage}`);
    } catch (_) {
      await execPromise(`${this.dockerCmd} pull ${lab.dockerImage}`);
    }

    // If a stale container with same name exists, remove it
    try {
      await execPromise(`${this.dockerCmd} rm -f ${containerName}`);
    } catch (_) {
      // ignore
    }

    const runCmd = `${this.dockerCmd} run -d --name ${containerName} -p ${hostPort}:${internalPort} --restart=no ${lab.dockerImage}`;
    const { stderr } = await execPromise(runCmd);
    if (stderr) {
      // docker sometimes writes warnings to stderr; do not fail on non-empty stderr
      try { if (!/^[\s\S]*$/.test(stderr)) { } } catch (_) { }
    }

    const now = new Date();
    const details = {
      id: containerName,
      status: 'running',
      containerName,
      hostPort,
      internalPort,
      image: lab.dockerImage,
      accessUrl: `http://localhost:${hostPort}`,
      startedAt: now,
      lastActivityAt: now,       // ← idle-timeout tracking
      timeoutMs: LAB_TIMEOUT_MS  // ← sent to frontend so it knows the limit
    };

    this.activeLabs.set(key, details);
    return details;
  }

  async stopLabContainer({ labId, userId }) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);
    const containerName = info ? info.containerName : this._containerName(labId, userId);
    try {
      await execPromise(`${this.dockerCmd} rm -f ${containerName}`);
    } catch (_) {
      // ignore
    }
    this.activeLabs.delete(key);
    return { success: true };
  }

  async getStatus({ labId, userId }) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);
    if (!info) return { status: 'stopped' };
    try {
      const { stdout } = await execPromise(`${this.dockerCmd} inspect -f '{{.State.Running}}' ${info.containerName}`);
      const running = stdout.includes('true');
      if (!running) {
        this.activeLabs.delete(key);
        return { status: 'stopped' };
      }
      return {
        ...info,
        status: 'running',
        remainingMs: this.getRemainingTime(userId, labId)
      };
    } catch (_) {
      this.activeLabs.delete(key);
      return { status: 'stopped' };
    }
  }

  async executeCommand({ labId, userId, command }) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);

    if (!info) {
      throw new Error('Lab container is not running. Please start the lab first.');
    }

    // Every terminal command refreshes the idle timer
    info.lastActivityAt = new Date();

    try {
      // Execute command in the container
      const { stdout, stderr } = await execFilePromise(this.dockerPath, ['exec', info.containerName, '/bin/sh', '-c', command]);

      // Combine stdout and stderr for terminal output
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      return {
        success: true,
        output: output || '(no output)\r\n'
      };
    } catch (error) {
      return {
        success: false,
        output: error.message || 'Command execution failed'
      };
    }
  }

  /**
   * Sweep all tracked containers and stop any that have been idle
   * longer than LAB_TIMEOUT_MS. Called by the cron in server.js.
   * @returns {string[]} list of container names that were stopped
   */
  async stopIdleContainers() {
    const stopped = [];
    const now = Date.now();

    for (const [key, info] of this.activeLabs.entries()) {
      const idleMs = now - new Date(info.lastActivityAt).getTime();
      if (idleMs >= LAB_TIMEOUT_MS) {
        console.log(`[LabManager] Auto-stopping idle container: ${info.containerName} (idle ${Math.round(idleMs / 60000)} min)`);
        try {
          await execPromise(`${this.dockerCmd} rm -f ${info.containerName}`);
        } catch (_) {
          // Container may have already exited on its own — still remove from map
        }
        this.activeLabs.delete(key);
        stopped.push(info.containerName);
      }
    }

    if (stopped.length > 0) {
      console.log(`[LabManager] Auto-stopped ${stopped.length} idle container(s):`, stopped);
    }

    return stopped;
  }

  /**
   * Start the background sweeper that runs every 5 minutes.
   * Call once from server.js after the server starts.
   */
  startSweeper() {
    const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes
    const timeoutMinutes = LAB_TIMEOUT_MS / 60000;
    console.log(`[LabManager] Idle-container sweeper started (timeout: ${timeoutMinutes} min, check interval: 5 min)`);
    setInterval(() => this.stopIdleContainers(), SWEEP_INTERVAL_MS);
  }
}

module.exports = new LabManager();
