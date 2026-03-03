#!/usr/bin/env tsx
/**
 * 养生食谱小程序营销图文 - 基于真实使用场景
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3";

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
  } catch {}
}

function getConfig() {
  return {
    ARK_API_KEY: process.env.ARK_API_KEY || "",
    ARK_IMAGE_MODEL: process.env.ARK_IMAGE_MODEL || "",
  };
}

// ============================================
// 统一的风格模板
// ============================================
const UNIFIED_STYLE = `Internet meme style, minimalist line art comic style, bright colors, humorous mood, high resolution, no watermark`;

// ============================================
// 基于真实使用场景的主题
// ============================================
const scenarios = [
  {
    name: "封面-小红书主图",
    topic: `Eye-catching Xiaohongshu cover image. Center frame shows elderly happy couple cooking together with smartphone displaying recipe. Surrounding elements: top left "症状搜索" icon, top right "节气推荐" calendar, bottom left "分步教学" video icon, bottom right "一键分享" heart icon. Warm vibrant colors, heartwarming family atmosphere. Large bold text at center: "养生食谱小程序" and smaller text below "全家人的健康助手". 4:3 aspect ratio optimized for social media.`,
  },
  {
    name: "场景A-日常调理",
    topic: `Middle-aged man (Uncle Zhang) looking at smartphone showing recipe for "天麻鱼头汤" (Gastrodia Fish Head Soup) for blood pressure. Phone screen shows "症状搜索：降压" and recipe with step-by-step video icon. Character looks happy and relieved. Warm kitchen background. Text overlay: "头晕？找对食谱" and "天麻鱼头汤平稳血压".`,
  },
  {
    name: "场景B-预防保健",
    topic: `Auntie looking at smartphone showing seasonal recipe recommendations. Phone screen shows "节气推荐：立秋" and recipes like "祛湿粥品" and "温补炖菜". Character with joint discomfort looks relieved after finding suitable recipes. Cozy home setting. Text overlay: "关节不适？" and "节气推荐祛湿温补".`,
  },
  {
    name: "场景C-子女关爱",
    topic: `Young daughter sharing recipe from smartphone to family group chat on phone screen. Recipe shown is "安神助眠糖水" with "一键分享" button. Warm emotional moment showing care for mother's sleep quality. Text overlay: "妈妈睡不好" and "一键分享简单食谱".`,
  },
  {
    name: "场景D-产品功能",
    topic: `Split image showing four key features: 1) Symptom search with magnifying glass icon, 2) Seasonal recommendations with calendar, 3) Step-by-step video cooking tutorial, 4) One-click share to family. Each quadrant shows a different elderly person benefiting from the feature. Warm colors, caring atmosphere. Text overlay: "养生食谱小程序" and "全家人的健康助手".`,
  },
];

function buildPrompt(topic: string): string {
  return `You are creating promotional illustrations for a health recipe mini-app targeted at elderly people and their children.

1. **Style** (IMPORTANT - must follow): ${UNIFIED_STYLE}

2. **Content**: ${topic}

3. **Additional**: Make it warm, caring, and family-oriented. Avoid overly sarcastic or self-deprecating humor. Focus on health benefits and family care.

Please generate the image following these guidelines.`;
}

async function generateImage(topic: string, outputPath: string, config: ReturnType<typeof getConfig>): Promise<void> {
  const url = `${ARK_URL}/images/generations`;

  const prompt = buildPrompt(topic);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_IMAGE_MODEL,
      prompt: prompt,
      n: 1,
      size: process.env.IMAGE_SIZE_XHS || "1920x2560", // 小红书 3:4 比例
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`火山引擎 API 错误: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.data || !result.data[0] || !result.data[0].url) {
    throw new Error(`API 响应格式错误`);
  }

  const imageUrl = result.data[0].url;
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`下载图片失败`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(imageBuffer));
}

async function main() {
  await loadEnv();
  const config = getConfig();

  console.log("\n" + "=".repeat(60));
  console.log("   🎨 生成养生食谱小程序营销图文");
  console.log("   (基于真实使用场景)");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `养生食谱小程序营销-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`🎨 统一风格: ${UNIFIED_STYLE}`);
  const imageSize = process.env.IMAGE_SIZE_XHS || "1920x2560";
  console.log(`📐 图片比例: 3:4 (${imageSize}) - 小红书优化\n`);
  console.log(`📋 图片内容:\n`);
  console.log(`   1. 封面图 - 小红书主封面（吸睛）`);
  console.log(`   2. 场景A - 日常调理（张叔叔找降压汤品）`);
  console.log(`   3. 场景B - 预防保健（李阿姨找祛湿食谱）`);
  console.log(`   4. 场景C - 子女关爱（女儿分享安神食谱）`);
  console.log(`   5. 场景D - 产品功能（四大核心功能）\n`);

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`   ${i + 1}. ${scenario.name} - 生成中...`);

    const imagePath = path.join(outputDir, `${i + 1}-${scenario.name}.png`);
    const promptPath = path.join(outputDir, `${i + 1}-${scenario.name}-prompt.txt`);

    const fullPrompt = buildPrompt(scenario.topic);
    await fs.writeFile(promptPath, fullPrompt, "utf-8");

    try {
      await generateImage(scenario.topic, imagePath, config);
      console.log(`      ✅ 成功`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n✨ 5张营销图文生成完成！`);
  console.log(`\n📱 第1张为小红书封面图（吸睛设计）`);
  console.log(`📱 后4张为场景展示图（真实使用场景）`);
  console.log(`📱 所有图片均为4:3比例，适合小红书发布`);
  console.log(`\n📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
