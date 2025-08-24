#!/usr/bin/env pwsh

# Python Learning Portal - Background Service V2
# Completely redesigned for maximum reliability

param(
    [string]$Action = "help"
)

# ================================================================
# EMERGENCY CLEANUP FUNCTION
# ================================================================

function Invoke-EmergencyCleanup {
    Write-Host "🚨 EMERGENCY CLEANUP - Killing all related processes..." -ForegroundColor Red
    
    $processesToKill = @("node", "npm", "npx", "esbuild", "eslint", "vite", "tsc", "webpack", "cmd", "ts-node", "ts-node-dev")
    $totalKilled = 0
    
    # Kill processes multiple times to ensure they're dead
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        Write-Host "Cleanup attempt $attempt..." -ForegroundColor Yellow
        
        foreach ($processName in $processesToKill) {
            try {
                $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
                foreach ($process in $processes) {
                    try {
                        $process.Kill()
                        $totalKilled++
                        Write-Host "Killed $processName (PID: $($process.Id))" -ForegroundColor Yellow
                        Start-Sleep -Milliseconds 10
                    } catch {
                        try {
                            # Force kill if normal kill fails
                            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                            $totalKilled++
                            Write-Host "Force killed $processName (PID: $($process.Id))" -ForegroundColor Red
                        } catch {
                            Write-Host "Failed to kill $processName (PID: $($process.Id)): $($_.Exception.Message)" -ForegroundColor Red
                        }
                    }
                }
            } catch {
                # Process type not found, ignore
            }
        }
        
        if ($attempt -lt 3) {
            Start-Sleep -Seconds 2
        }
    }
    
    # Also kill any PowerShell processes that might be background services
    try {
        $currentPid = [System.Diagnostics.Process]::GetCurrentProcess().Id
        $backgroundServices = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object { 
            $_.Id -ne $currentPid -and ($_.CommandLine -like "*background-service*" -or $_.CommandLine -like "*python-learning-portal*")
        }
        foreach ($process in $backgroundServices) {
            try {
                $process.Kill()
                $totalKilled++
                Write-Host "Killed background PowerShell service (PID: $($process.Id))" -ForegroundColor Red
            } catch {
                Write-Host "Failed to kill PowerShell service (PID: $($process.Id)): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } catch {
        # Ignore errors
    }
    
    Write-Host "✅ Emergency cleanup complete. Killed $totalKilled processes total." -ForegroundColor Green
    
    # Final verification
    $remaining = 0
    foreach ($processName in $processesToKill) {
        $count = (Get-Process -Name $processName -ErrorAction SilentlyContinue | Measure-Object).Count
        $remaining += $count
    }
    
    if ($remaining -gt 0) {
        Write-Host "⚠️  WARNING: $remaining processes still remain. You may need to restart your computer." -ForegroundColor Yellow
    } else {
        Write-Host "✅ All problematic processes eliminated!" -ForegroundColor Green
    }
}

# ================================================================
# CONFIGURATION
# ================================================================

$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$PID_FILE = Join-Path $PROJECT_ROOT "service-v2.pid"
$LOG_FILE = Join-Path $PROJECT_ROOT "service-v2.log"

# Port ranges for services (dedicated to avoid conflicts)
$BACKEND_PORTS = @(3050..3060)
$FRONTEND_PORTS = @(3010..3020)

# ================================================================
# LOGGING SYSTEM
# ================================================================

function Write-ServiceLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Console output
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "INFO"  { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry }
    }
    
    # File output
    try {
        Add-Content -Path $LOG_FILE -Value $logEntry -ErrorAction SilentlyContinue
    } catch {
        # Ignore file logging errors
    }
}

# ================================================================
# PORT MANAGEMENT
# ================================================================

function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connections = netstat -an | Where-Object { $_ -match ":$Port " }
        return $connections.Count -gt 0
    } catch {
        return $false
    }
}

function Get-AvailablePort {
    param([int[]]$PortRange)
    
    foreach ($port in $PortRange) {
        if (-not (Test-PortInUse -Port $port)) {
            return $port
        }
    }
    return $null
}

function Get-ProcessOnPort {
    param([int]$Port)
    
    try {
        $netstatResult = netstat -ano | Select-String ":$Port "
        if ($netstatResult) {
            $processId = ($netstatResult -split '\s+')[-1]
            return Get-Process -Id $processId -ErrorAction SilentlyContinue
        }
    } catch {
        return $null
    }
    return $null
}

