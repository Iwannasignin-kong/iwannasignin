---
name: Uncle-L-random-wellness-notes
description: 随机养生笔记生成器 - 一键生成养生食谱+小红书风格图片。通过功效×饮食类别抽卡生成独特内容。需要用户提供火山引擎和深度求索API密钥。
---

# 🎲 Uncle-L 随机养生笔记生成器

**需要用户自行配置 API 密钥后才能使用**

## 快速开始

### 1. 配置 API 密钥

在使用前，请确保已设置以下环境变量：

```bash
# 深度求索 API Key (用于生成食谱文本)
export DEEPSEEK_API_KEY="your-deepseek-api-key"

# 火山引擎 API Key (用于生成图片)
export ARK_API_KEY="your-volcengine-api-key"

# 火山引擎模型端点名称
export ARK_MODEL="your-model-endpoint-id"
```

### 2. 运行程序

```bash
cd Uncle-L-random-wellness-notes
npx tsx generate-all.ts
```

运行后会在桌面生成 `中式养生笔记-{日期}` 文件夹，包含10组完整的养生笔记。

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 🎲 **随机抽卡** | 功效 × 饮食类别，生成独特组合 |
| 📝 **AI文本** | Deepseek生成6道养生食谱 |
| 🎨 **AI图片** | 火山引擎即梦API生成封面+6张详情页 |
| 📁 **自动保存** | 所有内容保存到桌面文件夹 |

---

## 随机种子池

### 功效（10种）
护眼、抗衰老、增强免疫力、改善睡眠、促进消化、降血脂、补血养颜、健脑益智、清热降火、强健骨骼

### 饮食类别（10种）
豆浆、炖汤、沙拉、粥品、茶饮、坚果、果蔬汁、粗粮、海鲜、甜品

---

## 输出结构

每组笔记包含15个文件：

```
中式养生笔记-{日期}/
└── 01-功效-类别/
    ├── 00-cover.png              # 封面图（2×3排列）
    ├── 01-detail-1.png           # 详情页1
    ├── 02-detail-2.png           # 详情页2
    ├── 03-detail-3.png           # 详情页3
    ├── 04-detail-4.png           # 详情页4
    ├── 05-detail-5.png           # 详情页5
    ├── 06-detail-6.png           # 详情页6
    ├── recipes.md                # 食谱文本
    ├── cover-prompt.txt          # 封面提示词
    └── detail-01~06-prompt.txt   # 6个详情页提示词
```

---

## API 配置说明

### 获取 Deepseek API Key
1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 创建 API Key

### 获取火山引擎 API Key 和模型端点
1. 访问 https://console.volcengine.com/
2. 注册/登录账号
3. 开通「火山方舟」服务
4. 创建推理接入点，获取 Endpoint ID
5. 在 API Key 管理页面创建 Key

---

## 使用示例

### 生成10组笔记
```bash
npx tsx generate-all.ts
```

### 生成的组合示例
- 01-补血养颜-炖汤
- 02-护眼-粗粮
- 03-增强免疫力-炖汤
- 04-强健骨骼-粥品
- ...

---

## 图片风格说明

### 【封面图】
- 风格：柔和水彩，清新浅色，古风元素
- 尺寸：3:4竖屏
- 布局：6道食谱插画按2×3网格排列

### 【详情页】
- 风格：柔和水彩，清新浅色，古风元素
- 尺寸：3:4竖屏
- 结构：
  - 头部：菜谱名称文字
  - 中部：水彩插画
  - 底部：制作步骤和食材

---

## 文件清单

```
Uncle-L-random-wellness-notes/
├── SKILL.md              # 本说明文档
├── generate-all.ts       # ⭐ 主程序
└── (生成的笔记文件夹)    # 桌面/中式养生笔记-{日期}/
```

---

**使用方式：配置API后，一行命令直接生成！** 🎉
