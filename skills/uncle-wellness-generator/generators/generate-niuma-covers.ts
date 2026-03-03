#!/usr/bin/env tsx
/**
 * 生成"牛马打工人生成器"小红书封面
 * 使用示例提示词作为风格参考
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

// 示例提示词作为风格参考
const EXAMPLE_PROMPT = `2026 worker meme, a chonky orange and white cat wearing a blue striped tie, sitting at an office desk with stacks of papers, a keyboard, and a monitor. On the monitor, a horse wearing a wig with the text "我司雇我在 我在工位很想你 还好马上过年放假了". The cat has a deadpan, resigned expression. Text overlay: "2026正式确诊为：斑马 一只上着普通班的普通马 天天想辞职 月月拿满勤". Internet meme style, bright colors, humorous, high resolution, no watermark`;

const coverIdeas = [
  {
    name: "老干马",
    customPrompt: `老干马 - a seasoned anthropomorphic horse wearing office suit and tie, thick dark circles under eyes, messy hair, holding a thermos cup with both hooves, sitting in office cubicle with stacks of documents. Deadpan exhausted but determined expression. Text overlay at top: "你是哪种马？" and smaller text: "老干马 - 经验丰富的打工人". Upper-lower split layout, Chinese internet meme sticker style.`,
  },
  {
    name: "汗血宝马",
    customPrompt: `汗血宝马 - a determined anthropomorphic horse sweating profusely with exaggerated sweat drops, juggling multiple tasks: laptop on one hoof, phone in another, coffee cup balanced, documents flying. Dynamic action pose, fierce determined expression, busy office background with clocks and deadlines. Text overlay: "你是哪种马？" and "汗血宝马 - 拼命三郎型选手". Meme style, vibrant colors.`,
  },
  {
    name: "内卷马",
    customPrompt: `内卷马 - a hyper-competitive anthropomorphic horse with comically thick glasses, surrounded by towering stacks of books and multiple laptops, studying intensely while typing. Multiple arms doing different tasks, books everywhere. The horse looks manically focused, overworking satire. Text overlay: "你是哪种马？" and "内卷马 - 卷王之王". Exaggerated cartoon style.`,
  },
];

async function generateImage(idea: typeof coverIdeas[0], outputPath: string, config: ReturnType<typeof getConfig>): Promise<void> {
  const url = `${ARK_URL}/images/generations`;

  // 组合：示例提示词 + 自定义内容
  const finalPrompt = `Reference style: ${EXAMPLE_PROMPT}\n\nCreate similar image: ${idea.customPrompt}\n\nMaintain the same vibe: humorous worker meme, Chinese internet sticker style, bright colors, upper-lower text-image split layout, funny self-deprecating humor, high quality, no watermark.`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_IMAGE_MODEL,
      prompt: finalPrompt,
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
  console.log("   🎨 生成小红书封面：牛马打工人生成器");
  console.log("   (使用示例提示词作为风格参考)");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `牛马打工人生成器-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`📝 示例提示词:\n   ${EXAMPLE_PROMPT}\n`);

  for (let i = 0; i < coverIdeas.length; i++) {
    const idea = coverIdeas[i];
    console.log(`   ${i + 1}. ${idea.name} - 生成中...`);

    const imagePath = path.join(outputDir, `${i + 1}-${idea.name}.png`);
    const promptPath = path.join(outputDir, `${i + 1}-${idea.name}-prompt.txt`);

    // 保存完整提示词
    const finalPrompt = `Reference style: ${EXAMPLE_PROMPT}\n\nCreate similar image: ${idea.customPrompt}\n\nMaintain the same vibe: humorous worker meme, Chinese internet sticker style, bright colors, upper-lower text-image split layout, funny self-deprecating humor, high quality, no watermark.`;
    await fs.writeFile(promptPath, finalPrompt, "utf-8");

    try {
      await generateImage(idea, imagePath, config);
      console.log(`      ✅ 成功`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n✨ 3张封面图生成完成！`);

  // 生成小红书文案
  const content = `# 小红书文案：牛马打工人生成器

## 通用文案（可搭配任一封面）

### 标题
打工人！你是哪种马？🐴一键扫描变身趣味牛马！

### 正文
家人们！我发现了一个神仙神器！🎮

只要一键扫描，就能变身成你的专属牛马形态：
🐴 老干马 - 经验丰富的老打工人
🐴 汗血宝马 - 拼命三郎型选手
🐴 内卷马 - 卷王之王本王

变身特效丝滑，全程幽默自嘲，完全没有负面情绪！
轻松解压，打工人的精神续命水！💪

我测了一下，果然是内卷马没跑了...🤣

快去测测你是哪种马！

#打工人 #牛马 #职场 #解压神器 #打工人日常

---

### 标题选项2
笑不活了😂一键测出你的打工人牛马属性！

### 正文选项2
救命！这个牛马测试太准了！

我测出来是【内卷马】
眼镜比脸还厚，书比人还高
一边卷一边还要说"我不卷"

到底是哪个社畜发明了这个？
太懂我们打工人了！🤣

🐴老干马 - 老油条专属
🐴汗血宝马 - 奋斗逼本逼
🐴内卷马 - 卷王之王

你是哪种马？评论区告诉我！

#打工人 #内卷 #职场 #搞笑 #社畜日常

---

### 标题选项3
打工人的精神状态🐴一键测出你的牛马属性！

### 正文选项3
打工人！打工魂！
打工都是人上人！

直到我测了这个牛马属性...🙃

老干马：保温杯里泡枸杞，工作十年成老油条
汗血宝马：一天干三天活，永远在冲KPI的路上
内卷马：我不卷谁卷，卷死别人算工伤

救命，全中！🤣

这个一键变身也太丝滑了
特效超棒，全程无广放心冲！

#打工人日常 #职场吐槽 #搞笑 #解压 #牛马

---

生成时间: ${new Date().toLocaleString("zh-CN")}
`;

  await fs.writeFile(path.join(outputDir, "小红书文案.md"), content, "utf-8");

  console.log(`\n📝 小红书文案已生成`);
  console.log(`📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
