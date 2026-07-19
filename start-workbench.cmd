@echo off
setlocal
cd /d "%~dp0"

echo =============================================
echo Hengmao Local Product Content Workbench
echo =============================================
echo.
echo Starting local server at:
echo http://127.0.0.1:4175/admin.html
echo.
echo Keep this window open while editing products.
echo Press Ctrl+C to stop the server.
echo.

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:4175/admin.html'"
call npm.cmd run workbench

echo.
echo The workbench server has stopped.
pause
