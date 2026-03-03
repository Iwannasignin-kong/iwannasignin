#!/usr/bin/env tsx
/**
 * 中医药健康食谱小程序 - 小红书清新科普风格
 * 风格: fresh (清新自然)
 * 叙事: 节气/食材科普向
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

// 清新科普风格模板
const UNIFIED_STYLE = `Fresh and clean illustration style for Xiaohongshu health education. Natural color palette with soft greens, warm beige, herbal tones. Minimalist botanical illustrations, ingredient showcase style. Educational and informative vibe, like a wellness magazine. Clean white space, delicate line work, natural lighting. High quality, no watermark.`;

// 6张图 - 节气/食材科普向
const scenarios = [
  {
    name: "01-cover",
    title: "封面",
    topic: `Xiaohongshu cover image for TCM wellness education. Fresh, clean design with seasonal theme. Central showcase of a smartphone displaying the health recipe app. Surrounding botanical elements: herbs (goji berries, chrysanthemum, red dates), seasonal produce icons. Soft green and beige color palette. Large title text in Chinese: "顺时而食，养生有道" (Eat with the seasons, wellness follows). Fresh, educational magazine style. 3:4 vertical ratio.`,
  },
  {
    name: "02-seasonal-concept",
    title: "节气养生概念",
    topic: `Beautiful illustration showing the concept of "eating with the seasons" (顺时而食). Four quadrants representing four seasons: spring (green sprouts), summer (cooling foods), autumn (nourishing soups), winter (warming stews). Each season has representative ingredients and herbs. Soft pastel colors, botanical illustration style. Educational and informative. Text: "春夏秋冬，各有讲究" (Each season has its principles). Balanced, infographic style layout.`,
  },
  {
    name: "03-ingredient-knowledge",
    title: "食材科普",
    topic: `Ingredient knowledge showcase card. Clean layout featuring three key TCM ingredients:天麻 (Gastrodia) for calming blood pressure, 枸杞 (Goji berries) for wellness, 红枣 (Red dates) for nourishment. Each ingredient shown with simple illustration and brief benefit explanation. Fresh green background, botanical drawing style. Text: "常见食材，大有功效" (Common ingredients, great benefits). Clean, educational layout.`,
  },
  {
    name: "04-seasonal-recommendation",
    title: "当季推荐",
    topic: `Seasonal recipe recommendation showcase. Smartphone screen showing the app's "seasonal recommendation" feature. Current season display (e.g., "立春 - Spring Begins") with curated recipes: "祛湿粥" (Dampness-removing porridge), "养肝汤" (Liver-nourishing soup). Clean UI design with ingredient icons. Fresh, appetizing food illustrations. Text: "节气推荐，精准养生" (Seasonal recommendations, precise wellness). Balanced composition.`,
  },
  {
    name: "05-scenario-benefit",
    title: "使用场景",
    topic: `Split scene showing two users benefiting from the app. Left: Elderly person finding recipe for their health concern. Right: Young person discovering nutritional knowledge. Both look satisfied and healthy. Fresh, uplifting colors. Clean line art style with soft washes of color. Text: "全家健康，一个就够了" (Whole family's health, one app is enough). Warm, inclusive atmosphere.`,
  },
  {
    name: "06-cta-education",
    title: "结尾引导",
    topic: `Fresh, educational CTA image. Collection of wellness tips in clean card format: "顺时而食" (eat seasonally), "药食同源" (food as medicine), "因人而异" (personalized). Background has subtle herbal illustrations. Soft green and natural tones. Inspirational message text: "打开小程序，开启你的养生之旅" (Open the mini-app, start your wellness journey). Clean, minimalist layout with educational focus.`,
  },
];

function buildPrompt(topic: string): string {
  return `You are creating educational Xiaohongshu (Little Red Book) illustrations for a TCM health recipe mini-app with a focus on seasonal eating and ingredient knowledge.

1. **Style** (CRITICAL - must follow exactly): ${UNIFIED_STYLE}

2. **Content**: ${topic}

3. **Additional guidelines**:
   - Use fresh, natural color palette (soft greens, warm beige, herbal tones)
   - Create an educational, informative vibe
   - Include botanical/herbal illustration elements
   - Clean white space for readability
   - Delicate line work, like wellness magazine illustrations
   - Avoid overly promotional language
   - Focus on knowledge sharing and health benefits
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
  console.log("   风格: fresh 清新科普 | 叙事: 节气/食材科普向");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `小红书-fresh清新科普-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`🎨 统一风格: fresh (清新自然)`);
  console.log(`📐 图片比例: 3:4 (${config.IMAGE_SIZE}) - 小红书优化`);
  console.log(`📖 叙事结构: 节气概念→食材科普→当季推荐→使用场景→CTA\n`);
  console.log(`📋 6张图片内容:\n`);

  scenarios.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name} - ${s.title}`);
  });

  console.log(`\n${"=".repeat(60)}\n`);

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`[${i + 1}/6] ${scenario.name} - ${scenario.title}...`);

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
  console.log(`✨ 6张小红书图文生成完成！`);
  console.log(`\n📱 第1张: 封面 - 顺时而食主题`);
  console.log(`📱 第2张: 节气概念 - 四季养生`);
  console.log(`📱 第3张: 食材科普 - 常见药材功效`);
  console.log(`📱 第4张: 当季推荐 - 节气食谱`);
  console.log(`📱 第5张: 使用场景 - 全家受益`);
  console.log(`📱 第6张: CTA - 开启养生之旅`);
  console.log(`\n📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
