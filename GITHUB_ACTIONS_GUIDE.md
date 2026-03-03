# GitHub Actions 自动推送配置指南

## 📋 快速开始（3 步完成）

### 第 1 步：创建 GitHub 仓库并上传代码

```bash
# 初始化 git 仓库（如果还没有）
cd C:\Users\10360\Desktop\111
git init

# 添加所有文件
git add .

# 提交
git commit -m "初始化热点日报项目"

# 创建 GitHub 仓库后，执行以下命令（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 第 2 步：在 GitHub 中配置 Secrets

1. 打开你的 GitHub 仓库
2. 点击 **Settings**（设置）
3. 左侧菜单点击 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**（新建仓库密钥）

**添加飞书 Webhook:**
- Name: `FEISHU_WEBHOOK_URL`
- Secret: `https://open.feishu.cn/open-apis/bot/v2/hook/你的token`

**添加钉钉 Webhook（可选）:**
- Name: `DINGTALK_WEBHOOK_URL`
- Secret: `https://oapi.dingtalk.com/robot/send?access_token=你的token`

### 第 3 步：启用 Actions 并手动测试

1. 点击 **Actions** 标签页
2. 选择 **每日热点日报推送** workflow
3. 点击 **Run workflow**（运行工作流）
4. 选择分支，点击 **Run workflow** 确认

等待几分钟，如果成功，你会收到飞书/钉钉推送！

---

## ⚙️ 高级配置

### 修改推送时间

编辑 `.github/workflows/daily-hotspot-report.yml` 文件：

```yaml
schedule:
  # UTC 时间，北京时间 = UTC + 8
  # 示例：
  - cron: '0 1 * * *'   # 北京时间 9:00
  - cron: '0 2 * * *'   # 北京时间 10:00
  - cron: '30 3 * * *'  # 北京时间 11:30
  - cron: '0 23 * * *'  # 前一天 UTC 23:00 = 北京时间 7:00
```

**Cron 表达式说明：**
```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6，0 = 周日)
│ │ │ │ │
* * * * *
```

### 添加多个推送时间

```yaml
schedule:
  - cron: '0 1 * * *'   # 早上 9:00
  - cron: '0 14 * * *'  # 晚上 10:00
```

### 只推送到钉钉（或飞书）

修改 workflow 文件中的 `--feishu` 为 `--dingtalk`：

```yaml
python scripts/generate_hotspots.py \
  --domain all \
  --top 50 \
  --no-fallback \
  --dingtalk  # 改为 --dingtalk
```

### 同时推送到多个平台

```yaml
python scripts/generate_hotspots.py \
  --domain all \
  --top 50 \
  --no-fallback \
  --feishu \
  --dingtalk
```

---

## 📊 推送效果预览

### 飞书推送效果

```
全网热点日报
2026-03-03

📊 50 条热点，0 条高优先级

🔥 Top 5 热点：
1. 美以袭击伊朗已超 60 小时，当前局势如何？
   热度: 3.8/5 | 综合热度最高
   https://www.zhihu.com/question/...

2. 伊朗导弹击中美第五舰队总部瞬间
   热度: 3.8/5 | 综合热度最高
   https://s.weibo.com/weibo?q=...

[...]

📌 查看完整报告
数据源: 5 个 | 异常: 0 个
```

---

## 🐛 常见问题

### Q1: Actions 运行失败，提示 "Module not found"

**原因:** Python 依赖未正确安装

**解决:** 检查 workflow 文件中的依赖安装步骤，确保所有依赖都已列出

### Q2: 没有收到推送

**检查清单:**
1. ✅ Secrets 是否正确配置
2. ✅ Webhook URL 是否有效
3. ✅ Actions 是否运行成功（查看 Actions 日志）
4. ✅ 检查飞书/钉钉群机器人是否被删除或禁用

### Q3: 如何查看运行日志？

1. 点击 **Actions** 标签页
2. 点击最近的运行记录
3. 点击具体的 job 查看详细日志
4. 可以看到每一步的输出和错误信息

### Q4: 定时任务没有触发

**可能原因:**
- GitHub Actions 有默认的延迟，可能会晚几分钟
- 如果是刚创建的仓库，建议先手动触发测试
- 检查 cron 表达式是否正确（使用的是 UTC 时间）

### Q5: 如何暂停推送？

**方法 1 - 临时禁用 workflow:**
1. 点击 **Actions** 标签页
2. 点击 **每日热点日报推送**
3. 点击右侧的 **...** 菜单
4. 选择 **Disable workflow**

**方法 2 - 删除 Secrets:**
删除 `FEISHU_WEBHOOK_URL` 和 `DINGTALK_WEBHOOK_URL`

**方法 3 - 修改 workflow 文件:**
在 `schedule` 前加 `#` 注释掉

---

## 💡 提示

### 推送时间选择

建议选择以下时间点（北京时间）：
- 早上 8:00 - 上班前
- 早上 9:00 - 正式上班时间
- 晚上 9:00 - 下班后

### 查看运行历史

GitHub 免费账户的 Actions 限制：
- **Public 仓库**: 无限制
- **Private 仓库**: 每月 2000 分钟
- 本项目单次运行约 2-3 分钟，每天运行完全够用

### 数据保留

生成的 HTML 报告会保留 30 天（可在 workflow 中配置），超过后自动删除。
如需永久保存，可以：
1. 使用 GitHub Pages 托管报告
2. 上传到对象存储（如阿里云 OSS）
3. 定期下载到本地

---

## 📚 相关文件

- `.github/workflows/daily-hotspot-report.yml` - Actions 配置文件
- `hotspot-radar-manual/NOTIFICATION_SETUP.md` - 推送配置指南
- `hotspot-radar-manual/scripts/generate_hotspots.py` - 主程序

---

## 🎉 完成！

配置完成后，每天会自动推送热点日报到你的飞书/钉钉群，无需任何服务器，完全免费！

需要帮助？查看 GitHub Actions 日志或提 Issue。
