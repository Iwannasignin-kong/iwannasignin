#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
小红书养生笔记一键生成器
Author: Uncle-L
Description: 随机碰撞10组养生功效×10组食物分类，批量生成养生图文笔记
"""

import json
import os
import random
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("请先安装 requests: pip install requests")
    sys.exit(1)


# ==================== 配置区域 ====================

# 10组养生功效种子
WELLNESS_EFFECTS = [
    "补气养血",
    "美容养颜",
    "调理脾胃",
    "清热解毒",
    "润肺止咳",
    "安神助眠",
    "降脂减肥",
    "增强免疫",
    "补肾壮阳",
    "疏肝理气"
]

# 10组食物分类种子
FOOD_CATEGORIES = [
    "滋补汤品",
    "养生茶饮",
    "药膳粥品",
    "中式甜品",
    "时令蔬果",
    "养生药膳",
    "坚果零食",
    "五谷杂粮",
    "中药调理",
    "传统糕点"
]


# ==================== 配置加载 ====================

def load_config():
    """加载配置文件"""
    config_path = Path(__file__).parent / "config.json"

    if not config_path.exists():
        print(f"❌ 配置文件不存在: {config_path}")
        print(f"📝 请复制 config.json.example 为 config.json 并填写API密钥")
        sys.exit(1)

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    # 验证必需配置
    required_keys = ["gemini_api_key", "volcano_api_key", "volcano_endpoint"]
    for key in required_keys:
        if not config.get(key) or config[key].startswith("your-"):
            print(f"❌ 配置不完整: {key} 未设置")
            sys.exit(1)

    return config


# ==================== 随机选题生成 ====================

def generate_combinations(count=10):
    """随机生成养生功效×食物分类的组合"""
    combinations = []

    for _ in range(count):
        effect = random.choice(WELLNESS_EFFECTS)
        category = random.choice(FOOD_CATEGORIES)
        combinations.append((effect, category))

    return combinations


# ==================== AI调用 ====================

def call_gemini(api_key, effect, category):
    """调用Gemini生成笔记内容"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"

    prompt = f"""你是一位专业的小红书养生博主，请根据以下信息创作一篇吸引人的小红书笔记：

【养生功效】: {effect}
【食物分类】: {category}

请生成以下内容，以JSON格式返回：
{{
  "title": "吸引人的标题，包含emoji，20字以内",
  "content": "正文内容，分段落，包含emoji，100-200字，语气亲切自然",
  "tags": ["标签1", "标签2", "标签3"],
  "image_prompt": "用于生成封面图的详细提示词"
}}

要求：
1. 标题要抓眼球，体现功效特色
2. 正文要实用，包含简单做法或功效说明
3. 语气要像朋友分享，不要太官方
4. 合理使用emoji增加可读性

请只返回JSON，不要其他内容。"""

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.8,
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        content = result["candidates"][0]["content"]["parts"][0]["text"]

        # 尝试解析JSON
        # 去除可能的markdown代码块标记
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return json.loads(content)

    except Exception as e:
        print(f"❌ Gemini调用失败: {e}")
        return None


def call_volcano_image(api_key, endpoint, prompt, image_type="cover"):
    """调用火山引擎生成图片"""
    url = f"https://ark.cn-beijing.volces.com/api/v3/chat/completions"

    image_prompt = f"""小红书养生美食图片：{prompt}

风格要求：
- 温暖自然的光线
- 中式养生美学风格
- 高清美食摄影
- 色彩温暖柔和
- {'适合做封面，构图居中' if image_type == 'cover' else '展示细节，适合配图'}

请直接生成图片，不要文字描述。"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": endpoint,
        "messages": [{"role": "user", "content": image_prompt}],
        "stream": False
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()

        # 提取图片URL
        if "choices" in result and len(result["choices"]) > 0:
            message = result["choices"][0].get("message", {})
            content = message.get("content", "")

            # 如果返回的是图片URL
            if content and content.startswith("http"):
                return content

            # 如果返回的是包含图片URL的JSON
            if isinstance(content, str):
                try:
                    data = json.loads(content)
                    if "url" in data:
                        return data["url"]
                except:
                    pass

        print(f"⚠️ 无法从响应中提取图片URL")
        return None

    except Exception as e:
        print(f"❌ 火山引擎图片生成失败: {e}")
        return None


# ==================== 主函数 ====================

def generate_wellness_notes(count=10):
    """生成养生笔记主函数"""
    config = load_config()

    print(f"\n🌿 开始生成 {count} 组养生笔记...\n")

    # 生成随机组合
    combinations = generate_combinations(count)

    output_dir = Path(__file__).parent / "output" / datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir.mkdir(parents=True, exist_ok=True)

    results = []

    for idx, (effect, category) in enumerate(combinations, 1):
        print(f"📝 [{idx}/{count}] 生成: {effect} × {category}")

        # 调用Gemini生成内容
        note_content = call_gemini(config["gemini_api_key"], effect, category)

        if not note_content:
            print(f"⚠️ 跳过此条，生成下一条...")
            continue

        # 生成封面图
        print(f"   📸 生成封面图...")
        cover_image = call_volcano_image(
            config["volcano_api_key"],
            config["volcano_endpoint"],
            note_content.get("image_prompt", f"{effect}{category}美食"),
            "cover"
        )

        # 生成正文图
        print(f"   📸 生成正文图...")
        content_image = call_volcano_image(
            config["volcano_api_key"],
            config["volcano_endpoint"],
            f"{note_content.get('title', '')} 详细展示",
            "content"
        )

        # 组装结果
        note_result = {
            "combination": f"{effect} × {category}",
            "title": note_content.get("title", ""),
            "content": note_content.get("content", ""),
            "tags": note_content.get("tags", []),
            "cover_image": cover_image,
            "content_image": content_image
        }

        results.append(note_result)

        # 保存单条笔记
        note_file = output_dir / f"note_{idx:02d}.json"
        with open(note_file, "w", encoding="utf-8") as f:
            json.dump(note_result, f, ensure_ascii=False, indent=2)

        print(f"   ✅ 完成\n")

    # 保存汇总文件
    summary_file = output_dir / "_summary.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 全部完成！")
    print(f"📁 输出目录: {output_dir}")
    print(f"📊 共生成 {len(results)} 条笔记")

    return results


def main():
    """命令行入口"""
    import argparse

    parser = argparse.ArgumentParser(description="小红书养生笔记一键生成器")
    parser.add_argument("-n", "--count", type=int, default=10, help="生成的笔记数量")
    args = parser.parse_args()

    generate_wellness_notes(args.count)


if __name__ == "__main__":
    main()
