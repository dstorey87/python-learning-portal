#!/usr/bin/env bash

# Python Learning Portal Deployment Script
# Handles both development and production deployments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infrastructure/docker"
ENV_DIR="$PROJECT_ROOT/infrastructure/environments"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    dev         Start development environment
    prod        Deploy production environment  
    build       Build all Docker images
    stop        Stop all containers
    clean       Clean up containers, images, and volumes
    logs        Show container logs
    health      Check service health
    terraform   Run Terraform commands

Options:
    --rebuild   Force rebuild of Docker images
    --verbose   Enable verbose output
    --help      Show this help message

Examples:
    $0 dev                    # Start development environment
    $0 prod --rebuild         # Deploy production with rebuild
    $0 logs backend           # Show backend service logs
    $0 terraform plan         # Run terraform plan
EOF
}

# Check prerequisites
check_prereqs() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is required but not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is required but not installed"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build executor service
    log "Building executor service..."
    docker build -t python-portal-executor:latest packages/@portal/executor/
    
    # Build backend service
    log "Building backend service..."
    docker build -t python-portal-backend:latest backend/
    
    # Build frontend service
    log "Building frontend service..."
    docker build -t python-portal-frontend:latest frontend/
    
    success "All images built successfully"
}

# Start development environment
start_dev() {
    log "Starting development environment..."
    
    cd "$DOCKER_DIR"
    
    # Copy environment file
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        cp "$ENV_DIR/.env.development" "$PROJECT_ROOT/.env"
        log "Copied development environment file"
    fi
    
    # Build if requested or if images don't exist
    if [[ "$REBUILD" == "true" ]] || ! docker images | grep -q python-portal; then
        build_images
    fi
    
    # Start services
    docker-compose -f docker-compose.dev.yml up -d
    
    success "Development environment started"
    log "Frontend: http://localhost:5173"
    log "Backend API: http://localhost:3001"
    log "Executor Service: http://localhost:3003"
}

# Deploy production environment
start_prod() {
    log "Deploying production environment..."
    
    cd "$DOCKER_DIR"
    
    # Copy environment file
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        cp "$ENV_DIR/.env.production" "$PROJECT_ROOT/.env"
        log "Copied production environment file"
    fi
    
    # Always build for production
    build_images
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    success "Production environment deployed"
    log "Application: http://localhost"
}

# Stop all containers
stop_containers() {
    log "Stopping all containers..."
    
    cd "$DOCKER_DIR"
    
    # Stop development containers
    if [[ -f docker-compose.dev.yml ]]; then
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    fi
    
    # Stop production containers
    if [[ -f docker-compose.prod.yml ]]; then
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    fi
    
    success "All containers stopped"
}

# Clean up everything
clean_all() {
    log "Cleaning up containers, images, and volumes..."
    
    stop_containers
    
    # Remove images
    docker rmi $(docker images "python-portal-*" -q) 2>/dev/null || true
    
    # Remove volumes
    docker volume prune -f
    
    # Remove networks
    docker network prune -f
    
    success "Cleanup completed"
}

# Show logs
show_logs() {
    local service="$1"
    
    cd "$DOCKER_DIR"
    
    if [[ -n "$service" ]]; then
        log "Showing logs for $service..."
        docker-compose -f docker-compose.dev.yml logs -f "$service" 2>/dev/null || \
        docker-compose -f docker-compose.prod.yml logs -f "$service"
    else
        log "Showing all service logs..."
        docker-compose -f docker-compose.dev.yml logs -f 2>/dev/null || \
        docker-compose -f docker-compose.prod.yml logs -f
    fi
}

# Check service health
check_health() {
    log "Checking service health..."
    
    local services=("frontend" "backend" "executor")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local container=$(docker ps --filter "name=$service" --format "{{.Names}}" | head -1)
        
        if [[ -n "$container" ]]; then
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            
            if [[ "$health" == "healthy" ]]; then
                success "$service: healthy"
            else
                error "$service: $health"
                all_healthy=false
            fi
        else
            error "$service: not running"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == "true" ]]; then
        success "All services are healthy"
    else
        error "Some services are unhealthy"
        exit 1
    fi
}

# Run Terraform commands
run_terraform() {
    local tf_command="$1"
    shift
    
    cd "$PROJECT_ROOT/infrastructure/terraform"
    
    log "Running terraform $tf_command..."
    
    case "$tf_command" in
        "init")
            terraform init
            ;;
        "plan")
            terraform plan "$@"
            ;;
        "apply")
            terraform apply "$@"
            ;;
        "destroy")
            warning "This will destroy all Terraform-managed resources!"
            read -p "Are you sure? (yes/no): " confirm
            if [[ "$confirm" == "yes" ]]; then
                terraform destroy "$@"
            else
                log "Terraform destroy cancelled"
            fi
            ;;
        *)
            terraform "$tf_command" "$@"
            ;;
    esac
}

# Parse command line arguments
REBUILD=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild)
            REBUILD=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Main command processing
case "${1:-help}" in
    "dev")
        check_prereqs
        start_dev
        ;;
    "prod")
        check_prereqs
        start_prod
        ;;
    "build")
        check_prereqs
        build_images
        ;;
    "stop")
        stop_containers
        ;;
    "clean")
        clean_all
        ;;
    "logs")
        show_logs "$2"
        ;;
    "health")
        check_health
        ;;
    "terraform")
        shift
        run_terraform "$@"
        ;;
    "help"|*)
        usage
        exit 0
        ;;
esac