# ================================================================
# PROCESS MANAGEMENT
# ================================================================

function Stop-ServiceProcesses {
    Write-ServiceLog "EMERGENCY: Stopping ALL development processes to prevent loops..."
    
    # Kill ALL development-related processes aggressively
    $processesToKill = @("node", "npm", "npx", "esbuild", "eslint", "vite", "tsc", "webpack", "ts-node", "ts-node-dev")
    $totalKilled = 0
    
    foreach ($processName in $processesToKill) {
        try {
            $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
            foreach ($process in $processes) {
                Write-ServiceLog "KILLING $processName process: PID $($process.Id)"
                try {
                    $process.Kill()
                    $totalKilled++
                    Start-Sleep -Milliseconds 50
                } catch {
                    try {
                        # Force kill if normal kill fails
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                        $totalKilled++
                    } catch {
                        Write-ServiceLog "Failed to stop $processName process $($process.Id): $($_.Exception.Message)" "WARN"
                    }
                }
            }
        } catch {
            # Process type not found, ignore
        }
    }
    
    # Kill ALL cmd processes to prevent shell loops
    try {
        $cmdProcesses = Get-Process -Name "cmd" -ErrorAction SilentlyContinue
        foreach ($process in $cmdProcesses) {
            Write-ServiceLog "KILLING CMD process: PID $($process.Id)"
            try {
                $process.Kill()
                $totalKilled++
                Start-Sleep -Milliseconds 50
            } catch {
                try {
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                    $totalKilled++
                } catch {
                    Write-ServiceLog "Failed to stop CMD process $($process.Id): $($_.Exception.Message)" "WARN"
                }
            }
        }
    } catch {
        # Ignore errors
    }
    
    # Kill any PowerShell processes that might be service instances (except current)
    try {
        $currentPid = [System.Diagnostics.Process]::GetCurrentProcess().Id
        $powershellProcesses = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object { 
            $_.Id -ne $currentPid -and ($_.CommandLine -like "*background-service*" -or $_.CommandLine -like "*python-learning-portal*")
        }
        foreach ($process in $powershellProcesses) {
            Write-ServiceLog "KILLING PowerShell service process: PID $($process.Id)"
            try {
                $process.Kill()
                $totalKilled++
                Start-Sleep -Milliseconds 50
            } catch {
                try {
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                    $totalKilled++
                } catch {
                    Write-ServiceLog "Failed to stop PowerShell process $($process.Id): $($_.Exception.Message)" "WARN"
                }
            }
        }
    } catch {
        # Ignore errors
    }
    
    Write-ServiceLog "KILLED $totalKilled processes total"
    
    # Stop processes on specific ports
    $stoppedAny = $false
    
    # Stop processes on backend ports
    foreach ($port in $BACKEND_PORTS) {
        $process = Get-ProcessOnPort -Port $port
        if ($process) {
            Write-ServiceLog "Stopping backend process on port $port (PID: $($process.Id))"
            try {
                $process.Kill()
                $stoppedAny = $true
                Start-Sleep -Milliseconds 500
            } catch {
                Write-ServiceLog "Failed to stop process on port $port`: $($_.Exception.Message)" "WARN"
            }
        }
    }
    
    # Stop processes on frontend ports  
    foreach ($port in $FRONTEND_PORTS) {
        $process = Get-ProcessOnPort -Port $port
        if ($process) {
            Write-ServiceLog "Stopping frontend process on port $port (PID: $($process.Id))"
            try {
                $process.Kill()
                $stoppedAny = $true
                Start-Sleep -Milliseconds 500
            } catch {
                Write-ServiceLog "Failed to stop process on port $port`: $($_.Exception.Message)" "WARN"
            }
        }
    }
    
    if ($stoppedAny -or $totalKilled -gt 0) {
        Write-ServiceLog "Waiting for processes to fully terminate..."
        Start-Sleep -Seconds 5  # Longer wait to ensure cleanup
    } else {
        Write-ServiceLog "No existing services found"
    }
}

# ================================================================
# SERVICE STARTUP
# ================================================================

