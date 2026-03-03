# 热点雷达 - 每日热点日报推送

> 全网热点自动采集、去重、分析，每日推送到飞书/钉钉

## ✨ 特性

- 🔥 **多源聚合**: Tophub、微博、知乎、百度、小红书、TechCrunch、Ars Technica 等
- 🤖 **智能分析**: 自动识别热点主题，生成针对性建议
- 📊 **热度评分**: 基于真实热度值和排名的评分系统
- 🎯 **精准推送**: 飞书/钉钉每日自动推送，无需人工干预
- 🚀 **零成本**: 基于 GitHub Actions，完全免费运行

## 🚀 快速开始

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/你的用户名/你的仓库.git
cd 你的仓库

# 安装依赖
pip install requests playwright
playwright install chromium

# 生成报告
python hotspot-radar-manual/scripts/generate_hotspots.py --domain all --top 50

# 发送推送
python hotspot-radar-manual/scripts/generate_hotspots.py --domain all --top 50 --feishu
```

### GitHub Actions 自动运行

1. **Star** 本仓库
2. 点击 **Use this template** 创建你自己的仓库
3. 在仓库设置中添加 Secrets:
   - `FEISHU_WEBHOOK_URL`: 你的飞书机器人 Webhook
   - `DINGTALK_WEBHOOK_URL`: 你的钉钉机器人 Webhook
4. 启用 Actions，完成！

详细步骤请查看 [GitHub Actions 配置指南](GITHUB_ACTIONS_GUIDE.md)

## 📋 推送效果

### 飞书

```
全网热点日报
2026-03-03

📊 50 条热点，0 条高优先级

🔥 Top 5 热点：
1. 美以袭击伊朗已超 60 小时...
   热度: 3.8/5 | 综合热度最高
   https://www.zhihu.com/question/...

[...]

📌 查看完整报告
数据源: 5 个 | 异常: 0 个
```

### HTML 报告

每天自动生成精美的 HTML 热点报告，可直接在浏览器中查看。

## ⚙️ 配置选项

### 命令行参数

```bash
python scripts/generate_hotspots.py [选项]

--domain    # 域名选择: all, ai, tech, finance, startup 等
--top       # 热点数量，默认 50
--feishu    # 推送到飞书
--dingtalk  # 推送到钉钉
--no-fallback  # 禁用 fallback 数据（推荐）
--clear-cookies  # 清除 cookies 强制刷新
```

### 推送时间

在 `.github/workflows/daily-hotspot-report.yml` 中修改：

```yaml
schedule:
  - cron: '0 1 * * *'  # UTC 1:00 = 北京时间 9:00
```

## 📁 项目结构

```
├── .github/
│   └── workflows/
│       └── daily-hotspot-report.yml  # GitHub Actions 配置
├── hotspot-radar-manual/
│   ├── scripts/
│   │   └── generate_hotspots.py      # 主程序
│   ├── references/
│   │   └── sources.json              # 信源配置
│   ├── data/                         # 数据目录
│   └── output/                       # 报告输出
├── GITHUB_ACTIONS_GUIDE.md           # GitHub Actions 配置指南
├── NOTIFICATION_SETUP.md             # 推送配置指南
└── README.md                         # 本文件
```

## 🎯 支持的信源

| 平台 | 类型 | 说明 |
|------|------|------|
| Tophub | 聚合 | 今日热榜聚合 |
| 微博 | 社交 | 微博热搜 |
| 知乎 | 问答 | 知乎热榜 |
| 百度 | 搜索 | 百度热搜 |
| 小红书 | 社交 | 小红书热榜（需登录） |
| TechCrunch | 科技 | 科技新闻 |
| Ars Technica | 科技 | 深度科技 |
| Wired | 科技 | 科技文化 |
| MIT Technology Review | 科技 | 科技评论 |
| VentureBeat | 科技 | AI/创业 |

## 🛠️ 开发

### 添加新信源

编辑 `hotspot-radar-manual/references/sources.json`:

```json
{
  "your-domain": {
    "title": "你的热点日报",
    "summary_hint": "你的建议提示",
    "keywords": ["关键词1", "关键词2"],
    "sources": [
      "https://your-source.com/feed"
    ]
  }
}
```

### 本地开发

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r hotspot-radar-manual/requirements.txt

# 运行测试
python hotspot-radar-manual/scripts/generate_hotspots.py --domain all --top 10
```

## 📝 更新日志

### v1.0.0 (2026-03-03)
- ✅ 多源热点聚合
- ✅ 智能主题分析
- ✅ 飞书/钉钉推送
- ✅ GitHub Actions 自动化
- ✅ 动态建议生成
- ✅ Cookie 自动刷新

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Tophub](https://tophub.today/) - 热点数据聚合
- [Playwright](https://playwright.dev/) - 浏览器自动化
- [GitHub Actions](https://github.com/features/actions) - CI/CD 平台

---

**Star** ⭐ 本仓库以支持项目持续开发！
