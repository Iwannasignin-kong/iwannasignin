import { writeFile, mkdir, access, readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";
import process from "node:process";
import os from "node:os";

import {
  CdpConnection,
  getFreePort,
  launchChrome,
  waitForChromeDebugPort,
  waitForNetworkIdle,
  waitForPageLoad,
  evaluateScript,
  killChrome,
} from "./cdp.js";

const CDP_CONNECT_TIMEOUT_MS = 15_000;
const DEFAULT_TIMEOUT_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

interface Args {
  url: string;
  output?: string;
  append: boolean;
  timeout: number;
  waitLogin: boolean;
  downloadCover: boolean;
  downloadVideo: boolean;
  downloadImages: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { 
    url: "", 
    append: true, 
    timeout: DEFAULT_TIMEOUT_MS, 
    waitLogin: false, 
    downloadCover: false, 
    downloadVideo: false,
    downloadImages: false
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--new" || arg === "-n") {
      args.append = false;
    } else if (arg === "-o" || arg === "--output") {
      args.output = argv[++i];
    } else if (arg === "--timeout" || arg === "-t") {
      args.timeout = parseInt(argv[++i], 10) || DEFAULT_TIMEOUT_MS;
    } else if (arg === "--login" || arg === "-l") {
      args.waitLogin = true;
    } else if (arg === "--cover" || arg === "-c") {
      args.downloadCover = true;
    } else if (arg === "--video" || arg === "-v") {
      args.downloadVideo = true;
    } else if (arg === "--images" || arg === "-i") {
      args.downloadImages = true;
    } else if (!arg.startsWith("-") && !args.url) {
      args.url = argv[i];
    }
  }
  return args;
}

async function waitForUserSignal(message: string): Promise<void> {
  console.log(message);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.once("line", () => { rl.close(); resolve(); });
  });
}

// Download file from URL
async function downloadFile(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/'
      }
    });
    
    if (!response.ok) {
      console.log(`   ⚠️ 下载失败: HTTP ${response.status}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, Buffer.from(buffer));
    return true;
  } catch (err) {
    console.log(`   ⚠️ 下载失败: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

const extractXHSDataScript = `
(function() {
  const data = { 
    title: "", 
    content: "",
    likes: "", 
    collects: "", 
    comments: "", 
    author: "", 
    coverUrl: "", 
    videoUrl: "",
    imageUrls: [],
    url: window.location.href 
  };
  
  // Title
  const titleEl = document.querySelector('#detail-title');
  if (titleEl) data.title = titleEl.textContent.trim();
  
  // Content - extract note text
  const contentSelectors = [
    '.note-content .desc',
    '.note-content .content',
    '.note-text',
    '[class*="content"] p',
    '#detail-desc'
  ];
  
  for (const sel of contentSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      data.content = el.textContent.trim();
      break;
    }
  }
  
  // If not found, try to get from meta description
  if (!data.content) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      data.content = metaDesc.getAttribute('content') || '';
    }
  }
  
  // Stats
  document.querySelectorAll('.count').forEach(el => {
    const text = el.textContent.trim();
    if (!/^\\d/.test(text)) return;
    
    const parent = el.closest('.like-wrapper, .collect-wrapper, .chat-wrapper');
    if (!parent) return;
    
    if (parent.classList.contains('like-wrapper')) data.likes = text;
    else if (parent.classList.contains('collect-wrapper')) data.collects = text;
    else if (parent.classList.contains('chat-wrapper')) data.comments = text;
  });
  
  // Author
  const authorSelectors = ['.author-name', '.nickname', '.username', '[class*="author"] a'];
  for (const sel of authorSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      const name = el.textContent.trim();
      if (name && name !== '小红书' && name.length < 50) {
        data.author = name;
        break;
      }
    }
  }
  
  // All images in note
  const imgSelectors = [
    '.note-content img',
    '.slider-image img', 
    '.img-container img',
    '.swiper-slide img'
  ];
  
  const seenUrls = new Set();
  imgSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(img => {
      const src = img.src || img.getAttribute('data-src');
      if (src && !seenUrls.has(src) && src.includes('xhscdn')) {
        seenUrls.add(src);
        data.imageUrls.push(src);
      }
    });
  });
  
  // Cover image (first image or poster)
  const posterEl = document.querySelector('xg-poster');
  if (posterEl) {
    const style = posterEl.getAttribute('style') || '';
    const match = style.match(/background-image:\\s*url\\(['"]?([^'"\\)]+)['"]?\\)/);
    if (match) data.coverUrl = match[1];
  }
  
  if (!data.coverUrl && data.imageUrls.length > 0) {
    data.coverUrl = data.imageUrls[0];
  }
  
  if (!data.coverUrl) {
    const metaImg = document.querySelector('meta[property="og:image"]');
    if (metaImg) data.coverUrl = metaImg.getAttribute('content');
  }
  
  // Video URL
  const videoEl = document.querySelector('video');
  if (videoEl && videoEl.src) {
    data.videoUrl = videoEl.src;
  }
  
  if (!data.videoUrl) {
    try {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent || '';
        const videoMatch = text.match(/"url":\\s*"(https?:\\/\\/[^"]+\\.(mp4|mov))"/i);
        if (videoMatch) {
          data.videoUrl = videoMatch[1].replace(/\\\\/g, '');
          break;
        }
        const streamMatch = text.match(/"streamUrl":\\s*"([^"]+)"/);
        if (streamMatch) {
          data.videoUrl = streamMatch[1].replace(/\\\\/g, '');
          break;
        }
      }
    } catch (e) {}
  }
  
  return data;
})()
`;

interface XHSNoteData {
  title: string;
  content: string;
  likes: string;
  collects: string;
  comments: string;
  author: string;
  coverUrl: string;
  videoUrl: string;
  imageUrls: string[];
  url: string;
}

function resolveDataDir(): string {
  return process.env.XHS_DATA_DIR || path.join(os.homedir(), "Desktop", "xhs-topic-tracker");
}

async function getDefaultOutputPath(): Promise<string> {
  const dataDir = resolveDataDir();
  const date = new Date();
  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return path.join(dataDir, `xhs-topics-${yearMonth}.md`);
}

async function ensureDocumentHeader(filePath: string): Promise<void> {
  if (!(await fileExists(filePath))) {
    const header = `# 小红书爆款选题文档

> 自动收集的小红书热门笔记数据
> 收集时间: ${new Date().toLocaleString("zh-CN")}

| 序号 | 标题 | 作者 | 点赞 | 收藏 | 评论 | 原文 | 图片 |
|------|------|------|------|------|------|------|------|
`;
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, header, "utf-8");
  }
}

async function getNextSerialNumber(filePath: string): Promise<number> {
  if (!(await fileExists(filePath))) return 1;
  
  const content = await readFile(filePath, "utf-8");
  const matches = content.match(/^\| (\d+) \|/gm);
  if (!matches || matches.length === 0) return 1;
  
  const numbers = matches.map(m => parseInt(m.match(/\d+/)?.[0] || "0"));
  return Math.max(...numbers) + 1;
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^\w\u4e00-\u9fa5]/g, '_')
    .slice(0, 40)
    || 'untitled';
}

