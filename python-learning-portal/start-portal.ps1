# Simple startup script to replace the overly complex background-service-v2.ps1
# This provides the basic functionality needed without 679 lines of complexity

param(
    [string]$Action = "start"
)

$BackendPath = ".\backend"
$FrontendPath = ".\frontend"
$LogFile = "portal.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Tee-Object -FilePath $LogFile -Append | Write-Host
}

function Start-Services {
    Write-Log "🚀 Starting Python Learning Portal..."
    
    # Check if directories exist
    if (!(Test-Path $BackendPath) -or !(Test-Path $FrontendPath)) {
        Write-Log "❌ Backend or frontend directory not found. Run from project root."
        exit 1
    }
    
    # Start backend
    Write-Log "📊 Starting backend service..."
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $BackendPath -WindowStyle Hidden
    
    # Wait a moment for backend to start
    Start-Sleep -Seconds 3
    
    # Start frontend  
    Write-Log "🌐 Starting frontend service..."
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $FrontendPath -WindowStyle Hidden
    
    Write-Log "✅ Services started successfully!"
    Write-Log "🌍 Frontend: http://localhost:3010"
    Write-Log "📊 Backend: http://localhost:3050"
    Write-Log "📝 Logs: $LogFile"
}

function Stop-Services {
    Write-Log "🛑 Stopping services..."
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Log "✅ Services stopped"
}

# Main execution
switch ($Action.ToLower()) {
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { 
        Stop-Services
        Start-Sleep -Seconds 2
        Start-Services 
    }
    default {
        Write-Host "Usage: .\start-portal.ps1 [start|stop|restart]"
        Write-Host "Default action: start"
    }
}