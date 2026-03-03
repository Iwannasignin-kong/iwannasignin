@echo off
setlocal
cd /d "%~dp0"

set /p DOMAIN=请输入领域 key（默认 ai）: 
if "%DOMAIN%"=="" set DOMAIN=ai

python "%~dp0generate_hotspots.py" --domain "%DOMAIN%"
if errorlevel 1 (
  echo.
  echo 生成失败，请检查领域 key、网络或配置文件。
  pause
  exit /b 1
)

set HTML_FILE=%~dp0..\output\hotspots-%DOMAIN%-latest.html
if exist "%HTML_FILE%" (
  start "" "%HTML_FILE%"
) else (
  echo 未找到文件：%HTML_FILE%
)

echo.
echo 已完成，按任意键打开输出目录。
pause >nul
start "" "%~dp0..\output"
