# Clean up stale processes
Write-Host "Cleaning up stale processes..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue

Write-Host "Starting Backend..."
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd backend; .\venv\Scripts\Activate; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`""

Write-Host "Starting Frontend..."
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "Both servers are launching in separate windows."
Write-Host "Backend  ->  http://localhost:8000"
Write-Host "Frontend ->  http://localhost:3000"
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop."