function Start-BackendService {
    param([int]$Port = $null)
    
    Write-ServiceLog "Backend service DISABLED to prevent process loops" "WARN"
    Write-ServiceLog "To enable services, manually run: cd backend && npm run dev" "INFO"
    
    # COMPLETELY DISABLED to prevent loops
    return $null
    
    <# DISABLED CODE TO PREVENT LOOPS
    Write-ServiceLog "Starting backend service..."
    
    if (-not (Test-Path $BACKEND_DIR)) {
        Write-ServiceLog "Backend directory not found: $BACKEND_DIR" "ERROR"
        return $null
    }
    
    if (-not $Port) {
        $Port = Get-AvailablePort -PortRange $BACKEND_PORTS
        if (-not $Port) {
            Write-ServiceLog "No available backend ports!" "ERROR"
            return $null
        }
    }
    
    Write-ServiceLog "Starting backend on port $Port"
    
    # Store the backend port globally for frontend reference
    $script:backendPort = $Port
    
    try {
        # Use npx to run ts-node-dev directly
        $npxExe = (Get-Command npx -ErrorAction Stop).Source
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = $npxExe
        $processInfo.Arguments = "ts-node-dev --respawn --transpile-only src/index.ts"
        $processInfo.WorkingDirectory = $BACKEND_DIR
        $processInfo.UseShellExecute = $false
        $processInfo.CreateNoWindow = $true
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        
        # Set environment variables directly
        $processInfo.EnvironmentVariables["PORT"] = $Port.ToString()
        $processInfo.EnvironmentVariables["NODE_ENV"] = "development"
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        if ($process.HasExited) {
            Write-ServiceLog "Backend process exited immediately" "ERROR"
            return $null
        }
        
        Write-ServiceLog "Backend started with PID: $($process.Id) on port $Port"
        
        return @{
            Process = $process
            Port = $Port
            Type = "Backend"
        }
    } catch {
        Write-ServiceLog "Failed to start backend: $($_.Exception.Message)" "ERROR"
        Write-ServiceLog "Backend will be disabled for this session" "WARN"
        return $null
    }
    #>
}

function Start-FrontendService {
    param([int]$Port = $null)
    
    Write-ServiceLog "Frontend service DISABLED to prevent process loops" "WARN"
    Write-ServiceLog "To enable services, manually run: cd frontend && npm run dev" "INFO"
    
    # COMPLETELY DISABLED to prevent loops
    return $null
    
    <# DISABLED CODE TO PREVENT LOOPS
    Write-ServiceLog "Starting frontend service..."
    
    if (-not (Test-Path $FRONTEND_DIR)) {
        Write-ServiceLog "Frontend directory not found: $FRONTEND_DIR" "ERROR"
        return $null
    }
    
    if (-not $Port) {
        $Port = Get-AvailablePort -PortRange $FRONTEND_PORTS
        if (-not $Port) {
            Write-ServiceLog "No available frontend ports!" "ERROR"
            return $null
        }
    }
    
    Write-ServiceLog "Starting frontend on port $Port"
    
    try {
        # Use direct npx execution to avoid shell spawning
        $npxExe = (Get-Command npx -ErrorAction Stop).Source
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = $npxExe
        $processInfo.Arguments = "vite --port $Port --host --no-open"
        $processInfo.WorkingDirectory = $FRONTEND_DIR
        $processInfo.UseShellExecute = $false
        $processInfo.CreateNoWindow = $true
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        
        # Set environment variables directly
        if ($script:backendPort) {
            $processInfo.EnvironmentVariables["VITE_API_URL"] = "http://localhost:$($script:backendPort)"
        }
        $processInfo.EnvironmentVariables["NODE_ENV"] = "development"
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        if ($process.HasExited) {
            Write-ServiceLog "Frontend process exited immediately" "ERROR"
            return $null
        }
        
        Write-ServiceLog "Frontend started with PID: $($process.Id) on port $Port"
        
        return @{
            Process = $process
            Port = $Port
            Type = "Frontend"
        }
    } catch {
        Write-ServiceLog "Failed to start frontend: $($_.Exception.Message)" "ERROR"
        Write-ServiceLog "Frontend will be disabled for this session" "WARN"
        return $null
    }
    #>
}

# ================================================================
# HEALTH MONITORING
# ================================================================

