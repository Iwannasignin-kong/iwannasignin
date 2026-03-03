#!/usr/bin/env tsx
/**
 * Uncle-L 随机养生笔记生成器
 * 需要配置环境变量：DEEPSEEK_API_KEY, ARK_API_KEY, ARK_MODEL
 *
 * 使用方法:
 * 1. 在项目根目录创建 .env 文件并配置 API 密钥
 * 2. 运行: npx tsx generate-all.ts
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ============================================
// API 配置
// ============================================
const DEEPSEEK_URL = "https://api.deepseek.com/v1";

// 配置对象
let config = {
  DEEPSEEK_API_KEY: "",
  ARK_API_KEY: "",
  ARK_MODEL: "",
};

// ============================================
// 加载 .env 文件
// ============================================
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
  } catch (err) {
    // .env 文件不存在，忽略
  }
}

// ============================================
// 初始化配置
// ============================================
async function initConfig(): Promise<boolean> {
  await loadEnv();

  config = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
    ARK_API_KEY: process.env.ARK_API_KEY || "",
    ARK_MODEL: process.env.ARK_MODEL || "",
  };

  return validateConfig();
}

// ============================================
// 验证 API 配置
// ============================================
function validateConfig(): boolean {
  const missing: string[] = [];

  if (!config.DEEPSEEK_API_KEY) missing.push("DEEPSEEK_API_KEY");
  if (!config.ARK_API_KEY) missing.push("ARK_API_KEY");
  if (!config.ARK_MODEL) missing.push("ARK_MODEL");

  if (missing.length > 0) {
    console.error("\n❌ 错误：缺少以下环境变量配置：");
    missing.forEach(key => console.error(`   - ${key}`));
    console.error("\n请在 .env 文件中配置这些变量\n");
    return false;
  }

  return true;
}

// ============================================
// 随机种子池
// ============================================
const EFFECTS = [
  "护眼", "抗衰老", "增强免疫力", "改善睡眠", "促进消化",
  "降血脂", "补血养颜", "健脑益智", "清热降火", "强健骨骼"
];

const CATEGORIES = [
  "豆浆", "炖汤", "沙拉", "粥品", "茶饮",
  "坚果", "果蔬汁", "粗粮", "海鲜", "甜品"
];

// ============================================
// 工具函数
// ============================================
function drawCard() {
  return {
    effect: EFFECTS[Math.floor(Math.random() * EFFECTS.length)],
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  };
}

function getTimestamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

// ============================================
// Deepseek API - 生成食谱文本
// ============================================
async function generateRecipes(effect: string, category: string): Promise<string> {
  const prompt = `请你给出【${effect}】x【${category}】的6种不同的养生食谱。

【极其重要的格式要求】
1. 必须严格按照以下格式输出，每一道食谱占据3行：
养生食谱名称：XXX
简单介绍：XXX
具体功效食材：XXX

2. 不要在任何位置添加 markdown 标记（如 **、- 等）
3. 不要添加序号（如 1.、2.）
4. 不要在食谱前后添加任何说明文字
5. 6道食谱之间用空行分隔
6. 只输出食谱内容，其他什么都不说

请严格按照以上格式生成6道【${effect}】x【${category}】的养生食谱：`;

  const response = await fetch(`${DEEPSEEK_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepseek API 错误: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// ============================================
// 解析食谱
// ============================================
function parseRecipes(text: string) {
  const recipes: Array<{name: string, intro: string, ingredients: string}> = [];
  const regex = /养生食谱名称：(.+)\n简单介绍：(.+)\n具体功效食材：(.+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    recipes.push({
      name: match[1].trim(),
      intro: match[2].trim(),
      ingredients: match[3].trim(),
    });
  }
  return recipes;
}

// ============================================
// 火山引擎 API - 生成图片
// ============================================
async function generateImage(prompt: string, outputPath: string) {
  // 火山引擎即梦 API 端点
  const JIMENG_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

  const response = await fetch(JIMENG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.ARK_MODEL,
      prompt: prompt,
      n: 1,
      size: "1024x1365",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`火山引擎 API 错误: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // 检查响应结构
  if (!result.data || !result.data[0] || !result.data[0].url) {
    throw new Error(`API 响应格式错误: ${JSON.stringify(result)}`);
  }

  const imageUrl = result.data[0].url;

  // 下载图片
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`下载图片失败: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(imageBuffer));
}

// ============================================
// 构建提示词
// ============================================
function buildCoverPrompt(recipes: Array<{name: string, intro: string, ingredients: string}>) {
  const recipesText = recipes.map((r, i) =>
    `${i + 1}. ${r.name}\n   介绍：${r.intro}\n   食材：${r.ingredients}`
  ).join("\n\n");

  return `你现在是一个小红书养生图文博主，我会为你提供六道中式养生食谱，请你帮我生成一张中式风格的养生题材养生图文笔记封面；

1.图片风格：请采用的柔和水彩风格，清晰易读，风格清新，浅色背景，可以稍微带一点古风元素；

2.尺寸选择：请你生成3:4竖屏图片；

3.内容展示：请你生成六道食谱插画，并且按照2x3的格式依次排列，每道食谱插画空间分布平均
—
以下是具体食材及介绍：

${recipesText}`;
}

function buildDetailPrompt(recipe: {name: string, intro: string, ingredients: string}) {
  return `你现在是一个小红书养生图文博主，我会为你提供1道中式养生食谱，请你帮我生成一张中式风格的养生图文笔记食谱详情介绍页；

1.图片风格：请采用的柔和水彩风格，清晰易读，风格清新，浅色背景，可以稍微带一点古风元素
2.尺寸选择：请你生成3:4竖屏图片
3.内容展示：请你生成这道食谱插画，并且展示出制作步骤和具体食材；
4.图片的结构为固定三部分，头部是菜谱名称文字，中间是菜谱的主体水彩插画，底部展示出制作步骤和具体食材展示；
—
以下是具体食材及介绍：

食谱名称：${recipe.name}
简单介绍：${recipe.intro}
具体功效食材：${recipe.ingredients}`;
}

// ============================================
// 生成单组笔记
// ============================================
async function generateGroup(
  index: number,
  total: number,
  outputDir: string,
  effect?: string,
  category?: string
): Promise<boolean> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`   🎲 第 ${index}/${total} 组养生笔记`);
  console.log(`${"=".repeat(60)}`);

  // 抽卡
  const card = effect && category
    ? { effect, category }
    : drawCard();

  const folderName = `${String(index).padStart(2, "0")}-${card.effect}-${card.category}`;
  const groupDir = path.join(outputDir, folderName);
  await fs.mkdir(groupDir, { recursive: true });

  console.log(`\n📋 抽卡结果: ${card.effect} × ${card.category}`);
  console.log(`📁 输出目录: ${groupDir}`);

  // Step 1: 生成食谱文本
  console.log(`\n📝 Step 1: 生成食谱文本...`);
  let recipesText = "";
  let recipes: Array<{name: string, intro: string, ingredients: string}> = [];
  let retries = 3;

  while (retries > 0 && recipes.length < 6) {
    try {
      recipesText = await generateRecipes(card.effect, card.category);
      recipes = parseRecipes(recipesText);
    } catch (e) {
      console.log(`   API调用失败，重试... (${4 - retries}/3)`);
    }
    retries--;
  }

  if (recipes.length < 6) {
    console.log(`❌ 无法解析出6道食谱，实际解析: ${recipes.length}道`);
    await fs.writeFile(path.join(groupDir, "error-debug.txt"), recipesText, "utf-8");
    return false;
  }

  console.log(`   ✅ 成功生成 ${recipes.length} 道食谱:`);
  recipes.forEach((r, i) => console.log(`      ${i + 1}. ${r.name}`));

  // 保存文本
  const mdContent = `# ${card.effect}${card.category}养生笔记

## 抽卡结果
- **功效**: ${card.effect}
- **饮食类别**: ${card.category}
- **组合主题**: ${card.effect}${card.category}

---

${recipesText}
`;
  await fs.writeFile(path.join(groupDir, "recipes.md"), mdContent, "utf-8");

  // Step 2: 生成封面图
  console.log(`\n🎨 Step 2: 生成封面图...`);
  const coverPrompt = buildCoverPrompt(recipes);
  await fs.writeFile(path.join(groupDir, "cover-prompt.txt"), coverPrompt, "utf-8");

  try {
    await generateImage(coverPrompt, path.join(groupDir, "00-cover.png"));
    console.log(`   ✅ 封面图已保存`);
  } catch (e) {
    console.log(`   ❌ 封面图生成失败: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Step 3: 生成6张详情页
  console.log(`\n📄 Step 3: 生成6张详情页...`);
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const detailPrompt = buildDetailPrompt(recipe);
    const promptFileName = `detail-${String(i + 1).padStart(2, "0")}-prompt.txt`;
    const imageFileName = `${String(i + 1).padStart(2, "0")}-detail-${i + 1}.png`;

    await fs.writeFile(path.join(groupDir, promptFileName), detailPrompt, "utf-8");

    try {
      await generateImage(detailPrompt, path.join(groupDir, imageFileName));
      process.stdout.write(`   ${i + 1}✅ `);
    } catch (e) {
      process.stdout.write(`   ${i + 1}❌ `);
    }
  }
  console.log("");

  console.log(`\n✨ 第 ${index} 组完成: ${card.effect}${card.category}`);
  return true;
}

// ============================================
// 主函数
// ============================================
async function main() {
  // 初始化配置
  const configured = await initConfig();
  if (!configured) {
    process.exit(1);
  }

  const count = 10; // 默认生成10组

  console.log("\n" + "🌟".repeat(30));
  console.log("   Uncle-L 随机养生笔记生成器");
  console.log(`   将生成 ${count} 组养生笔记`);
  console.log("   " + "🌟".repeat(30));

  // 输出目录：桌面/中式养生笔记-{日期}
  const desktopPath = path.join(os.homedir(), "Desktop");
  const outputDir = path.join(desktopPath, `中式养生笔记-${getTimestamp()}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);

  // 生成统计
  let success = 0;
  let failed = 0;

  for (let i = 1; i <= count; i++) {
    try {
      const ok = await generateGroup(i, count, outputDir);
      if (ok) {
        success++;
      } else {
        failed++;
        // 重试一次
        console.log(`   尝试重新生成第 ${i} 组...`);
        const ok2 = await generateGroup(i, count, outputDir);
        if (ok2) {
          success++;
          failed--;
        }
      }
    } catch (err) {
      console.error(`\n❌ 第 ${i} 组异常:`, err instanceof Error ? err.message : String(err));
      failed++;
    }
  }

  // 总结
  console.log("\n" + "=".repeat(60));
  console.log("   📊 生成总结");
  console.log("=".repeat(60));
  console.log(`\n   ✅ 成功: ${success} 组`);
  console.log(`   ❌ 失败: ${failed} 组`);
  console.log(`   📁 输出: ${outputDir}`);

  // 列出所有生成的文件夹
  const folders = await fs.readdir(outputDir);
  console.log(`\n   生成内容:`);
  folders.sort().forEach(f => console.log(`      📂 ${f}`));

  console.log("\n✨ 全部完成！\n");
}

// 运行
main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
