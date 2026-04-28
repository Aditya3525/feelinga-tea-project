param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

Push-Location $ProjectRoot
try {
  Write-Host "[graphify] Refreshing code graph in $(Get-Location)..."
  graphify update .
  Write-Host "[graphify] Done. Outputs in graphify-out/"
}
finally {
  Pop-Location
}
