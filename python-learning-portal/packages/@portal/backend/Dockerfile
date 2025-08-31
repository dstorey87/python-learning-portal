# Backend Service Dockerfile
# Production-ready Node.js container for @portal/backend

FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies for building
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application inside Docker
RUN npm run build

# Create necessary directories
RUN mkdir -p temp logs dist data

# Set production environment
ENV NODE_ENV=production
ENV PORT=3050

# Expose backend port
EXPOSE 3050

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3050/health', (res) => { res.statusCode === 200 ? process.exit(0) : process.exit(1) }).on('error', () => process.exit(1))"

# Run the application
CMD ["node", "dist/index.js"]