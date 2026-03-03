#!/usr/bin/env tsx
/**
 * 养生食谱小程序小红书营销图文生成
 * 学习Uncle-L的统一风格模板
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
// 统一的风格模板（关键！）
// ============================================
const UNIFIED_STYLE = `Internet meme style, minimalist line art comic style, bright colors, humorous mood, high resolution, no watermark`;

const themes = [
  {
    name: "厨房杀手翻身",
    topic: `Cute character holding cooking utensils with confused expression in messy kitchen. Phone screen showing step-by-step cooking instructions. Character looks like a kitchen disaster trying to cook. Text overlay: "厨房杀手翻身记" and "分步教学救大命".`,
  },
  {
    name: "外卖续命vs养生",
    topic: `Split comparison image. Left side: exhausted character eating takeout food with tired expression. Right side: same character eating healthy meal with happy energetic expression. Text overlay: "外卖续命 vs 养生自救" and "分步教学秒变大厨".`,
  },
  {
    name: "节气养生",
    topic: `Cute character surrounded by seasonal ingredients (fruits, vegetables, herbs), holding smartphone showing seasonal recipe recommendations. Character looks healthy and happy. Text overlay: "立秋润燥" and "节气养生不踩雷".`,
  },
  {
    name: "打工人专属养生",
    topic: `Exhausted office worker character at desk with dark circles under eyes, looking at smartphone showing personalized health recommendations. Character looks surprised and grateful with sparkle eyes. Text overlay: "打工人专属养生" and "祛湿健脾一键安排".`,
  },
];

// ============================================
// 构建统一的prompt（学习Uncle-L的做法）
// ============================================
function buildPrompt(topic: string): string {
  return `You are a Xiaohongshu lifestyle blogger. Please create an illustration based on the following requirements:

1. **Style** (IMPORTANT - must follow): ${UNIFIED_STYLE}

2. **Content**: ${topic}

3. **Additional**: Make it visually appealing, humorous, and shareable on social media.

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
      size: "1920x1920",
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
  console.log("   🎨 生成养生食谱小程序小红书营销图文");
  console.log("   (使用统一风格模板)");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `养生食谱小程序营销-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`🎨 统一风格: ${UNIFIED_STYLE}\n`);

  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
    console.log(`   ${i + 1}. ${theme.name} - 生成中...`);

    const imagePath = path.join(outputDir, `${i + 1}-${theme.name}.png`);
    const promptPath = path.join(outputDir, `${i + 1}-${theme.name}-prompt.txt`);

    const fullPrompt = buildPrompt(theme.topic);
    await fs.writeFile(promptPath, fullPrompt, "utf-8");

    try {
      await generateImage(theme.topic, imagePath, config);
      console.log(`      ✅ 成功`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n✨ 4张营销图文生成完成！`);
  console.log(`\n💡 关键改进：每张图使用统一的风格描述`);
  console.log(`   "${UNIFIED_STYLE}"`);
  console.log(`\n📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
