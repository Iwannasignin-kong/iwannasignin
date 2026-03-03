/**
 * Canva 集成测试 - 使用第 1 张图片
 * 演示如何将 JSON 元数据应用到 Canva 设计中
 */

// ============================================================================
// 测试数据 - 从生成的 JSON 读取
// ============================================================================

const testData = {
  "image": "01-cover-v2.png",
  "position": "cover",
  "layout": "sparse",
  "visual_notes": "冬日寒风背景，干裂的脸部特写（插画风格），温暖的色彩点缀给人希望感，中心留出大标题空间。冷色蓝与暖色桃粉渐变对比。",
  "text_elements": [
    {
      "id": "title",
      "content": "入冬后脸干裂了",
      "type": "heading",
      "position": {"x": "50%", "y": "32%", "align": "center"},
      "style": {
        "font_size": "xlarge",
        "font_weight": "bold",
        "color": "#8B4513",
        "background": "highlight",
        "decoration": "brackets"
      }
    },
    {
      "id": "subtitle",
      "content": "试了5款面霜终于救回来了",
      "type": "subheading",
      "position": {"x": "50%", "y": "50%", "align": "center"},
      "style": {
        "font_size": "large",
        "font_weight": "normal",
        "color": "#A0522D",
        "background": "none",
        "decoration": "underline"
      }
    },
    {
      "id": "tagline",
      "content": "真实测评",
      "type": "label",
      "position": {"x": "50%", "y": "62%", "align": "center"},
      "style": {
        "font_size": "small",
        "font_weight": "normal",
        "color": "#CD853F",
        "background": "solid",
        "decoration": "rounded"
      }
    }
  ]
};

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  designWidth: 1080,
  designHeight: 1440,
  fontSizeMap: {
    'xlarge': 56,
    'large': 42,
    'medium': 32,
    'small': 24
  },
  colorMap: {
    '#8B4513': '#8B4513',  // saddlebrown
    '#A0522D': '#A0522D',  // sienna
    '#CD853F': '#CD853F'   // peru
  }
};

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 将 JSON 元数据转换为 Canva API 格式
 */
function convertToCanvaFormat(metadata, config) {
  const elements = [];

  for (const item of metadata.text_elements) {
    const canvaElement = convertTextElement(item, config);
    elements.push(canvaElement);
  }

  return {
    design: {
      width: config.designWidth,
      height: config.designHeight,
      background: {
        type: 'image',
        src: `./${metadata.image}`
      }
    },
    elements: elements
  };
}

/**
 * 转换单个文字元素
 */
function convertTextElement(element, config) {
  const position = calculateAbsolutePosition(element.position, config);
  const style = parseStyle(element.style, element.type, config);

  return {
    type: 'text',
    id: element.id,
    content: element.content,
    ...position,
    ...style
  };
}

/**
 * 计算绝对位置（百分比 → 像素）
 */
function calculateAbsolutePosition(position, config) {
  const x = Math.round((parseFloat(position.x) / 100) * config.designWidth);
  const y = Math.round((parseFloat(position.y) / 100) * config.designHeight);

  let anchor = 'center';
  if (position.align === 'left') anchor = 'start';
  if (position.align === 'right') anchor = 'end';

  return {
    x: x,
    y: y,
    textAlign: position.align,
    anchor: anchor
  };
}

/**
 * 解析样式配置
 */
function parseStyle(style, type, config) {
  const canvaStyle = {
    fontSize: config.fontSizeMap[style.font_size] || 32,
    fontWeight: style.font_weight === 'bold' ? 'bold' : 'normal',
    color: config.colorMap[style.color] || style.color,
    fontFamily: 'Noto Sans SC'
  };

  // 应用装饰
  applyDecoration(canvaStyle, style);

  // 应用背景
  applyBackground(canvaStyle, style);

  return canvaStyle;
}

/**
 * 应用装饰效果
 */
