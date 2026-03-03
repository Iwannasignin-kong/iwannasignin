#!/usr/bin/env tsx
/**
 * REDINK小红书内容创作工作室
 * 完整工作流：参考图分析 → Prompt提取优化 → AI二次创作
 *
 * 工作模式:
 * 1. analyze - 分析参考图，提取构图/风格/元素，生成优化Prompt
 * 2. create - 从标题创作完整内容（原标题功能）
 * 3. remix - 基于参考图进行二次创作
 *
 * 依赖环境变量:
 * - DEEPSEEK_API_KEY - Deepseek API密钥
 * - ARK_API_KEY - 火山引擎API密钥
 * - ARK_MODEL - 模型名称
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import readline from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3";
const ARK_IMAGE_ANALYSIS_URL = `${ARK_URL}/image/analysis`;

// ============================================
// 配置管理
// ============================================

interface Config {
  ARK_API_KEY: string;
  ARK_CHAT_MODEL: string;      // 用于图片分析和Prompt生成（支持vision）
  ARK_IMAGE_MODEL: string;      // 用于图片生成（文生图）
  IMAGE_SIZE: string;
}

let config: Config = {
  ARK_API_KEY: "",
  ARK_CHAT_MODEL: "",
  ARK_IMAGE_MODEL: "",
  IMAGE_SIZE: "1920x1920",
};

async function loadEnv(): Promise<void> {
  const envPaths = [
    path.join(process.cwd(), ".env"),
    path.join(__dirname, ".env"),
  ];

  for (const envPath of envPaths) {
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
      break;
    } catch {
      continue;
    }
  }
}

async function initConfig(): Promise<boolean> {
  await loadEnv();

  config = {
    ARK_API_KEY: process.env.ARK_API_KEY || "",
    ARK_CHAT_MODEL: process.env.ARK_CHAT_MODEL || "",
    ARK_IMAGE_MODEL: process.env.ARK_IMAGE_MODEL || process.env.ARK_MODEL || "",
    IMAGE_SIZE: process.env.IMAGE_SIZE || "1920x1920",
  };

  return validateConfig();
}

function validateConfig(): boolean {
  const missing: string[] = [];
  if (!config.ARK_API_KEY) missing.push("ARK_API_KEY");
  if (!config.ARK_CHAT_MODEL) missing.push("ARK_CHAT_MODEL");
  if (!config.ARK_IMAGE_MODEL) missing.push("ARK_IMAGE_MODEL");

  if (missing.length > 0) {
    console.error("❌ 缺少环境变量:", missing.join(", "));
    return false;
  }
  return true;
}

// ============================================
// 工具函数
// ============================================

function getTimestamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function base64FromFile(filePath: string): string {
  const buffer = require("node:fs").readFileSync(filePath);
  return buffer.toString("base64");
}

// ============================================
// 交互式确认
// ============================================

async function confirmOrEditPrompt(originalPrompt: string, context: string = ""): Promise<string> {
  // 检查是否禁用了交互模式
  if ((globalThis as any).INTERACTIVE_MODE === false) {
    return originalPrompt;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n" + "─".repeat(60));
  console.log("📝 即将生成的Prompt:");
  console.log("─".repeat(60));
  console.log(originalPrompt);
  console.log("─".repeat(60));

  const answer = await new Promise<string>((resolve) => {
    rl.question("\n是否需要修改？直接回车使用原prompt，或输入修改意见（支持简短描述）:\n> ", (input) => {
      resolve(input.trim());
    });
  });

  rl.close();

  // 如果用户没有输入，返回原prompt
  if (!answer) {
    console.log("✅ 使用原prompt\n");
    return originalPrompt;
  }

  // 用户输入了修改意见，用AI理解并优化
  console.log(`\n🤖 AI正在理解你的修改意见: "${answer}"`);

  const enhancedPrompt = await enhancePromptWithUserIntent(originalPrompt, answer, context);

  console.log("\n✨ 优化后的Prompt:");
  console.log("─".repeat(60));
  console.log(enhancedPrompt);
  console.log("─".repeat(60));

  // 二次确认
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirm = await new Promise<string>((resolve) => {
    rl2.question("\n是否使用优化后的prompt？(Y/n): ", (input) => {
      resolve(input.trim().toLowerCase());
    });
  });

  rl2.close();

  if (confirm === 'n') {
    console.log("❌ 取消，使用原prompt\n");
    return originalPrompt;
  }

  console.log("✅ 使用优化后的prompt\n");
  return enhancedPrompt;
}

async function enhancePromptWithUserIntent(originalPrompt: string, userIntent: string, context: string): Promise<string> {
  const prompt = `你是一个AI绘画Prompt优化专家。用户给出了一个原prompt和简短的修改意见，请理解用户的意图并优化prompt。

【原Prompt】
${originalPrompt}

【用户修改意见】
${userIntent}

${context ? `【参考信息】\n${context}` : ""}

请根据用户的修改意见，优化原prompt，生成一个完整的新prompt。

要求：
1. 理解用户的真实意图（即使用户表达不完整）
2. 保持原prompt的优秀部分（风格、构图等）
3. 融合用户的修改需求
4. 输出完整的英文prompt
5. 保持质量关键词（high quality, detailed等）

请只返回优化后的prompt，不要其他内容。`;

  try {
    const response = await fetch(`${ARK_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.ARK_CHAT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      let enhanced = result.choices[0].message.content.trim();

      // 清理可能的markdown标记
      if (enhanced.startsWith("```")) enhanced = enhanced.split("\n").slice(1).join("\n");
      if (enhanced.endsWith("```")) enhanced = enhanced.slice(0, -3);
      enhanced = enhanced.trim();

      return enhanced;
    }
  } catch (e) {
    console.log("⚠️  AI优化失败，使用原prompt");
  }

  return originalPrompt;
}

// ============================================
// Deepseek API
// ============================================

interface ImageAnalysisResult {
  overall_description: string;
  composition: {
    layout: string;
    perspective: string;
    focus_point: string;
  };
  style: {
    art_style: string;
    color_palette: string[];
    mood: string;
    lighting: string;
  };
  elements: {
    main_subject: string;
    key_objects: string[];
    background: string;
    text_overlay?: string[];
  };
  tech_specs: {
    quality_keywords: string[];
    composition_keywords: string[];
    style_keywords: string[];
  };
}

async function analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
  console.log("\n🔍 火山引擎Chat模型正在分析参考图...");

  const base64Image = base64FromFile(imagePath);
  const mimeType = path.extname(imagePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";

  const prompt = `你是一位专业的小红书图片分析专家。请仔细分析这张参考图，提取出可用于AI绘画的关键信息。

请按照以下JSON格式返回分析结果：

{
  "overall_description": "图片的整体描述，一句话概括",
  "composition": {
    "layout": "构图布局（居中/三分法/对称/对角线等）",
    "perspective": "视角（平视/俯视/仰视/特写等）",
    "focus_point": "焦点位置（中心/左上/右下等）"
  },
  "style": {
    "art_style": "艺术风格（如：网络表情包/梗图/插画/摄影/3D渲染/水彩/极简等）",
    "color_palette": ["主色1", "主色2", "点缀色"],
    "mood": "氛围感（温馨/搞笑/自嘲/活泼/高级/文艺等）",
    "lighting": "光线（自然光/暖光/冷光/柔光/高对比度等）"
  },
  "elements": {
    "main_subject": "画面主体是什么",
    "key_objects": ["关键元素1", "关键元素2", "关键元素3"],
    "background": "背景描述",
    "text_overlay": ["图中已有的文字内容（如果有）"]
  },
  "tech_specs": {
    "quality_keywords": ["高质量", "细节丰富", "简洁", "表情包风格"],
    "composition_keywords": ["构图平衡", "视觉焦点", "层次分明", "中心构图"],
    "style_keywords": ["风格关键词1", "风格关键词2"]
  }
}

注意：
1. 如果图中有文字，请准确提取文字内容
2. 提取的关键词要适合用于AI绘画prompt
3. 分析要具体，不要泛泛而谈
4. 如果是表情包/梗图风格，请准确识别其特征（夸张表情、大字报文字、高饱和度等）

请只返回JSON，不要其他内容。`;

  // 使用火山引擎Chat模型的vision能力
  const response = await fetch(`${ARK_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_CHAT_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
        ]
      }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`火山引擎Chat模型错误: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  let content = result.choices[0].message.content;

  content = content.trim();
  if (content.startsWith("```json")) content = content.slice(7);
  if (content.startsWith("```")) content = content.slice(3);
  if (content.endsWith("```")) content = content.slice(0, -3);
  content = content.trim();

  return JSON.parse(content);
}

interface OptimizedPrompts {
  original_analysis: string;
  style_prompt: string;
  composition_prompt: string;
  element_prompt: string;
  full_prompt_en: string;
  suggested_tags: string[];
  remix_ideas: string[];
}

async function generateOptimizedPrompts(analysis: ImageAnalysisResult, userContext?: string): Promise<OptimizedPrompts> {
  console.log("\n✨ 火山引擎Chat模型正在生成优化Prompt...");

  const contextAddition = userContext ? `\n【用户补充说明】\n${userContext}` : "";

  // 示例提示词作为风格参考
  const EXAMPLE_PROMPT = `2026 worker meme, a chonky orange and white cat wearing a blue striped tie, sitting at an office desk with stacks of papers, a keyboard, and a monitor. On the monitor, a horse wearing a wig with the text "我司雇我在 我在工位很想你 还好马上过年放假了". The cat has a deadpan, resigned expression. Text overlay: "2026正式确诊为：斑马 一只上着普通班的普通马 天天想辞职 月月拿满勤". Internet meme style, bright colors, humorous, high resolution, no watermark, --ar 1:1 --style raw --v 6.0`;

  const prompt = `你是一位专业的AI绘画Prompt工程师。请参考以下示例提示词的风格和格式，基于图片分析结果生成优化的AI绘画Prompt。

【示例提示词参考】（学习这个示例的写法、风格描述和质量标准）
${EXAMPLE_PROMPT}

示例特点分析：
- 具体角色描述：chonky orange and white cat, wearing a blue striped tie
- 具体场景元素：office desk, stacks of papers, keyboard, monitor
- 表情和情绪：deadpan, resigned expression
- 文字内容：准确包含中文text overlay
- 风格关键词：Internet meme style, bright colors, humorous
- 质量标准：high resolution, no watermark

---

【图片分析结果】
${JSON.stringify(analysis, null, 2)}
${contextAddition}

请参考示例的写法，生成以下内容（以JSON格式返回）：

{
  "original_analysis": "原图风格总结（中文，50字以内）",
  "style_prompt": "风格专用Prompt（英文，参考示例的写法，描述艺术风格、色彩、氛围）",
  "composition_prompt": "构图专用Prompt（英文，描述构图、视角、焦点）",
  "element_prompt": "元素专用Prompt（英文，参考示例的具体描述方式，描述主体、关键元素）",
  "full_prompt_en": "完整英文Prompt，参考示例风格整合所有要素，适合直接用于AI绘画",
  "suggested_tags": ["小红书标签1", "标签2", "标签3"],
  "remix_ideas": ["二次创作创意1（描述如何改变主题但保持风格）", "创意2", "创意3"]
}

Prompt编写要求：
1. 参考示例的具体描述方式，不要泛泛而谈
2. 使用英文编写Prompt，关键词用逗号分隔
3. 包含示例中的质量标准：humorous, high resolution, no watermark
4. 风格描述要具体：类似示例的 "Internet meme style, bright colors"
5. 构图灵活处理：
   - 如果主题是单个角色展示 → 使用centered composition（居中构图）
   - 如果需要突出文字内容 → 使用upper-lower split（上下分栏）
   - 根据主题特点选择最合适的构图，不要照搬参考图布局
6. 如果有文字，使用 "Text overlay: \"中文内容\"" 的格式
7. 角色描述要像示例一样生动：chonky cat, deadpan expression这种具体描述

请只返回JSON，不要其他内容。`;

  const response = await fetch(`${ARK_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`火山引擎Chat模型错误: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  let content = result.choices[0].message.content;

  content = content.trim();
  if (content.startsWith("```json")) content = content.slice(7);
  if (content.startsWith("```")) content = content.slice(3);
  if (content.endsWith("```")) content = content.slice(0, -3);
  content = content.trim();

  return JSON.parse(content);
}

// ============================================
// 火山引擎图片生成
// ============================================

async function generateImage(prompt: string, outputPath: string): Promise<void> {
  const JIMENG_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

  const response = await fetch(JIMENG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_IMAGE_MODEL,
      prompt: prompt,
      n: 1,
      size: config.IMAGE_SIZE,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`火山引擎 API 错误: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.data || !result.data[0] || !result.data[0].url) {
    throw new Error(`API 响应格式错误: ${JSON.stringify(result)}`);
  }

  const imageUrl = result.data[0].url;

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`下载图片失败: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(imageBuffer));
}

// ============================================
// 工作流函数
// ============================================

async function workflowAnalyze(imagePath: string, userContext?: string): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("   🔍 模式: 分析参考图");
  console.log("=".repeat(60));

  // 分析图片
  const analysis = await analyzeImage(imagePath);

  // 生成优化Prompt
  const prompts = await generateOptimizedPrompts(analysis, userContext);

  // 输出结果
  console.log("\n📋 分析结果:");
  console.log(`   原图风格: ${prompts.original_analysis}`);
  console.log(`   艺术风格: ${analysis.style.art_style}`);
  console.log(`   构图布局: ${analysis.composition.layout}`);
  console.log(`   色彩氛围: ${analysis.style.color_palette.join(", ")} - ${analysis.style.mood}`);

  console.log("\n🎨 优化的Prompt:");
  console.log(`   风格: ${prompts.style_prompt}`);
  console.log(`   构图: ${prompts.composition_prompt}`);
  console.log(`   元素: ${prompts.element_prompt}`);

  console.log("\n✨ 完整Prompt (可直接用于AI绘画):");
  console.log(`   ${prompts.full_prompt_en}`);

  console.log("\n💡 二次创作创意:");
  prompts.remix_ideas.forEach((idea, i) => console.log(`   ${i + 1}. ${idea}`));

  console.log("\n🏷️ 建议标签:");
  console.log(`   ${prompts.suggested_tags.join(" ")}`);

  // 保存结果
  const outputDir = path.join(os.homedir(), "Desktop", `REDINK分析-${getTimestamp()}`);
  await fs.mkdir(outputDir, { recursive: true });

  const reportPath = path.join(outputDir, "analysis-report.md");
  const reportContent = `# REDINK 图片分析报告

## 原图风格总结
${prompts.original_analysis}

## 详细分析

### 构图
- 布局: ${analysis.composition.layout}
- 视角: ${analysis.composition.perspective}
- 焦点: ${analysis.composition.focus_point}

### 风格
- 艺术风格: ${analysis.style.art_style}
- 色彩: ${analysis.style.color_palette.join(", ")}
- 氛围: ${analysis.style.mood}
- 光线: ${analysis.style.lighting}

### 元素
- 主体: ${analysis.elements.main_subject}
- 关键元素: ${analysis.elements.key_objects.join(", ")}
- 背景: ${analysis.elements.background}
${analysis.elements.text_overlay ? `- 图中文字: ${analysis.elements.text_overlay.join(", ")}` : ""}

## 优化的Prompt

### 风格Prompt
\`${prompts.style_prompt}\`

### 构图Prompt
\`${prompts.composition_prompt}\`

### 元素Prompt
\`${prompts.element_prompt}\`

### 完整Prompt (可直接使用)
\`\`\`
${prompts.full_prompt_en}
\`\`\`

## 二次创作创意
${prompts.remix_ideas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}

## 建议标签
${prompts.suggested_tags.join(" ")}

---
生成时间: ${new Date().toLocaleString("zh-CN")}
`;

  await fs.writeFile(reportPath, reportContent, "utf-8");

  // 复制参考图到输出目录
  const refImageCopy = path.join(outputDir, "reference-image" + path.extname(imagePath));
  await fs.copyFile(imagePath, refImageCopy);

  console.log(`\n📁 报告已保存: ${reportPath}`);
}

async function workflowRemix(imagePath: string, userPrompt?: string, count: number = 3): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("   🎨 模式: 二次创作");
  console.log("=".repeat(60));

  // 分析图片
  const analysis = await analyzeImage(imagePath);

  // 生成优化Prompt
  const prompts = await generateOptimizedPrompts(analysis, userPrompt);

  // 创建输出目录
  const outputDir = path.join(os.homedir(), "Desktop", `REDINK二次创作-${getTimestamp()}`);
  await fs.mkdir(outputDir, { recursive: true });

  // 保存分析报告
  const analysisPath = path.join(outputDir, "style-analysis.json");
  await fs.writeFile(analysisPath, JSON.stringify({ analysis, prompts }, null, 2), "utf-8");

  // 生成创意图片
  console.log(`\n🎨 准备生成 ${count} 张二次创作图片...\n`);

  const remixPrompts: string[] = [];

  for (let i = 0; i < count; i++) {
    let elementPrompt = prompts.element_prompt;
    let ideaDescription = prompts.remix_ideas[i] || "用户指定主题";

    if (userPrompt && i === 0) {
      // 第一张使用用户指定的主题
      elementPrompt = userPrompt;
      ideaDescription = `用户主题: ${userPrompt}`;
    } else if (prompts.remix_ideas[i - 1] || i > 0) {
      // 后续使用AI建议的创意
      const ideaIndex = userPrompt ? i - 1 : i;
      if (prompts.remix_ideas[ideaIndex]) {
        const ideaPrompt = await translateIdeaToPrompt(prompts.remix_ideas[ideaIndex], prompts);
        elementPrompt = ideaPrompt;
        ideaDescription = prompts.remix_ideas[ideaIndex];
      }
    }

    const fullPrompt = `${prompts.style_prompt}, ${prompts.composition_prompt}, ${elementPrompt}, high quality, detailed, 8k`;

    // 交互式确认
    console.log(`\n📌 第 ${i + 1}/${count} 张: ${ideaDescription}`);

    const finalPrompt = await confirmOrEditPrompt(
      fullPrompt,
      `创意描述: ${ideaDescription}\n风格: ${prompts.style_prompt}`
    );

    remixPrompts.push(finalPrompt);

    console.log(`   正在生成第 ${i + 1} 张...`);

    const imagePath = path.join(outputDir, `remix-${i + 1}.png`);
    const promptPath = path.join(outputDir, `remix-${i + 1}-prompt.txt`);

    await fs.writeFile(promptPath, finalPrompt, "utf-8");

    try {
      await generateImage(finalPrompt, imagePath);
      console.log(`      ✅ 成功`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n📁 输出目录: ${outputDir}`);
}

async function translateIdeaToPrompt(idea: string, styleContext: OptimizedPrompts): Promise<string> {
  const prompt = `将以下创意描述转换为英文AI绘画Prompt，保持简洁：

创意: ${idea}

参考风格: ${styleContext.style_prompt}

请只返回英文Prompt，不要其他内容。`;

  const response = await fetch(`${ARK_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    return idea;
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
}

// ============================================
// 主函数
// ============================================

async function main() {
  const args = process.argv.slice(2);

  // 解析标志参数
  const flags = {
    interactive: true,  // 默认启用交互
  };

  // 提取标志
  const filteredArgs = args.filter(arg => {
    if (arg === "--interactive" || arg === "-i") {
      flags.interactive = true;
      return false;
    }
    if (arg === "--no-interactive") {
      flags.interactive = false;
      return false;
    }
    return true;
  });

  if (filteredArgs.length === 0 || filteredArgs[0] === "help" || filteredArgs[0] === "--help" || filteredArgs[0] === "-h") {
    console.log("\n✨ REDINK小红书内容创作工作室 ✨\n");
    console.log("使用方法:");
    console.log("  analyze <图片路径> [用户备注]            # 分析参考图，提取Prompt");
    console.log("  remix <图片路径> <主题> [数量]           # 基于参考图二次创作");
    console.log("\n交互模式:");
    console.log("  --interactive, -i      # 启用交互确认（默认）");
    console.log("  --no-interactive       # 禁用交互，直接生成");
    console.log("\n示例:");
    console.log("  npx tsx redink-workflow.ts analyze reference.jpg");
    console.log("  npx tsx redink-workflow.ts remix reference.jpg \"确诊牛马\" 3");
    console.log("  npx tsx redink-workflow.ts remix reference.jpg \"确诊牛马\" 1 --no-interactive");
    console.log("\n交互模式下:");
    console.log("  - 生成图片前会显示prompt");
    console.log("  - 可以输入简短修改意见（如：加个猫咪、换个颜色）");
    console.log("  - AI会自动理解并优化prompt");
    console.log("");
    return;
  }

  const configured = await initConfig();
  if (!configured) {
    process.exit(1);
  }

  const mode = filteredArgs[0];

  if (mode === "analyze") {
    const imagePath = filteredArgs[1];
    const userContext = filteredArgs[2];
    if (!imagePath) {
      console.error("❌ 请指定图片路径");
      process.exit(1);
    }
    await workflowAnalyze(imagePath, userContext);

  } else if (mode === "remix") {
    const imagePath = filteredArgs[1];
    const userPrompt = filteredArgs[2];
    const count = parseInt(filteredArgs[3]) || 3;
    if (!imagePath) {
      console.error("❌ 请指定图片路径");
      process.exit(1);
    }

    // 设置交互模式标志（全局变量，让confirmOrEditPrompt使用）
    (globalThis as any).INTERACTIVE_MODE = flags.interactive;

    await workflowRemix(imagePath, userPrompt, count);

  } else {
    console.error(`❌ 未知模式: ${mode}`);
    console.log("   可用模式: analyze, remix");
    console.log("   运行 'npx tsx redink-workflow.ts help' 查看帮助");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
