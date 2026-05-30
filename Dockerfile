# ==========================================
# 🌌 MARSIL AI - Multi-Stage Production Dockerfile
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
# Copy built frontend assets to serve statically
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Create secure non-root user and group
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app

# Switch to non-root user for security hardening
USER app

# Expose backend port
EXPOSE 3001

# Production Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/health || exit 1

# Command to launch Marsil Backend
CMD ["node", "backend/src/presentation/Server.js"]
