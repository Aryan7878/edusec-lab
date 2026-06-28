# EduSec Labs

EduSec Labs is a comprehensive cybersecurity education platform designed to provide hands-on experience with ethical hacking and vulnerability testing. It features a modern React frontend, a robust Node.js/Express backend, and integrated virtualized environments using Vagrant (Kali Linux) and Docker (DVWA).

## Features

-   **Interactive Dashboard**: A user-friendly interface to manage labs and track progress.
-   **Virtual Labs**:
    -   **Kali Linux**: Full-fledged Kali Linux environment managed via Vagrant for finding and exploiting vulnerabilities.
    -   **DVWA (Damn Vulnerable Web App)**: Dockerized vulnerable web application for practicing web attacks.
-   **Terminal Integration**: Web-based terminal (xterm.js) to interact with lab environments directly from the browser.
-   **Progress Tracking**: Track your completion status and scores for different labs.
-   **AI Tutor**: Integrated AI assistant to help guide you through labs and explain concepts.

## Technology Stack

### Frontend
-   **React**: UI library for building the user interface.
-   **Vite**: Next Generation Frontend Tooling.
-   **Bootstrap**: CSS framework for responsive design.
-   **xterm.js**: For embedding a terminal in the browser.
-   **Axios**: For making HTTP requests to the backend.

### Backend
-   **Node.js & Express**: Server-side runtime and web framework.
-   **MongoDB & Mongoose**: NoSQL database for storing user data, lab info, and progress.
-   **JWT (JSON Web Tokens)**: For secure user authentication.
-   **Docker Integration**: Interacting with Docker containers for labs.
-   **VirtualBox & Vagrant**: Managing the Kali Linux VM.

## Prerequisites

Before setting up the project, ensure you have the following installed:

-   **Node.js** (v18 or higher)
-   **npm** (Node Package Manager)
-   **MongoDB** (running locally or a cloud URI)
-   **Docker Desktop** (for containerized labs like DVWA)
-   **VirtualBox** (for Kali Linux VM)
-   **Vagrant** (for managing the Kali VM)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/edusec-labs.git
cd edusec-labs
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edusec-labs
JWT_SECRET=your_jwt_secret_key
# OPENAI_API_KEY=your_openai_key # Optional for AI Tutor
```

Initialize the database with default labs:

```bash
npm run init-labs
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or the port shown in your terminal).

### 4. Lab Environment Setup

#### Docker Labs (DVWA)
Ensure Docker Desktop is running. The backend will automatically manage the lifecycle of Docker containers when you start a lab from the dashboard.

#### Kali Linux VM
Navigate to the vagrant directory:

```bash
cd vagrant
```

Start the Kali Linux VM (this may take a while to download the box for the first time):

```bash
vagrant up
```

Once running, you can access the Kali machine via SSH or through the web terminal if configured.

## Usage

1.  Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
2.  Register a new account or log in.
3.  Browse the available labs on the dashboard.
4.  Click "Start Lab" to spin up the environment (e.g., DVWA).
5.  Use the provided access details to interact with the vulnerable target.
6.  Use the AI Assistant if you get stuck or need a hint.

## License

This project is licensed under the MIT License.

---

## 🚀 Deployment (Free Stack)

EduSec Labs uses a **split deployment** because the lab environments require a real Docker daemon:

```
Cloudflare Pages (FREE) ──API──▶ Oracle Cloud VM (FREE)
   React frontend                  Node.js + MongoDB + Docker labs
```

### Part 1 — Backend on Oracle Cloud (Always Free)

> Oracle Cloud gives you a permanent free ARM VM with 4 CPUs + 24 GB RAM — enough for the backend, MongoDB, and multiple Docker lab containers.

#### Step 1 — Create your Oracle Cloud VM

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) (free, credit card required but never charged)
2. Create an **Ampere A1** instance → Ubuntu 22.04 → Always Free shape
3. Note your **VM Public IP**
4. Open ports **5000** (TCP) in the VM's security list

#### Step 2 — Install Docker on the VM

SSH into your VM and run:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

#### Step 3 — Set up environment variables

```bash
git clone https://github.com/Aryan7878/edusec-lab.git ~/edusec-labs
cd ~/edusec-labs
cp .env.example .env
nano .env   # Fill in JWT_SECRET and CORS_ORIGIN
```

Key vars to set:
```env
JWT_SECRET=<run: openssl rand -base64 48>
CORS_ORIGIN=https://your-project.pages.dev
OPENAI_API_KEY=           # optional
```

#### Step 4 — Deploy with Docker Compose

```bash
docker compose -f docker-compose.prod.yml up -d --build

# Seed the database (run once)
docker exec edusec-labs-app node scripts/initLabs.js
docker exec edusec-labs-app node scripts/initChallenges.js
```

Your backend is now live at `http://<VM-IP>:5000` ✅

#### Step 5 — (Optional) One-command redeploy

From your local machine after pushing changes to GitHub:

```bash
./deploy.sh <VM-PUBLIC-IP>
```

---

### Part 2 — Frontend on Cloudflare Pages

1. Push your code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → **Create a project** → Connect GitHub repo
3. Set build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
4. Add an **environment variable** in Cloudflare Pages settings:
   - `VITE_API_URL` = `http://<YOUR-ORACLE-VM-IP>:5000`
5. Deploy — Cloudflare builds and hosts your React app globally ✅

> **Important**: After deploying Cloudflare Pages, copy your `.pages.dev` URL and update `CORS_ORIGIN` in your VM's `.env`, then re-run `docker compose -f docker-compose.prod.yml up -d`.

---

### Deployment Architecture Summary

| Component | Platform | Cost |
|-----------|----------|------|
| React Frontend | Cloudflare Pages | **Free** |
| Node.js Backend | Oracle Cloud A1 VM | **Free** |
| MongoDB | Docker on same VM | **Free** |
| Docker Lab Containers | Docker on same VM | **Free** |
| SSL/HTTPS | Cloudflare (auto) | **Free** |

**Total monthly cost: $0** 🎉
