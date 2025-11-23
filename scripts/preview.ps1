$ErrorActionPreference = 'Stop'
$proj = 'D:\Madhur\ai_assistant_project'
Push-Location $proj

# Python venv
$venvPy = Join-Path $proj '.venv\Scripts\python.exe'
if (!(Test-Path $venvPy)) { python -m venv .venv }

& $venvPy -m pip install -r (Join-Path $proj 'backend\requirements.txt') | Out-Null

Write-Host 'Starting backend on http://localhost:8000' -ForegroundColor Cyan
$args = @('-m','uvicorn','app.main:app','--app-dir',(Join-Path $proj 'backend'),'--port','8000')
Start-Process -FilePath $venvPy -ArgumentList $args -WorkingDirectory (Join-Path $proj 'backend') -WindowStyle Minimized | Out-Null

Write-Host 'Serving frontend build on http://localhost:4173' -ForegroundColor Cyan
Start-Process -FilePath cmd.exe -ArgumentList @('/c','npm','run','build') -WorkingDirectory (Join-Path $proj 'frontend') -WindowStyle Minimized | Out-Null
Start-Sleep -Seconds 2
Start-Process -FilePath cmd.exe -ArgumentList @('/c','npm','run','preview') -WorkingDirectory (Join-Path $proj 'frontend') -WindowStyle Minimized | Out-Null

Start-Sleep -Seconds 2
Start-Process 'http://localhost:4173' | Out-Null
Start-Process 'http://localhost:8000/docs' | Out-Null

Pop-Location
