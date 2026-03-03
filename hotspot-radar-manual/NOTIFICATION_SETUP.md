# 热点日报推送配置指南

## 一、获取 Webhook URL

### 飞书（Feishu/Lark）

1. 打开飞书群聊
2. 点击群设置 → 群机器人 → 添加机器人 → 自定义机器人
3. 机器人名称：热点日报推送
4. 安全设置：可选择"加签"或"IP白名单"（可选）
5. 创建后复制 Webhook URL，格式如：
   ```
   https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxx
   ```

### 钉钉（DingTalk）

1. 打开钉钉群聊
2. 点击群设置 → 智能群助手 → 添加机器人 → 自定义
3. 机器人名称：热点日报推送
4. 安全设置：可选择"加签"或"关键词"（关键词设为"热点"）
5. 创建后复制 Webhook URL，格式如：
   ```
   https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxx
   ```

## 二、配置环境变量

### Windows（PowerShell）

```powershell
# 设置飞书 Webhook
[System.Environment]::SetEnvironmentVariable("FEISHU_WEBHOOK_URL", "你的飞书Webhook", "User")

# 设置钉钉 Webhook
[System.Environment]::SetEnvironmentVariable("DINGTALK_WEBHOOK_URL", "你的钉钉Webhook", "User")

# 验证设置
[System.Environment]::GetEnvironmentVariable("FEISHU_WEBHOOK_URL", "User")
```

### Linux/Mac

```bash
# 编辑 ~/.bashrc 或 ~/.zshrc
export FEISHU_WEBHOOK_URL="你的飞书Webhook"
export DINGTALK_WEBHOOK_URL="你的钉钉Webhook"

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

## 三、测试推送

```bash
# 测试飞书推送
python scripts/generate_hotspots.py --domain all --top 50 --no-fallback --feishu

# 测试钉钉推送
python scripts/generate_hotspots.py --domain all --top 50 --no-fallback --dingtalk
```

## 四、设置每日自动推送

### 方案一：本地定时任务（需要电脑一直开着）

#### Windows 任务计划程序

1. 打开"任务计划程序"（搜索 `taskschd.msc`）
2. 创建基本任务
   - 名称：热点日报推送
   - 触发器：每天 早上 9:00
   - 操作：启动程序
     - 程序：`python`
     - 参数：`scripts\generate_hotspots.py --domain all --top 50 --no-fallback --feishu`
     - 起始于：`C:\Users\10360\Desktop\111\hotspot-radar-manual`

#### Linux/Mac Cron Job

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天早上9点执行）
0 9 * * * cd /path/to/hotspot-radar-manual && python scripts/generate_hotspots.py --domain all --top 50 --no-fallback --feishu
```

### 方案二：云服务器（推荐，不需要电脑开着）

#### 腾讯云/阿里云 轻量应用服务器

1. 购买最便宜的云服务器（约 ¥50-100/年）
2. 安装 Python 环境
3. 上传代码到服务器
4. 设置 Cron 定时任务
5. 服务器 24 小时运行，不受本地电脑影响

### 方案三：GitHub Actions（免费，但需要代码公开）

1. 将代码推送到 GitHub
2. 创建 `.github/workflows/daily-report.yml`：

```yaml
name: Daily Hotspot Report

on:
  schedule:
    - cron: '0 1 * * *'  # UTC 1:00 = 北京 9:00
  workflow_dispatch:      # 支持手动触发

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install requests playwright
          playwright install chromium

      - name: Generate report
        env:
          FEISHU_WEBHOOK_URL: ${{ secrets.FEISHU_WEBHOOK_URL }}
        run: |
          cd hotspot-radar-manual
          python scripts/generate_hotspots.py --domain all --top 50 --no-fallback --feishu
```

3. 在 GitHub 仓库设置中添加 Secret：
   - Settings → Secrets → New repository secret
   - Name: `FEISHU_WEBHOOK_URL`
   - Value: 你的飞书 Webhook URL

## 五、推送示例

### 飞书推送效果

```
全网热点日报
2026-03-03

📊 50 条热点，0 条高优先级

🔥 Top 5 热点：
1. 美以袭击伊朗已超 60 小时...
   热度: 3.8/5 | 综合热度最高
   https://www.zhihu.com/question/...

2. 伊朗导弹击中美第五舰队...
   热度: 3.8/5 | 综合热度最高
   https://s.weibo.com/weibo?q=...

3. 美以袭击伊朗导致国际油价飙升...
   热度: 3.8/5 | 综合热度最高
   https://www.zhihu.com/question/...

4. 伊朗货币兑人民币近一年贬值...
   热度: 3.8/5 | 综合热度较高
   https://www.zhihu.com/question/...

5. 女子带1米长巨大豆荚坐飞机...
   热度: 3.8/5 | 综合热度较高
   https://s.weibo.com/weibo?q=...

📌 查看完整报告
数据源: 5 个 | 异常: 0 个
```

### 钉钉推送效果

```
## 全网热点日报 - 2026-03-03

📊 **统计信息**
- 热点条数: 50 条
- 高优先级: 0 条
- 数据源: 5 个
- 异常信源: 0 个

🔥 **Top 3 热点**
1. **[美以袭击伊朗已超 60 小时...]** 评分: 3.8/5 | [链接](https://...)
2. **[伊朗导弹击中美第五舰队...]** 评分: 3.8/5 | [链接](https://...)
3. **[美以袭击伊朗导致国际油价...]** 评分: 3.8/5 | [链接](https://...)

---
📅 生成时间: 2026-03-03 09:00:00
```

## 六、常见问题

### Q: 需要电脑一直开着吗？
A:
- **本地定时任务**：需要电脑一直开着且保持联网
- **云服务器**：不需要，服务器24小时运行
- **GitHub Actions**：不需要，GitHub自动运行（免费但有额度限制）

### Q: 推送失败怎么办？
A: 检查以下几点：
1. Webhook URL 是否正确
2. 环境变量是否设置成功
3. 网络是否正常
4. 查看控制台错误信息

### Q: 可以推送到多个群吗？
A: 可以，有两种方式：
1. 添加多个机器人，获取多个 Webhook URL
2. 修改代码支持多 Webhook 轮询发送

### Q: 推送时间可以自定义吗？
A: 可以，修改定时任务的 cron 表达式或任务计划程序的触发时间。

### Q: 如何暂停推送？
A:
- 临时暂停：删除或禁用定时任务
- 永久停止：删除 Webhook 或设置环境变量为空
