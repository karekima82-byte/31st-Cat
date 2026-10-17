@echo off
setlocal
cd /d "%~dp0"
set "RETRACE_NODE="
where node >nul 2>nul
if not errorlevel 1 set "RETRACE_NODE=node"
if not defined RETRACE_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "RETRACE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined RETRACE_NODE (
  echo Node.js was not found. Please open this folder from Codex and run: node tools/serve.mjs --lan
  pause
  exit /b 1
)
echo RE:TRACE - Smartphone preview
echo Keep this window open while reading on your phone.
echo Connect your PC and phone to the same Wi-Fi.
"%RETRACE_NODE%" tools/serve.mjs --lan
pause
