#!/usr/bin/env pwsh

# SAFE CLEANUP SCRIPT - Only for emergency process cleanup
# This script ONLY kills processes and does NOT start any services

Write-Host "🛡️  SAFE CLEANUP TOOL - Process Killer Only" -ForegroundColor Cyan
Write-Host "This script will ONLY kill runaway processes and will NOT start any services!" -ForegroundColor Green
Write-Host ""

$processesToKill = @("node", "npm", "npx", "esbuild", "eslint", "vite", "tsc", "webpack", "cmd", "ts-node", "ts-node-dev")
$totalKilled = 0

Write-Host "Scanning for problematic processes..." -ForegroundColor Yellow

# Show what we found first
foreach ($processName in $processesToKill) {
    $count = (Get-Process -Name $processName -ErrorAction SilentlyContinue | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "Found $count $processName processes" -ForegroundColor Red
    }
}

Write-Host ""
$response = Read-Host "Kill all these processes? (y/N)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "🚨 KILLING PROCESSES..." -ForegroundColor Red
    
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
                            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                            $totalKilled++
                            Write-Host "Force killed $processName (PID: $($process.Id))" -ForegroundColor Red
                        } catch {
                            Write-Host "Failed to kill $processName (PID: $($process.Id))" -ForegroundColor Red
                        }
                    }
                }
            } catch {
                # Process type not found, ignore
            }
        }
        
        if ($attempt -lt 3) {
            Start-Sleep -Seconds 1
        }
    }
    
    Write-Host "✅ Cleanup complete. Killed $totalKilled processes." -ForegroundColor Green
    
    # Final count
    $remaining = 0
    foreach ($processName in $processesToKill) {
        $remaining += (Get-Process -Name $processName -ErrorAction SilentlyContinue | Measure-Object).Count
    }
    
    if ($remaining -gt 0) {
        Write-Host "⚠️  WARNING: $remaining processes still remain." -ForegroundColor Yellow
    } else {
        Write-Host "✅ All targeted processes eliminated!" -ForegroundColor Green
    }
    
} else {
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To manually start services:" -ForegroundColor Cyan
Write-Host "  Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor White