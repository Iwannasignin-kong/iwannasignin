@echo off
echo ========================================
echo GitHub Actions 快速配置脚本
echo ========================================
echo.

REM 检查是否已安装 git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未检测到 Git
    echo 请先安装 Git: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo [1/6] 初始化 Git 仓库...
git init

echo.
echo [2/6] 添加所有文件...
git add .

echo.
echo [3/6] 创建初始提交...
git commit -m "初始化热点日报项目 - 添加 GitHub Actions 自动推送"

echo.
echo [4/6] 请输入你的 GitHub 仓库地址
echo 格式: https://github.com/用户名/仓库名.git
echo.
set /p REPO_URL="仓库地址: "

if "%REPO_URL%"=="" (
    echo 错误: 仓库地址不能为空
    pause
    exit /b 1
)

echo.
echo [5/6] 添加远程仓库...
git remote add origin %REPO_URL%
git branch -M main

echo.
echo [6/6] 推送到 GitHub...
echo 注意: 首次推送可能需要登录 GitHub
echo.
git push -u origin main

echo.
echo ========================================
echo 推送完成！
echo ========================================
echo.
echo 接下来的步骤:
echo.
echo 1. 打开你的 GitHub 仓库
echo 2. 点击 Settings → Secrets and variables → Actions
echo 3. 添加以下 Secrets:
echo    - FEISHU_WEBHOOK_URL (飞书 Webhook)
echo    - DINGTALK_WEBHOOK_URL (钉钉 Webhook，可选)
echo.
echo 4. 点击 Actions 标签页
echo 5. 启用 "每日热点日报推送" workflow
echo 6. 点击 "Run workflow" 手动测试
echo.
echo 详细步骤请查看: GITHUB_ACTIONS_GUIDE.md
echo.

pause
