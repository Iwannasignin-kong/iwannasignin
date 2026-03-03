#!/usr/bin/env tsx
/**
 * 生成4种牛马主题封面
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

const EXAMPLE_PROMPT = `2026 worker meme, a chonky orange and white cat wearing a blue striped tie, sitting at an office desk with stacks of papers, a keyboard, and a monitor. On the monitor, a horse wearing a wig with the text "我司雇我在 我在工位很想你 还好马上过年放假了". The cat has a deadpan, resigned expression. Text overlay: "2026正式确诊为：斑马 一只上着普通班的普通马 天天想辞职 月月拿满勤". Internet meme style, bright colors, humorous, high resolution, no watermark.`;

const niumaThemes = [
  {
    name: "老干马",
    prompt: `A cute anthropomorphic horse character wearing office suit and tie, thick dark circles under eyes, holding a thermos cup with both hooves. Experienced office worker vibe, exhausted but determined expression. Centered composition, soft indoor lighting. Text overlay: "你是哪种马？" and "老干马 - 经验丰富的打工人". Internet meme style, humorous, bright colors.`,
  },
  {
    name: "汗血宝马",
    prompt: `A cute anthropomorphic horse character sweating profusely with exaggerated sweat drops, juggling multiple tasks: laptop in one hoof, phone in another, coffee cup balanced. Dynamic action pose, determined expression, energetic vibe. Centered composition. Text overlay: "你是哪种马？" and "汗血宝马 - 拼命三郎型选手". Meme style, vibrant colors.`,
  },
  {
    name: "躺平马",
    prompt: `A cute anthropomorphic horse character lounging comfortably on a couch, eating snacks and looking at phone. Relaxed posture, peaceful expression, cozy living room background. Centered composition, warm lighting. Text overlay: "你是哪种马？" and "躺平马 - 能躺绝不坐着". Meme style, humorous vibe.`,
  },
  {
    name: "内卷马",
    prompt: `A cute anthropomorphic horse character with comically thick glasses, surrounded by stacks of books and multiple laptops. Studying intensely while typing, hyper-focused expression. Books everywhere, multiple arms doing different tasks. Centered composition. Text overlay: "你是哪种马？" and "内卷马 - 卷王之王". Exaggerated cartoon style.`,
  },
];

async function generateImage(prompt: string, outputPath: string, config: ReturnType<typeof getConfig>): Promise<void> {
  const url = `${ARK_URL}/images/generations`;

  const finalPrompt = `Reference: ${EXAMPLE_PROMPT}\n\nCreate: ${prompt}\n\nStyle: Internet meme style, humorous, bright colors, high resolution, no watermark, centered composition.`;

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
    throw new Error(`API 响应格式错误`);
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
  console.log("   🎨 生成小红书封面：4种牛马打工人生成器");
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `牛马打工人生成器-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);

  for (let i = 0; i < niumaThemes.length; i++) {
    const theme = niumaThemes[i];
    console.log(`   ${i + 1}. ${theme.name} - 生成中...`);

    const imagePath = path.join(outputDir, `${i + 1}-${theme.name}.png`);
    const promptPath = path.join(outputDir, `${i + 1}-${theme.name}-prompt.txt`);

    await fs.writeFile(promptPath, theme.prompt, "utf-8");

    try {
      await generateImage(theme.prompt, imagePath, config);
      console.log(`      ✅ 成功`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n✨ 4张封面图生成完成！`);

  // 生成小红书营销文案
  const content = `# 小红书营销文案：牛马打工人生成器

## 产品介绍
当代打工人打工名场面，一键扫描变身趣味牛马：老干马、汗血宝马、躺平马、内卷马，拟人化搞笑马造型，变身特效丝滑，全程幽默自嘲，无负面情绪，轻松解压

---

## 文案1：测试你的打工人属性

### 标题
笑不活了😂一键测出你是哪种马！

### 正文
家人们！这个打工人生成器太准了！

只要一键扫描，就能变身成你的专属牛马形态：

🐴 老干马 - 经验丰富的老打工人
   保温杯里泡枸杞，工作十年成老油条

🐴 汗血宝马 - 拼命三郎型选手
   一天干三天活，永远在冲KPI的路上

🐴 躺平马 - 能躺绝不坐着
   上班如上坟，下班如重生

🐴 内卷马 - 卷王之王本王
   眼镜比脸还厚，卷死别人算工伤

我测出来是【老干马】
保温杯时刻在手，淡定应对一切🤣

到底是哪个社畜发明了这个？
太懂我们打工人了！

快去测测你是哪种马！
评论区告诉我你的牛马属性！

#打工人 #牛马 #职场 #搞笑 #社畜日常 #打工人日常

---

## 文案2：打工人精神状态

### 标题
打工人的精神状态🐴一键测出你的牛马属性

### 正文
打工人！打工魂！打工都是人上人！

直到我测了这个牛马生成器...🙃

🔸 老干马：老油条专属，工作十年如一日
🔸 汗血宝马：奋斗逼本逼，996是福报
🔸 躺平马：上班如上坟，能躺绝不坐着
🔸 内卷马：我不卷谁卷，卷死别人算工伤

救命，我全中！🤣

这个一键变身也太丝滑了
拟人化马造型超可爱
全程幽默自嘲，完全没有负面情绪
轻松解压，打工人的精神续命水！

特效超棒，全程无广放心冲！

#打工人日常 #职场吐槽 #搞笑 #解压 #牛马 #打工人

---

## 文案3：解压神器推荐

### 标题
发现神仙神器✨打工人的精神续命水

### 正文
家人们！我发现了一个打工人生成器！

一键扫描就能变身成你的专属牛马形态：
老干马、汗血宝马、躺平马、内卷马

每种马的造型都超可爱：
🐴 拟人化搞笑马造型
🐴 变身特效丝滑
🐴 全程幽默自嘲
🐴 完全没有负面情绪
🐴 轻松解压

我测出来是躺平马哈哈哈
上班如上坟，下班如重生
太真实了！🤣

每天上班前扫一下
看今天自己是哪种马
轻松开启打工人的一天！

快去测测你是哪种马！

#打工人 #解压神器 #职场 #搞笑 #牛马属性

---

## 文案4：四种马你中哪个

### 标题
你是哪种马？🐴一键测出你的打工属性

### 正文
当代打工人打工名场面
一键扫描变身趣味牛马

看看你是哪一种：

【老干马】
保温杯在手，天下我有
十年老油条，淡定应对一切

【汗血宝马】
拼命三郎，永远在冲KPI的路上
一天干三天活，马不停蹄

【躺平马】
上班如上坟，下班如重生
能躺绝不坐着，能摸鱼绝不干活

【内卷马】
眼镜比脸还厚
卷死别人算工伤
我不卷谁卷

我测出来是老干马🤣
保温杯时刻在手，老油条本油

你是哪种马？评论区告诉我！

#打工人 #牛马 #职场 #搞笑 #社畜

---

生成时间: ${new Date().toLocaleString("zh-CN")}
`;

  await fs.writeFile(path.join(outputDir, "小红书营销文案.md"), content, "utf-8");

  console.log(`\n📝 小红书营销文案已生成`);
  console.log(`📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