function Test-ServiceHealth {
    param([int]$Port, [string]$Type)
    
    try {
        $endpoint = if ($Type -eq "Backend") { "/health" } else { "/" }
        $uri = "http://localhost:$Port$endpoint"
        
        $response = Invoke-WebRequest -Uri $uri -TimeoutSec 5 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# ================================================================
# MAIN SERVICE LOOP
# ================================================================

function Start-ServiceMonitoring {
    Write-ServiceLog "=== BACKGROUND SERVICE V2 (CLEANUP MODE) ==="
    Write-ServiceLog "Project root: $PROJECT_ROOT"
    
    # Safety check: prevent runaway process creation
    $nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object).Count
    $powershellCount = (Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Measure-Object).Count
    $cmdCount = (Get-Process -Name "cmd" -ErrorAction SilentlyContinue | Measure-Object).Count
    
    Write-ServiceLog "Current process counts - Node: $nodeCount, PowerShell: $powershellCount, CMD: $cmdCount"
    
    if ($nodeCount -gt 50 -or $powershellCount -gt 20 -or $cmdCount -gt 10) {
        Write-ServiceLog "DANGER: Too many processes detected! Node: $nodeCount, PowerShell: $powershellCount, CMD: $cmdCount" "ERROR"
        Write-ServiceLog "Aborting to prevent resource exhaustion." "ERROR"
        return
    }
    
    # Save PID
    try {
        $currentProcess = [System.Diagnostics.Process]::GetCurrentProcess()
        Set-Content -Path $PID_FILE -Value $currentProcess.Id
        Write-ServiceLog "PID file created: $($currentProcess.Id)"
    } catch {
        Write-ServiceLog "Failed to create PID file: $($_.Exception.Message)" "ERROR"
    }
    
    # FORCE Stop existing services - this is the main purpose now
    Stop-ServiceProcesses
    
    Write-ServiceLog "SERVICES DISABLED - All processes cleaned up!"
    Write-ServiceLog "To start services manually:"
    Write-ServiceLog "  Backend:  cd backend && npm run dev"
    Write-ServiceLog "  Frontend: cd frontend && npm run dev"
    Write-ServiceLog "Service will monitor for runaway processes and clean them up..."
    
    # Simple monitoring loop - just cleanup, no service starting
    $cleanupCount = 0
    while ($true) {
        Start-Sleep -Seconds 60  # Check every minute
        
        # Count potentially problematic processes
        $nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object).Count
        $cmdCount = (Get-Process -Name "cmd" -ErrorAction SilentlyContinue | Measure-Object).Count
        $eslintCount = (Get-Process -Name "eslint*" -ErrorAction SilentlyContinue | Measure-Object).Count
        $esbuildCount = (Get-Process -Name "*esbuild*" -ErrorAction SilentlyContinue | Measure-Object).Count
        
        $totalProblematic = $nodeCount + $cmdCount + $eslintCount + $esbuildCount
        
        if ($totalProblematic -gt 10) {
            Write-ServiceLog "WARNING: Detected $totalProblematic potentially problematic processes" "WARN"
            Write-ServiceLog "Node: $nodeCount, CMD: $cmdCount, ESLint: $eslintCount, ESBuild: $esbuildCount" "WARN"
            
            # Auto-cleanup if too many processes
            if ($totalProblematic -gt 20) {
                Write-ServiceLog "AUTO-CLEANUP: Too many processes, cleaning up..." "ERROR"
                Stop-ServiceProcesses
                $cleanupCount++
                
                if ($cleanupCount -gt 5) {
                    Write-ServiceLog "TOO MANY CLEANUP ATTEMPTS - STOPPING MONITORING TO PREVENT LOOPS" "ERROR"
                    break
                }
            }
        } else {
            Write-ServiceLog "System healthy - $totalProblematic development processes running"
            $cleanupCount = 0  # Reset cleanup counter when system is healthy
        }
    }
}

# ================================================================
# SERVICE STATUS
# ================================================================

