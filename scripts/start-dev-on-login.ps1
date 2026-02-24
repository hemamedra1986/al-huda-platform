# Start dev server for al-huda-platform
# Place this file in the repository and register it to run at user logon (see STARTUP_SETUP.md)

$project = "C:\Users\Lenovo\al-huda-platform"

try {
    Set-Location -Path $project
} catch {
    Write-Error "Cannot change to project directory: $project"
    exit 1
}

# Open a new PowerShell window and run the clean dev flow there so it stays alive after login
$psArgs = "-NoExit", "-Command", "cd '$project'; if (Test-Path package.json) { npm run dev:clean } else { Write-Host 'package.json not found in $project' }"
Start-Process -FilePath "powershell.exe" -ArgumentList $psArgs -WindowStyle Normal