function applyDecoration(canvaStyle, style) {
  switch (style.decoration) {
    case 'brackets':
      canvaStyle.prefix = '【';
      canvaStyle.suffix = '】';
      break;
    case 'underline':
      canvaStyle.textDecoration = 'underline';
      break;
  }
}

/**
 * 应用背景效果
 */
function applyBackground(canvaStyle, style) {
  if (style.background === 'highlight') {
    canvaStyle.backgroundColor = '#F9E79F';
    canvaStyle.padding = { horizontal: 12, vertical: 6 };
  } else if (style.background === 'solid') {
    canvaStyle.backgroundColor = style.color;
    canvaStyle.color = '#FFFFFF';
    canvaStyle.padding = { horizontal: 16, vertical: 8 };
    canvaStyle.borderRadius = 8;
  }
}

// ============================================================================
// 测试执行
// ============================================================================

console.log('='.repeat(60));
console.log('Canva 集成测试 - 第 1 张图片');
console.log('='.repeat(60));

// 转换为 Canva 格式
const canvaData = convertToCanvaFormat(testData, CONFIG);

console.log('\n📋 输入数据（JSON 元数据）：');
console.log(JSON.stringify(testData, null, 2));

console.log('\n🎨 输出数据（Canva API 格式）：');
console.log(JSON.stringify(canvaData, null, 2));

console.log('\n📝 文字元素详情：');
canvaData.elements.forEach((el, index) => {
  console.log(`\n[${index + 1}] ${el.id}`);
  console.log(`    内容: ${el.prefix || ''}${el.content}${el.suffix || ''}`);
  console.log(`    位置: (${el.x}, ${el.y})`);
  console.log(`    字号: ${el.fontSize}px`);
  console.log(`    颜色: ${el.color}`);
  if (el.backgroundColor) {
    console.log(`    背景: ${el.backgroundColor}`);
  }
});

// ============================================================================
// 模拟 Canva API 调用
// ============================================================================

console.log('\n🔄 模拟 Canva API 调用流程：');
console.log('\n1. 上传背景图片');
console.log(`   POST /v1/images`);
console.log(`   file: ${testData.image}`);

console.log('\n2. 创建新设计');
console.log(`   POST /v1/designs`);
console.log(`   body: { width: ${CONFIG.designWidth}, height: ${CONFIG.designHeight} }`);

console.log('\n3. 添加背景图片到设计');
console.log(`   POST /v1/designs/{designId}/elements`);
console.log(`   body: { type: "image", mediaId: "...", x: 0, y: 0 }`);

canvaData.elements.forEach((el, index) => {
  console.log(`\n${4 + index}. 添加文字元素: ${el.id}`);
  console.log(`   POST /v1/designs/{designId}/elements`);
  console.log(`   body: {`);
  console.log(`     type: "text",`);
  console.log(`     content: "${el.prefix || ''}${el.content}${el.suffix || ''}",`);
  console.log(`     x: ${el.x},`);
  console.log(`     y: ${el.y},`);
  console.log(`     fontSize: ${el.fontSize},`);
  console.log(`     fontWeight: "${el.fontWeight}",`);
  console.log(`     color: "${el.color}",`);
  console.log(`     fontFamily: "${el.fontFamily}",`);
  console.log(`     textAlign: "${el.textAlign}"`);
  if (el.backgroundColor) {
    console.log(`     backgroundColor: "${el.backgroundColor}",`);
    console.log(`     padding: ${JSON.stringify(el.padding)},`);
    console.log(`     borderRadius: ${el.borderRadius}`);
  }
  console.log(`   }`);
});

console.log('\n✅ 测试完成！');
console.log('\n💡 下一步：');
console.log('   1. 使用真实的 Canva API Token');
console.log('   2. 上传图片到 Canva');
console.log('   3. 调用 Canva API 添加文字元素');
console.log('   4. 导出最终设计');

// 导出测试数据
module.exports = {
  testData,
  canvaData,
  convertToCanvaFormat,
  CONFIG
};