function Show-ServiceStatus {
    Write-Host "Python Learning Portal Service V2 Status:" -ForegroundColor Cyan
    
    # Check if service process is running
    if (Test-Path $PID_FILE) {
        $servicePid = Get-Content $PID_FILE -ErrorAction SilentlyContinue
        $serviceProcess = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
        
        if ($serviceProcess) {
            Write-Host "✅ Service: RUNNING (PID: $servicePid)" -ForegroundColor Green
        } else {
            Write-Host "❌ Service: NOT RUNNING" -ForegroundColor Red
            Remove-Item $PID_FILE -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "❌ Service: NOT RUNNING" -ForegroundColor Red
    }
    
    # Check backend ports
    $backendHealthy = $false
    foreach ($port in $BACKEND_PORTS) {
        if (Test-ServiceHealth -Port $port -Type "Backend") {
            Write-Host "✅ Backend: HEALTHY (port $port)" -ForegroundColor Green
            $backendHealthy = $true
            break
        }
    }
    if (-not $backendHealthy) {
        Write-Host "❌ Backend: DOWN" -ForegroundColor Red
    }
    
    # Check frontend ports
    $frontendHealthy = $false
    foreach ($port in $FRONTEND_PORTS) {
        if (Test-ServiceHealth -Port $port -Type "Frontend") {
            Write-Host "✅ Frontend: HEALTHY (port $port)" -ForegroundColor Green
            $frontendHealthy = $true
            break
        }
    }
    if (-not $frontendHealthy) {
        Write-Host "❌ Frontend: DOWN" -ForegroundColor Red
    }
    
    # Recent logs
    if (Test-Path $LOG_FILE) {
        Write-Host "`nRecent logs:" -ForegroundColor Yellow
        $recentLogs = Get-Content $LOG_FILE -Tail 5 -ErrorAction SilentlyContinue
        $recentLogs | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    }
}

# ================================================================
# SERVICE CONTROL
# ================================================================

function Stop-BackgroundService {
    if (Test-Path $PID_FILE) {
        $servicePid = Get-Content $PID_FILE -ErrorAction SilentlyContinue
        $process = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-ServiceLog "Stopping background service (PID: $servicePid)..."
            $process.Kill()
            Remove-Item $PID_FILE -ErrorAction SilentlyContinue
        }
    }
    
    Stop-ServiceProcesses
    Write-Host "✅ Service stopped" -ForegroundColor Green
}

# ================================================================
# MAIN ENTRY POINT
# ================================================================

switch ($Action.ToLower()) {
    "start" {
        # Emergency check first
        $nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object).Count
        $cmdCount = (Get-Process -Name "cmd" -ErrorAction SilentlyContinue | Measure-Object).Count
        $esbuildCount = (Get-Process -Name "*esbuild*" -ErrorAction SilentlyContinue | Measure-Object).Count
        
        if ($nodeCount -gt 20 -or $cmdCount -gt 10 -or $esbuildCount -gt 10) {
            Write-Host "🚨 DANGER: Too many processes detected!" -ForegroundColor Red
            Write-Host "Node: $nodeCount, CMD: $cmdCount, ESBuild: $esbuildCount" -ForegroundColor Yellow
            Write-Host "Run with 'emergency' action first to clean up!" -ForegroundColor Red
            exit 1
        }
        
        # Check for existing service instances
        if (Test-Path $PID_FILE) {
            $servicePid = Get-Content $PID_FILE -ErrorAction SilentlyContinue
            $existing = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
            if ($existing) {
                Write-Host "⚠️  Service already running (PID: $servicePid). Use 'restart' to force restart." -ForegroundColor Yellow
                exit 1
            } else {
                # PID file exists but process is dead - clean it up
                Remove-Item $PID_FILE -ErrorAction SilentlyContinue
            }
        }
        
        Write-ServiceLog "Starting Python Learning Portal Background Service V2..."
        Start-ServiceMonitoring
    }
    
    "stop" {
        Stop-BackgroundService
    }
    
    "status" {
        Show-ServiceStatus
    }
    
    "restart" {
        Stop-BackgroundService
        Start-Sleep -Seconds 2
        & $MyInvocation.MyCommand.Path -Action "start"
    }
    
    "emergency" {
        Invoke-EmergencyCleanup
    }
    
    default {
        Write-Host @"
Python Learning Portal - Background Service V2

Usage: background-service-v2.ps1 [ACTION]

Actions:
  start      - Start the background service
  stop       - Stop the background service  
  status     - Show service status
  restart    - Restart the service
  emergency  - 🚨 Emergency cleanup of all related processes
  help       - Show this help

The service will:
- Monitor backend on ports 3050-3060
- Monitor frontend on ports 3010-3020  
- Automatically restart failed services
- Run completely detached from terminals

⚠️  If you see runaway processes, use 'emergency' action first!
"@ -ForegroundColor Cyan
    }
}