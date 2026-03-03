#!/usr/bin/env tsx
/**
 * 小红书玩梗抽象生成器
 * 需要配置环境变量：DEEPSEEK_API_KEY, ARK_API_KEY, ARK_MODEL
 *
 * 使用方法:
 * 1. 在项目根目录创建 .env 文件并配置 API 密钥
 * 2. 运行: npx tsx generate-all.ts "你的标题"
 *
 * 说明:
 * - 玩梗抽象风格，大量使用网络流行语、梗、抽象表达
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
// Deepseek API - 分析标题并生成内容（玩梗抽象版）
// ============================================
async function generateContent(title: string) {
  console.log(`\n📝 正在分析标题并生成内容...`);

  const prompt = `你是一位精通玩梗抽象风格的小红书博主，你是热点梗的捕捉大师，反应神速，永远冲在玩梗第一线。

【我的标题】
${title}

【你的人物设定】
- 5G冲浪选手，每天24小时在线吃瓜，新梗出来3秒内就能玩
- 热点雷达精准，任何时事、热点、新梗都能立马联想到
- 时效性极强，说梗就要说最新的，不说过气的
- 喜欢用抽象、玩梗、阴阳怪气的方式表达
- 说话风格：抽象、玩梗、梗多、破防、蚌埠住了、抽象话、emoji多
- 热门梗库（随时间更新，永远用最新的梗）：家人们、咱就是说、一整个、狠狠、太绝了、笑不活了、我直接一个好家伙、纯纯的、狠狠拿捏、这波是、谁懂啊、家人们谁懂啊、破防了、蚌埠住了、狠狠共情了、直接给我整破防了、这波在大气层、坐牢、发疯、精神状态、我的评价是、真有你的、你是懂xx的、一眼顶针、鉴定为、这才是、yyds、绝绝子、尊嘟假嘟、泰酷辣、汗流浃背了、整个人都不好了、我是真的会谢、这个逼班是一天也上不下去了、一整个大动作、真的会谢、我直接好家伙、纯纯的大冤种、狠狠拿捏了、这波在大气层、谁懂啊家人们、狠狠破防了、蚌埠住了、直接给我整不会了、我真的会谢、我的评价是、真有你的、这才是、一眼顶针鉴定为、这就是、懂你的、我哭死、这个设定、这个是真的、那个是真、建议直接、这波是、这波属于是、狠狠、狠狠共情了、直接给我整破防了、这波在大气层等

【时效性要求】
- 假设现在是2026年2月，请使用2025-2026年最新的网络梗
- 不要用2023年及之前的过气梗（如yyds、绝绝子、尊嘟假嘟这种老梗）
- 捕捉标题中的时效性元素，如果是热点事件要快速反应
- 内容要有"刚发生""正在发生"的即时感

【你需要生成的内容】

1. **小红书标题优化（玩梗版）**
   - 大量使用emoji
   - 用抽象玩梗的方式表达
   - 让人一看就想点进来

2. **内容风格分析**
   - 分析这个内容适合用什么梗和抽象表达

3. **核心要点（玩梗版）**
   - 3-6 个要点
   - 每个要点都要用玩梗抽象的方式表达

4. **正文内容（疯狂玩梗版）**
   - 开头：用梗引入，比如"家人们谁懂啊"、"咱就是说"、"一整个大无语"
   - 中间：疯狂玩梗，大量使用网络流行语
   - 结尾：抽象式互动引导
   - emoji要贯穿全文，越多越好

5. **标签建议（玩梗版）**
   - 8-12 个标签，要抽象要玩梗

6. **图片配文（抽象版）**
   - 20-50字，用梗表达

【输出格式】
请严格按照以下JSON格式输出：

{
  "optimized_title": "优化后的标题（玩梗版，emoji多）",
  "content_type": "内容类型",
  "visual_style": "适合的视觉风格",
  "points": [
    {"name": "要点1（玩梗版）", "description": "描述1（玩梗版）"}
  ],
  "content": "正文内容（疯狂玩梗版）",
  "tags": ["#标签1（玩梗版）"],
  "image_caption": "图片配文（抽象版）"
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
      temperature: 0.9,
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

    const prompt = `你是一位擅长玩梗抽象风格的小红书图片设计师。请为以下小红书笔记设计一张图片。

【笔记标题】${data.optimized_title}
【原始标题】${title}
【图片配文】${data.image_caption}
【内容类型】${data.content_type}
【视觉风格】${data.visual_style}

【核心要点】
${data.points.map((p: any, i: number) => `${i + 1}. ${p.name}: ${p.description}`).join("\n")}

【设计要求】
这是第 ${i + 1} 张图片，呈现角度：${angle}

图片风格要求：
1. 玩梗抽象、梗多、emoji多
2. 可以用表情包、梗图、抽象元素
3. 配色鲜艳活泼，符合Z世代审美
4. 3:4竖屏比例
5. 符合小红书玩梗博主风格

【重要】图片中出现的所有文字必须是中文！包括标题、标签、对话气泡等，不要使用英文文字。

请直接给出图片生成的详细提示词（用英文描述画面，但指定所有图片内的文字都要用中文），不要有任何其他文字。`;

    const response = await fetch(`${DEEPSEEK_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepseek API 错误: ${response.status}`);
    }

    const result = await response.json();
    let imagePrompt = result.choices[0].message.content;

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
    console.log("\n" + "🤪".repeat(30));
    console.log("   小红书玩梗抽象生成器");
    console.log("   " + "🤪".repeat(30) + "\n");
    console.log("使用方法:");
    console.log("  npx tsx generate-all.ts \"你的标题\"\n");
    console.log("说明:");
    console.log("  - 玩梗抽象风格，疯狂玩梗");
    console.log("  - 每次生成 3 张不同角度的图片\n");
    console.log("示例:");
    console.log("  npx tsx generate-all.ts \"今天被老板骂了\"");
    console.log("  npx tsx generate-all.ts \"这顿饭我直接吃穷了\"\n");
    process.exit(0);
  }

  console.log("\n" + "🤪".repeat(30));
  console.log("   小红书玩梗抽象生成器");
  console.log("   " + "🤪".repeat(30));
  console.log(`\n   📝 标题: ${title}`);
  console.log(`   🤪 玩梗模式启动！\n`);

  // 输出目录
  const desktopPath = path.join(os.homedir(), "Desktop");
  const outputDir = path.join(desktopPath, `小红书玩梗笔记-${getTimestamp()}`);
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
