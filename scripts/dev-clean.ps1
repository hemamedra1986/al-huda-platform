$ErrorActionPreference = "SilentlyContinue"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -Path $projectRoot

# Stop any lingering Next.js dev node processes for this project
$escapedProjectRoot = [Regex]::Escape($projectRoot)
$nodeProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"

foreach ($process in $nodeProcesses) {
    $commandLine = $process.CommandLine
    if (
        $commandLine -match "next" -and
        $commandLine -match "dev" -and
        $commandLine -match $escapedProjectRoot
    ) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Milliseconds 700

# Remove stale Next.js dev lock file if present
$lockFile = Join-Path $projectRoot ".next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
}

$ErrorActionPreference = "Continue"
npm run dev