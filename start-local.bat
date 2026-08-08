@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 python\local_server.py
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  python python\local_server.py
  goto :eof
)
echo.
echo [無法啟動本機 Python 引擎]
echo 這台電腦找不到 Python。你仍可直接開啟 index.html 使用離線 JavaScript 引擎，
echo 或將整個資料夾放到 GitHub Pages；線上時會嘗試在瀏覽器內載入 Python 執行環境。
echo.
pause
