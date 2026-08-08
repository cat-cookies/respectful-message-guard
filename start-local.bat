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
echo [找不到 Python]
echo 仍可直接開啟 index.html 使用完整的本機混合語言模型。
echo 若瀏覽器限制麥克風或其他功能，建議安裝 Python 後再執行 start-local.bat。
echo.
pause
