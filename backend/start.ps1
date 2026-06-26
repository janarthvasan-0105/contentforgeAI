# start.ps1 — Safe startup with log cleanup

$PY = "C:\Users\janar\AppData\Local\Programs\Python\Python312\python.exe"

# Kill any stale Python backend processes
Write-Host "Checking for stale processes..."
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Clear old log
if (Test-Path "server.log") { Remove-Item "server.log" -Force }

Write-Host "Starting ContentForge backend (without reload to avoid Windows Named Pipe permission issues)..."
& $PY -m uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 |
  Tee-Object -FilePath server.log
