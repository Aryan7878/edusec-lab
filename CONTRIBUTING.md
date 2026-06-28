# Contributing to EduSec Labs

First off, thank you for considering contributing to EduSec Labs! It's people like you who make this platform a world-class training ground for cybersecurity students.

Please take a moment to review this document to understand our branching strategy and development workflows.

---

## 🚦 Branching Strategy

Our repository uses two main branches:
*   **`master`**: Production-ready code. The stable deployment branch.
*   **`Aryan`**: Active integration branch where features are gathered and tested.

All new feature work should be branched off `Aryan` or targeted to merge back into `Aryan`. Never submit a PR pointing directly to `master` unless it is a critical emergency hotfix.

---

## 🛠️ Step-by-Step Local Setup

1.  **Fork and Clone:**
    ```bash
    git clone https://github.com/Aryan7878/edusec-lab.git
    cd edusec-lab
    ```
2.  **Create a Feature Branch:**
    ```bash
    git checkout Aryan
    git checkout -b feature/your-awesome-feature
    ```
3.  **Install Node Modules:**
    Install dependencies for both backend and frontend workspaces:
    ```bash
    # Install backend dependencies
    cd backend && npm install && cd ..
    # Install frontend dependencies
    cd frontend && npm install && cd ..
    ```
4.  **Database Configuration:**
    Configure a local database or set up a MongoDB Atlas cluster. Set up your environment files:
    ```bash
    cp backend/.env.example backend/.env
    # Edit the variables inside backend/.env
    ```
5.  **Seed Initial Data:**
    ```bash
    cd backend
    npm run init-labs
    npm run init-challenges
    cd ..
    ```
6.  **Run Development Servers:**
    Run both components in separate terminals:
    ```bash
    # Terminal 1 (Backend dev)
    cd backend && npm run dev
    # Terminal 2 (Frontend dev)
    cd frontend && npm run dev
    ```

---

## 📝 Coding Standards

*   **RESTful APIs:** Endpoint names should be kebab-cased (e.g. `/api/labs/:id/heartbeat`). Always return structured JSON:
    ```json
    {
      "success": true,
      "data": {}
    }
    ```
*   **No Stored Secrets:** Never commit real secrets. Always retrieve passwords, credentials, and API keys via `process.env`.
*   **Docker Safe Commands:** When invoking shell commands through Node child processes, validate and sanitize parameters to prevent command injection risks.

---

## 🧪 Submission Checklist

*   Run `npm run build` inside `frontend/` to ensure Vite bundles without errors.
*   Ensure all new variables are added to `.env.example`.
*   Submit your PR targeting the `Aryan` branch.
