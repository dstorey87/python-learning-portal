# Infrastructure Documentation

This directory contains all infrastructure-related configurations for the Python Learning Portal microservice architecture.

## Directory Structure

```
infrastructure/
├── docker/                     # Docker orchestration
│   ├── docker-compose.dev.yml  # Development environment
│   ├── docker-compose.prod.yml # Production environment
│   └── nginx/                  # Nginx reverse proxy configs
│       └── nginx.prod.conf
├── terraform/                  # AWS infrastructure as code
│   └── lightsail.tf           # Lightsail container service
├── environments/              # Environment configurations
│   ├── .env.development      # Development variables
│   ├── .env.production       # Production variables
│   └── .env.example          # Template file
├── deploy.sh                 # Unix deployment script
└── deploy.ps1                # PowerShell deployment script
```

## Quick Start

### Development Environment

```powershell
# Start all services in development mode
./deploy.ps1 dev

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# Executor Service: http://localhost:3003
```

### Production Environment

```powershell
# Deploy production environment
./deploy.ps1 prod

# Access the application
# Application: http://localhost (via Nginx)
```

### Other Commands

```powershell
# Build all Docker images
./deploy.ps1 build

# Stop all services
./deploy.ps1 stop

# View logs
./deploy.ps1 logs [service-name]

# Check service health
./deploy.ps1 health

# Clean up containers and images
./deploy.ps1 clean
```

## Architecture

### Microservices

1. **Frontend Service** (`packages/@portal/frontend`)
   - React application with Vite
   - Serves static files and handles routing
   - Port: 5173 (dev), 80 (prod)

2. **Backend Service** (`packages/@portal/backend`)
   - Express.js API server
   - Handles authentication, data, and proxying
   - Port: 3001 (both dev/prod)

3. **Executor Service** (`packages/@portal/executor`)
   - Python code execution microservice
   - Isolated Python environment
   - Port: 3003 (both dev/prod)

4. **Nginx (Production Only)**
   - Reverse proxy and load balancer
   - SSL termination
   - Static file serving optimization
   - Port: 80/443

### Service Communication

```
Frontend → Nginx → Backend → Executor
   ↑                   ↑         ↑
   │                   │         │
5173/80              3001      3003
```

### Environment Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` | `https://...lightsail.com` |
| `BACKEND_URL` | Backend API URL | `http://localhost:3001` | `https://...lightsail.com/api` |
| `EXECUTOR_URL` | Executor service URL | `http://localhost:3003` | `http://executor:3000` |
| `CORS_ORIGINS` | Allowed CORS origins | Localhost variants | Production domain |

## Docker Configuration

### Development (`docker-compose.dev.yml`)

- **Hot Reload**: Source code mounted as volumes
- **Debug Logging**: Enhanced logging for development
- **Port Mapping**: Direct port access to services
- **No Resource Limits**: Full system resources available

### Production (`docker-compose.prod.yml`)

- **Optimized Builds**: Multi-stage builds with production targets
- **Resource Limits**: CPU and memory constraints
- **Health Checks**: Comprehensive service monitoring
- **Security**: Non-root users, security options
- **Nginx Proxy**: Production-grade reverse proxy

### Health Checks

All services include health check endpoints:

- **Frontend**: `GET /health` → 200 OK
- **Backend**: `GET /health` → 200 OK  
- **Executor**: `GET /health` → 200 OK
- **Nginx**: `GET /health` → 200 OK

## AWS Deployment

### Lightsail Container Service

The application is designed to deploy on AWS Lightsail Container Service:

- **Free Tier**: 3 months free, then $10/month
- **Resources**: 512MB RAM, 0.25 vCPU per service
- **Domain**: Auto-assigned `.cs.amazonlightsail.com` domain
- **SSL**: Automatic SSL certificate management

### Terraform Configuration

```powershell
# Initialize Terraform
./deploy.ps1 terraform init

# Plan deployment
./deploy.ps1 terraform plan

# Deploy infrastructure  
./deploy.ps1 terraform apply

# Destroy infrastructure
./deploy.ps1 terraform destroy
```

### Cost Management

The infrastructure is designed to stay within AWS Free Tier:

