# ==========================================
# 🌌 MARSIL AI - Multi-Stage Dockerfile
# ==========================================

# --- Stage 1: Build the Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build the Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./

# --- Stage 3: Final Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built backend files and dependencies
COPY --from=backend-builder /app/backend ./backend
# Copy built frontend assets to a public directory in the backend to serve statically
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Expose backend port
EXPOSE 3001

# Command to launch Marsil Backend
CMD ["node", "backend/src/presentation/Server.js"]
