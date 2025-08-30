# Multi-stage build for Python Executor Service
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

# Install Python and security tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    && addgroup -g 1001 -S executor \
    && adduser -S executor -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=executor:executor /app/dist ./dist
COPY --from=builder --chown=executor:executor /app/node_modules ./node_modules
COPY --from=builder --chown=executor:executor /app/package.json ./

# Create temp directory with proper permissions
RUN mkdir -p /app/temp && chown -R executor:executor /app/temp

# Switch to non-root user for security
USER executor

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the service
CMD ["node", "dist/index.js"]