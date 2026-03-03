#!/usr/bin/env tsx
/**
 * 场景化思维PPT生成器
 * 生成2页PPT图片：场景定义 + 方法论
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ============================================
// API 配置
// ============================================
const JIMENG_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

let config = {
  ARK_API_KEY: "",
  ARK_MODEL: "",
  IMAGE_SIZE: "1920x1080",
};

// ============================================
// PPT内容定义
// ============================================

const PAGE1_PROMPT = `你是一位专业的信息图表设计师。请为以下内容设计一张精美的PPT单页图片。

【页面标题】
一个高针对性的场景是如何产出的？
（第1页：什么是场景？为什么需要场景？）

【内容布局 - 分为上下两个板块】

===== 上半部分：场景的定义 =====

标题：一、场景的定义（两个维度）

表格：
| 维度 | 内容 |
|------|------|
| 用户群体 | 谁？在什么状态下？ |
| 核心需求 | 功能性需求 + 情绪价值 |

举例框（用不同颜色背景）：
📌 举例：需要AI代写情书
• 功能性：不知道怎么写 → 帮我生成内容
• 情绪价值：真诚感 → 不是套路模板

===== 下半部分：为什么需要场景？ =====

标题：二、为什么现在需要"场景"？

流程图（从左到右的箭头连接）：

[技术同质化] → [应用同质化] → [场景化是唯一差异点]
基座模型能力     套壳产品泛滥    结论
差不多           ChatDOC/PDF

【设计风格要求】
• 参考小红书知识卡片风格，信息图表设计
• 配色：蓝色主色调（专业感）+ 橙色点缀（重点突出）
• 排版：网格化，模块化，条理清晰
• 表格边框清晰，有背景色区分
• 流程图用箭头连接，视觉流畅
• 图标：使用简约扁平图标
• 留白均匀，不拥挤
• 整体风格：专业干货，知识分享类`;

const PAGE2_PROMPT = `你是一位专业的信息图表设计师。请为以下内容设计一张精美的PPT单页图片。

【页面标题】
如何产出高针对性场景？
（第2页：方法论 + 实战案例）

【内容布局 - 分为上下两个板块】

===== 上半部分：三步方法论 =====

标题：三步方法论 → 场景卡片

表格（3列）：
| Step | 动作 | 关键问题 |
|:----:|------|----------|
| 1️⃣ 用户视角 | 洞察需求 | 在乎什么痛点？有什么待办任务？ |
| 2️⃣ 观察/调研 | 收集信息 | 做什么行为？什么情境？ |
| 3️⃣ PM转化 | 转化为产品 | 场景具象化 + 技术可落性 |

产出标识：
📋 产出 = 场景卡片

===== 下半部分：场景卡片好坏对比 =====

标题：场景卡片的好坏对比

对比表格（左右两列）：
左列标题：❌ 太泛（无法指导开发）
内容：办公提效

右列标题：✅ 具体（清晰可落地）
内容：在职场上，想快速将非结构化数据转换为结构化图表，且质量要满足投行标准

底部公式框（用醒目背景色）：
好场景公式 = 【用户群体】+【情境】+【核心任务】+【质量标准】

【设计风格要求】
• 参考小红书知识卡片风格，信息图表设计
• 配色：蓝色主色调（专业感）+ 橙色点缀（重点突出）
• 排版：网格化，模块化，条理清晰
• 表格边框清晰，有背景色区分
• 对比部分：左列用灰色/红色，右列用绿色/蓝色突出
• 公式框用醒目的渐变背景
• 留白均匀，不拥挤
• 整体风格：专业干货，知识分享类`;

// ============================================
// 加载环境变量
// ============================================
async function loadEnv(): Promise<void> {
  const envPath = path.join(process.cwd(), "Uncle-L-random-wellness-notes", ".env");
  try {
    const envContent = await fs.readFile(envPath, "utf-8");
    envContent.split("\n").forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  } catch (err) {
    console.error("无法加载.env文件:", err);
  }
}

// ============================================
// 初始化配置
// ============================================
async function initConfig(): Promise<boolean> {
  await loadEnv();

  config = {
    ARK_API_KEY: process.env.ARK_API_KEY || "",
    ARK_MODEL: process.env.ARK_MODEL || "",
    IMAGE_SIZE: process.env.IMAGE_SIZE || "1920x1080",
  };

  if (!config.ARK_API_KEY || !config.ARK_MODEL) {
    console.error("❌ 缺少API配置");
    return false;
  }

  return true;
}

// ============================================
// 生成图片
// ============================================
async function generateImage(prompt: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`\n🎨 正在生成图片: ${path.basename(outputPath)}`);

    const response = await fetch(JIMENG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.ARK_MODEL,
        prompt: prompt,
        n: 1,
        size: config.IMAGE_SIZE,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.data || !result.data[0] || !result.data[0].url) {
      throw new Error(`API响应格式错误`);
    }

    const imageUrl = result.data[0].url;
    console.log(`   📥 下载图片中...`);

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`下载图片失败: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(imageBuffer));

    console.log(`   ✅ 保存成功: ${outputPath}`);
    return true;

  } catch (e) {
    console.log(`   ❌ 生成失败: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("   场景化思维PPT生成器");
  console.log("=".repeat(60));

  const configured = await initConfig();
  if (!configured) {
    process.exit(1);
  }

  // 输出目录
  const desktopPath = path.join(os.homedir(), "Desktop");
  const outputDir = path.join(desktopPath, `场景化PPT-${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}`);

  // 保存prompt文件
  await fs.writeFile(path.join(outputDir, "page1-prompt.txt"), PAGE1_PROMPT, "utf-8");
  await fs.writeFile(path.join(outputDir, "page2-prompt.txt"), PAGE2_PROMPT, "utf-8");

  // 生成两页图片
  const page1Path = path.join(outputDir, "第1页-场景定义.png");
  const page2Path = path.join(outputDir, "第2页-方法论.png");

  console.log(`\n🎨 开始生成2页PPT图片...\n`);

  const result1 = await generateImage(PAGE1_PROMPT, page1Path);
  const result2 = await generateImage(PAGE2_PROMPT, page2Path);

  // 生成Markdown版本
  const mdContent = `# 场景化思维PPT

## 第1页：什么是场景？为什么需要场景？

### 一、场景的定义（两个维度）

| 维度 | 内容 |
|------|------|
| **用户群体** | 谁？在什么状态下？ |
| **核心需求** | 功能性需求 + 情绪价值 |

📌 **举例**：需要AI代写情书
- 功能性：不知道怎么写 → 帮我生成内容
- 情绪价值：真诚感 → 不是套路模板

---

### 二、为什么现在需要"场景"？

\`\`\`
技术同质化          应用同质化
基座模型能力差不多  →  套壳产品泛滥
        ↓                ↓
    场景化是唯一差异点
\`\`\`

---

## 第2页：如何产出高针对性场景？

### 三步方法论 → 场景卡片

| Step | 动作 | 关键问题 |
|:----:|------|----------|
| 1️⃣ | **用户视角** | 在乎什么痛点？有什么待办任务？ |
| 2️⃣ | **观察/调研** | 做什么行为？什么情境？ |
| 3️⃣ | **PM转化** | 场景具象化 + 技术可落性 |

📋 **产出 = 场景卡片**

---

### 场景卡片的好坏对比

| ❌ 太泛 | ✅ 具体 |
|-------|-------|
| "办公提效" | "在职场上，想快速将**非结构化数据**转换为**结构化图表**，且质量要满足**投行标准**" |

**好场景公式：**
\`\`\`
【用户群体】+【情境】+【核心任务】+【质量标准】
\`\`\`
`;

  await fs.writeFile(path.join(outputDir, "PPT内容.md"), mdContent, "utf-8");

  console.log("\n" + "=".repeat(60));
  console.log(`   📁 输出位置: ${outputDir}`);
  console.log("=".repeat(60));
  console.log(`\n✅ 第1页: ${result1 ? "成功" : "失败"}`);
  console.log(`✅ 第2页: ${result2 ? "成功" : "失败"}`);
  console.log(`📄 Markdown版本: PPT内容.md\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
