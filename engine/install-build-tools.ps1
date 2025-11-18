# Install Build Tools for ZeroConfig Engine
# Run this script as Administrator

Write-Host "ZeroConfig Build Tools Installer" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To run as admin:" -ForegroundColor Cyan
    Write-Host "  1. Press Windows + X" -ForegroundColor Gray
    Write-Host "  2. Select 'Windows PowerShell (Admin)' or 'Terminal (Admin)'" -ForegroundColor Gray
    Write-Host "  3. Run this script again" -ForegroundColor Gray
    exit 1
}

# Check if Chocolatey is installed
Write-Host "Checking for Chocolatey..." -ForegroundColor Yellow

try {
    choco --version | Out-Null
    Write-Host "✓ Chocolatey is installed" -ForegroundColor Green
} catch {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✓ Chocolatey installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Choose build toolchain:" -ForegroundColor Cyan
Write-Host "  1. MinGW-w64 (Recommended - faster install, ~500MB)" -ForegroundColor White
Write-Host "  2. Visual Studio Build Tools (Complete - ~7GB)" -ForegroundColor White
Write-Host "  3. Both (for maximum compatibility)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Installing MinGW-w64..." -ForegroundColor Yellow
        choco install mingw -y
        refreshenv
        Write-Host "✓ MinGW-w64 installed" -ForegroundColor Green

        # Set GNU as default
        Write-Host "Setting Rust to use GNU toolchain..." -ForegroundColor Yellow
        rustup default stable-x86_64-pc-windows-gnu
        Write-Host "✓ Rust configured for GNU" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "Installing Visual Studio Build Tools..." -ForegroundColor Yellow
        Write-Host "This will download ~7GB and may take some time..." -ForegroundColor Gray
        choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --includeOptional --passive" -y
        Write-Host "✓ Visual Studio Build Tools installed" -ForegroundColor Green

        # Set MSVC as default
        Write-Host "Setting Rust to use MSVC toolchain..." -ForegroundColor Yellow
        rustup default stable-x86_64-pc-windows-msvc
        Write-Host "✓ Rust configured for MSVC" -ForegroundColor Green
    }
    "3" {
        Write-Host ""
        Write-Host "Installing both toolchains..." -ForegroundColor Yellow

        Write-Host "  Installing MinGW-w64..." -ForegroundColor Gray
        choco install mingw -y

        Write-Host "  Installing Visual Studio Build Tools..." -ForegroundColor Gray
        choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --includeOptional --passive" -y

        refreshenv
        Write-Host "✓ Both toolchains installed" -ForegroundColor Green

        Write-Host "Setting Rust to use MSVC by default..." -ForegroundColor Yellow
        rustup default stable-x86_64-pc-windows-msvc
        Write-Host "✓ Rust configured for MSVC" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow

# Check Rust
Write-Host "  Checking Rust..." -ForegroundColor Gray
rustc --version
cargo --version

# Check compiler
if ($choice -eq "1" -or $choice -eq "3") {
    Write-Host "  Checking GCC..." -ForegroundColor Gray
    gcc --version | Select-Object -First 1
}

Write-Host ""
Write-Host "✓ Build tools installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Close this PowerShell window" -ForegroundColor White
Write-Host "  2. Open a new terminal" -ForegroundColor White
Write-Host "  3. Navigate to the engine directory:" -ForegroundColor White
Write-Host "     cd C:\Users\judic\OneDrive\Desktop\zero-config\engine" -ForegroundColor Gray
Write-Host "  4. Build the project:" -ForegroundColor White
Write-Host "     cargo build --release" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
