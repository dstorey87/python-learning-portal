# Python Learning Portal Deployment Script (PowerShell)
# Handles both development and production deployments

param(
    [Parameter(Position=0)]
    [ValidateSet('dev', 'prod', 'build', 'stop', 'clean', 'logs', 'health', 'terraform', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Position=1)]
    [string]$Service = '',
    
    [switch]$Rebuild,
    [switch]$Verbose,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptDir
$DockerDir = Join-Path $ProjectRoot "infrastructure\docker"
$EnvDir = Join-Path $ProjectRoot "infrastructure\environments"

# Colors for output
$Colors = @{
    Red = 'Red'
    Green = 'Green'
    Yellow = 'Yellow'
    Blue = 'Blue'
    White = 'White'
}

# Logging functions
function Write-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Show usage
function Show-Usage {
    Write-Host @"
Usage: .\deploy.ps1 [COMMAND] [OPTIONS]

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
    -Rebuild    Force rebuild of Docker images
    -Verbose    Enable verbose output
    -Help       Show this help message

Examples:
    .\deploy.ps1 dev                    # Start development environment
    .\deploy.ps1 prod -Rebuild          # Deploy production with rebuild
    .\deploy.ps1 logs backend           # Show backend service logs
    .\deploy.ps1 terraform plan         # Run terraform plan
"@
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is required but not installed"
        exit 1
    }
    
    if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is required but not installed"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Build Docker images
function Build-Images {
    Write-Log "Building Docker images..."
    
    Push-Location $ProjectRoot
    
    try {
        # Build executor service
        Write-Log "Building executor service..."
        docker build -t python-portal-executor:latest packages/@portal/executor/
        
        # Build backend service
        Write-Log "Building backend service..."
        docker build -t python-portal-backend:latest backend/
        
        # Build frontend service
        Write-Log "Building frontend service..."
        docker build -t python-portal-frontend:latest frontend/
        
        Write-Success "All images built successfully"
    }
    finally {
        Pop-Location
    }
}

# Start development environment
function Start-Development {
    Write-Log "Starting development environment..."
    
    Push-Location $DockerDir
    
    try {
        # Copy environment file
        $envFile = Join-Path $ProjectRoot ".env"
        if (!(Test-Path $envFile)) {
            Copy-Item (Join-Path $EnvDir ".env.development") $envFile
            Write-Log "Copied development environment file"
        }
        
        # Build if requested or if images don't exist
        if ($Rebuild -or !(docker images | Select-String "python-portal")) {
            Build-Images
        }
        
        # Start services
        docker-compose -f docker-compose.dev.yml up -d
        
        Write-Success "Development environment started"
        Write-Log "Frontend: http://localhost:5173"
        Write-Log "Backend API: http://localhost:3001"
        Write-Log "Executor Service: http://localhost:3003"
    }
    finally {
        Pop-Location
    }
}

# Deploy production environment
function Start-Production {
    Write-Log "Deploying production environment..."
    
    Push-Location $DockerDir
    
    try {
        # Copy environment file
        $envFile = Join-Path $ProjectRoot ".env"
        if (!(Test-Path $envFile)) {
            Copy-Item (Join-Path $EnvDir ".env.production") $envFile
            Write-Log "Copied production environment file"
        }
        
        # Always build for production
        Build-Images
        
        # Start services
        docker-compose -f docker-compose.prod.yml up -d
        
        Write-Success "Production environment deployed"
        Write-Log "Application: http://localhost"
    }
    finally {
        Pop-Location
    }
}

# Stop all containers
function Stop-Containers {
    Write-Log "Stopping all containers..."
    
    Push-Location $DockerDir
    
    try {
        # Stop development containers
        if (Test-Path "docker-compose.dev.yml") {
            docker-compose -f docker-compose.dev.yml down 2>$null
        }
        
        # Stop production containers
        if (Test-Path "docker-compose.prod.yml") {
            docker-compose -f docker-compose.prod.yml down 2>$null
        }
        
        Write-Success "All containers stopped"
    }
    finally {
        Pop-Location
    }
}

# Clean up everything
function Remove-All {
    Write-Log "Cleaning up containers, images, and volumes..."
    
    Stop-Containers
    
    # Remove images
    $images = docker images --filter "reference=python-portal-*" -q
    if ($images) {
        docker rmi $images 2>$null
    }
    
    # Remove volumes
    docker volume prune -f
    
    # Remove networks
    docker network prune -f
    
    Write-Success "Cleanup completed"
}

# Show logs
function Show-Logs {
    param([string]$ServiceName)
    
    Push-Location $DockerDir
    
    try {
        if ($ServiceName) {
            Write-Log "Showing logs for $ServiceName..."
            $devResult = docker-compose -f docker-compose.dev.yml logs -f $ServiceName 2>$null
            if (!$devResult) {
                docker-compose -f docker-compose.prod.yml logs -f $ServiceName
            }
        } else {
            Write-Log "Showing all service logs..."
            $devResult = docker-compose -f docker-compose.dev.yml logs -f 2>$null
            if (!$devResult) {
                docker-compose -f docker-compose.prod.yml logs -f
            }
        }
    }
    finally {
        Pop-Location
    }
}

# Check service health
function Test-Health {
    Write-Log "Checking service health..."
    
    $services = @("frontend", "backend", "executor")
    $allHealthy = $true
    
    foreach ($service in $services) {
        $container = docker ps --filter "name=$service" --format "{{.Names}}" | Select-Object -First 1
        
        if ($container) {
            $health = docker inspect --format='{{.State.Health.Status}}' $container 2>$null
            if (!$health) { $health = "unknown" }
            
            if ($health -eq "healthy") {
                Write-Success "$service`: healthy"
            } else {
                Write-Error "$service`: $health"
                $allHealthy = $false
            }
        } else {
            Write-Error "$service`: not running"
            $allHealthy = $false
        }
    }
    
    if ($allHealthy) {
        Write-Success "All services are healthy"
    } else {
        Write-Error "Some services are unhealthy"
        exit 1
    }
}

# Run Terraform commands
function Invoke-Terraform {
    param([string[]]$TerraformArgs)
    
    $tfCommand = $TerraformArgs[0]
    $tfArgs = $TerraformArgs[1..($TerraformArgs.Length-1)]
    
    Push-Location (Join-Path $ProjectRoot "infrastructure\terraform")
    
    try {
        Write-Log "Running terraform $tfCommand..."
        
        switch ($tfCommand) {
            "init" {
                terraform init
            }
            "plan" {
                terraform plan @tfArgs
            }
            "apply" {
                terraform apply @tfArgs
            }
            "destroy" {
                Write-Warning "This will destroy all Terraform-managed resources!"
                $confirm = Read-Host "Are you sure? (yes/no)"
                if ($confirm -eq "yes") {
                    terraform destroy @tfArgs
                } else {
                    Write-Log "Terraform destroy cancelled"
                }
            }
            default {
                terraform $tfCommand @tfArgs
            }
        }
    }
    finally {
        Pop-Location
    }
}

# Main execution
if ($Help) {
    Show-Usage
    exit 0
}

if ($Verbose) {
    $VerbosePreference = "Continue"
}

switch ($Command) {
    'dev' {
        Test-Prerequisites
        Start-Development
    }
    'prod' {
        Test-Prerequisites
        Start-Production
    }
    'build' {
        Test-Prerequisites
        Build-Images
    }
    'stop' {
        Stop-Containers
    }
    'clean' {
        Remove-All
    }
    'logs' {
        Show-Logs $Service
    }
    'health' {
        Test-Health
    }
    'terraform' {
        $remainingArgs = $args
        Invoke-Terraform $remainingArgs
    }
    default {
        Show-Usage
    }
}