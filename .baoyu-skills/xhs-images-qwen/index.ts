#!/usr/bin/env tsx
/**
 * 小红书信息图生成器 - 阿里云 DashScope 版
 * 支持 Style × Layout 二维系统
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ==================== 配置 ====================

async function loadEnv(): Promise<void> {
  // 尝试多个可能的 .env 文件路径
  const possiblePaths = [
    path.join(__dirname, ".env"),  // 当前脚本目录
    path.join(process.cwd(), ".env"),  // 当前工作目录
    path.join(process.cwd(), ".baoyu-skills", "xhs-images-qwen", ".env"),  // 项目目录
    path.join(os.homedir(), ".baoyu-skills", "xhs-images-qwen", ".env"),  // 用户目录
  ];

  for (const envPath of possiblePaths) {
    try {
      const envContent = await fs.readFile(envPath, "utf-8");
      console.log(`\n📋 加载配置文件: ${envPath}`);
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
      return;  // 成功加载后退出
    } catch {
      continue;  // 尝试下一个路径
    }
  }

  console.warn("\n⚠️  警告: 未找到 .env 配置文件");
}

function getConfig() {
  return {
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY || "",
    DASHSCOPE_BASE_URL: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
    DASHSCOPE_IMAGE_MODEL: process.env.DASHSCOPE_IMAGE_MODEL || "qwen-vl-plus",
    IMAGE_SIZE: process.env.IMAGE_SIZE_XHS || "3072x4096",
  };
}

// ==================== 风格系统 ====================

// 9种视觉风格
const STYLES: Record<string, string> = {
  cute: "Cute kawaii illustration style for Xiaohongshu. Soft pastel colors (pink, baby blue, lavender), big expressive eyes, rounded shapes, adorable chibi characters. Playful, childlike charm. High quality, clean composition, no watermark.",
  fresh: "Fresh and clean illustration style for Xiaohongshu. Natural color palette with soft greens, warm beige, herbal tones. Minimalist botanical illustrations, ingredient showcase style. Educational and informative vibe. Clean white space, delicate line work. High quality, no watermark.",
  warm: "Warm and caring cartoon illustration style for Xiaohongshu. Soft pastel colors (cream, peach, warm orange), gentle lines, hand-drawn decorative elements (hearts, clouds), cozy family atmosphere. Emotionally resonant, authentic storytelling vibe. High quality, no watermark.",
  bold: "Bold graphic style for Xiaohongshu. High contrast colors (vivid red, electric blue, sunny yellow), strong geometric shapes, thick outlines, eye-catching composition. Dynamic and energetic. Pop art influence. High quality, no watermark.",
  minimal: "Minimalist zen style for Xiaohongshu. Limited color palette (black, white, one accent), clean lines, ample negative space, simple geometric shapes. Calm and refined. Japanese minimalism influence. High quality, no watermark.",
  retro: "Retro Chinese national trend (国潮) illustration style for Xiaohongshu. Fusion of traditional Chinese aesthetics with modern design. Rich color palette: vermilion red, imperial gold, deep jade green, ink black. Traditional elements: cloud patterns, auspicious symbols, Chinese paper-cut style. High quality, no watermark.",
  pop: "Pop art style for Xiaohongshu. Bright saturated colors, bold outlines, comic book halftone dots, dynamic poses. Playful and energetic. Neo-pop art influence. High quality, no watermark.",
  notion: "Notion-style clean line art for Xiaohongshu. Simple black outlines on white background, minimal color accents, clean typography-friendly layout. Productivity and knowledge sharing vibe. Like Notion's illustration style. High quality, no watermark.",
  chalkboard: "Chalkboard style for Xiaohongshu. Colorful chalk drawings on black background, hand-drawn warmth, educational and friendly. Vibrant chalk colors (pink, blue, yellow, green). Learning and teaching vibe. High quality, no watermark.",
};

// 6种信息密度布局
const LAYOUTS: Record<string, { density: string; description: string }> = {
  sparse: { density: "1-2 points", description: "Covers, quotes, single key message" },
  balanced: { density: "3-4 points", description: "Regular content, standard information density" },
  dense: { density: "5-8 points", description: "Knowledge cards, cheat sheets, information-rich" },
  list: { density: "4-7 items", description: "Checklists, rankings, itemized content" },
  comparison: { density: "2 sides", description: "Before/after, pros/cons, A/B comparison" },
  flow: { density: "3-6 steps", description: "Processes, timelines, step-by-step guides" },
};

// ==================== Prompt 构建 ====================

interface GenerationOptions {
  style: string;
  layout: string;
  count: number;
}

function buildPrompt(content: string, options: GenerationOptions): string {
  const style = STYLES[options.style] || STYLES.cute;
  const layout = LAYOUTS[options.layout] || LAYOUTS.balanced;

  return `You are creating a Xiaohongshu (Little Red Book) infographic image.

**Content to visualize**: ${content}

**Style** (CRITICAL - must follow exactly): ${style}

**Layout**: ${layout.density} density - ${layout.description}

**Technical requirements**:
- 3:4 vertical aspect ratio (3072x4096) optimized for mobile social media
- Maintain visual consistency across all images
- All text should be in Chinese where content is Chinese
- High quality, no watermark
- Clean, readable layout suitable for social media

Please generate the image following these guidelines precisely.`;
}

// ==================== API 调用 ====================

async function generateImage(
  prompt: string,
  outputPath: string,
  config: ReturnType<typeof getConfig>
): Promise<void> {
  // 使用阿里云通义万相原生 API (仅支持异步)
  const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

  // 通义万相支持的尺寸: 1024*1024, 720*1280, 768*1152, 1280*720
  // 将 3:4 比例映射到支持的尺寸
  const supportedSizes = {
    "1024*1024": "1:1 (方形)",
    "720*1280": "9:16 (竖屏)",
    "768*1152": "2:3 (竖屏)",
    "1280*720": "16:9 (横屏)",
  };

  // 使用 720*1280 作为 3:4 竖屏的近似
  const size = "720*1280";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.DASHSCOPE_API_KEY}`,
      "X-DashScope-Async": "enable",  // 必须启用异步
    },
    body: JSON.stringify({
      model: "wanx-v1",
      input: {
        prompt: prompt,
      },
      parameters: {
        size: size,
        n: 1,
        style: "<auto>",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope API 错误: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // 通义万相异步任务：获取 task_id
  if (!result.output?.task_id) {
    throw new Error(`API 响应格式错误: ${JSON.stringify(result)}`);
  }

  const taskId = result.output.task_id;
  console.log(`      ⏳ 任务已提交: ${taskId}`);

  // 轮询获取结果
  let imageUrl = null;
  let attempts = 0;
  const maxAttempts = 60; // 最多等待2分钟

  while (attempts < maxAttempts && !imageUrl) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒

    const statusResponse = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        headers: {
          "Authorization": `Bearer ${config.DASHSCOPE_API_KEY}`,
        },
      }
    );

    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();

      // 检查任务状态
      if (statusResult.output?.task_status === "SUCCEEDED" && statusResult.output?.results) {
        imageUrl = statusResult.output.results[0]?.url;
      } else if (statusResult.output?.task_status === "FAILED") {
        throw new Error(`图片生成失败: ${JSON.stringify(statusResult)}`);
      }
    }

    attempts++;

    // 每10秒显示一次进度
    if (attempts % 5 === 0 && !imageUrl) {
      console.log(`      ⏳ 生成中... (${attempts * 2}s)`);
    }
  }

  if (!imageUrl) {
    throw new Error(`图片生成超时，任务ID: ${taskId}`);
  }

  console.log(`      ✅ 图片生成成功`);

  // 下载图片
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`下载图片失败`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(imageBuffer));
}

// ==================== 内容解析 ====================

async function parseContent(input: string): Promise<string> {
  // 检查是否是文件路径
  try {
    const stat = await fs.stat(input);
    if (stat.isFile()) {
      return await fs.readFile(input, "utf-8");
    }
  } catch {}

  // 直接返回文本内容
  return input;
}

// 将长内容分割成多个片段
function splitContentIntoScenes(content: string, count: number): string[] {
  // 按段落分割
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length <= count) {
    return paragraphs;
  }

  // 如果段落太多，按字符数智能分割
  const scenes: string[] = [];
  const targetLength = Math.ceil(content.length / count);
  let currentScene = "";

  for (const para of paragraphs) {
    if (currentScene.length + para.length > targetLength && currentScene.length > 0) {
      scenes.push(currentScene.trim());
      currentScene = para;
    } else {
      currentScene += (currentScene ? "\n\n" : "") + para;
    }
  }

  if (currentScene) {
    scenes.push(currentScene.trim());
  }

  return scenes.slice(0, count);
}

// ==================== 主函数 ====================

async function main() {
  await loadEnv();
  const config = getConfig();

  // 解析命令行参数
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
使用方法:
  tsx index.ts "<内容或文件路径>" [选项]

选项:
  --style <风格>     cute|fresh|warm|bold|minimal|retro|pop|notion|chalkboard (默认: cute)
  --layout <布局>    sparse|balanced|dense|list|comparison|flow (默认: balanced)
  --count <数量>     生成图片数量 1-10 (默认: 6)

示例:
  tsx index.ts "今天分享5个提升效率的小技巧" --style fresh --layout list
  tsx index.ts ./article.md --style warm --count 7
    `);
    process.exit(0);
  }

  let content = args[0];
  let style = "cute";
  let layout = "balanced";
  let count = 6;

  // 解析选项
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--style" && i + 1 < args.length) {
      style = args[i + 1];
      i++;
    } else if (args[i] === "--layout" && i + 1 < args.length) {
      layout = args[i + 1];
      i++;
    } else if (args[i] === "--count" && i + 1 < args.length) {
      count = parseInt(args[i + 1]);
      i++;
    }
  }

  // 验证参数
  if (!STYLES[style]) {
    console.error(`❌ 无效的风格: ${style}`);
    console.log(`可用风格: ${Object.keys(STYLES).join(", ")}`);
    process.exit(1);
  }

  if (!LAYOUTS[layout]) {
    console.error(`❌ 无效的布局: ${layout}`);
    console.log(`可用布局: ${Object.keys(LAYOUTS).join(", ")}`);
    process.exit(1);
  }

  if (count < 1 || count > 10) {
    console.error(`❌ 无效的数量: ${count} (必须是 1-10)`);
    process.exit(1);
  }

  // 解析内容
  const parsedContent = await parseContent(content);
  const scenes = splitContentIntoScenes(parsedContent, count);

  console.log("\n" + "=".repeat(60));
  console.log("   🎨 小红书信息图生成器 - 阿里云 DashScope 版");
  console.log("=".repeat(60));
  console.log(`\n📝 内容长度: ${parsedContent.length} 字符`);
  console.log(`🎨 风格: ${style}`);
  console.log(`📐 布局: ${layout} (${LAYOUTS[layout].density})`);
  console.log(`🖼️  生成数量: ${scenes.length} 张`);

  // 创建输出目录
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const outputDir = path.join(os.homedir(), "Desktop", `小红书-${style}-${layout}-${timestamp}`);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`\n📁 输出目录: ${outputDir}\n`);
  console.log(`="`.repeat(60) + "\n");

  // 生成图片
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`[${i + 1}/${scenes.length}] 生成第 ${i + 1} 张图...`);

    const imagePath = path.join(outputDir, `${String(i + 1).padStart(2, "0")}.png`);
    const promptPath = path.join(outputDir, `${String(i + 1).padStart(2, "0")}-prompt.txt`);

    const prompt = buildPrompt(scene, { style, layout, count });
    await fs.writeFile(promptPath, prompt, "utf-8");

    try {
      await generateImage(prompt, imagePath, config);
      console.log(`      ✅ 成功: ${path.basename(imagePath)}`);
    } catch (e) {
      console.log(`      ❌ 失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✨ ${scenes.length} 张小红书图文生成完成！`);
  console.log(`\n📁 输出位置: ${outputDir}\n`);
}

main().catch(err => {
  console.error("\n💥 程序异常:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
