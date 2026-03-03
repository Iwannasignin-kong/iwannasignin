# REDINK小红书内容创作工作室

**Author:** Uncle-L
**Version:** 2.0

完整实现**捕捉网感图文 → 分析风格 → 优化Prompt → AI二次创作**工作流。

## 🎯 两种创作模式

### 模式1: analyze - 分析参考图
分析小红书/网络爆款图文，自动提取创作要素：

```bash
/redink analyze <图片路径> [备注说明]
```

**输出内容：**
- 构图分析（布局/视角/焦点）
- 风格分析（艺术风格/色彩/氛围/光线）
- 元素提取（主体/关键元素/背景/文字）
- 优化的AI绘画Prompt（风格/构图/元素/完整）
- 二次创作创意建议
- 小红书标签建议

**输出文件：**
```
Desktop/REDINK分析-20260227/
├── reference-image.jpg      # 参考图副本
└── analysis-report.md       # 详细分析报告
```

### 模式2: remix - 二次创作
基于参考图风格，生成新主题的图片：

```bash
/redink remix <参考图> <新主题> [数量]
```

**示例：**
```bash
# 保持咖啡图的风格，生成3张不同产品
/redink remix coffee-reference.jpg "抹茶拿铁" 3

# 保持美食图的风格，生成5张新品
/redink remix food-reference.jpg "草莓蛋糕" 5
```

**输出文件：**
```
Desktop/REDINK二次创作-20260227/
├── style-analysis.json      # 风格分析数据
├── remix-1.png             # 创作图
├── remix-1-prompt.txt      # 对应Prompt
└── ...
```

## 🔄 完整工作流

```
┌─────────────────┐
│ 捕捉爆款图文     │ ← 手动：小红书/网络
└────────┬────────┘
         ▼
┌─────────────────┐
│ AI图片分析       │ ← Deepseek Vision
│ - 构图/风格      │
│ - 元素/色彩      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Prompt优化      │ ← Deepseek Chat
│ - 风格Prompt    │
│ - 构图Prompt    │
│ - 元素Prompt    │
│ - 完整Prompt    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 人工微调(可选)  │ ← 调整主题/风格
└────────┬────────┘
         ▼
┌─────────────────┐
│ AI二次创作       │ ← 火山引擎
│ - 批量生成      │
│ - 风格一致      │
└─────────────────┘
```

## 💡 使用场景

### 场景1: 捕捉爆款风格
```bash
# 1. 看到小红书爆款图，保存
# 2. 分析风格
/redink analyze 爆款图.jpg

# 3. 查看报告，获取优化Prompt
# 4. 用Prompt在Midjourney/DALL-E等生成相似图
```

### 场景2: 快速批量创作
```bash
# 保持"咖啡系列"统一风格，换不同产品
/redink remix 咖啡参考图.jpg "抹茶拿铁" 5
/redink remix 咖啡参考图.jpg "燕麦拿铁" 5
/redink remix 咖啡参考图.jpg "焦糖拿铁" 5
```

### 场景3: 风格迁移
```bash
# 把暖色调风格迁移到新品上
/redink analyze 目标风格.jpg "保持暖色调"
/redink remix 目标风格.jpg "新品展示" 3
```

## ⚙️ 环境配置

在项目根目录创建 `.env` 文件：

```env
# 火山引擎 API 配置
ARK_API_KEY=你的火山引擎密钥

# Chat模型（支持vision，用于图片分析和Prompt生成）
ARK_CHAT_MODEL=doubao-seed-2-0-pro-260215

# 图片生成模型（用于文生图）
ARK_IMAGE_MODEL=doubao-seedream-5-0-260128

IMAGE_SIZE=1920x1920
```

**说明：**
- **ARK_CHAT_MODEL**：支持vision的chat模型，用于分析参考图和生成Prompt
- **ARK_IMAGE_MODEL**：文生图模型，用于生成最终图片
- 两个模型都使用同一个火山引擎API密钥

**API获取：**
- **火山引擎**: https://www.volcengine.com/

---

## 🌿 旧版功能：养生笔记生成器

随机碰撞10组【养生功效】× 10组【食物分类】，批量生成养生图文笔记。

```bash
# 生成10组养生笔记
/redink 10

# 或直接运行Python脚本
python generator.py -n 10
```

**选题组合：**

| 养生功效 | 食物分类 |
|---------|---------|
| 补气养血 | 滋补汤品 |
| 美容养颜 | 养生茶饮 |
| 调理脾胃 | 药膳粥品 |
| 清热解毒 | 中式甜品 |
| 润肺止咳 | 时令蔬果 |
| 安神助眠 | 养生药膳 |
| 降脂减肥 | 坚果零食 |
| 增强免疫 | 五谷杂粮 |
| 补肾壮阳 | 中药调理 |
| 疏肝理气 | 传统糕点 |

---

## 📊 分析报告示例

```markdown
# REDINK 图片分析报告

## 原图风格总结
暖色调极简风格，一杯咖啡放在木质桌面上，自然光柔和

## 详细分析

### 构图
- 布局: 居中构图
- 视角: 俯视45度
- 焦点: 画面中心

### 风格
- 艺术风格: 真实摄影
- 色彩: 暖棕色, 米白色, 金色点缀
- 氛围: 温馨、治愈
- 光线: 自然光、柔光

### 元素
- 主体: 一杯拿铁咖啡
- 关键元素: 拉花图案, 陶瓷杯, 木桌, 蒸汽
- 背景: 模糊的室内环境
- 图中文字: "早安"

## 优化的Prompt

### 风格Prompt
`warm tone photography, soft natural lighting, cozy atmosphere, depth of field`

### 构图Prompt
`centered composition, top-down 45 degree angle, shallow depth of field`

### 元素Prompt
`a cup of coffee on wooden table, latte art, ceramic mug, steam rising`

### 完整Prompt (可直接使用)
```
warm tone photography, soft natural lighting, cozy atmosphere, depth of field, centered composition, top-down 45 degree angle, shallow depth of field, a cup of coffee on wooden table, latte art, ceramic mug, steam rising, high quality, detailed, 8k
```

## 二次创作创意
1. 抹茶拿铁，保持暖色调和木质桌面
2. 热可可配棉花糖，冬季氛围
3. 水果茶，加入新鲜水果点缀

## 建议标签
#咖啡日常 #治愈系 #小红书美食 #咖啡控 #早安
```

## License

MIT
