"""
小红书图片文字添加测试
使用 Pillow 在纯图上添加中文文字
"""

import json
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ============================================================================
# 配置
# ============================================================================

class Config:
    # 图片尺寸
    design_width = 1080
    design_height = 1440

    # 字号映射（放大 30%）
    font_size_map = {
        'xlarge': 73,   # 56 * 1.3
        'large': 55,    # 42 * 1.3
        'medium': 42,   # 32 * 1.3
        'small': 31     # 24 * 1.3
    }

    # 字体路径（可爱圆润风格优先）
    font_paths = [
        # 可爱圆润字体（Windows）
        'C:/Windows/Fonts/FZSTK.TTF',      # 方正舒体黑
        'C:/Windows/Fonts/SIMYOU.TTF',     # 幼圆
        'C:/Windows/Fonts/STHUPO.TTC',     # 华文琥珀
        'C:/Windows/Fonts/STXINGKA.TTC',   # 华文行楷
        'C:/Windows/Fonts/STCAIYUN.TTC',   # 华文彩云
        'C:/Windows/Fonts/FZSEJW.TTF',     # 方正少儿体
        'C:/Windows/Fonts/msyh.ttc',       # 微软雅黑（备选）
        'C:/Windows/Fonts/simhei.ttf',     # 黑体（备选）
        # Linux
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        # macOS
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
    ]

# ============================================================================
# 字体加载
# ============================================================================

def load_font(size):
    """加载中文字体"""
    for font_path in Config.font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except Exception as e:
                print(f"   无法加载字体 {font_path}: {e}")
                continue

    # 如果都失败了，使用默认字体
    print("   ⚠️ 使用默认字体（可能不支持中文）")
    return ImageFont.load_default()

def load_bold_font(size):
    """加载粗体中文字体"""
    for font_path in Config.font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except:
                continue
    return load_font(size)

# ============================================================================
# 文字元素处理
# ============================================================================

def calculate_text_position(element, config):
    """计算文字位置（百分比 → 像素）"""
    # 获取位置值（可能是字符串 "50%" 或数字 50）
    x_val = element['position']['x']
    y_val = element['position']['y']

    # 处理字符串格式 "50%"
    if isinstance(x_val, str):
        x_val = float(x_val.rstrip('%'))
    if isinstance(y_val, str):
        y_val = float(y_val.rstrip('%'))

    x = int(x_val / 100 * config.design_width)
    y = int(y_val / 100 * config.design_height)
    align = element['position'].get('align', 'left')

    return x, y, align

def parse_text_style(style, element_type, config):
    """解析文字样式"""
    # 获取字号
    font_size = config.font_size_map.get(style.get('font_size', 'medium'), 32)

    # 获取字体
    font_weight = style.get('font_weight', 'normal')
    if font_weight == 'bold':
        font = load_bold_font(font_size)
    else:
        font = load_font(font_size)

    # 获取颜色
    color = style.get('color', '#000000')

    # 获取装饰
    decoration = style.get('decoration', 'none')
    prefix = ''
    suffix = ''

    if decoration == 'brackets':
        prefix = '【'
        suffix = '】'
    elif decoration == 'star':
        prefix = '⭐ '

    # 获取背景
    background = style.get('background', 'none')

    return {
        'font': font,
        'color': color,
        'prefix': prefix,
        'suffix': suffix,
        'background': background,
        'font_size': font_size
    }

def draw_text_with_shadow(draw, x, y, text, font, color, anchor='mm',
                           shadow_offset=3, shadow_color='rgba(0,0,0,0.3)'):
    """绘制带阴影的文字（立体效果）"""

    # 获取文字尺寸
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 根据 anchor 计算阴影位置
    if anchor == 'mm':  # center-middle
        shadow_pos = (x + shadow_offset, y + shadow_offset)
        text_pos = (x, y)
    elif anchor == 'la':  # left-ascender
        shadow_pos = (x + shadow_offset, y + shadow_offset)
        text_pos = (x, y)
    else:  # right (ra)
        shadow_pos = (x + shadow_offset, y + shadow_offset)
        text_pos = (x, y)

    # 先绘制阴影（半透明黑色）
    try:
        # 创建半透明阴影（需要单独的图层）
        from PIL import ImageColor
        shadow_rgba = ImageColor.getrgb(shadow_color)
        draw.text(shadow_pos, text, fill=shadow_rgba[:3], font=font, anchor=anchor)
    except:
        # 如果半透明失败，使用灰色阴影
        draw.text(shadow_pos, text, fill='#CCCCCC', font=font, anchor=anchor)

    # 再绘制主文字
    draw.text(text_pos, text, fill=color, font=font, anchor=anchor)

