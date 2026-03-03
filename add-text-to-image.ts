#!/usr/bin/env bun
/**
 * 自动在图片上添加文字
 * 使用 Canvas 在指定位置绘制文字
 */

import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "node:fs/promises";
import path from "node:path";

interface TextBox {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily?: string;
  fontWeight?: string;
  align?: "left" | "center" | "right";
  maxWidth?: number;
}

interface Config {
  imagePath: string;
  outputPath: string;
  width: number;
  height: number;
  texts: TextBox[];
  backgroundColor?: string;
}

// 默认中文字体（使用系统字体）
const DEFAULT_FONT = "Microsoft YaHei, SimHei, Arial, sans-serif";

async function addTextToImage(config: Config): Promise<void> {
  // 创建画布
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext("2d");

  // 加载背景图片
  const image = await loadImage(config.imagePath);
  ctx.drawImage(image, 0, 0, config.width, config.height);

  // 绘制每个文字
  for (const textbox of config.texts) {
    const {
      text,
      x,
      y,
      fontSize,
      color,
      fontFamily = DEFAULT_FONT,
      fontWeight = "normal",
      align = "left",
      maxWidth,
    } = textbox;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "top";

    if (maxWidth) {
      // 自动换行
      const lines = wrapText(ctx, text, maxWidth);
      let lineHeight = fontSize * 1.3;
      lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight);
      });
    } else {
      ctx.fillText(text, x, y);
    }
  }

  // 保存图片
  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(config.outputPath, buffer);
  console.log(`✅ 图片已保存: ${config.outputPath}`);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split("");
  const lines: string[] = let currentLine = "";

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

// 从配置文件读取
async function loadConfig(configPath: string): Promise<Config> {
  const content = await fs.readFile(configPath, "utf-8");
  return JSON.parse(content);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
用法:
  bun add-text-to-image.ts <config.json>
  bun add-text-to-image.ts <image.png> <output.png> <texts.json>

配置文件格式 (config.json):
{
  "imagePath": "输入图片路径",
  "outputPath": "输出图片路径",
  "width": 2560,
  "height": 1440,
  "texts": [
    {
      "text": "主标题",
      "x": 100,
      "y": 50,
      "fontSize": 60,
      "color": "#333333",
      "fontWeight": "bold"
    },
    {
      "text": "副标题内容",
      "x": 100,
      "y": 130,
      "fontSize": 36,
      "color": "#666666",
      "maxWidth": 800
    }
  ]
}
    `);
    process.exit(1);
  }

  let config: Config;

  if (args.length === 1) {
    // 从配置文件读取
    config = await loadConfig(args[0]);
  } else if (args.length >= 3) {
    // 命令行参数
    const textsConfig = await loadConfig(args[2]);
    config = {
      imagePath: args[0],
      outputPath: args[1],
      ...textsConfig,
    };
  } else {
    console.error("❌ 参数错误");
    process.exit(1);
  }

  await addTextToImage(config);
}

main().catch((err) => {
  console.error("❌ 错误:", err.message);
  process.exit(1);
});
