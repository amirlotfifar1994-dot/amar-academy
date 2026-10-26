@echo off
setlocal
cd /d "%~dp0"
if not exist "dist\index.html" (
  echo The built app is missing. Install Node.js and pnpm, then run: pnpm install --frozen-lockfile ^&^& pnpm build
  goto finish
)
echo Open http://127.0.0.1:5180/ in your browser.
echo Keep this window open while using the app. Press Ctrl+C to stop.
py -3 --version >nul 2>&1
if not errorlevel 1 (
  py -3 -m http.server 5180 --bind 127.0.0.1 --directory dist
  goto finish
)
python -c "import sys; sys.exit(0 if sys.version_info.major == 3 else 1)" >nul 2>&1
if not errorlevel 1 (
  python -m http.server 5180 --bind 127.0.0.1 --directory dist
  goto finish
)
python3 -c "import sys; sys.exit(0 if sys.version_info.major == 3 else 1)" >nul 2>&1
if not errorlevel 1 (
  python3 -m http.server 5180 --bind 127.0.0.1 --directory dist
  goto finish
)
echo Python 3 was not found. Install Python 3, or follow docs/TRANSFER.md for Node.js setup.
:finish
pause
