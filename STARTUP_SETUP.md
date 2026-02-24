Auto-start dev server (Windows)

This repository includes a helper script `scripts/start-dev-on-login.ps1` that opens a new PowerShell window and runs `npm run dev` in the project folder.

Two recommended ways to run it at login:

1) Create a Scheduled Task (recommended):

Open an elevated PowerShell or CMD once and run:

```powershell
schtasks /Create /SC ONLOGON /RL HIGHEST /TN "AlHuda Start Dev" /TR "powershell -ExecutionPolicy Bypass -File \"C:\Users\Lenovo\al-huda-platform\scripts\start-dev-on-login.ps1\""
```

This will run the script each time you sign in.

2) Use the Startup folder (per-user):
- Create a shortcut to run PowerShell with the script, and place the shortcut in `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`.
- Shortcut target example:

```
powershell -ExecutionPolicy Bypass -File "C:\Users\Lenovo\al-huda-platform\scripts\start-dev-on-login.ps1"
```

Notes & security:
- The script runs `npm run dev` — ensure your environment has `node` and `npm` available in PATH.
- If you prefer the script to run only when you explicitly want it, do not register it; instead run it manually.
- `git` was not available in the current environment where development was performed; commits must be made locally if you want versioned saves.

If you want, I can also provide a one-line `schtasks` command adjusted to run only on the current user or to start minimized.
