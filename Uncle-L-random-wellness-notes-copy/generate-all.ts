#!/usr/bin/env tsx
/**
 * 小红书万能博主生成器
 * 需要配置环境变量：DEEPSEEK_API_KEY, ARK_API_KEY, ARK_MODEL
 *
 * 使用方法:
 * 1. 在项目根目录创建 .env 文件并配置 API 密钥
 * 2. 运行: npx tsx generate-all.ts "你的标题"
 *
 * 说明:
 * - 输入标题后，AI会自动分析内容并匹配最合适的画风
 * - 每次生成 3 张不同角度的图片供选择
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ============================================
// API 配置
// ============================================
const DEEPSEEK_URL = "https://api.deepseek.com/v1";

// 配置对象
let config = {
  DEEPSEEK_API_KEY: "",
  ARK_API_KEY: "",
  ARK_MODEL: "",
  IMAGE_SIZE: "1024x1365",
};

// ============================================
// 加载 .env 文件
// ============================================
async function loadEnv(): Promise<void> {
  const envPath = path.join(process.cwd(), ".env");
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
    // .env 文件不存在，忽略
  }
}

// ============================================
// 初始化配置
// ============================================
async function initConfig(): Promise<boolean> {
  await loadEnv();

  config = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
    ARK_API_KEY: process.env.ARK_API_KEY || "",
    ARK_MODEL: process.env.ARK_MODEL || "",
    IMAGE_SIZE: process.env.IMAGE_SIZE || "1024x1365",
  };

  return validateConfig();
}

// ============================================
// 验证 API 配置
// ============================================
function validateConfig(): boolean {
  const missing: string[] = [];

  if (!config.DEEPSEEK_API_KEY) missing.push("DEEPSEEK_API_KEY");
  if (!config.ARK_API_KEY) missing.push("ARK_API_KEY");
  if (!config.ARK_MODEL) missing.push("ARK_MODEL");

  if (missing.length > 0) {
    console.error("\n❌ 错误：缺少以下环境变量配置：");
    missing.forEach(key => console.error(`   - ${key}`));
    console.error("\n请在 .env 文件中配置这些变量\n");
    return false;
  }

  return true;
}

// ============================================
// 工具函数
// ============================================
function getTimestamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// ============================================
// Deepseek API - 分析标题并生成内容
// ============================================
async function generateContent(title: string) {
  console.log(`\n📝 正在分析标题并生成内容...`);

  const prompt = `你是一位专业的小红书爆款内容创作者。我会给你一个标题，你需要帮我生成一套完整的小红书图文内容。

【我的标题】
${title}

【你需要生成的内容】

1. **小红书标题优化**
   - 基于我的标题，生成一个更具吸引力的小红书风格标题
   - 要有emoji、要能引起共鸣/好奇心

2. **内容风格分析**
   - 分析这个内容属于什么类型（情感/搞笑/科普/干货/种草/日常等）
   - 判断适合什么视觉风格

3. **核心要点/物品/步骤**
   - 给出 3-6 个具体的要点

4. **正文内容**
   - 写一篇完整的小红书正文
   - 开头要有共鸣/痛点引入
   - 中间详细展开每个要点
   - 结尾要有互动引导
   - 语气要像和朋友聊天

5. **标签建议**
   - 给出 8-12 个相关话题标签

6. **图片配文**
   - 为图片写一段简短有力的配文
   - 20-50字，提炼核心信息

【输出格式】
请严格按照以下JSON格式输出：

{
  "optimized_title": "优化后的标题",
  "content_type": "内容类型",
  "visual_style": "适合的视觉风格",
  "points": [
    {"name": "要点1", "description": "描述1"}
  ],
  "content": "正文内容",
  "tags": ["#标签1"],
  "image_caption": "图片配文"
}

请生成：`;

  const response = await fetch(`${DEEPSEEK_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepseek API 错误: ${response.status}`);
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
// Deepseek API - 根据内容生成图片提示词
// ============================================
async function generateImagePrompts(data: any, title: string, count: number = 3) {
  console.log(`\n🎨 正在根据内容风格生成 ${count} 种图片...`);

  const prompts: string[] = [];

  for (let i = 0; i < count; i++) {
    const angle = i === 0 ? "整体概览" : i === 1 ? "细节特写" : "场景氛围";

    const prompt = `你是一位专业的小红书图片设计师。请为以下小红书笔记设计一张图片。

【笔记标题】${data.optimized_title}
【原始标题】${title}
【图片配文】${data.image_caption}
【内容类型】${data.content_type}
【视觉风格】${data.visual_style}

【核心要点】
${data.points.map((p: any, i: number) => `${i + 1}. ${p.name}: ${p.description}`).join("\n")}

【设计要求】
这是第 ${i + 1} 张图片，呈现角度：${angle}

请根据内容类型和视觉风格，生成一张匹配的图片。要求：
1. 竖屏3:4比例
2. 画面有吸引力和故事感
3. 符合小红书审美
4. 不要出现过多文字，以视觉为主

【重要】如果图片中需要出现任何文字（标题、标签、对话等），必须使用中文，不要使用英文。

请直接给出图片生成的详细提示词（用英文描述画面，但指定图片内的文字都用中文），不要有任何其他文字。`;

    const response = await fetch(`${DEEPSEEK_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepseek API 错误: ${response.status}`);
    }

    const result = await response.json();
    let imagePrompt = result.choices[0].message.content;

    // 清理可能的markdown标记
    imagePrompt = imagePrompt.trim();
    if (imagePrompt.startsWith("```")) imagePrompt = imagePrompt.split("\n").slice(1).join("\n");
    if (imagePrompt.endsWith("```")) imagePrompt = imagePrompt.slice(0, -3);
    imagePrompt = imagePrompt.trim();

    prompts.push(imagePrompt);
  }

  return prompts;
}

// ============================================
// 火山引擎 API - 生成图片
// ============================================
async function generateImage(prompt: string, outputPath: string) {
  const JIMENG_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

  const requestBody = {
    model: config.ARK_MODEL,
    prompt: prompt,
    n: 1,
    size: config.IMAGE_SIZE,
  };

  const response = await fetch(JIMENG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\n   API错误详情: ${errorText}`);
    throw new Error(`火山引擎 API 错误: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.data || !result.data[0] || !result.data[0].url) {
    console.error(`\n   API响应: ${JSON.stringify(result)}`);
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
// 生成单组笔记
// ============================================
async function generateNote(title: string, outputDir: string): Promise<boolean> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`   🎲 生成笔记: ${title}`);
  console.log(`${"=".repeat(60)}`);

  const folderName = sanitizeFilename(title);
  const noteDir = path.join(outputDir, folderName);
  await fs.mkdir(noteDir, { recursive: true });

  console.log(`\n📁 输出目录: ${noteDir}`);

  // Step 1: 生成内容
  let contentData;
  let retries = 3;

  while (retries > 0) {
    try {
      contentData = await generateContent(title);
      break;
    } catch (e) {
      console.log(`   API调用失败，重试... (${4 - retries}/3)`);
      retries--;
    }
  }

  if (!contentData) {
    console.log(`❌ 内容生成失败`);
    return false;
  }

  console.log(`\n   ✅ 优化标题: ${contentData.optimized_title}`);
  console.log(`   ✅ 内容类型: ${contentData.content_type}`);
  console.log(`   ✅ 视觉风格: ${contentData.visual_style}`);
  console.log(`   ✅ 生成 ${contentData.points.length} 个要点:`);
  contentData.points.forEach((p: any, i: number) => console.log(`      ${i + 1}. ${p.name}`));
  console.log(`   ✅ 图片配文: ${contentData.image_caption}`);

  // 保存内容
  const mdContent = `# ${contentData.optimized_title}

## 原始标题
${title}

## 内容分析
- **类型**: ${contentData.content_type}
- **视觉风格**: ${contentData.visual_style}

## 要点列表
${contentData.points.map((p: any, i: number) => `${i + 1}. **${p.name}**\n   ${p.description}`).join("\n\n")}

## 图片配文
${contentData.image_caption}

---

## 正文内容

${contentData.content}

---

## 标签

${contentData.tags.join(" ")}
`;
  await fs.writeFile(path.join(noteDir, "content.md"), mdContent, "utf-8");

  // 保存JSON数据
  await fs.writeFile(path.join(noteDir, "data.json"), JSON.stringify(contentData, null, 2), "utf-8");

  // Step 2: 生成图片提示词
  const imagePrompts = await generateImagePrompts(contentData, title, 3);

  // Step 3: 生成图片
  console.log(`\n🎨 开始生成 3 张图片...\n`);

  let successCount = 0;
  const angles = ["整体概览", "细节特写", "场景氛围"];

  for (let i = 0; i < imagePrompts.length; i++) {
    console.log(`\n   ${i + 1}. ${angles[i]} - 生成中...`);

    const promptFileName = `image-${i + 1}-prompt.txt`;
    const imageFileName = `image-${i + 1}.png`;

    await fs.writeFile(path.join(noteDir, promptFileName), imagePrompts[i], "utf-8");

    try {
      await generateImage(imagePrompts[i], path.join(noteDir, imageFileName));
      console.log(`      ✅ 成功`);
      successCount++;
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n\n   成功生成 ${successCount}/3 张图片`);

  console.log(`\n✨ 生成完成!`);
  return true;
}

// ============================================
// 主函数
// ============================================
async function main() {
  // 初始化配置
  const configured = await initConfig();
  if (!configured) {
    process.exit(1);
  }

  // 获取标题
  const title = process.argv[2];

  if (!title) {
    console.log("\n" + "✨".repeat(30));
    console.log("   小红书万能博主生成器");
    console.log("   " + "✨".repeat(30) + "\n");
    console.log("使用方法:");
    console.log("  npx tsx generate-all.ts \"你的标题\"\n");
    console.log("说明:");
    console.log("  - AI会自动分析内容类型和适合的画风");
    console.log("  - 每次生成 3 张不同角度的图片\n");
    console.log("示例:");
    console.log("  npx tsx generate-all.ts \"妈妈寄来的老干妈被扣了\"");
    console.log("  npx tsx generate-all.ts \"月薪3000在杭州怎么活\"\n");
    process.exit(0);
  }

  console.log("\n" + "✨".repeat(30));
  console.log("   小红书万能博主生成器");
  console.log("   " + "✨".repeat(30));
  console.log(`\n   📝 标题: ${title}`);
  console.log(`   🤖 AI将自动识别适合的画风\n`);

  // 输出目录
  const desktopPath = path.join(os.homedir(), "Desktop");
  const outputDir = path.join(desktopPath, `小红书笔记-${getTimestamp()}`);
  await fs.mkdir(outputDir, { recursive: true });

  // 生成
  await generateNote(title, outputDir);

  console.log("\n" + "=".repeat(60));
  console.log(`   📁 输出位置: ${outputDir}`);
  console.log("=".repeat(60) + "\n");
}

// 运行
main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
