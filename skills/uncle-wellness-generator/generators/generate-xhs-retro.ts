#!/usr/bin/env tsx
/**
 * 中医药健康食谱小程序 - 小红书复古国潮风
 * 风格: retro (复古国潮)
 * 叙事: 传统养生智慧 + 现代便捷科技
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
    IMAGE_SIZE: process.env.IMAGE_SIZE_XHS || "1920x2560",
  };
}

// 复古国潮风格模板
const UNIFIED_STYLE = `Retro Chinese national trend (国潮) illustration style for Xiaohongshu. Fusion of traditional Chinese aesthetics with modern design. Rich color palette: vermilion red, imperial gold, deep jade green, ink black. Traditional elements: cloud patterns, auspicious symbols, Chinese paper-cut style, ink wash painting influence. Vintage poster aesthetic with bold typography. Cultural heritage meets modern technology. High quality, no watermark.`;

// 7张图 - 传统智慧 + 现代科技
const scenarios = [
  {
    name: "01-cover",
    title: "封面",
    topic: `Xiaohongshu cover image with retro Chinese national trend style. Bold poster design featuring a smartphone with the health recipe app as the centerpiece. Background has traditional cloud patterns (祥云) and auspicious symbols. Rich vermilion and gold color scheme. Large bold calligraphy-style title text in Chinese: "千年智慧，一键可得" (Thousands of years of wisdom, one click away). Fusion of ancient TCM heritage and modern technology. Traditional Chinese aesthetic with contemporary twist. 3:4 vertical ratio.`,
  },
  {
    name: "02-heritage",
    title: "传承千载",
    topic: `Beautiful illustration showcasing TCM heritage. Ancient Chinese medicine book/treatise on one side, smartphone app on the other, connected by flowing ink or golden thread. Traditional ink wash painting style with modern clean elements. Background subtle mountain and water landscape (山水). Deep jade and gold accents. Text: "黄帝内经到今天，智慧从未断代" (From Yellow Emperor's Inner Canon to today, wisdom never ceased). Cultural continuity theme. Balanced composition.`,
  },
  {
    name: "03-modern-convenience",
    title: "现代便捷",
    topic: `Split composition showing traditional vs modern. Left side: Ancient apothecary with herbs, traditional diagnosis methods in vintage style. Right side: Modern smartphone showing the app's easy search and video tutorials. Connected by flowing design elements showing the bridge between ancient wisdom and modern convenience. Rich colors with vermilion and gold. Text: "古人千难万难，今人一键即得" (Ancients faced thousand difficulties, moderns get it with one click). Contrast and harmony design.`,
  },
  {
    name: "04-seasonal-wisdom",
    title: "节气智慧",
    topic: `Illustration of the 24 solar terms (二十四节气) presented in traditional circular calendar style, integrated with smartphone app interface. Each season marked with traditional seasonal foods and herbs. Retro color palette with muted earth tones and pops of vermilion. Traditional Chinese border patterns. Text: "二十四节气，顺时应季而食" (24 solar terms, eat with the seasons). Educational and cultural. Intricate, detailed design.`,
  },
  {
    name: "05-family-wellness",
    title: "全家安康",
    topic: `Warm scene showing multi-generational family benefiting from TCM wisdom through the app. Grandparents sharing recipes with grandchildren, all looking at the smartphone together. Traditional Chinese family setting with modern touches. Paper-cut style figures or ink wash illustration style. Warm gold and vermilion tones. Auspicious symbols decorating background. Text: "一家老小，养生有方" (Whole family, from old to young, has wellness ways). Cultural and heartwarming.`,
  },
  {
    name: "06-ingredient-art",
    title: "药材艺术",
    topic: `Artistic showcase of TCM ingredients as cultural treasures. Goji berries, red dates, gastrodia, chrysanthemum, ginseng illustrated in traditional botanical art style (like Bencao Gangmu), each with spiritual energy aura (气). Presented as precious cultural heritage. Deep greens, reds, golds on cream background. Traditional Chinese frame borders. Text: "药食同源，皆是瑰宝" (Medicine and food share the same source, all are treasures). Reverence for tradition.`,
  },
  {
    name: "07-cta-cultural",
    title: "结尾召唤",
    topic: `Powerful CTA image with retro Chinese poster aesthetic. Central message in bold calligraphy style: "传承国医智慧，守护家人健康" (Inherit national medical wisdom, guard family health). Background features traditional auspicious clouds, peony patterns, and subtle app interface. Rich vermilion red and imperial gold dominating. Modern smartphone integrated harmoniously with traditional elements. Inspiring, culturally proud, action-oriented. Strong visual impact.`,
  },
];

function buildPrompt(topic: string): string {
  return `You are creating Xiaohongshu (Little Red Book) illustrations for a TCM health recipe mini-app with a retro Chinese national trend (国潮) style, celebrating the fusion of ancient wisdom and modern technology.

1. **Style** (CRITICAL - must follow exactly): ${UNIFIED_STYLE}

2. **Content**: ${topic}

3. **Additional guidelines**:
   - Use rich, traditional Chinese color palette (vermilion red, imperial gold, deep jade, ink black)
   - Incorporate traditional elements: cloud patterns (祥云), auspicious symbols, mountain-water landscapes
   - Create a fusion of ancient aesthetics and modern technology
   - Bold, calligraphy-style typography where appropriate
   - Cultural heritage and pride theme
   - Reference traditional Chinese art: ink wash painting, paper-cut, botanical illustration
   - Avoid overly cartoonish or cute style
   - Focus on cultural depth and reverence for TCM tradition
   - All text should be in Chinese where specified
   - 3:4 vertical aspect ratio optimized for mobile social media

Please generate the image following these guidelines precisely.`;
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
      size: config.IMAGE_SIZE,
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
  console.log("   🎨 中医药健康食谱小程序 - 小红书图文生成");
  console.log("   风格: retro 复古国潮 | 叙事: 传统智慧+现代科技");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `小红书-retro复古国潮-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`🎨 统一风格: retro (复古国潮)`);
  console.log(`📐 图片比例: 3:4 (${config.IMAGE_SIZE}) - 小红书优化`);
  console.log(`📖 叙事结构: 传承→古今对比→节气智慧→全家安康→药材文化→CTA\n`);
  console.log(`📋 7张图片内容:\n`);

  scenarios.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name} - ${s.title}`);
  });

  console.log(`\n${"=".repeat(60)}\n`);

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`[${i + 1}/7] ${scenario.name} - ${scenario.title}...`);

    const imagePath = path.join(outputDir, `${scenario.name}.png`);
    const promptPath = path.join(outputDir, `${scenario.name}-prompt.txt`);

    const fullPrompt = buildPrompt(scenario.topic);
    await fs.writeFile(promptPath, fullPrompt, "utf-8");

    try {
      await generateImage(scenario.topic, imagePath, config);
      console.log(`      ✅ 成功: ${scenario.name}.png`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✨ 7张小红书图文生成完成！`);
  console.log(`\n📱 第1张: 封面 - 千年智慧一键可得`);
  console.log(`📱 第2张: 传承千载 - 从黄帝内经到今天`);
  console.log(`📱 第3张: 现代便捷 - 古今对比`);
  console.log(`📱 第4张: 节气智慧 - 二十四节气`);
  console.log(`📱 第5张: 全家安康 - 多代同堂`);
  console.log(`📱 第6张: 药材艺术 - 本草瑰宝`);
  console.log(`📱 第7张: CTA - 传承国医智慧`);
  console.log(`\n📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
