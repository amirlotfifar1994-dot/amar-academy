@echo off
setlocal
cd /d "%~dp0"
set "AMAR_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
echo Open http://127.0.0.1:5180/ in your browser.
echo Keep this window open while using the app. Press Ctrl+C to stop.
if exist "%AMAR_PYTHON%" (
  "%AMAR_PYTHON%" -m http.server 5180 --bind 127.0.0.1 --directory dist
) else (
  python -m http.server 5180 --bind 127.0.0.1 --directory dist
)
pause
