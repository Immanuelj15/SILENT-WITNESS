# ==========================================================
#  SILENT WITNESS: Headless Android SDK & Build Setup (Windows)
# ==========================================================
param(
    [string]$InstallDir = "$HOME\android-sdk"
)

$ErrorActionPreference = "Stop"

Write-Host "=== [1/5] Checking Java 17 Installation ===" -ForegroundColor Cyan
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "Installing OpenJDK 17 via Winget..." -ForegroundColor Yellow
    winget install EclipseAdoptium.Temurin.17.JDK --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "Java detected: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
}

Write-Host "=== [2/5] Setting Up Android SDK Directory: $InstallDir ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$InstallDir\cmdline-tools" | Out-Null

$CmdlineToolsPath = "$InstallDir\cmdline-tools\latest"
if (!(Test-Path "$CmdlineToolsPath\bin\sdkmanager.bat")) {
    Write-Host "Downloading Android Command-Line Tools..." -ForegroundColor Yellow
    $ZipUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $ZipFile = "$env:TEMP\cmdline-tools.zip"
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile

    $ExtractTemp = "$env:TEMP\cmdline-extracted"
    Expand-Archive -Path $ZipFile -DestinationPath $ExtractTemp -Force
    Move-Item -Path "$ExtractTemp\cmdline-tools" -Destination $CmdlineToolsPath -Force
    Remove-Item -Path $ZipFile, $ExtractTemp -Recurse -Force
}

Write-Host "=== [3/5] Configuring Environment Variables ===" -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $InstallDir, "User")
$env:ANDROID_HOME = $InstallDir

$SdkBin = "$CmdlineToolsPath\bin"
$PlatformTools = "$InstallDir\platform-tools"
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$SdkBin*") {
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$SdkBin;$PlatformTools", "User")
}
$env:PATH = "$env:PATH;$SdkBin;$PlatformTools"

Write-Host "=== [4/5] Accepting Licenses & Installing Platform 34 ===" -ForegroundColor Cyan
$ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
$ProcessInfo.FileName = "$SdkBin\sdkmanager.bat"
$ProcessInfo.Arguments = "--licenses"
$ProcessInfo.RedirectStandardInput = $true
$ProcessInfo.UseShellExecute = $false
$Process = [System.Diagnostics.Process]::Start($ProcessInfo)
for ($i = 0; $i -lt 15; $i++) {
    $Process.StandardInput.WriteLine("y")
}
$Process.WaitForExit()

& "$SdkBin\sdkmanager.bat" "platforms;android-34" "build-tools;34.0.0" "platform-tools"

Write-Host "=== [5/5] Setup Complete! Building Debug APK ===" -ForegroundColor Green
Set-Location "$PSScriptRoot\..\android"
.\gradlew.bat assembleDebug
