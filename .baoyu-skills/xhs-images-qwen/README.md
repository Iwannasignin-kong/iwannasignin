# 小红书信息图生成器 - 阿里云 DashScope 版

使用阿里云通义千问 API 生成小红书风格的信息图。

## 功能特点

- **9种视觉风格** × **6种布局** = 无限创意组合
- 支持文本输入或 Markdown 文件
- 自动将长内容分割成多张图片
- 3:4 竖屏比例，专为小红书优化

## 风格系统

### 视觉风格 (Styles)

| 风格 | 描述 |
|------|------|
| `cute` | 可爱卡哇伊，柔和粉彩，大眼睛Q版 |
| `fresh` | 清新自然，植物风，教育科普 |
| `warm` | 温暖亲和，家庭氛围，情感共鸣 |
| `bold` | 大胆图形，高对比度，动感活力 |
| `minimal` | 极简禅意，留白，克制优雅 |
| `retro` | 复古国潮，传统美学，祥云瑞彩 |
| `pop` | 波普艺术，饱和色彩，漫画风 |
| `notion` | Notion风格，简洁线条，生产力 |
| `chalkboard` | 黑板粉笔，教育友好，多彩 |

### 信息布局 (Layouts)

| 布局 | 密度 | 适用场景 |
|------|------|----------|
| `sparse` | 1-2要点 | 封面、金句、单点信息 |
| `balanced` | 3-4要点 | 常规内容、标准信息密度 |
| `dense` | 5-8要点 | 知识卡片、作弊表、密集信息 |
| `list` | 4-7条目 | 清单、排行、步骤列表 |
| `comparison` | 2方对比 | 前后对比、优缺点、AB对比 |
| `flow` | 3-6步骤 | 流程、时间线、步骤指南 |

## 安装

```bash
npm install tsx
```

## 配置

API 配置已包含在 `.env` 文件中：

```env
DASHSCOPE_API_KEY=sk-9de88735d2bb4436bf502e5c7a8324f4
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_IMAGE_MODEL=qwen-vl-plus
IMAGE_SIZE_XHS=3072x4096
```

## 使用方法

### 命令行使用

```bash
# 基本用法
tsx index.ts "今天分享5个提升效率的小技巧"

# 指定风格和布局
tsx index.ts "今天分享5个提升效率的小技巧" --style fresh --layout list

# 从文件生成
tsx index.ts ./article.md --style warm --count 7

# 完整选项
tsx index.ts "<内容>" --style <风格> --layout <布局> --count <数量>
```

### 参数说明

- `<内容>`: 要生成图文的文本或 Markdown 文件路径
- `--style`: 视觉风格（默认: cute）
- `--layout`: 信息布局（默认: balanced）
- `--count`: 生成图片数量 1-10（默认: 6）

## 使用示例

### 清新风格 + 列表布局

```bash
tsx index.ts "春季养生必知5个小贴士" --style fresh --layout list --count 5
```

### 国潮风格 + 流程布局

```bash
tsx index.ts "传统节气养生指南" --style retro --layout flow --count 6
```

### 温暖风格 + 平衡布局

```bash
tsx index.ts ./family-health.md --style warm --layout balanced --count 7
```

## 输出

生成的图片保存在 `~/Desktop/小红书-{风格}-{布局}-{日期}/` 目录下：

```
~/Desktop/小红书-fresh-list-20260228/
├── 01.png
├── 01-prompt.txt
├── 02.png
├── 02-prompt.txt
└── ...
```

## 技术栈

- TypeScript
- Node.js
- 阿里云通义千问 API (qwen-vl-plus)

## 注意事项

1. 确保已安装 `tsx` 运行时
2. API 调用可能需要一些时间，请耐心等待
3. 生成的图片仅供个人学习使用
4. 建议每次生成 4-8 张图片，效果最佳

## License

MIT
