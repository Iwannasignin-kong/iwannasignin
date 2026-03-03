#!/usr/bin/env tsx
/**
 * 快速生成梗图 - 确诊牛马属性主题
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3";

// 加载环境变量
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
    ARK_MODEL: process.env.ARK_MODEL || "",
  };
}

// 三个梗图创意
const memeIdeas = [
  {
    name: "确诊单",
    prompt: `A Chinese meme image in the style of funny internet stickers. A cute cartoon panda head character holding a medical diagnosis document with a confused expression. The document has a red official stamp that says "确诊" (confirmed) in large Chinese characters. Background is clean white. The panda has an exaggerated, funny, resigned expression typical of Chinese internet memes. Bold Chinese text at the top: "确诊了" (It's confirmed). Simple composition, centered, high contrast, sticker style, funny self-deprecating humor like Chinese "dai ma" (corporate slave) memes.`,
    title: "确诊单"
  },
  {
    name: "打工人实锤",
    prompt: `A Chinese meme image showing a cartoon panda head character being flattened by a giant hammer, but still typing on a keyboard. The panda has a funny, resigned, "this is my life" expression. Yellow background for high contrast. Bold Chinese text: "这就是命" (This is fate). Smaller text: "牛马认命，继续搬砖" (Accept being a corporate slave, keep working). Simple sticker style, centered composition, exaggerated expressions, Chinese internet meme humor, self-deprecating office worker theme.`,
    title: "打工人实锤"
  },
  {
    name: "反向进化",
    prompt: `An evolutionary progression meme showing: monkey → human → "niu ma" (corporate slave). The last stage is a cute cartoon panda head wearing an employee ID badge, looking tired and defeated. Textbook illustration style but with funny twist. Bold Chinese text at top: "反向进化" (Reverse evolution). The panda looks like a typical Chinese office worker. Simple line art style, white background, centered horizontal layout, self-deprecating humor about working life, Chinese meme culture.`,
    title: "反向进化"
  }
];

async function generateImage(prompt: string, outputPath: string, config: ReturnType<typeof getConfig>): Promise<void> {
  const url = `${ARK_URL}/images/generations`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_MODEL,
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

async function main() {
  await loadEnv();
  const config = getConfig();

  console.log("\n" + "=".repeat(60));
  console.log("   🎨 生成梗图：确诊了我的牛马属性");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `牛马属性梗图-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);

  for (let i = 0; i < memeIdeas.length; i++) {
    const idea = memeIdeas[i];
    console.log(`   ${i + 1}. ${idea.name} - 生成中...`);

    const imagePath = path.join(outputDir, `${i + 1}-${idea.name}.png`);
    const promptPath = path.join(outputDir, `${i + 1}-${idea.name}-prompt.txt`);

    await fs.writeFile(promptPath, idea.prompt, "utf-8");

    try {
      await generateImage(idea.prompt, imagePath, config);
      console.log(`      ✅ 成功`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n✨ 完成！`);

  // 生成说明文档
  const readme = `# 确诊牛马属性梗图

## 三张梗图说明

### 1. 确诊单
一张诊断单风格，熊猫头拿着写着"确诊"的诊断报告，一脸懵逼

### 2. 打工人实锤
熊猫头被锤子砸扁但还在打字，配文"这就是命，牛马认命继续搬砖"

### 3. 反向进化
进化图：猴子→人→牛马（戴工牌的熊猫头）

---

生成时间: ${new Date().toLocaleString("zh-CN")}
`;

  await fs.writeFile(path.join(outputDir, "README.md"), readme, "utf-8");
  console.log(`📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
