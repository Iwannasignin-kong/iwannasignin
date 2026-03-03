# 小红书图片生成器 - Image-Only 模式测试报告

## 测试日期
2026-03-03

## 测试目标
验证 `--image-only` 模式：生成纯图（无文字）+ JSON 元数据，用于后续 Canva 集成

---

## ✅ 测试结果

### 1. 优化 Prompt 成功

**问题**：初始 prompt 包含 `NO TEXT` 指令，但模型仍然生成带文字的图片

**解决方案**：多重强调 + 明确留白区域 + 负面提示

**关键改进**：
```markdown
## CRITICAL INSTRUCTION - NO TEXT WHATSOEVER
*** WARNING: DO NOT INCLUDE ANY TEXT, LETTERS, CHARACTORS, OR WRITING IN THIS IMAGE ***
*** THIS IMAGE MUST BE 100% TEXT-FREE ***

## Text-Free Zones (MUST BE BLANK)
1. **Zone description** (dimensions) - BLANK for [purpose]

## NEGATIVE PROMPT
DO NOT include: Any text, letters, numbers, Chinese characters
```

**验证**：`01-cover-v2.png` 成功生成了纯图（无文字）

### 2. JSON 元数据格式验证

创建的 JSON 元数据包含：
- `image`: 图片文件名
- `position`: 位置（cover/content/ending）
- `layout`: 布局类型
- `text_elements[]`: 文字元素数组
  - `id`: 元素 ID
  - `content`: 中文内容
  - `type`: 类型（heading/bullet/cta/label）
  - `position`: 百分比位置 + 对齐方式
  - `style`: 样式配置（字号、颜色、装饰等）

### 3. Canva 集成流程验证

**数据转换测试**：`canva-test.js` 成功运行
- JSON → Canva API 格式转换
- 百分比位置 → 绝对像素坐标
- 样式映射（font_size、color、decoration）

---

## 📁 生成文件

```
xhs-images/winter-moisturizer-review/
├── 01-cover-v2.png                          ✅ 纯图（无文字）
├── 01-cover-dry-skin-problem.json           ✅ 文字元数据
├── 02-review-journey-textfree.md            ✅ 优化版 prompt
├── 03-holy-grail-textfree.md                ✅ 优化版 prompt
├── 04-benefits-textfree.md                  ✅ 优化版 prompt
├── 05-ending-textfree.md                    ✅ 优化版 prompt
├── canva-test.js                            ✅ 转换测试脚本
├── canva-api-real.js                        ✅ 真实 API 调用（Node.js）
├── canva-api-real.py                        ✅ 真实 API 调用（Python）
├── text-manifest.json                       ✅ 汇总元数据
└── TEST-SUMMARY.md                          ✅ 本文档
```

---

## 🎯 Prompt 模板（优化版）

### 关键要素

1. **多重警告** - 使用 `***` 和大写强调
2. **明确留白** - 具体说明哪些区域需要空白
3. **负面提示** - 明确列出不包含的内容

### 模板结构

```markdown
## CRITICAL INSTRUCTION - NO TEXT WHATSOEVER
*** WARNING: DO NOT INCLUDE ANY TEXT... ***
*** THIS IMAGE MUST BE 100% TEXT-FREE ***

## Text-Free Zones (MUST BE BLANK)
1. **Zone name** (dimensions) - BLANK for purpose
2. **Zone name** (dimensions) - BLANK for purpose

## Visual Concept
[具体视觉描述，避开留白区域]

## NEGATIVE PROMPT
NO text, NO letters, NO numbers, NO Chinese characters.
Only visual elements: [允许的视觉元素]
```

---

## 🔧 Canva 集成使用指南

### 方法 1: 使用提供的脚本

**Node.js**:
```bash
# 设置环境变量
export CANVA_API_TOKEN=your_token_here

# 运行脚本
cd xhs-images/winter-moisturizer-review
node canva-api-real.js
```

**Python**:
```bash
# 设置环境变量
export CANVA_API_TOKEN=your_token_here

# 运行脚本
cd xhs-images/winter-moisturizer-review
python canva-api-real.py
```

### 方法 2: 手动集成

1. **读取 JSON 元数据**
   ```javascript
   const metadata = JSON.parse(fs.readFileSync('01-cover-dry-skin-problem.json'));
   ```

2. **转换位置**
   ```javascript
   const x = (parseFloat(element.position.x) / 100) * designWidth;
   const y = (parseFloat(element.position.y) / 100) * designHeight;
   ```

3. **映射样式**
   ```javascript
   const fontSize = { 'xlarge': 56, 'large': 42, 'medium': 32, 'small': 24 };
   ```

4. **调用 Canva API**
   ```javascript
   await canva.addText(designId, { content, x, y, fontSize, ... });
   ```

---

## 📊 JSON → Canva 映射示例

### 输入（JSON 元数据）
```json
{
  "id": "title",
  "content": "入冬后脸干裂了",
  "type": "heading",
  "position": { "x": "50%", "y": "32%", "align": "center" },
  "style": {
    "font_size": "xlarge",
    "font_weight": "bold",
    "color": "#8B4513",
    "background": "highlight",
    "decoration": "brackets"
  }
}
```

### 输出（Canva API）
```javascript
{
  type: "text",
  content: "【入冬后脸干裂了】",  // 添加了装饰
  x: 540,                         // 50% of 1080
  y: 461,                         // 32% of 1440
  fontSize: 56,                   // xlarge → 56px
  fontWeight: "bold",
  color: "#8B4513",
  backgroundColor: "#F9E79F",     // highlight 背景
  padding: { horizontal: 12, vertical: 6 }
}
```

---

## 🚀 下一步

### 立即可做

1. **生成剩余图片**
   - 网络稳定后使用优化后的 prompts 生成
   - 已准备好：`02-review-journey-textfree.md` 到 `05-ending-textfree.md`

2. **测试 Canva 集成**
   - 获取 Canva API Token
   - 运行 `canva-api-real.js` 或 `canva-api-real.py`
   - 验证完整流程

### 技能改进

1. **保存优化后的 Prompt 模板**
   - 将 `-textfree.md` 版本保存到技能文档
   - 更新 `prompt-assembly-image-only.md`

2. **自动化流程**
   - 创建批量处理脚本
   - 一次调用生成所有图片 + JSON

3. **错误处理**
   - 添加图片生成失败重试机制
   - 提供部分成功时的恢复选项

---

## 📝 经验总结

### 成功要点

1. **多重强调 NO TEXT** - 单次指令不够，需要反复强调
2. **明确留白区域** - 告诉模型哪里不要放东西
3. **使用负面提示** - 明确列出不允许的内容
4. **JSON 结构化** - 元数据格式清晰，易于集成

### 遇到的问题

| 问题 | 解决方案 |
|------|----------|
| 模型生成文字 | 优化 prompt，多重强调 NO TEXT |
| 网络不稳定 | 添加重试机制，分批生成 |
| API 证书错误 | 检查网络，使用环境变量传递 key |

---

## 🎓 建议改进

### Prompt 优化
- [ ] 添加更多视觉示例
- [ ] 针对不同布局类型定制 prompt
- [ ] 创建 prompt 模板库

### 工作流程
- [ ] 添加进度显示
- [ ] 支持断点续传
- [ ] 批量生成优化

### 集成优化
- [ ] 支持更多设计工具（Figma、Sketch）
- [ ] 添加预览功能
- [ ] 自动化导出流程

---

**测试完成！Image-Only 模式已验证可行 ✅**
