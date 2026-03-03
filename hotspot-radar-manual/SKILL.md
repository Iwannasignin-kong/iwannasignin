---
name: hotspot-radar-manual
description: Manual one-click hotspot brief generator for multi-domain trend scouting. Use when you need RSS aggregation, Chinese social media hotspots (Zhihu, Weibo, Baidu, Toutiao), deduplication, Chinese short descriptions, styled HTML output, and DingTalk notifications for AI/robotics/finance or other domains.
---

# Quick Start

## Basic Usage
1. Double-click: `scripts/run_manual.bat`
2. Input domain key (e.g. `ai`, `robotics`, `finance`, `global`)
3. Open output file in `output/`:
   - `hotspots-<domain>-YYYY-MM-DD.html`
   - `hotspots-<domain>-latest.html`

## With DingTalk Notification
```powershell
# Windows CMD
set DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
python scripts/generate_hotspots.py --domain global --dingtalk

# PowerShell
$env:DINGTALK_WEBHOOK_URL="https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
python scripts/generate_hotspots.py --domain global --dingtalk
```

# Setup DingTalk Notification

## Step 1: Create DingTalk Robot
1. Open your DingTalk group
2. Go to **Group Settings** → **Group Robot** → **Add Robot**
3. Choose **Custom** robot type
4. Set a name (e.g. "AI 热点日报")
5. Copy the **Webhook URL** (format: `https://oapi.dingtalk.com/robot/send?access_token=xxx`)
6. Optional: Configure security settings (recommended for production)

## Step 2: Set Environment Variable
```powershell
# Windows CMD (temporary)
set DINGTALK_WEBHOOK_URL=your_webhook_url_here

# Windows CMD (permanent)
setx DINGTALK_WEBHOOK_URL "your_webhook_url_here"

# PowerShell (temporary)
$env:DINGTALK_WEBHOOK_URL="your_webhook_url_here"

# PowerShell (permanent - add to profile)
[System.Environment]::SetEnvironmentVariable('DINGTALK_WEBHOOK_URL', 'your_webhook_url_here', 'User')
```

## Step 3: Run with DingTalk
```powershell
python scripts/generate_hotspots.py --domain global --dingtalk --top 15
```

# Available Domains

| Domain | Description | Sources |
|--------|-------------|---------|
| `ai` | AI/ML industry news | OpenAI, Anthropic, Google AI, arXiv CS.AI, VentureBeat AI, MIT Tech Review |
| `robotics` | Robotics industry | IEEE Spectrum Robotics, The Robot Report |
| `finance` | FinTech trends | Financial Times, Economist Finance |
| `global` | Chinese social media hotspots | Zhihu热榜, 微博热搜, 百度热搜, 头条热榜 |

# Add New Domain

## Using RSS Feeds (Classic)
Edit `references/sources.json` under `domains`:
```json
{
  "your_domain": {
    "title": "Your Domain 热点日报",
    "summary_hint": "Your summary style hint.",
    "keywords": ["keyword1", "keyword2"],
    "feeds": [
      "https://example.com/rss.xml"
    ]
  }
}
```

## Using Structured Sources (New)
```json
{
  "your_domain": {
    "title": "Your Domain 热点日报",
    "summary_hint": "Your summary style hint.",
    "keywords": ["keyword1", "keyword2"],
    "sources": [
      {"type": "rss", "url": "https://example.com/rss.xml"},
      {"type": "zhihu_hotlist", "enabled": true}
    ]
  }
}
```

# Available Source Types

| Source Type | Description | Config Example |
|-------------|-------------|----------------|
| `rss` | RSS/Atom feed | `{"type": "rss", "url": "https://example.com/rss.xml"}` |
| `zhihu_hotlist` | Zhihu hot list API | `{"type": "zhihu_hotlist", "enabled": true}` |
| `weibo_hotsearch` | Weibo hot search | `{"type": "weibo_hotsearch", "enabled": true}` |
| `baidu_hotsearch` | Baidu hot search | `{"type": "baidu_hotsearch", "enabled": true}` |
| `toutiao_hottopics` | Toutiao hot topics | `{"type": "toutiao_hottopics", "enabled": true}` |

# CLI Usage

```powershell
# Basic usage
python scripts/generate_hotspots.py --domain ai

# Custom top N
python scripts/generate_hotspots.py --domain ai --top 15

# Custom config file
python scripts/generate_hotspots.py --domain ai --config path/to/sources.json

# Custom output directory
python scripts/generate_hotspots.py --domain ai --out path/to/output

# With DingTalk notification
python scripts/generate_hotspots.py --domain global --dingtalk

# Combined options
python scripts/generate_hotspots.py --domain global --top 20 --dingtalk
```

# Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

# Output Includes

- **Ranked hotspot cards** - Sorted by importance and credibility
- **Chinese short description** - Content creation guidance per item
- **Relevance score** - 3-5 scale based on keyword matching
- **Source credibility score** - Based on source domain reputation
- **Source link** - Direct link to original content
- **Daily summary block** - High priority count, official sources, research papers
- **DingTalk notification** - Optional push notification with top 3 items

# DingTalk Message Format

```markdown
## AI 热点日报 - 2026-03-02

**摘要**: 15 条热点，8 条高优先级
**信源**: 6 个来源 | **异常**: 0 个

### 热门前三
1. **[OpenAI发布GPT-5]** 评分: 4.5/5 | [链接](https://...)
2. **[Anthropic推出Claude 4]** 评分: 4.2/5 | [链接](https://...)
3. **[Google Gemini 2.0发布]** 评分: 4.0/5 | [链接](https://...)
```

# Troubleshooting

## DingTalk Notification Fails
- Verify `DINGTALK_WEBHOOK_URL` environment variable is set correctly
- Check that the webhook URL is valid and not expired
- Ensure the robot is not disabled in DingTalk group settings
- Check network connectivity to DingTalk API

## Chinese Sources Return Empty Results
- Some sources may require JavaScript rendering (results may vary)
- Network issues accessing Chinese platforms
- Source HTML structure may have changed (check for updates)

## RSS Feed Errors
- Verify the feed URL is accessible
- Some feeds may have rate limiting
- Check for SSL certificate issues
