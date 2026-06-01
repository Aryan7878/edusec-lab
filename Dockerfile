# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend and serve the entire app
FROM node:18-alpine
WORKDIR /app

# Install the Docker CLI so the Node app can run docker commands against the host's Docker socket
RUN apk add --no-cache docker-cli

# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --only=production

# Copy backend source code and compiled frontend dist
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000
CMD ["node", "server.js"]
