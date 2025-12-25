#!/usr/bin/env pwsh
# PassVault Mobile - Launch Script

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "║         🔐  PassVault Mobile - Launch Script         ║" -ForegroundColor Cyan
Write-Host "║                                                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in mobile directory" -ForegroundColor Red
    Write-Host "Please run: cd e:\PRODIGY\PassVault\mobile" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Checking project structure..." -ForegroundColor Green

$requiredFiles = @(
    "App.js",
    "app.json",
    "package.json",
    "src\screens\LoginScreen.js",
    "src\screens\UnlockScreen.js",
    "src\screens\VaultScreen.js",
    "src\utils\api.js",
    "src\utils\storage.js",
    "src\vault\crypto.js",
    "src\vault\sync.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ $file (MISSING)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All required files present!" -ForegroundColor Green
Write-Host ""

# Check if backend is running
Write-Host "🔍 Checking backend server..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend server not detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start backend:" -ForegroundColor Yellow
    Write-Host "  cd e:\PRODIGY\PassVault\backend" -ForegroundColor Gray
    Write-Host "  python app.py" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

Write-Host ""
Write-Host "🚀 Starting Expo development server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Scan QR code with Expo Go app" -ForegroundColor Yellow
Write-Host "   OR" -ForegroundColor Yellow
Write-Host "   Press 'a' for Android emulator" -ForegroundColor Yellow
Write-Host "   Press 'i' for iOS simulator (macOS only)" -ForegroundColor Yellow
Write-Host ""

# Start Expo
npx expo start