def draw_text_with_background(draw, x, y, text, font, color, background, anchor='mm'):
    """绘制带背景的文字（可爱风格）"""

    # 获取文字尺寸
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 计算背景位置（增加内边距，更可爱）
    padding_x = 16
    padding_y = 10

    # 根据 anchor 计算背景位置
    if anchor == 'mm':  # center-middle
        bg_x1 = x - text_width // 2 - padding_x
        bg_y1 = y - text_height // 2 - padding_y
        bg_x2 = x + text_width // 2 + padding_x
        bg_y2 = y + text_height // 2 + padding_y
        text_pos = (x, y)
    elif anchor == 'la':  # left-ascender
        bg_x1 = x - padding_x
        bg_y1 = y - text_height // 2 - padding_y
        bg_x2 = x + text_width + padding_x
        bg_y2 = y + text_height // 2 + padding_y
        text_pos = (x, y)
    else:  # right (ra)
        bg_x1 = x - text_width - padding_x
        bg_y1 = y - text_height // 2 - padding_y
        bg_x2 = x + padding_x
        bg_y2 = y + text_height // 2 + padding_y
        text_pos = (x, y)

    # 绘制背景
    if background == 'highlight':
        # 可爱的高亮背景（更柔和的黄色）
        draw.rectangle([bg_x1, bg_y1, bg_x2, bg_y2],
                      fill='#FFF5D0', outline='#FFD966', width=2)
    elif background == 'solid':
        # 可爱的按钮样式（圆角效果用多个小矩形模拟）
        draw.rectangle([bg_x1, bg_y1, bg_x2, bg_y2],
                      fill=color, outline='white', width=2)
        # 实色背景时文字改为白色
        color = '#FFFFFF'

    # 绘制带阴影的文字
    draw_text_with_shadow(draw, text_pos[0], text_pos[1], text, font, color, anchor)

def add_text_element(draw, element, config):
    """添加单个文字元素（可爱风格）"""
    # 解析内容
    content = element['content']
    element_type = element['type']
    style = element['style']

    # 计算位置
    x, y, align = calculate_text_position(element, config)

    # 解析样式
    style_info = parse_text_style(style, element_type, config)

    # 添加可爱元素和装饰
    full_text = style_info['prefix'] + content + style_info['suffix']

    # 根据类型添加可爱的 emoji 前缀
    cute_emojis = {
        'heading': ['✨', '💕', '🌸', '⭐', '🎀'],
        'subheading': ['💗', '🌷', '💫', '🍭'],
        'bullet': ['💝', '🌈', '🎀', '✿'],
        'cta': ['👉', '💖', '✨', '🎁'],
        'label': ['⭐', '💕', '✿', '🌸']
    }

    # 为标题和标签添加可爱的 emoji
    import random
    if element_type in cute_emojis and random.random() > 0.5:
        emoji = random.choice(cute_emojis[element_type])
        full_text = emoji + ' ' + full_text

    # Pillow anchor 格式映射
    anchor_map = {
        'left': 'la',
        'center': 'mm',
        'right': 'ra'
    }
    pillow_anchor = anchor_map.get(align, 'mm')

    # 绘制
    if style_info['background'] != 'none':
        draw_text_with_background(
            draw, x, y, full_text,
            style_info['font'], style_info['color'],
            style_info['background'], pillow_anchor
        )
    else:
        # 无背景，但仍然添加阴影效果（立体感）
        draw_text_with_shadow(
            draw, x, y, full_text,
            style_info['font'], style_info['color'],
            pillow_anchor
        )

    print(f"   [OK] Added text: {full_text} at ({x}, {y})")

# ============================================================================
# 主流程
# ============================================================================

def main():
    import sys
    import io

    # 设置 stdout 为 UTF-8 编码
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

    print("=" * 60)
    print("XHS Image Text Overlay Test")
    print("=" * 60)

    # 获取当前目录
    base_dir = Path(__file__).parent

    # 读取 JSON 元数据
    json_path = base_dir / "01-cover-dry-skin-problem.json"
    print(f"\n[INFO] Reading metadata: {json_path.name}")

    with open(json_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    # 打开图片
    image_path = base_dir / "01-cover-v2.png"
    print(f"[INFO] Reading image: {image_path.name}")

    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)

    # 添加所有文字元素
    print(f"\n[INFO] Adding {len(metadata['text_elements'])} text elements:")

    for element in metadata['text_elements']:
        add_text_element(draw, element, Config())

    # 保存结果（可爱风格版本）
    output_path = base_dir / "01-cover-final-cute.png"
    img.save(output_path, 'PNG')

    print(f"\n[SUCCESS] Saved to: {output_path.name}")
    print(f"[INFO] Output path: {output_path}")
    print(f"\n[INFO] Style: Cute & Kawaii with shadow effects")
    print(f"[INFO] Font size: +30% enlarged")
    print(f"[INFO] Effects: Shadow, emoji decorations")

    # 显示图片信息
    print(f"\n[INFO] Image info:")
    print(f"   Size: {img.size[0]} x {img.size[1]}")
    print(f"   Format: {img.format}")
    print(f"   Mode: {img.mode}")

if __name__ == "__main__":
    main()
