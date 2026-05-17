Write-Host "=== Revisando estructura ==="
$requiredFiles = @(
  "App.tsx",
  "app.json",
  "eas.json",
  "package.json",
  "src\state\AppContext.tsx",
  "src\components\TopBar.tsx",
  "src\components\Card.tsx",
  "assets\icon.png",
  "assets\adaptive-icon.png",
  "assets\splash.png"
)

foreach ($file in $requiredFiles) {
  if (Test-Path $file) {
    Write-Host "[OK] $file"
  } else {
    Write-Host "[FALTA] $file"
  }
}

Write-Host ""
Write-Host "=== Versiones importantes ==="
node -v
npm -v

Write-Host ""
Write-Host "=== TypeScript ==="
npm run typecheck

Write-Host ""
Write-Host "=== Expo Doctor ==="
npx expo-doctor