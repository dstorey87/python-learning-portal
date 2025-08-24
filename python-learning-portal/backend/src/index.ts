import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { initializeDatabase } from './database/init';
import { exerciseRoutes } from './routes/exercises';
import { userRoutes } from './routes/users';
import { executionRoutes } from './routes/execution';
import { progressRoutes } from './routes/progress';

const app = express();
const DEFAULT_PORT = 3050;  // Use our dedicated backend port range 3050-3060

// Function to find an available port in our dedicated range
async function findAvailablePort(startPort: number = 3050): Promise<number> {
  return new Promise((resolve, reject) => {
    const currentPort = startPort;
    const maxPort = 3060;  // Backend dedicated range: 3050-3060

    function tryPort(port: number): void {
      if (port > maxPort) {
        reject(new Error(`No available ports in backend range (3050-3060)`));
        return;
      }

      const server = app.listen(port)
        .on('listening', () => {
          server.close(() => {
            resolve(port);
          });
        })
        .on('error', (err: Error & { code?: string }) => {
          if (err.code === 'EADDRINUSE' && port < maxPort) {
            tryPort(port + 1);
          } else {
            reject(new Error(`No available ports in backend range (3050-3060). ${err.message}`));
          }
        });
    }

    tryPort(currentPort);
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Code execution rate limiting (more restrictive)
const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 code executions per minute
  message: 'Too many code executions, please wait before trying again.',
});

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - flexible port handling
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, only allow specific domains
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = ['https://your-domain.com'];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    }
    
    // In development, allow any localhost port between 3000-3010
    const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1):30\d{2}$/;
    if (localhostPattern.test(origin)) {
      return callback(null, true);
    }
    
    // Fallback: allow the origin
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/execution', executionLimiter, executionRoutes);
app.use('/api/progress', progressRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Find an available port starting from the default
    const requestedPort = parseInt(process.env.PORT || DEFAULT_PORT.toString());
    let port: number;
    
    try {
      port = await findAvailablePort(requestedPort);
      if (port !== requestedPort) {
        console.log(`⚠️ Port ${requestedPort} is busy, using port ${port} instead`);
      }
    } catch (error) {
      console.error('❌ Could not find available port:', error);
      // Wait a bit and retry
      console.log('🔄 Retrying in 3 seconds...');
      setTimeout(() => startServer(), 3000);
      return;
    }
    
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔗 CORS enabled for frontend at http://localhost:3010-3020`);
      console.log(`⚙️  Backend dedicated port range: 3050-3060`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('🔄 Retrying in 5 seconds...');
    // Don't exit, retry instead
    setTimeout(() => startServer(), 5000);
  }
}

// Graceful shutdown with cleanup
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.log('🔄 Attempting to restart server...');
  setTimeout(() => {
    startServer();
  }, 2000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Attempting to restart server...');
  setTimeout(() => {
    startServer();
  }, 2000);
});

// Start the server with fault tolerance
startServer().catch((error) => {
  console.error('💥 Fatal error starting server:', error);
  console.log('🔄 Will retry in 10 seconds...');
  setTimeout(() => startServer(), 10000);
});

export default app;