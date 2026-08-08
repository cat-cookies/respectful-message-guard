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
echo 建議安裝 Python 後再執行本檔，才能使用本機 LLM proxy。
echo 你仍可直接開啟 index.html；若 LM Studio 允許瀏覽器跨來源連線，Qwen 仍可能可用。
echo.
echo LM Studio 預設：Developer ^> Start Server，Base URL http://127.0.0.1:1234/v1
echo.
pause
