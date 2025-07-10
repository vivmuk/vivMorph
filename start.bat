@echo off
echo Starting Photo Studio...
echo.
echo Starting HTTP server on port 8000...
start /b python -m http.server 8000
echo.
echo Waiting for server to start...
timeout /t 2 /nobreak >nul
echo.
echo Opening Photo Studio in your browser...
start http://localhost:8000
echo.
echo Photo Studio is now running!
echo Visit: http://localhost:8000
echo.
echo Press any key to stop the server...
pause >nul
echo.
echo Stopping server...
taskkill /f /im python.exe 2>nul
echo Done. 