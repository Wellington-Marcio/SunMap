param(
  [int]$Port = 3001
)

try {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    Write-Host "Port $Port is in use"
    exit 1
  } else {
    Write-Host "Port $Port free"
    exit 0
  }
} catch {
  Write-Host "Unable to check port $Port: $_"
  exit 2
}
