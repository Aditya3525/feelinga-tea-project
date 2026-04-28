@echo off
setlocal
set ROOT=%~dp0..
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\graphify-refresh.ps1" "%ROOT%"
endlocal
