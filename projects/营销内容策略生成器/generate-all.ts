#!/usr/bin/env tsx
/**
 * 小红书营销内容策略生成器 - 套图版
 * 用于推广产品/小程序，生成多组不同风格的套图内容
 *
 * 使用方法:
 * 1. 在项目根目录创建 .env 文件并配置 API 密钥
 * 2. 运行: npx tsx generate-all.ts "产品/小程序描述"
 *
 * 输出:
 * - 5组不同抽象风格的内容
 * - 每组包含3-4张套图
 * - 可用于持续性投放测试
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
  IMAGE_SIZE: "1920x1920",  // 火山引擎要求至少3686400像素
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

// 安全解析JSON
function safeParseJSON(content: string): any {
  content = content.trim();
  if (content.startsWith("```json")) content = content.slice(7);
  if (content.startsWith("```")) content = content.slice(3);
  if (content.endsWith("```")) content = content.slice(0, -3);
  content = content.trim();

  // 移除控制字符
  content = content.replace(/[\x00-\x1F\x7F]/g, "");

  try {
    return JSON.parse(content);
  } catch (e) {
    let fixedContent = content
      // 修复中文引号
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      // 修复标签中的引号问题
      .replace(/"#/g, '\\"#')
      .replace(/#"/g, '#\\"')
      // 修复转义引号
      .replace(/\\"/g, '"')
      // 修复尾随逗号
      .replace(/,\s*]/g, ']')
      .replace(/,\s*}/g, '}')
      // 修复空格导致的键名问题
      .replace(/"[\s]*:/g, '":')
      // 修复换行符
      .replace(/\n\s*\n/g, '\n')
      // 修复字符串内的换行
      .replace(/"([^"]*)\n([^"]*)"/g, '"$1$2"');

    return JSON.parse(fixedContent);
  }
}

// ============================================
// 策略分析 - 5种不同抽象维度
// ============================================
async function analyzeProduct(productDesc: string) {
  console.log(`\n📊 正在分析产品和受众...`);

  const prompt = `你是一位专业的小红书营销策略专家。我会给你一个产品/小程序的描述，你需要帮我分析营销策略。

【产品描述】
${productDesc}

【重要】请生成5种不同抽象风格的话题，每种风格要有明显区分：

1. **职场发疯抽象** - 职场吐槽、工作emo、办公室日常
2. **生活破防抽象** - 生活琐事、消费吐槽、日常崩溃
3. **社交尴尬抽象** - 社交场面、聊天记录、人际迷惑
4. **情感关系抽象** - 恋爱吐槽、单身狗、关系迷惑
5. **自我认知抽象** - 性格测试、人格分析、自我解构

【请分析以下内容】

1. **产品核心价值**
2. **目标受众画像**
3. **5种抽象风格话题**（每种风格要明显不同）

【输出格式】
JSON：
{
  "product_name": "产品名称",
  "core_value": "核心价值",
  "target_audience": {
    "age": "年龄段",
    "occupation": "职业",
    "pain_points": ["痛点1", "痛点2"]
  },
  "topics": [
    {
      "style": "抽象风格（如：职场发疯抽象）",
      "angle": "话题角度",
      "title_example": "标题示例",
      "content_direction": "内容方向",
      "visual_style": "视觉风格描述",
      "cta_method": "引流方法"
    }
  ]
}

请分析：`;

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
  return safeParseJSON(result.choices[0].message.content);
}

// ============================================
// 内容生成 - 生成套图内容
// ============================================
async function generateContent(productDesc: string, strategy: any, topicIndex: number) {
  console.log(`\n📝 正在生成第 ${topicIndex + 1} 组内容...`);

  const topic = strategy.topics[topicIndex];

  const prompt = `你是一位精通玩梗抽象风格的小红书博主。

【产品】
${strategy.product_name}：${strategy.core_value}

【目标受众】
${strategy.target_audience.occupation}，${strategy.target_audience.age}

【本组风格】
抽象风格：${topic.style}
话题角度：${topic.angle}
视觉风格：${topic.visual_style}

【套图要求】
请为一组3-4张的套图生成内容：
- 图1：引入/共鸣
- 图2：场景/对比
- 图3：产品植入/结果
- 图4（可选）：互动/延伸

【内容要求】
1. **${topic.style}风格**
   - 使用2025-2026年最新网络梗
   - emoji贯穿全文

2. **内容结构**
   - 开头：用梗/痛点引起共鸣
   - 中间：场景化描述
   - 结尾：自然植入产品，互动引导

3. **引流策略**：${topic.cta_method}

【输出格式】
JSON：
{
  "optimized_title": "标题",
  "content": "正文内容",
  "series_images": [
    {
      "index": 1,
      "description": "第1张图的内容描述",
      "text_on_image": "图上文字"
    },
    {
      "index": 2,
      "description": "第2张图的内容描述",
      "text_on_image": "图上文字"
    },
    {
      "index": 3,
      "description": "第3张图的内容描述",
      "text_on_image": "图上文字"
    }
  ],
  "tags": ["#标签1"],
  "comment_script": "评论区话术"
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
  return safeParseJSON(result.choices[0].message.content);
}

// ============================================
// 生成图片提示词
// ============================================
async function generateImagePrompt(content: any, imageIndex: number, visualStyle: string) {
  const imageData = content.series_images[imageIndex];

  const prompt = `你是一位擅长${visualStyle}风格的小红书图片设计师。

【笔记标题】${content.optimized_title}

【本张图片】
第${imageIndex + 1}张图
内容描述：${imageData.description}
图上文字：${imageData.text_on_image}

【图片要求】
1. ${visualStyle}风格
2. 玩梗抽象、emoji多
3. 3:4竖屏比例
4. 【重要】图片中所有文字必须是中文

请直接给出图片生成的详细提示词（英文描述画面，但指定图片内的文字都用中文）。`;

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

  return imagePrompt;
}

async function generateImage(prompt: string, outputPath: string) {
  const JIMENG_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

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
// 主函数
// ============================================
async function main() {
  const configured = await initConfig();
  if (!configured) {
    process.exit(1);
  }

  const productDesc = process.argv[2];

  if (!productDesc) {
    console.log("\n" + "📊".repeat(30));
    console.log("   小红书营销内容策略生成器 - 套图版");
    console.log("   " + "📊".repeat(30) + "\n");
    console.log("使用方法:");
    console.log("  npx tsx generate-all.ts \"产品/小程序描述\"\n");
    console.log("输出:");
    console.log("  - 5组不同抽象风格的内容");
    console.log("  - 每组3-4张套图");
    console.log("  - 可用于持续性投放测试\n");
    console.log("示例:");
    console.log("  npx tsx generate-all.ts \"测测你是什么马 - 测试打工人牛马属性的趣味小程序\"\n");
    process.exit(0);
  }

  console.log("\n" + "📊".repeat(30));
  console.log("   小红书营销内容策略生成器 - 套图版");
  console.log("   " + "📊".repeat(30));
  console.log(`\n   📦 产品: ${productDesc}\n`);

  const desktopPath = path.join(os.homedir(), "Desktop");
  const outputDir = path.join(desktopPath, `营销套图-${getTimestamp()}`);
  await fs.mkdir(outputDir, { recursive: true });

  // Step 1: 分析产品和受众
  console.log(`${"=".repeat(60)}`);
  console.log(`   第一步：产品和受众分析`);
  console.log(`${"=".repeat(60)}`);

  const strategy = await analyzeProduct(productDesc);

  await fs.writeFile(
    path.join(outputDir, "strategy.json"),
    JSON.stringify(strategy, null, 2),
    "utf-8"
  );

  console.log(`\n   ✅ 产品名称: ${strategy.product_name}`);
  console.log(`   ✅ 核心价值: ${strategy.core_value}`);
  console.log(`   ✅ 目标受众: ${strategy.target_audience.occupation} (${strategy.target_audience.age})`);
  console.log(`\n   ✅ 生成 ${strategy.topics.length} 种抽象风格:`);
  strategy.topics.forEach((t: any, i: number) => {
    console.log(`      ${i + 1}. ${t.style}`);
    console.log(`         角度: ${t.angle}`);
  });

  // Step 2: 为每个风格生成套图内容
  console.log(`\n${"=".repeat(60)}`);
  console.log(`   第二步：生成套图内容（每组3-4张）`);
  console.log(`${"=".repeat(60)}`);

  for (let i = 0; i < strategy.topics.length; i++) {
    const topic = strategy.topics[i];
    const styleName = topic.style.split("抽象")[0].trim();
    const topicDir = path.join(outputDir, `${String(i + 1).padStart(2, "0")}-${styleName}`);
    await fs.mkdir(topicDir, { recursive: true });

    console.log(`\n   📊 风格 ${i + 1}: ${topic.style}`);
    console.log(`      话题: ${topic.angle}`);

    try {
      const content = await generateContent(productDesc, strategy, i);

      // 保存内容
      const mdContent = `# ${content.optimized_title}

## 抽象风格
${topic.style}

## 话题角度
${topic.angle}

## 视觉风格
${topic.visual_style}

## 引流方法
${topic.cta_method}

---

## 套图说明
${content.series_images.map((img: any) => `图${img.index}: ${img.description}`).join("\n")}

---

## 正文内容

${content.content}

---

## 标签
${content.tags.join(" ")}

---

## 评论区引流话术
${content.comment_script}
`;
      await fs.writeFile(path.join(topicDir, "content.md"), mdContent, "utf-8");

      console.log(`      ✅ 标题: ${content.optimized_title}`);
      console.log(`      ✅ 套图数量: ${content.series_images.length}张`);

      // 生成每张图片
      console.log(`      🎨 生成套图...`);
      let successCount = 0;

      for (let j = 0; j < content.series_images.length; j++) {
        try {
          const imagePrompt = await generateImagePrompt(content, j, topic.visual_style);
          await fs.writeFile(path.join(topicDir, `image-${j + 1}-prompt.txt`), imagePrompt, "utf-8");

          await generateImage(imagePrompt, path.join(topicDir, `image-${j + 1}.png`));
          console.log(`         图${j + 1}✅`);
          successCount++;
        } catch (e) {
          console.log(`         图${j + 1}❌: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      console.log(`      ✅ 成功生成 ${successCount}/${content.series_images.length} 张图片`);

    } catch (e) {
      console.log(`      ❌ 内容生成失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`   📁 输出位置: ${outputDir}`);
  console.log("=".repeat(60));
  console.log(`\n   📊 投放建议:`);
  console.log(`      - Day 1: 风格1 (职场发疯抽象)`);
  console.log(`      - Day 2: 风格2 (生活破防抽象)`);
  console.log(`      - Day 3: 风格3 (社交尴尬抽象)`);
  console.log(`      - Day 4: 风格4 (情感关系抽象)`);
  console.log(`      - Day 5: 风格5 (自我认知抽象)`);
  console.log(`\n   根据数据反馈选择最佳风格持续投放！\n`);
}

// 运行
main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
