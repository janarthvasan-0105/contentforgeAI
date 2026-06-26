# start-dev.ps1 — Safe startup for ContentForge on Windows

$PY   = "C:\Users\janar\AppData\Local\Programs\Python\Python312\python.exe"
$ROOT = "D:\ContentForge"

Write-Host "Cleaning up stale processes..." -ForegroundColor Cyan
Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Stop-Process -Name node   -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Backend — PowerShell window with real console
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process "powershell" -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$ROOT\backend'; & '$PY' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

# Frontend — cmd.exe to bypass PowerShell Execution Policy
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process "cmd.exe" -ArgumentList `
  "/K", "cd /d $ROOT\frontend && npm run dev"

Write-Host ""
Write-Host "Both servers are launching in separate windows." -ForegroundColor Cyan
Write-Host "Backend  →  http://localhost:8000" -ForegroundColor White
Write-Host "Frontend →  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop." -ForegroundColor Yellow
