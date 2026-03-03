#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

const ARK_API_KEY = "65670a89-8f2d-41dd-b45a-32c7eb8fdb01";
const ARK_MODEL = "doubao-seedream-5-0-260128";
const JIMENG_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

const prompt = `2026 worker meme, a chonky orange and white cat wearing a blue striped tie, sitting at an office desk with stacks of papers, a keyboard, and a monitor. On the monitor, a horse wearing a wig with the text "我司雇我在 我在工位很想你 还好马上过年放假了". The cat has a deadpan, resigned expression. Text overlay: "2026正式确诊为：斑马 一只上着普通班的普通马 天天想辞职 月月拿满勤". Internet meme style, bright colors, humorous, high resolution, no watermark, --ar 1:1 --style raw --v 6.0`;

async function generateImage() {
  console.log("正在调用火山引擎API生成图片...\n");

  const requestBody = {
    model: ARK_MODEL,
    prompt: prompt,
    n: 1,
    size: "1920x1920",
  };

  console.log("请求参数:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(JIMENG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log(`\n响应状态: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API错误: ${errorText}`);
    throw new Error(`火山引擎 API 错误: ${response.status}`);
  }

  const result = await response.json();
  console.log("\nAPI响应:", JSON.stringify(result, null, 2));

  if (!result.data || !result.data[0] || !result.data[0].url) {
    throw new Error(`API 响应格式错误`);
  }

  const imageUrl = result.data[0].url;
  console.log(`\n图片URL: ${imageUrl}`);

  // 下载图片
  console.log("\n正在下载图片...");
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`下载图片失败: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const outputPath = path.join("C:/Users/10360/Desktop/111", "worker-meme-2026.png");
  await fs.writeFile(outputPath, Buffer.from(imageBuffer));

  console.log(`\n图片已保存: ${outputPath}`);
  return outputPath;
}

generateImage()
  .then(path => console.log("\n生成成功！"))
  .catch(err => console.error("\n错误:", err.message));
