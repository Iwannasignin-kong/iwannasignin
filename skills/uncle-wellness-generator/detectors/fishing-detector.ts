#!/usr/bin/env tsx
/**
 * 钓鱼检测器 - 小红书营销图文生成
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3";

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
    } catch { continue; }
  }
}

function getConfig() {
  return {
    ARK_API_KEY: process.env.ARK_API_KEY || "",
    ARK_IMAGE_MODEL: process.env.ARK_IMAGE_MODEL || "",
  };
}

// 统一风格
const UNIFIED_STYLE = `Modern tech product photography, outdoor lifestyle, natural lighting, high resolution, professional quality, 4k, vibrant colors, social media optimized`;

// 钓鱼检测器场景
const scenarios = [
  {
    name: "封面-钓鱼人的救星",
    topic: `Eye-catching Xiaohongshu cover image for fishing detector device. Center shows a sleek smart fishing gadget with a digital screen displaying weather icons (sun, clouds, temperature) and tide/wave data. The device is placed on a rock by a beautiful lakeside at sunrise. Above the device, large bold Chinese text: "钓鱼人的救星" and below: "智能检测器一键掌握天气潮汐". Golden warm lighting, peaceful outdoor atmosphere, professional product photography style.`,
  },
  {
    name: "场景-天气检测功能",
    topic: `Close-up shot of a fisherman holding the smart fishing detector. The device screen clearly shows weather data: temperature 22°C, wind speed 12km/h, air pressure 1013hPa, with weather icons. Background shows a peaceful lake with misty morning atmosphere. The fisherman looks satisfied with the data. Natural lighting, outdoor tech lifestyle photography. Text overlay on image: "实时天气 一手掌握" and "出钓前先看天气".`,
  },
  {
    name: "场景-潮汐水流功能",
    topic: `Seaside fishing scene. A fisherman stands on the beach holding the smart device. The screen displays tide information: "涨潮时间 14:30", "退潮时间 21:15", with a tide curve graph and water current indicator. Ocean waves visible in background. Golden hour lighting creating warm atmosphere. Professional lifestyle photography showing technology meets nature. Text overlay: "潮汐水流 精准预测" and "最佳钓点一键锁定".`,
  },
  {
    name: "场景-自设地点功能",
    topic: `Fisherman using the smart fishing detector to mark a fishing spot on the map. Device screen shows GPS map with a pinned location marker and coordinates. The scene shows a remote mountain lake area with beautiful scenery. The fisherman looks focused while setting up the spot. Natural outdoor lighting, adventure lifestyle photography style. Text overlay: "想钓哪里 就钓哪里" and "自设地点 智能记录".`,
  },
  {
    name: "场景-产品全家福",
    topic: `Product showcase shot. The smart fishing detector displayed on a wooden table with fishing gear arranged artistically around it - fishing rod, tackle box, and fishing line. The device screen shows a summary dashboard with weather, tide, and location info. Outdoor natural lighting with a lake view in the blurred background. Premium tech product photography style. Text overlay: "钓鱼黑科技 懂你所需" and "智能检测器 钓鱼人必备".`,
  },
];

function buildPrompt(topic: string): string {
  return `Create a promotional illustration for a smart fishing detector device.

Style Guide: ${UNIFIED_STYLE}

Content: ${topic}

Additional Requirements:
- Make the product look premium and high-tech
- Emphasize the outdoor fishing lifestyle
- Use warm, natural lighting
- Show the device screen clearly with data
- Create an aspirational, professional look

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
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.data || !result.data[0] || !result.data[0].url) {
    throw new Error(`Invalid API response`);
  }

  const imageUrl = result.data[0].url;
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(imageBuffer));
}

async function main() {
  await loadEnv();
  const config = getConfig();

  console.log("\n" + "=".repeat(60));
  console.log("   钓鱼检测器 - 小红书营销图文");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `钓鱼检测器营销-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`📋 将生成5张营销图片:\n`);

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`   ${i + 1}. ${scenario.name}`);
  }

  console.log(`\n🎨 开始生成...\n`);

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`   [${i + 1}/${scenarios.length}] ${scenario.name}...`);

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
  console.log(`\n📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