function truncateContent(content: string, maxLength: number = 80): string {
  if (!content) return '';
  // Remove newlines for table display
  const singleLine = content.replace(/\n/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.slice(0, maxLength) + '...';
}

async function captureXHSNote(args: Args): Promise<XHSNoteData> {
  const port = await getFreePort();
  const chrome = await launchChrome(args.url, port, false);

  let cdp: CdpConnection | null = null;
  try {
    const wsUrl = await waitForChromeDebugPort(port, 30_000);
    cdp = await CdpConnection.connect(wsUrl, CDP_CONNECT_TIMEOUT_MS);

    const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; type: string; url: string }> }>("Target.getTargets");
    const pageTarget = targets.targetInfos.find(t => t.type === "page" && t.url.startsWith("http"));
    if (!pageTarget) throw new Error("No page target found");

    const { sessionId } = await cdp.send<{ sessionId: string }>("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });
    await cdp.send("Network.enable", {}, { sessionId });
    await cdp.send("Page.enable", {}, { sessionId });

    console.log("等待页面加载...");
    await Promise.race([
      waitForPageLoad(cdp, sessionId, 15_000),
      sleep(8_000)
    ]);
    await waitForNetworkIdle(cdp, sessionId, 2_000);
    
    if (args.waitLogin) {
      await sleep(2_000);
      await waitForUserSignal("\n═══════════════════════════════════════════\n📱 请在浏览器中完成登录\n═══════════════════════════════════════════\n\n登录完成后，按 Enter 键继续...");
      await cdp.send("Page.reload", {}, { sessionId });
      await sleep(5_000);
      await waitForNetworkIdle(cdp, sessionId, 2_000);
    } else {
      await sleep(5_000);
    }

    console.log("提取笔记数据...");
    const data = await evaluateScript<XHSNoteData>(cdp, sessionId, extractXHSDataScript, args.timeout);
    
    if (!data.url || data.url === "about:blank") {
      data.url = args.url;
    }
    
    return data;
  } finally {
    if (cdp) {
      try { await cdp.send("Browser.close", {}, { timeoutMs: 5_000 }); } catch {}
      cdp.close();
    }
    killChrome(chrome);
  }
}

function formatTableRow(serial: number, data: XHSNoteData, detailPath: string): string {
  const title = data.title || "(未获取到标题)";
  const author = data.author || "-";
  const likes = data.likes || "-";
  const collects = data.collects || "-";
  const comments = data.comments || "-";
  const content = truncateContent(data.content, 50);
  const imgCount = data.imageUrls.length;
  
  const displayTitle = title.length > 30 ? title.slice(0, 27) + "..." : title;
  
  return `| ${serial} | ${displayTitle} | ${author} | ${likes} | ${collects} | ${comments} | ${content} | [${imgCount}张](${detailPath}) |\n`;
}