- **Lightsail Container**: $0 for 3 months, $10/month after
- **Data Transfer**: 1 TB/month included
- **Storage**: 20GB included
- **Total Cost**: ~$120/year maximum (within $100 credit budget)

## Security Features

### Container Security

- **Non-root Users**: All containers run as user 1000:1000
- **No New Privileges**: Prevents privilege escalation
- **Read-only Mounts**: Source code mounted read-only
- **Resource Limits**: CPU and memory constraints

### Network Security

- **Internal Networks**: Services communicate via Docker networks
- **CORS Protection**: Strict origin validation
- **Security Headers**: X-Frame-Options, CSP, HSTS
- **SSL/TLS**: HTTPS-only in production

### Application Security

- **Input Validation**: All user inputs validated
- **Code Sandboxing**: Python execution in isolated environment
- **API Rate Limiting**: Request throttling
- **Error Handling**: Secure error messages

## Monitoring and Logging

### Health Monitoring

```powershell
# Check all service health
./deploy.ps1 health

# View real-time logs
./deploy.ps1 logs

# View specific service logs
./deploy.ps1 logs backend
```

### Log Aggregation

Logs are structured and include:

- **Timestamp**: ISO 8601 format
- **Level**: DEBUG, INFO, WARN, ERROR
- **Service**: Service identifier
- **Message**: Detailed log message
- **Context**: Request ID, user ID (if applicable)

### Performance Metrics

- **Response Times**: API endpoint performance
- **Error Rates**: Service error percentages  
- **Resource Usage**: CPU, memory, disk utilization
- **Request Volume**: Traffic patterns and peaks

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```powershell
   # Stop other services using ports 3000-3003, 5173
   ./deploy.ps1 stop
   ```

2. **Build Failures**
   ```powershell
   # Clean and rebuild
   ./deploy.ps1 clean
   ./deploy.ps1 build
   ```

3. **Service Startup Issues**
   ```powershell
   # Check logs for errors
   ./deploy.ps1 logs [service-name]
   
   # Check service health
   ./deploy.ps1 health
   ```

4. **Environment Issues**
   ```powershell
   # Verify environment file
   cat infrastructure/environments/.env.development
   
   # Recreate from template
   cp infrastructure/environments/.env.example .env
   ```

### Debug Mode

Enable verbose logging for debugging:

```powershell
./deploy.ps1 dev -Verbose
```

## Migration Guide

### From Legacy Architecture

If migrating from the old monolithic structure:

1. **Stop Old Services**
   ```powershell
   docker-compose down
   ```

2. **Clean Up**
   ```powershell
   ./infrastructure/deploy.ps1 clean
   ```

3. **Start New Architecture**
   ```powershell
   ./infrastructure/deploy.ps1 dev
   ```

4. **Verify Migration**
   ```powershell
   ./infrastructure/deploy.ps1 health
   ```

### Data Migration

- **No Database**: Application is stateless
- **User Data**: Stored in browser localStorage
- **Configuration**: Environment variables only

## Development Workflow

### Local Development

1. **Start Services**
   ```powershell
   ./infrastructure/deploy.ps1 dev
   ```

2. **Make Changes**
   - Frontend changes hot-reload automatically
   - Backend changes require service restart
   - Executor changes require service restart

3. **Test Changes**
   ```powershell
   ./infrastructure/deploy.ps1 health
   ./infrastructure/deploy.ps1 logs
   ```

4. **Stop Services**
   ```powershell
   ./infrastructure/deploy.ps1 stop
   ```

### Production Deployment

1. **Build and Test**
   ```powershell
   ./infrastructure/deploy.ps1 build
   ./infrastructure/deploy.ps1 prod
   ```

2. **Deploy to AWS**
   ```powershell
   ./infrastructure/deploy.ps1 terraform apply
   ```

3. **Verify Deployment**
   - Check application URL
   - Run health checks
   - Monitor logs

## Support

For issues and questions:

1. **Check Logs**: `./deploy.ps1 logs`
2. **Verify Health**: `./deploy.ps1 health` 
3. **Review Documentation**: This README
4. **Check Requirements**: Docker, Docker Compose installed
5. **Verify Ports**: No conflicts on 3000-3003, 5173