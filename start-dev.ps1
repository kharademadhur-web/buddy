# Start both backend and frontend servers in separate windows

# Backend (FastAPI) on port 8000
Write-Host "Starting backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process PowerShell -ArgumentList '-NoExit', '-Command', 'cd D:\Madhur\ai_assistant_project\backend; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000'

# Wait 2 seconds for backend to start
Start-Sleep -Seconds 2

# Frontend (Vite) on port 5173 with API base environment variable
Write-Host "Starting frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process PowerShell -ArgumentList '-NoExit', '-Command', 'cd D:\Madhur\ai_assistant_project\frontend; $env:VITE_API_BASE="http://127.0.0.1:8000"; npm run dev'

Write-Host "`n✅ Both services started in new windows." -ForegroundColor Green
Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor Cyan
