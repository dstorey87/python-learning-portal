FROM node:18-alpine

# Install Python for code execution
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy shared types into backend
COPY python-learning-portal/shared ./backend/src/shared/

# Copy and build backend (lightweight)
COPY python-learning-portal/backend/src ./backend/src
COPY python-learning-portal/backend/package.json ./backend/
COPY python-learning-portal/backend/tsconfig.json ./backend/
COPY index.docker.ts ./backend/src/index.ts

# Copy and build frontend (lightweight)  
COPY python-learning-portal/shared ./frontend/src/shared/
COPY python-learning-portal/frontend/src ./frontend/src
COPY python-learning-portal/frontend/public ./frontend/public
COPY python-learning-portal/frontend/index.html ./frontend/
COPY python-learning-portal/frontend/package.json ./frontend/
COPY python-learning-portal/frontend/vite.config.ts ./frontend/
COPY python-learning-portal/frontend/tsconfig*.json ./frontend/
COPY python-learning-portal/frontend/tailwind.config.js ./frontend/
COPY python-learning-portal/frontend/postcss.config.cjs ./frontend/
COPY vite.frontend.docker.config.ts ./frontend/vite.config.ts
COPY tsconfig.frontend.docker.json ./frontend/tsconfig.json

# Install dependencies and build
RUN cd backend && npm install && npm run build
RUN cd frontend && npm install && npm run build

# Serve frontend from backend (copy to compiled location)
RUN mkdir -p backend/dist/backend/public && cp -r frontend/dist/* backend/dist/backend/public/ 2>/dev/null || true

# Create data directory for SQLite database (at the correct compiled path)
RUN mkdir -p backend/dist/backend/data

# Copy exercises directory for loading into database
COPY exercises ./exercises
COPY solutions ./solutions

# Load exercises into database during build
WORKDIR /app/backend
# Create data directory structure that matches the compiled code expectations
RUN mkdir -p data
RUN npx ts-node src/scripts/loadExercises.ts

# Copy the populated database to the runtime location
RUN cp data/database.sqlite dist/backend/data/database.sqlite

EXPOSE 3000

CMD ["npm", "start"]