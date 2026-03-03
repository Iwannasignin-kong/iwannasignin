---
name: Uncle-L-xhs-topic-tracker
description: 小红书爆款选题文档生成工具。自动访问小红书笔记链接，提取标题、作者、点赞数、收藏数、评论数等数据，并记录到Markdown文档中。用于追踪和分析小红书热门内容。Use when user wants to "记录小红书笔记数据", "生成爆款选题文档", "追踪小红书热门内容", or "收集小红书数据分析"。
---

# 小红书爆款选题文档

自动抓取小红书笔记数据并生成结构化的选题追踪文档。

## 功能

- 使用 Chrome CDP 访问小红书笔记页面
- 自动提取笔记的**标题、正文、作者、点赞数、收藏数、评论数**
- **支持下载笔记封面图片**
- **支持下载所有笔记图片**
- **支持下载视频（视频笔记）**
- 将数据以表格形式记录到 Markdown 文档
- 每篇笔记详情独立保存（含完整正文和图片）
- 支持多链接批量处理
- 保持登录状态（使用 Chrome Profile）

## 前置要求

- 已安装 Chrome 浏览器
- 已安装 Bun: `curl -fsSL https://bun.sh/install | bash`

## 脚本目录

**重要**: 所有脚本位于 skill 的 `scripts/` 子目录中。

**执行方式**:
1. 确定此 SKILL.md 文件的目录路径为 `SKILL_DIR`
2. 脚本路径 = `${SKILL_DIR}/scripts/main.ts`
3. 将本文档中所有 `${SKILL_DIR}` 替换为实际路径

## 使用方法

### 单条链接记录

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts <小红书链接>
```

### 批量记录多条链接

```bash
# 依次处理多个链接
npx -y bun ${SKILL_DIR}/scripts/main.ts <链接1>
npx -y bun ${SKILL_DIR}/scripts/main.ts <链接2>
npx -y bun ${SKILL_DIR}/scripts/main.ts <链接3>
```

### 指定输出文件

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts <链接> -o ~/Documents/my-topics.md
```

### 创建新文件（覆盖现有）

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts <链接> --new
```

## 选项

| 选项 | 说明 |
|------|------|
| `<url>` | 小红书笔记链接 |
| `-o <path>` | 输出文件路径（默认: `~/Desktop/xhs-topic-tracker/xhs-topics-YYYY-MM.md`） |
| `-n, --new` | 创建新文件，不追加到现有文件 |
| `-l, --login` | 扫码登录模式（首次使用或登录过期时使用） |
| `-c, --cover` | 下载笔记封面图片 |
| `-i, --images` | 下载笔记所有图片 |
| `-v, --video` | 下载视频（仅视频笔记） |
| `-t <ms>` | 页面加载超时时间（默认: 30000ms） |

## 环境变量

| 变量 | 说明 |
|------|------|
| `XHS_CHROME_PATH` | Chrome 可执行文件路径 |
| `XHS_CHROME_PROFILE_DIR` | Chrome 用户数据目录（用于保持登录） |
| `XHS_DATA_DIR` | 数据文件保存目录 |

## 工作流程

### 首次使用（扫码登录）

1. 使用 `--login` 参数运行脚本
2. Chrome 浏览器会自动打开小红书页面
3. **在浏览器中扫码或手机号登录**
4. 登录完成后，按终端提示按 Enter 键继续
5. 脚本会继续抓取数据
6. 后续访问将保持登录状态

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts <链接> --login
```

### 日常使用

1. 用户提供小红书笔记链接
2. 运行脚本提取数据
3. 数据自动追加到文档

## 输出格式

### 主文档（表格视图）

所有笔记以简洁的表格形式展示，方便快速浏览：

```markdown
# 小红书爆款选题文档

| 序号 | 标题 | 作者 | 点赞 | 收藏 | 评论 | 正文预览 | 图片 |
|------|------|------|------|------|------|----------|------|
| 1 | Claude5是假的 | Max For AI | 216 | 18 | 20 | Claude-5要发布了？我们大概... | [3张](notes/xxx) |
| 2 | 崩坏星穹铁道爆料 | Hawaiian | 85 | 4 | 8 | #崩坏星穹铁道 送免费限五... | [3张](notes/xxx) |
```

### 笔记详情页

点击表格中的**图片数量**链接，可查看每篇笔记的完整详情：

```
notes/
└── 笔记标题-时间戳/
    ├── README.md          # 完整正文 + 图片预览
    ├── img-01.jpg
    ├── img-02.jpg
    └── img-03.jpg
```

详情页包含：
- 完整标题和作者信息
- 完整正文内容
- 所有图片的本地预览
- 原文链接

## 使用示例

### 示例 1: 记录单条笔记

用户: "帮我记录这条小红书笔记: https://www.xiaohongshu.com/explore/xxx"

执行:
```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts "https://www.xiaohongshu.com/explore/xxx"
```

### 示例 2: 批量记录多条笔记

用户提供了多个链接，依次执行:

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts "https://www.xiaohongshu.com/explore/xxx1"
npx -y bun ${SKILL_DIR}/scripts/main.ts "https://www.xiaohongshu.com/explore/xxx2"
npx -y bun ${SKILL_DIR}/scripts/main.ts "https://www.xiaohongshu.com/explore/xxx3"
```

### 示例 3: 下载封面图片

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts "<链接>" --cover
```

封面图片会保存到 `~/Desktop/xhs-topic-tracker/covers/` 目录

### 示例 4: 下载所有笔记图片

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts "<链接>" --images
```

所有图片会保存到 `~/Desktop/xhs-topic-tracker/notes/{笔记标题}-{时间戳}/` 目录

### 示例 5: 下载视频（视频笔记）

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts "<视频链接>" --video
```

视频会保存到 `~/Desktop/xhs-topic-tracker/videos/` 目录

### 示例 6: 同时下载封面、图片和视频

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts "<链接>" --cover --images --video
```

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| Chrome 未找到 | 设置 `XHS_CHROME_PATH` 环境变量指向 Chrome 路径 |
| 无法获取数据 | 检查是否已登录小红书，或增加超时时间 `-t 60000` |
| 登录状态丢失 | 检查 `XHS_CHROME_PROFILE_DIR` 是否有写入权限 |
| 数据提取失败 | 小红书页面结构可能变化，需要更新提取脚本 |

## 注意事项

1. **首次使用必须登录**: 小红书需要登录后才能查看完整数据
2. **保持 Chrome 打开**: 脚本运行期间不要关闭自动打开的 Chrome 窗口
3. **频率控制**: 避免短时间内大量抓取，以免触发反爬机制
4. **数据准确性**: 页面动态加载可能导致数据提取不完整，如遇问题可尝试增加超时时间
