@echo off
REM 热点日报推送测试脚本

echo ========================================
echo 热点日报推送测试
echo ========================================
echo.

REM 检查环境变量
echo [1/3] 检查环境变量...
if defined FEISHU_WEBHOOK_URL (
    echo ✓ 飞书 Webhook 已配置
) else (
    echo ✗ 飞书 Webhook 未配置
)

if defined DINGTALK_WEBHOOK_URL (
    echo ✓ 钉钉 Webhook 已配置
) else (
    echo ✗ 钉钉 Webhook 未配置
)

echo.
echo [2/3] 生成热点报告...
python scripts\generate_hotspots.py --domain all --top 50 --no-fallback

echo.
echo [3/3] 发送推送通知...

REM 飞书推送
if defined FEISHU_WEBHOOK_URL (
    echo.
    echo 正在发送飞书推送...
    python scripts\generate_hotspots.py --domain all --top 50 --no-fallback --feishu
)

REM 钉钉推送
if defined DINGTALK_WEBHOOK_URL (
    echo.
    echo 正在发送钉钉推送...
    python scripts\generate_hotspots.py --domain all --top 50 --no-fallback --dingtalk
)

echo.
echo ========================================
echo 测试完成！
echo ========================================
echo.
echo 如需配置环境变量，请运行:
echo   set FEISHU_WEBHOOK_URL=你的飞书Webhook
echo   set DINGTALK_WEBHOOK_URL=你的钉钉Webhook
echo.

pause
