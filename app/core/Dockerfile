# Multi-stage Docker build for secure HTTPS deployment
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY ./frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY ./frontend/ ./

# Build frontend static files
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY ./backend/package*.json ./
RUN npm ci

# Copy backend source
COPY ./backend/ ./

# Build backend
RUN npm run build

# Stage 3: Final production image with Nginx + Node
FROM node:18-alpine

# Install nginx and openssl for SSL certificates
RUN apk add --no-cache nginx openssl

# Create nginx directories (nginx user already exists)
RUN mkdir -p /var/log/nginx /var/cache/nginx /etc/nginx/conf.d /etc/nginx/ssl && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx /etc/nginx/ssl

# Create working directories
WORKDIR /app

# Install backend production dependencies
COPY ./backend/package*.json ./backend/
RUN cd ./backend && npm ci --only=production

# Copy built backend from backend-builder stage
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create SSL certificate directory and generate self-signed certificates
# In production, replace with your actual SSL certificates
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42School/OU=Transcendence/CN=localhost"

# Copy nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Create startup script
RUN printf '#!/bin/sh\n\n# Start nginx in background\nnginx -g "daemon off;" &\n\n# Start backend Node.js application\ncd /app/backend && node dist/server.js &\n\n# Wait for any process to exit\nwait -n\n\n# Exit with status of process that exited first\nexit $?\n' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose HTTPS port only
EXPOSE 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider https://localhost:443/healthcheck || exit 1

# Start both services
CMD ["/app/start.sh"] 