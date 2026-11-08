# Mo tunnel ngrok toi backend MRP (cong 3000).
# Authtoken nam trong cau hinh ngrok cua may, khong ghi vao repo.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$projectConfig = Join-Path $root "ngrok.yml"

$agentConfig = Join-Path $env:LOCALAPPDATA "ngrok\ngrok.yml"
if (-not (Test-Path -LiteralPath $agentConfig)) {
  $fallback = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA "Packages") -Filter "ngrok.yml" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "\\ngrok\\ngrok\.yml$" } |
    Select-Object -First 1
  if (-not $fallback) {
    throw "Chua co authtoken. Chay: ngrok config add-authtoken <token>"
  }
  $agentConfig = $fallback.FullName
}

Write-Host "Tunnel MRP -> http://127.0.0.1:3000"
& ngrok start mrp --config $agentConfig --config $projectConfig --log stdout --log-format logfmt