function formatNoteDetail(data: XHSNoteData, imageDir: string): string {
  const title = data.title || '未命名';
  let detail = `# ${title}\n\n`;
  
  // Metadata
  detail += `**作者:** ${data.author || '-'}  \n`;
  detail += `**点赞:** ${data.likes || '-'} | **收藏:** ${data.collects || '-'} | **评论:** ${data.comments || '-'}  \n`;
  detail += `**原文:** [点击查看](${data.url})\n\n`;
  
  // Content
  if (data.content) {
    detail += `## 正文\n\n${data.content}\n\n`;
  }
  
  // Images
  if (data.imageUrls.length > 0) {
    detail += `## 图片 (${data.imageUrls.length}张)\n\n`;
    data.imageUrls.forEach((url, idx) => {
      const filename = `img-${String(idx + 1).padStart(2, '0')}.jpg`;
      detail += `![图片${idx + 1}](${filename})\n\n`;
    });
  }
  
  return detail;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error("用法: bun main.ts <小红书链接> [选项]");
    console.error("");
    console.error("选项:");
    console.error("  -o, --output <path>  指定输出文件路径");
    console.error("  -n, --new            创建新文件");
    console.error("  -l, --login          等待扫码登录模式");
    console.error("  -c, --cover          下载封面图片");
    console.error("  -i, --images         下载所有图片");
    console.error("  -v, --video          下载视频");
    console.error("  -t, --timeout <ms>   超时时间");
    process.exit(1);
  }

  console.log(`正在获取: ${args.url}`);

  const data = await captureXHSNote(args);
  const dataDir = resolveDataDir();
  const outputPath = args.output || await getDefaultOutputPath();
  
  // Create note-specific directory
  const safeTitle = sanitizeFilename(data.title);
  const noteDirName = `${safeTitle}-${Date.now()}`;
  const noteDir = path.join(dataDir, 'notes', noteDirName);
  const detailPath = path.relative(path.dirname(outputPath), noteDir);

  if (!args.append) {
    const header = `# 小红书爆款选题文档

> 自动收集的小红书热门笔记数据
> 收集时间: ${new Date().toLocaleString("zh-CN")}

| 序号 | 标题 | 作者 | 点赞 | 收藏 | 评论 | 正文预览 | 图片 |
|------|------|------|------|------|------|----------|------|
`;
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, header, "utf-8");
  } else {
    await ensureDocumentHeader(outputPath);
  }

  const serial = await getNextSerialNumber(outputPath);
  const row = formatTableRow(serial, data, detailPath);
  await writeFile(outputPath, row, { flag: "a" });
  
  // Save note detail
  const noteDetail = formatNoteDetail(data, noteDir);
  const detailFilePath = path.join(noteDir, 'README.md');
  await mkdir(noteDir, { recursive: true });
  await writeFile(detailFilePath, noteDetail, "utf-8");

  console.log("✅ 数据已保存");
  console.log(`   标题: ${data.title || "(未获取)"}`);
  console.log(`   作者: ${data.author || "-"}`);
  console.log(`   点赞: ${data.likes || "-"}`);
  console.log(`   收藏: ${data.collects || "-"}`);
  console.log(`   评论: ${data.comments || "-"}`);
  console.log(`   正文: ${truncateContent(data.content, 40)}`);
  console.log(`   图片: ${data.imageUrls.length}张`);
  
  // Download cover
  if (args.downloadCover && data.coverUrl) {
    const coversDir = path.join(dataDir, 'covers');
    const ext = path.extname(new URL(data.coverUrl).pathname).split('!')[0] || '.jpg';
    const filename = `${safeTitle}-${Date.now()}${ext}`;
    const coverPath = path.join(coversDir, filename);
    
    console.log("📥 正在下载封面...");
    const success = await downloadFile(data.coverUrl, coverPath);
    if (success) console.log(`   ✅ 封面已保存`);
  }
  
  // Download all images
  if (args.downloadImages && data.imageUrls.length > 0) {
    console.log(`📥 正在下载 ${data.imageUrls.length} 张图片...`);
    
    let successCount = 0;
    for (let i = 0; i < data.imageUrls.length; i++) {
      const url = data.imageUrls[i];
      const filename = `img-${String(i + 1).padStart(2, '0')}.jpg`;
      const imgPath = path.join(noteDir, filename);
      
      process.stdout.write(`   图片 ${i + 1}/${data.imageUrls.length}... `);
      const success = await downloadFile(url, imgPath);
      if (success) successCount++;
      console.log(success ? '✅' : '❌');
    }
    
    console.log(`   ✅ 共下载 ${successCount}/${data.imageUrls.length} 张图片`);
  }
  
  // Download video
  if (args.downloadVideo) {
    if (data.videoUrl) {
      const videosDir = path.join(dataDir, 'videos');
      const filename = `${safeTitle}-${Date.now()}.mp4`;
      const videoPath = path.join(videosDir, filename);
      
      console.log("📥 正在下载视频...");
      const success = await downloadFile(data.videoUrl, videoPath);
      if (success) console.log(`   ✅ 视频已保存`);
    } else {
      console.log(`   ℹ️ 该笔记没有视频`);
    }
  }
  
  console.log(`   📁 主文档: ${outputPath}`);
  console.log(`   📄 详情页: ${path.join(noteDir, 'README.md')}`);
}

main().catch((err) => {
  console.error("错误:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
