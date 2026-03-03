"""
Canva API 真实调用示例 (Python)

使用方法：
1. 设置环境变量: export CANVA_API_TOKEN=your_token_here
2. 运行: python canva-api-real.py
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
import requests

# ============================================================================
# 配置
# ============================================================================

class Config:
    api_base_url = "https://api.canva.com/v1"
    api_token = os.getenv("CANVA_API_TOKEN", "YOUR_CANVA_API_TOKEN_HERE")
    design_width = 1080
    design_height = 1440
    font_size_map = {
        'xlarge': 56,
        'large': 42,
        'medium': 32,
        'small': 24
    }

# ============================================================================
# Canva API 客户端
# ============================================================================

class CanvaApiClient:
    def __init__(self, config: Config):
        self.config = config
        self.headers = {
            "Authorization": f"Bearer {config.api_token}",
            "Content-Type": "application/json"
        }

    def _request(self, endpoint: str, method: str = "GET", body: Optional[Dict] = None) -> Dict:
        """通用 API 请求方法"""
        url = f"{self.config.api_base_url}{endpoint}"

        try:
            if method == "GET":
                response = requests.get(url, headers=self.headers)
            elif method == "POST":
                response = requests.post(url, headers=self.headers, json=body)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            print(f"❌ 请求失败: {endpoint}")
            print(f"   错误: {e}")
            raise

    def upload_image(self, image_path: str) -> Dict:
        """上传图片"""
        print(f"\n📤 上传图片: {image_path}")

        # 注意：实际实现需要处理文件上传
        # 这里返回模拟数据
        return {
            "id": f"media_{int(time.time())}",
            "url": f"file://{image_path}"
        }

    def create_design(self, width: int, height: int) -> Dict:
        """创建新设计"""
        print(f"\n🎨 创建新设计: {width}x{height}")

        response = self._request("/designs", "POST", {
            "type": "custom",
            "width": width,
            "height": height
        })

        print(f"   ✅ 设计创建成功: {response['id']}")
        return response

    def add_image_to_design(self, design_id: str, media_id: str,
                           x: int = 0, y: int = 0,
                           width: Optional[int] = None,
                           height: Optional[int] = None) -> Dict:
        """添加图片到设计"""
        print(f"\n🖼️  添加图片到设计")

        body = {
            "type": "image",
            "mediaId": media_id,
            "x": x,
            "y": y
        }

        if width:
            body["width"] = width
        if height:
            body["height"] = height

        response = self._request(f"/designs/{design_id}/elements", "POST", body)
        print(f"   ✅ 图片添加成功")
        return response

    def add_text(self, design_id: str, text_data: Dict) -> Dict:
        """添加文字到设计"""
        content = f"{text_data.get('prefix', '')}{text_data['content']}{text_data.get('suffix', '')}"
        print(f"\n📝 添加文字: \"{content}\"")

        # 构建元素数据
        element = {
            "type": "text",
            "content": content,
            "x": text_data["x"],
            "y": text_data["y"],
            "fontSize": text_data["fontSize"],
            "fontWeight": text_data["fontWeight"],
            "color": text_data["color"],
            "fontFamily": text_data["fontFamily"],
            "textAlign": text_data["textAlign"]
        }

        # 可选属性
        if "backgroundColor" in text_data:
            element["backgroundColor"] = text_data["backgroundColor"]
        if "padding" in text_data:
            element["padding"] = text_data["padding"]
        if "borderRadius" in text_data:
            element["borderRadius"] = text_data["borderRadius"]
        if "textDecoration" in text_data:
            element["textDecoration"] = text_data["textDecoration"]

        response = self._request(f"/designs/{design_id}/elements", "POST", element)
        print(f"   ✅ 文字添加成功")
        return response

    def export_design(self, design_id: str, format: str = "PNG") -> Dict:
        """导出设计"""
        print(f"\n💾 导出设计: {format}")

        response = self._request(f"/designs/{design_id}/export", "POST", {
            "format": format
        })

        print(f"   ✅ 导出任务创建")
        return response

# ============================================================================
# 辅助函数
# ============================================================================

import time

def convert_text_element(element: Dict, config: Config) -> Dict:
    """转换文字元素"""
    x = int(float(element["position"]["x"]) / 100 * config.design_width)
    y = int(float(element["position"]["y"]) / 100 * config.design_height)

    style = {
        "x": x,
        "y": y,
        "content": element["content"],
        "fontSize": config.font_size_map.get(element["style"]["font_size"], 32),
        "fontWeight": "bold" if element["style"]["font_weight"] == "bold" else "normal",
        "color": element["style"]["color"],
        "fontFamily": "Noto Sans SC",
        "textAlign": element["position"]["align"]
    }

    # 应用装饰
    decoration = element["style"].get("decoration")
    if decoration == "brackets":
        style["prefix"] = "【"
        style["suffix"] = "】"
    elif decoration == "underline":
        style["textDecoration"] = "underline"

    # 应用背景
    background = element["style"].get("background")
    if background == "highlight":
        style["backgroundColor"] = "#F9E79F"
        style["padding"] = {"horizontal": 12, "vertical": 6}
    elif background == "solid":
        style["backgroundColor"] = element["style"]["color"]
        style["color"] = "#FFFFFF"
        style["padding"] = {"horizontal": 16, "vertical": 8}
        style["borderRadius"] = 8

    return style

# ============================================================================
# 主流程
# ============================================================================

def main():
    print("=" * 60)
    print("Canva API 集成 - 真实调用示例 (Python)")
    print("=" * 60)

    config = Config()

    # 检查 API Token
    if config.api_token == "YOUR_CANVA_API_TOKEN_HERE":
        print("\n❌ 错误: 请设置 CANVA_API_TOKEN 环境变量")
        print("\n使用方法:")
        print("  export CANVA_API_TOKEN=your_token_here")
        print("  python canva-api-real.py")
        print("\n或者在 .env 文件中设置:")
        print("  CANVA_API_TOKEN=your_token_here\n")
        return

    try:
        client = CanvaApiClient(config)

        # 1. 读取 JSON 元数据
        base_dir = Path(__file__).parent
        json_path = base_dir / "01-cover-dry-skin-problem.json"

        with open(json_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)

        print("\n📋 已加载元数据: 01-cover-dry-skin-problem.json")

        # 2. 上传背景图片
        image_path = base_dir / "01-cover-v2.png"
        media = client.upload_image(str(image_path))

        # 3. 创建新设计
        design = client.create_design(config.design_width, config.design_height)

        # 4. 添加背景图片
        client.add_image_to_design(
            design["id"],
            media["id"],
            x=0, y=0,
            width=config.design_width,
            height=config.design_height
        )

        # 5. 添加所有文字元素
        for element in metadata["text_elements"]:
            text_data = convert_text_element(element, config)
            client.add_text(design["id"], text_data)

        # 6. 导出设计
        export_result = client.export_design(design["id"])

        print("\n✅ 完成！")
        print(f"\n📦 导出链接: {export_result.get('exportUrl', 'N/A')}")
        print("\n💡 提示: 保存此链接以下载最终设计")

    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        print("\n请检查:")
        print("  1. API Token 是否正确")
        print("  2. 网络连接是否正常")
        print("  3. 文件路径是否正确")
        print("  4. Canva API 访问权限是否正确")

if __name__ == "__main__":
    main()
