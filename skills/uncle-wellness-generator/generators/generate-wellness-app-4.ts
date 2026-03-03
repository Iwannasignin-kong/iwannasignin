#!/usr/bin/env tsx
/**
 * 生成养生食谱小程序4张营销封面
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

const EXAMPLE_PROMPT = `MBTI INTJ themed internet meme, anthropomorphic white-brown cat with a serious stern expression sitting in a car driver's seat, gripping a car steering wheel. Text overlay: "当有人跟intj说"这件事儿你做不了"的时候：", "我一定能做到". Internet meme style, color palette of gray-green, white-brown, black-yellow, funny and stubborn mood, high resolution, no watermark.`;

const themes = [
  {
    name: "厨房杀手翻身",
    prompt: `Internet meme style, anthropomorphic cute character holding cooking utensils with confused expression in messy kitchen. Phone screen visible showing step-by-step cooking instructions. Character looks like a "kitchen disaster" trying to cook. Funny, relatable humor. Text overlay: "厨房杀手翻身记" and "分步教学救大命". Bright colors, high resolution, no watermark.`,
  },
  {
    name: "外卖续命vs养生",
    prompt: `Internet meme style, split comparison image. Left side: exhausted character eating takeout food with tired expression. Right side: same character eating healthy meal with happy energetic expression. Text overlay: "外卖续命 vs 养生自救" and "分步教学秒变大厨". Humorous contrast, bright colors, high resolution, no watermark.`,
  },
  {
    name: "节气养生",
    prompt: `Internet meme style, cute character surrounded by seasonal ingredients (fruits, vegetables, herbs), holding smartphone showing seasonal recipe recommendations. Character looks healthy and happy. Four seasonal elements in corners. Warm cozy lighting. Text overlay: "立秋润燥" and "节气养生不踩雷". Warm colors, high resolution, no watermark.`,
  },
  {
    name: "打工人专属养生",
    prompt: `Internet meme style, exhausted office worker character at desk with dark circles under eyes, looking at smartphone showing personalized health recommendations. Character looks surprised and grateful with sparkle eyes. Office background. Text overlay: "打工人专属养生" and "祛湿健脾一键安排". Relatable humor, bright colors, high resolution, no watermark.`,
  },
];

async function generateImage(prompt: string, outputPath: string, config: ReturnType<typeof getConfig>): Promise<void> {
  const url = `${ARK_URL}/images/generations`;

  const finalPrompt = `Reference: ${EXAMPLE_PROMPT}\n\nCreate: ${prompt}`;

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
  console.log("=".repeat(60));

  const outputDir = path.join(os.homedir(), "Desktop", `养生食谱小程序营销-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);

  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
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

  console.log(`\n✨ 4张营销图文生成完成！`);

  // 生成小红书文案
  const content = `# 养生食谱小程序 - 小红书营销文案

## 文案1：厨房杀手翻身记

### 标题
笑不活了😂厨房杀手居然靠这个翻身了！

### 正文
家人们！我宣布个事！

本厨房杀手居然学会做养生菜了！🎉

这个小程序太懂我了：
✅ 扫码就能进，不用下载
✅ 简单问卷就知道我脾胃虚弱
✅ 分步教学，每一步都有大字说明
✅ 还有语音朗读！不用担心看漏了

我做了个祛湿汤
全程跟着手机走
居然没翻车！

以前做饭：黑暗料理
现在做饭：养生大厨👨‍🍳

厨房杀手们，冲！

#养生食谱 #厨房杀手 #养生 #健康 #打工人

---

## 文案2：外卖续命vs养生自救

### 标题
打工人的续命神器✨外卖续命vs养生自救

### 正文
家人们！发现了个神仙小程序！

平时：外卖续命，奶茶续命
下班：浑身疲惫，湿气缠身

这个小程序直接给我安排：
🔸 根据症状个性化推荐
🔸 祛湿？健脾？都有
🔸 分步教学，小白也能学会
🔸 食材精确到克，不会翻车

我选了"祛湿套餐"
跟着做了个山药排骨汤
喝完感觉整个人都清爽了！🥰

打工人也要爱自己呀
身体是革命的本钱！

#打工人 #养生 #健康 #祛湿 #外卖

---

## 文案3：节气养生不踩雷

### 标题
立秋润燥吃什么？这个小程序太懂了！

### 正文
家人们！立秋了！

本来不知道吃什么
这个小程序直接给我推"润燥食谱"

🍐 雪梨银耳汤
🎃 冰糖雪梨
🥣 百合莲子羹

每道菜都有：
✓ 功效说明
✓ 禁忌提醒（适合我的体质）
✓ 食材清单（精确到克）
✓ 分步教学
✓ 预估耗时

小白也能学会！
我做了雪梨银耳汤
润润的，好喝！😋

节气养生不踩雷
这个小程序给我锁死！🔒

#节气养生 #立秋润燥 #养生食谱 #健康

---

## 文案4：养生小程序测评

### 标题
发现宝藏小程序✨厨房小白的养生救星

### 正文
家人们！发现个宝藏小程序！

作为一个厨房小白
我一直想做养生菜
但是：
❌ 不知道吃什么
❌ 不知道怎么做
❌ 总是翻车

直到我用了这个小程序：

✅ 首页有个性推荐
✅ 根据我的症状推荐食谱
✅ 节气食谱也有
✅ 点击进入看详情
✅ 功效、禁忌、食材都有
✅ 分步教学太贴心了
✅ 还能分享给朋友

做了个山药粥
跟着分步走
居然成功了！🎉

厨房小白们，快去试试！

#养生 #小程序推荐 #厨房小白 #健康 #食谱

---

## 5大核心卖点

1. **零门槛启动**
   - 微信扫码直接用
   - 简单问卷建档案

2. **个性化推荐**
   - 根据症状推荐食谱
   - 祛湿/健脾/润燥都有

3. **分步教学**
   - 每步都有大字说明
   - 高清图片/短视频
   - 语音朗读支持

4. **贴心细节**
   - 功效说明清晰
   - 禁忌提醒到位
   - 食材精确到克

5. **社交属性**
   - 标记"已学会"
   - 记录感受
   - 一键分享

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
