#!/usr/bin/env tsx
/**
 * 中医药健康食谱小程序 - 小红书7张图故事驱动方案
 * 策略A: Story-Driven + warm风格
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

// 统一风格模板 - warm 温暖亲和
const UNIFIED_STYLE = `Warm and caring cartoon illustration style for Xiaohongshu (Little Red Book). Soft pastel colors (cream, peach, warm orange), gentle lines, hand-drawn decorative elements (hearts, clouds), cozy family atmosphere. Emotionally resonant, authentic storytelling vibe. High quality, clean composition, optimized for social media engagement. No watermark.`;

// 7张图的故事驱动场景
const scenarios = [
  {
    name: "01-cover",
    title: "封面",
    topic: `Xiaohongshu cover image, 3:4 vertical ratio. Warm family scene with a smartphone showing a health recipe mini-app in the center. Soft pastel background with heart and cloud decorations. Large bold text in Chinese: "在外地工作，最怕的就是爸妈身体不舒服" (The scariest thing when working away is parents not feeling well). Emotional, caring atmosphere. Warm color palette with cream and peach tones. Minimalist layout with focus on the emotional message.`,
  },
  {
    name: "02-pain-point",
    title: "痛点引入",
    topic: `Young person looking at phone with worried expression, representing the pain point of being unable to help parents from afar. Soft, sympathetic lighting. Thought bubble or text overlay showing concern about mother's sleep problems. Warm illustration style, emotive but not overly sad. Text: "电话里听说妈妈睡眠不好，却只能干着急" (Heard mom has trouble sleeping on the phone, can only worry helplessly). Balanced composition.`,
  },
  {
    name: "03-discovery",
    title: "发现解决方案",
    topic: `Smartphone screen showing "symptom search" feature of the health recipe mini-app. Search bar shows "失眠" (insomnia) or "睡眠不好" (poor sleep). Below, a list of recommended calming recipes appears. Character has a "eureka" moment of discovering the solution. Clean UI design, warm colors. Text: "偶然发现这个中医药食谱小程序，能按症状找食谱" (Stumbled upon this TCM recipe app, can find recipes by symptoms). Balanced layout showing discovery moment.`,
  },
  {
    name: "04-share",
    title: "分享瞬间",
    topic: `WeChat family group chat interface on phone screen. A recipe card for calming sleep syrup is being shared. "One-click share" button highlighted with a sparkle effect. Chat messages show warmth between daughter and mother: "妈，这个安神糖水你试试" (Mom, try this calming syrup) and mom's reply "谢谢闺女" (Thanks daughter). Warm, loving atmosphere. Text: "一键分享到家庭群，妈妈收到很开心" (One-click share to family group, mom was happy to receive it). Balanced composition.`,
  },
  {
    name: "05-result",
    title: "妈妈的反馈",
    topic: `Cozy kitchen scene with mother and daughter cooking together. Both have happy expressions. The finished calming syrup/soup is shown in a bowl. Warm kitchen lighting, steam rising from the food. Mother looks relieved and well-rested. Domestic warmth, family bonding. Text: "周末回家一起做，妈妈说睡得比以前香了" (Came home on weekend to make it together, mom said she's sleeping better than before). Balanced layout showing positive outcome.`,
  },
  {
    name: "06-feature",
    title: "产品功能",
    topic: `Clean feature showcase of the mini-app's three core functions displayed as cards: 1) Symptom Search with magnifying glass icon, 2) Seasonal Recommendations with calendar icon, 3) Video Tutorial with play button. Each feature has a brief description. Simple, modern UI design with warm color scheme. Text: "还能按节气推荐，现在全家都在用" (Can also recommend by seasonal terms, now the whole family uses it). Information-dense but clean layout. Notion-style minimalist approach.`,
  },
  {
    name: "07-cta",
    title: "结尾引导",
    topic: `Warm family photo scene - multi-generational family eating together at dining table. Everyone looks happy and healthy. Soft, warm lighting. Heart and warmth elements in background. Emotional, heartwarming conclusion. Inspirational message text: "别等父母生病才想起关心，现在就开始用起来吧" (Don't wait until parents are sick to show care, start using it now). CTA-style design with emotional appeal. Sparse layout with powerful message.`,
  },
];

function buildPrompt(topic: string): string {
  return `You are creating Xiaohongshu (Little Red Book) promotional illustrations for a TCM health recipe mini-app.

1. **Style** (CRITICAL - must follow exactly): ${UNIFIED_STYLE}

2. **Content**: ${topic}

3. **Additional guidelines**:
   - Maintain visual consistency across all images
   - Use warm, caring color palette (cream, peach, warm orange, soft greens)
   - Create emotional resonance through authentic storytelling
   - Avoid overly promotional or aggressive marketing tone
   - Focus on family care and health benefits
   - Include decorative hearts and clouds where appropriate
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
  console.log("   策略A: 故事驱动 + warm风格");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `小红书-中医药健康食谱-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`🎨 统一风格: warm (温暖亲和)`);
  console.log(`📐 图片比例: 3:4 (${config.IMAGE_SIZE}) - 小红书优化`);
  console.log(`📖 故事结构: 痛点→发现→分享→反馈→功能→CTA\n`);
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
  console.log(`\n📱 第1张: 封面 - 情感钩子，吸睛标题`);
  console.log(`📱 第2-5张: 故事主体 - 真实场景，情感共鸣`);
  console.log(`📱 第6张: 功能展示 - 产品价值`);
  console.log(`📱 第7张: CTA结尾 - 行动召唤`);
  console.log(`\n📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
