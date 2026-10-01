# ==========================================================
#  SILENT WITNESS: Headless Android SDK & Build Setup (Windows)
# ==========================================================
param(
    [string]$InstallDir = "$HOME\android-sdk"
)

# Use Continue so stderr from native binaries (like java -version) does not abort PowerShell
$ErrorActionPreference = "Continue"
if (Test-Path Variable:\PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}

Write-Host "=== [1/5] Checking Java Installation ===" -ForegroundColor Cyan
$javaCmd = Get-Command java.exe -ErrorAction SilentlyContinue

if (-not $javaCmd) {
    Write-Host "Installing OpenJDK 17 via Winget..." -ForegroundColor Yellow
    winget install EclipseAdoptium.Temurin.17.JDK --accept-package-agreements --accept-source-agreements
    $javaCmd = Get-Command java.exe -ErrorAction SilentlyContinue
}

if ($javaCmd) {
    $javaPath = $javaCmd.Source
    $detectedJavaHome = (Get-Item $javaPath).Directory.Parent.FullName
    Write-Host "Found Java executable at: $javaPath" -ForegroundColor Green
    Write-Host "Configuring JAVA_HOME to: $detectedJavaHome" -ForegroundColor Green
    $env:JAVA_HOME = $detectedJavaHome
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $detectedJavaHome, "User")
} else {
    Write-Error "Could not find or install Java. Please install Java 17 or higher."
    exit 1
}

Write-Host "`n=== [2/5] Setting Up Android SDK Directory: $InstallDir ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$InstallDir\cmdline-tools" | Out-Null

$CmdlineToolsPath = "$InstallDir\cmdline-tools\latest"
if (!(Test-Path "$CmdlineToolsPath\bin\sdkmanager.bat")) {
    Write-Host "Downloading Android Command-Line Tools from Google..." -ForegroundColor Yellow
    $ZipUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $ZipFile = "$env:TEMP\cmdline-tools.zip"

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile -UseBasicParsing

    $ExtractTemp = "$env:TEMP\cmdline-extracted"
    if (Test-Path $ExtractTemp) { Remove-Item $ExtractTemp -Recurse -Force }
    Expand-Archive -Path $ZipFile -DestinationPath $ExtractTemp -Force

    if (Test-Path "$ExtractTemp\cmdline-tools") {
        if (Test-Path $CmdlineToolsPath) { Remove-Item $CmdlineToolsPath -Recurse -Force }
        Move-Item -Path "$ExtractTemp\cmdline-tools" -Destination $CmdlineToolsPath -Force
    }
    Remove-Item -Path $ZipFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $ExtractTemp -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Command-Line Tools installed successfully." -ForegroundColor Green
} else {
    Write-Host "Android Command-Line tools already exist at $CmdlineToolsPath" -ForegroundColor Green
}

Write-Host "`n=== [3/5] Configuring Environment Variables ===" -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $InstallDir, "User")
$env:ANDROID_HOME = $InstallDir

$SdkBin = "$CmdlineToolsPath\bin"
$PlatformTools = "$InstallDir\platform-tools"
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$SdkBin*") {
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$SdkBin;$PlatformTools", "User")
}
$env:PATH = "$env:PATH;$SdkBin;$PlatformTools;$env:JAVA_HOME\bin"

Write-Host "`n=== [4/5] Accepting Licenses & Installing Platform 34 ===" -ForegroundColor Cyan
$sdkManagerBat = "$SdkBin\sdkmanager.bat"

if (Test-Path $sdkManagerBat) {
    Write-Host "Accepting licenses automatically..." -ForegroundColor Yellow
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = $sdkManagerBat
    $pinfo.Arguments = "--licenses"
    $pinfo.RedirectStandardInput = $true
    $pinfo.UseShellExecute = $false
    $p = [System.Diagnostics.Process]::Start($pinfo)
    for ($i = 0; $i -lt 20; $i++) {
        $p.StandardInput.WriteLine("y")
    }
    $p.WaitForExit()

    Write-Host "Installing platforms;android-34, build-tools;34.0.0, and platform-tools..." -ForegroundColor Yellow
    & $sdkManagerBat "platforms;android-34" "build-tools;34.0.0" "platform-tools"
} else {
    Write-Error "sdkmanager.bat was not found at $sdkManagerBat"
    exit 1
}

Write-Host "`n=== [5/5] Setup Complete! Building Debug APK ===" -ForegroundColor Green
$androidDir = Join-Path $PSScriptRoot "..\android"
Set-Location $androidDir
.\gradlew.bat assembleDebug
