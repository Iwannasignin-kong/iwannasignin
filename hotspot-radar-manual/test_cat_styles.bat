@echo off
REM 猫娘风格测试脚本

echo ========================================
echo 猫娘风格测试 - 热点日报推送
echo ========================================
echo.
echo 请选择猫娘风格：
echo.
echo [1] 默认风格 - 温柔甜美的标准猫娘 ✨
echo [2] 调皮撒娇 - 调皮撒娇的猫娘 🎀
echo [3] 慵懒慵懒 - 慵懒随意的猫娘 😴
echo [4] 高冷优雅 - 高冷优雅的猫娘 ❄️
echo [5] 软萌可爱 - 超级软萌的猫娘 🌸
echo.
set /p choice="请输入数字 (1-5): "

if "%choice%"=="1" set style=default
if "%choice%"=="2" set style=playful
if "%choice%"=="3" set style=lazy
if "%choice%"=="4" set style=cool
if "%choice%"=="5" set style=cute

echo.
echo 你选择了：[%style%] 风格
echo.
echo 正在推送...

cd hotspot-radar-manual
set FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/51d5271e-0cde-41db-a6be-d13602447391
python scripts/generate_hotspots.py --domain all --top 50 --no-fallback --feishu --cat --cat-style %style%

echo.
echo ========================================
echo 推送完成！请检查飞书群~
echo ========================================
echo.
echo 想看其他风格？重新运行这个脚本即可！
echo.

pause
