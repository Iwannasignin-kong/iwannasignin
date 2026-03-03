/**
 * Canva API 真实调用示例
 *
 * 使用方法：
 * 1. 设置 CANVA_API_TOKEN 环境变量
 * 2. 运行: node canva-api-real.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  apiBaseUrl: 'https://api.canva.com/v1',
  apiToken: process.env.CANVA_API_TOKEN || 'YOUR_CANVA_API_TOKEN_HERE',
  designWidth: 1080,
  designHeight: 1440,
  fontSizeMap: {
    'xlarge': 56,
    'large': 42,
    'medium': 32,
    'small': 24
  }
};

/**
 * Canva API 客户端
 */
class CanvaApiClient {
  constructor(baseUrl, apiToken) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 通用 API 请求方法
   */
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API Error: ${data.message || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`Request failed: ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * 上传图片
   */
  async uploadImage(imagePath) {
    console.log(`\n📤 上传图片: ${imagePath}`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const headers = {
      'Authorization': `Bearer ${this.apiToken}`
    };

    // 注意：需要使用 multipart/form-data
    // 这里简化处理，实际需要使用合适的 HTTP 库
    console.log('   POST /v1/media');
    console.log('   注意：实际实现需要处理文件上传');

    // 返回模拟的 media ID
    return {
      id: 'media_' + Date.now(),
      url: `file://${imagePath}`
    };
  }

  /**
   * 创建新设计
   */
  async createDesign(width, height) {
    console.log(`\n🎨 创建新设计: ${width}x${height}`);

    const response = await this.request('/designs', 'POST', {
      type: 'custom',
      width,
      height
    });

    console.log(`   ✅ 设计创建成功: ${response.id}`);
    return response;
  }

  /**
   * 添加图片到设计
   */
  async addImageToDesign(designId, mediaId, x = 0, y = 0, width, height) {
    console.log(`\n🖼️  添加图片到设计`);

    const response = await this.request(`/designs/${designId}/elements`, 'POST', {
      type: 'image',
      mediaId,
      x,
      y,
      width,
      height
    });

    console.log(`   ✅ 图片添加成功`);
    return response;
  }

  /**
   * 添加文字到设计
   */
  async addText(designId, textData) {
    console.log(`\n📝 添加文字: "${textData.prefix || ''}${textData.content}${textData.suffix || ''}"`);

    const element = {
      type: 'text',
      content: (textData.prefix || '') + textData.content + (textData.suffix || ''),
      x: textData.x,
      y: textData.y,
      fontSize: textData.fontSize,
      fontWeight: textData.fontWeight,
      color: textData.color,
      fontFamily: textData.fontFamily,
      textAlign: textData.textAlign
    };

    // 可选属性
    if (textData.backgroundColor) {
      element.backgroundColor = textData.backgroundColor;
    }
    if (textData.padding) {
      element.padding = textData.padding;
    }
    if (textData.borderRadius) {
      element.borderRadius = textData.borderRadius;
    }
    if (textData.textDecoration) {
      element.textDecoration = textData.textDecoration;
    }

    const response = await this.request(`/designs/${designId}/elements`, 'POST', element);

    console.log(`   ✅ 文字添加成功`);
    return response;
  }

  /**
   * 导出设计
   */
  async exportDesign(designId, format = 'PNG') {
    console.log(`\n💾 导出设计: ${format}`);

    const response = await this.request(`/designs/${designId}/export`, 'POST', {
      format
    });

    console.log(`   ✅ 导出任务创建: ${response.exportUrl}`);
    return response;
  }
}

/**
 * 主流程
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Canva API 集成 - 真实调用示例');
  console.log('='.repeat(60));

  // 检查 API Token
  if (CONFIG.apiToken === 'YOUR_CANVA_API_TOKEN_HERE') {
    console.error('\n❌ 错误: 请设置 CANVA_API_TOKEN 环境变量');
    console.log('\n使用方法:');
    console.log('  CANVA_API_TOKEN=your_token_here node canva-api-real.js');
    console.log('\n或者设置 .env 文件:');
    console.log('  CANVA_API_TOKEN=your_token_here\n');
    return;
  }

  try {
    const client = new CanvaApiClient(CONFIG.apiBaseUrl, CONFIG.apiToken);

    // 1. 读取 JSON 元数据
    const jsonPath = path.join(__dirname, '01-cover-dry-skin-problem.json');
    const metadata = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('\n📋 已加载元数据: 01-cover-dry-skin-problem.json');

    // 2. 上传背景图片
    const imagePath = path.join(__dirname, '01-cover-v2.png');
    const media = await client.uploadImage(imagePath);

    // 3. 创建新设计
    const design = await client.createDesign(CONFIG.designWidth, CONFIG.designHeight);

    // 4. 添加背景图片
    await client.addImageToDesign(
      design.id,
      media.id,
      0, 0,
      CONFIG.designWidth,
      CONFIG.designHeight
    );

    // 5. 添加所有文字元素
    for (const element of metadata.text_elements) {
      const textData = convertTextElement(element, CONFIG);
      await client.addText(design.id, textData);
    }

    // 6. 导出设计
    const exportResult = await client.exportDesign(design.id);

    console.log('\n✅ 完成！');
    console.log(`\n📦 导出链接: ${exportResult.exportUrl}`);
    console.log('\n💡 提示: 保存此链接以下载最终设计');

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    console.error('\n请检查:');
    console.log('  1. API Token 是否正确');
    console.log('  2. 网络连接是否正常');
    console.log('  3. 文件路径是否正确');
  }
}

/**
 * 转换文字元素（与测试脚本相同的逻辑）
 */
function convertTextElement(element, config) {
  const x = Math.round((parseFloat(element.position.x) / 100) * config.designWidth);
  const y = Math.round((parseFloat(element.position.y) / 100) * config.designHeight);

  const style = {
    x,
    y,
    content: element.content,
    fontSize: config.fontSizeMap[element.style.font_size] || 32,
    fontWeight: element.style.font_weight === 'bold' ? 'bold' : 'normal',
    color: element.style.color,
    fontFamily: 'Noto Sans SC',
    textAlign: element.position.align
  };

  // 应用装饰
  if (element.style.decoration === 'brackets') {
    style.prefix = '【';
    style.suffix = '】';
  } else if (element.style.decoration === 'underline') {
    style.textDecoration = 'underline';
  }

  // 应用背景
  if (element.style.background === 'highlight') {
    style.backgroundColor = '#F9E79F';
    style.padding = { horizontal: 12, vertical: 6 };
  } else if (element.style.background === 'solid') {
    style.backgroundColor = element.style.color;
    style.color = '#FFFFFF';
    style.padding = { horizontal: 16, vertical: 8 };
    style.borderRadius = 8;
  }

  return style;
}

// 运行主流程
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CanvaApiClient, convertTextElement, CONFIG };
