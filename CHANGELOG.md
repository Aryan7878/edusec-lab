# Changelog

All notable changes to the EduSec Labs project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-06-28

### Added
*   **Idle Container Sweeper:** Automatically shuts down user Docker containers if idle for more than 30 minutes to protect host resources.
*   **Countdown Banner UI:** Displays active countdown timers on the dashboard and warns when a session is within 5 minutes of timeout.
*   **GitHub Action Pipelines:** Configured automatic build validation, weekly dependency audit, and linter integrations.
*   **Community Templates:** Added issue templates, pull request checklists, contributor policies, security guides, and license files.
*   **OpenAPI Specifications:** Complete REST API mapping added to `docs/openapi.yaml`.

### Changed
*   **Premium Landing Portal:** OVERHAULED landing page in `Home.jsx` to feature dynamic terminal animations, features grids, and architecture maps.
*   **Configurable CORS Policy:** Swapped wide-open origins to customizable environment variables.
*   **React Router Future Flags:** Configured v7 startTransition flags inside `App.jsx` to eliminate console deprecation warnings.

---

## [1.0.0] - 2026-06-24

### Added
*   Core authentication flows (Register, Login, Password Reset).
*   Dynamic Docker lab launcher (`LabManager`) supporting DVWA and Juice Shop target workloads.
*   Alpine-based Kali-lite pen-testing VM container with tool autoinstallers.
*   xterm.js browser terminal rendering inputs inside active containers.
*   AI tutor supporting dual-mode (OpenAI model / offline Knowledge base fallback).
*   CTF flag validation mechanisms and points scoring engine.
*   Global leaderboard view.
*   Custom notifications and toasts frameworks.
