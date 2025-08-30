# @portal/backend

Independent Express API server for the Python Learning Portal.

## Purpose

This package provides the backend API services for the Python Learning Portal, including:

- Exercise management and retrieval
- User authentication and progress tracking
- Python code execution coordination
- RESTful API endpoints
- Health monitoring and metrics

## Architecture

This is a **loosely coupled, independently deployable** backend service that:

- Uses `@portal/types` for shared type definitions
- Provides RESTful API endpoints for frontend consumption  
- Manages SQLite database for persistence
- Coordinates with Python execution services
- Supports horizontal scaling and containerization

## API Endpoints

### Health Checks
- `GET /health` - General health status
- `GET /health/ready` - Readiness probe for Kubernetes
- `GET /health/live` - Liveness probe for Kubernetes

### Core API
- `GET /api/exercises` - List all exercises
- `GET /api/exercises/:id` - Get specific exercise
- `POST /api/execution` - Execute Python code
- `GET /api/users/:id` - Get user information
- `POST /api/users` - Create/update user
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress` - Update user progress

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Environment Variables

```env
NODE_ENV=production
PORT=3050
DATABASE_PATH=./data/portal.db
LOG_LEVEL=info
```

## Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY data ./data
EXPOSE 3050
CMD ["npm", "start"]
```

## Database

Uses SQLite for development and production. Database files are stored in the `data/` directory.

## Deployment

This package is designed for independent deployment:

- Can be deployed as a standalone service
- Supports containerization with Docker
- Compatible with Kubernetes deployment
- Includes comprehensive health checks
- Supports horizontal scaling

## Dependencies

- **Runtime**: Express.js, SQLite, security middleware
- **Types**: `@portal/types` for shared type definitions
- **Development**: TypeScript, ESLint, Jest

## Port Configuration

- **Development**: 3050 (with auto-fallback to 3051-3060)
- **Production**: Configurable via PORT environment variable
- **Health checks**: Available on main port

## Security Features

- Helmet.js for security headers
- Rate limiting for API and code execution
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection prevention