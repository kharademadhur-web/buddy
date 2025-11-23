param(
  [switch]$BackendOnly,
  [switch]$FrontendOnly
)

$ErrorActionPreference = 'Stop'
$proj = 'D:\Madhur\ai_assistant_project'
Push-Location $proj

# Python venv
$venvPy = Join-Path $proj '.venv\Scripts\python.exe'
if (!(Test-Path $venvPy)) { python -m venv .venv }

& $venvPy -m pip install -r (Join-Path $proj 'backend\requirements.txt') | Out-Null

if (-not $FrontendOnly) {
  Write-Host 'Starting backend on http://localhost:8000' -ForegroundColor Cyan
  $args = @('-m','uvicorn','app.main:app','--app-dir',(Join-Path $proj 'backend'),'--reload','--port','8000')
  Start-Process -FilePath $venvPy -ArgumentList $args -WorkingDirectory (Join-Path $proj 'backend') -WindowStyle Minimized | Out-Null
}

if (-not $BackendOnly) {
  Write-Host 'Starting frontend dev on http://localhost:5173' -ForegroundColor Cyan
  Start-Process -FilePath cmd.exe -ArgumentList @('/c','npm','run','dev') -WorkingDirectory (Join-Path $proj 'frontend') -WindowStyle Minimized | Out-Null
}

Start-Sleep -Seconds 2
if (-not $BackendOnly) { Start-Process 'http://localhost:5173' | Out-Null }
if (-not $FrontendOnly) { Start-Process 'http://localhost:8000/docs' | Out-Null }

Pop-Location
