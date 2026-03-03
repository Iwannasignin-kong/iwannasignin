#!/usr/bin/env python3
"""
Hotspot Radar - Multi-source hotspot aggregator with pluggable data sources.
Supports RSS/Atom feeds and Chinese social media platforms (Zhihu, Weibo, Baidu, Toutiao).
"""

import argparse
import dataclasses
import datetime as dt
import html
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional

# Try to import requests for better HTTP handling
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# Try to import playwright for browser automation
try:
    from playwright.sync_api import sync_playwright, Browser, Page
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False


# ==================== Constants ====================

DEFAULT_KEYWORDS = ["launch", "release", "agent", "model", "api", "benchmark", "paper"]

# Global flag to control fallback data usage
USE_FALLBACK_DATA = True


# ==================== DataSource Architecture ====================

@dataclasses.dataclass
class HotspotItem:
    """Unified hotspot item structure."""
    title: str
    link: str
    source: str
    score: float = 3.0
    extra: Dict[str, Any] = dataclasses.field(default_factory=dict)


class DataSource(ABC):
    """Abstract base class for all data sources."""

    source_type: str = "base"

    @abstractmethod
    def fetch(self, limit: int = 10) -> List[HotspotItem]:
        """Fetch hotspot items from this source."""
        pass

    @classmethod
    def from_config(cls, config: Dict[str, Any]) -> "DataSource":
        """Create instance from configuration dict."""
        return cls()


class RSSSource(DataSource):
    """RSS/Atom feed source."""

    source_type = "rss"

    def __init__(self, url: str):
        self.url = url

    def fetch(self, limit: int = 10) -> List[HotspotItem]:
        """Fetch items from RSS/Atom feed."""
        request = urllib.request.Request(
            self.url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        context = ssl.create_default_context()
        with urllib.request.urlopen(request, timeout=20, context=context) as resp:
            raw = resp.read()
        root = ET.fromstring(raw)

        items = []
        if root.tag.endswith("rss"):
            channel = root.find("channel")
            if channel is not None:
                for item in channel.findall("item")[:limit]:
                    title = self._text(item, "title")
                    link = self._text(item, "link")
                    if title and link:
                        items.append(HotspotItem(
                            title=title,
                            link=link,
                            source=self.url
                        ))
        else:
            # Atom feed
            ns = {"a": "http://www.w3.org/2005/Atom"}
            for entry in root.findall("a:entry", ns)[:limit]:
                title = self._text(entry, "a:title")
                link_node = entry.find("a:link", ns)
                link = ""
                if link_node is not None:
                    link = link_node.attrib.get("href", "").strip()
                if title and link:
                    items.append(HotspotItem(
                        title=title,
                        link=link,
                        source=self.url
                    ))
        return items

    @staticmethod
    def _text(node, path: str) -> str:
        child = node.find(path)
        return (child.text or "").strip() if child is not None else ""

    @classmethod
    def from_config(cls, config: Dict[str, Any]) -> "RSSSource":
        return cls(url=config["url"])


class DemoDataSource(DataSource):
    """Demo data source for testing multi-source aggregation."""

    source_type = "demo"

    def fetch(self, limit: int = 10) -> List[HotspotItem]:
        """Return demo hotspot items."""
        demo_data = [
            ("AI大模型在医疗领域取得重大突破", "https://example.com/ai-medical", 4.5),
            ("量子计算机实现新里程碑", "https://example.com/quantum", 4.2),
            ("新能源电池技术革新", "https://example.com/battery", 3.9),
            ("元宇宙社交平台用户破亿", "https://example.com/metaverse", 3.7),
            ("5G网络覆盖率达到新高度", "https://example.com/5g", 3.5),
            ("自动驾驶技术进入商用阶段", "https://example.com/auto", 4.0),
            ("智能家居生态系统日趋完善", "https://example.com/smarthome", 3.3),
            ("区块链技术在金融领域落地", "https://example.com/blockchain", 3.8),
            ("可穿戴设备健康监测功能升级", "https://example.com/wearable", 3.4),
            ("云计算市场规模持续扩大", "https://example.com/cloud", 3.6),
        ]

        items = []
        for title, url, score in demo_data[:limit]:
            items.append(HotspotItem(
                title=title,
                link=url,
                source="演示数据源",
                score=score
            ))

        return items


class ChineseSocialSource(DataSource):
    """Chinese social media hot topics simulation source.

    NOTE: Real Weibo/Xiaohongshu require JavaScript execution and login.
    This source provides realistic mock data for demonstration.
    """

    source_type = "chinese_social"

    def fetch(self, limit: int = 15) -> List[HotspotItem]:
        """Return simulated Chinese social media hot topics."""

        # Simulated Weibo hot search data (realistic format)
        weibo_hot_data = [
            ("AI大模型再次刷屏 这个功能太实用了", 4.8, "weibo"),
            ("春晚彩排路透 这些节目值得期待", 4.5, "weibo"),
            ("某明星新剧开播 网友评分创新高", 4.3, "weibo"),
            ("新能源汽车降价潮来了 车企回应", 4.2, "weibo"),
            ("这届年轻人为何爱上博物馆打卡", 3.9, "weibo"),
            ("春季旅游攻略 这些小众目的地火了", 3.8, "weibo"),
            ("职场人必备AI工具 效率提升十倍", 4.1, "weibo"),
            ("健身新趋势 这个运动方式火了", 3.7, "weibo"),
            ("手机摄影技巧 一秒拍出大片", 3.6, "weibo"),
            ("考研分数线公布 相关话题登上热搜", 4.4, "weibo"),
        ]

        # Simulated Xiaohongshu trending data (realistic format)
        xhs_hot_data = [
            ("早八人救星 10分钟搞定精致妆容", 4.6, "xiaohongshu"),
            ("租房改造爆改出租屋 温馨小窝", 4.4, "xiaohongshu"),
            ("减脂餐食谱 好吃不胖还能瘦", 4.3, "xiaohongshu"),
            ("春日穿搭 这些搭配太绝了", 4.5, "xiaohongshu"),
            ("小众旅游地 人少景美还便宜", 4.2, "xiaohongshu"),
            ("独居生活 我的30㎡小窝", 4.1, "xiaohongshu"),
            ("职场穿搭 干练又时尚", 3.9, "xiaohongshu"),
            ("拍照姿势 男友也会拍的照片", 3.8, "xiaohongshu"),
            ("护肤干货 敏感肌亲测好物", 4.0, "xiaohongshu"),
            ("学习笔记 专升本上岸经验", 4.2, "xiaohongshu"),
        ]

        # Combine and return
        all_data = weibo_hot_data + xhs_hot_data
        all_data.sort(key=lambda x: x[1], reverse=True)

        items = []
        for title, score, platform in all_data[:limit]:
            # Create search URL for the platform
            if platform == "weibo":
                url = f"https://s.weibo.com/weibo?q={urllib.parse.quote(title)}"
                source_name = "微博热搜"
            else:  # xiaohongshu
                url = f"https://www.xiaohongshu.com/search_result?keyword={urllib.parse.quote(title)}"
                source_name = "小红书热榜"

            items.append(HotspotItem(
                title=title,
                link=url,
                source=source_name,
                score=score,
                extra={"platform": platform}
            ))

        return items


class ManualHotspotSource(DataSource):
    """Manual hotspot source that reads from a JSON file.

    This allows you to manually update hotspots by editing the JSON file.
    File location: data/manual_hotspots.json
    """

    source_type = "manual"
    config_file = "manual_hotspots.json"

    def fetch(self, limit: int = 20) -> List[HotspotItem]:
        """Read hotspots from manual JSON file."""
        try:
            config_path = Path(__file__).parent.parent / "data" / self.config_file

            if not config_path.exists():
                print(f"手动热点文件不存在: {config_path}")
                print("请创建 data/manual_hotspots.json 文件")
                return []

            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            items = []
            weibo_items = data.get("weibo_hot", [])
            xhs_items = data.get("xiaohongshu_hot", [])

            # Add Weibo hot items
            for item in weibo_items[:limit]:
                title = item.get("title", "")
                score = item.get("score", 3.5)
                if title:
                    encoded = urllib.parse.quote(title)
                    items.append(HotspotItem(
                        title=title,
                        link=f"https://s.weibo.com/weibo?q={encoded}",
                        source="微博热搜(手动)",
                        score=score
                    ))

            # Add Xiaohongshu hot items
            for item in xhs_items[:limit]:
                title = item.get("title", "")
                score = item.get("score", 3.8)
                if title:
                    encoded = urllib.parse.quote(title)
                    items.append(HotspotItem(
                        title=title,
                        link=f"https://www.xiaohongshu.com/search_result?keyword={encoded}",
                        source="小红书热榜(手动)",
                        score=score
                    ))

            # Sort by heat (热度) > rank (排名) > score (评分)
            def sort_key(item):
                # Prefer heat value (higher is better)
                heat = item.extra.get("heat", 0)
                if heat > 0:
                    return (1, heat)  # Priority 1: by heat

                # Then by rank (lower is better)
                rank = item.extra.get("rank", 999)
                if rank < 999:
                    return (2, -rank)  # Priority 2: by rank (inverted)

                # Finally by score
                return (3, item.score)  # Priority 3: by score

            items.sort(key=sort_key, reverse=True)
            return items[:limit]

        except Exception as e:
            print(f"读取手动热点失败: {e}")
            return []


class WeiboPlaywrightSource(DataSource):
    """Weibo hot search source using Playwright browser automation.

    This uses a headless browser to execute JavaScript and bypass visitor verification.
    First run may require manual login to save cookies.
    """

    source_type = "weibo_playwright"
    cookie_file = "weibo_cookies.json"

    def fetch(self, limit: int = 15) -> List[HotspotItem]:
        """Fetch Weibo hot search using Playwright."""
        if not HAS_PLAYWRIGHT:
            print("警告: Playwright 未安装，微博热搜将使用模拟数据")
            print("安装方法: pip install playwright && playwright install chromium")
            return self._get_fallback_data(limit)

        try:
            with sync_playwright() as p:
                # Launch browser - try to use system Chrome if available
                import os
                chrome_path = r"C:\Users\10360\AppData\Local\ms-playwright\chrome-win\chrome.exe"

                if os.path.exists(chrome_path):
                    browser = p.chromium.launch(
                        headless=True,
                        executable_path=chrome_path
                    )
                else:
                    browser = p.chromium.launch(headless=True)

                context = browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                )

                # Load cookies if available
                self._load_cookies(context)

                page = context.new_page()
                page.goto("https://s.weibo.com/top/summary", timeout=30000)

                # Wait for content to load
                time.sleep(3)

                # Check if we hit visitor verification
                if "访客" in page.title() or "Visitor" in page.title():
                    print("检测到访客验证系统")
                    # Try to wait for auto-redirect
                    time.sleep(5)

                # Get page content
                content = page.content()

                # Parse hot search items
                items = self._parse_weibo_page(content, limit)

                # Debug output
                if items:
                    print(f"微博获取到 {len(items)} 条热点，第一条: {items[0].title[:30]}...")
                else:
                    print("警告: 微博未获取到任何热点")

                # Save cookies for next time
                self._save_cookies(context.cookies())

                browser.close()
                return items

        except Exception as e:
            print(f"Weibo Playwright 抓取失败: {e}")
            return self._get_fallback_data(limit)

    def _parse_weibo_page(self, html: str, limit: int) -> List[HotspotItem]:
        """Parse Weibo page HTML to extract hot search items."""
        items = []

        # Multiple patterns for Weibo hot search (ordered by specificity)
        patterns = [
            # Pattern 1: Main hot search links with /weibo?q=
            (r'<a[^>]*href="(/weibo\?q=([^"]+))"[^>]*>([^<]+)</a>', "weibo_link"),
            # Pattern 2: td-02 table cells
            (r'<td[^>]*class="td-02"[^>]*>.*?<a[^>]*>([^<]+)</a>', "td_02"),
            # Pattern 3: Any link with /weibo?q= path
            (r'href="/weibo\?q=([^"]+)"[^>]*>([^<]+)</a>', "simple_link"),
        ]

        for pattern, ptype in patterns:
            matches = re.findall(pattern, html, re.DOTALL)

            for idx, match in enumerate(matches[:limit]):
                if ptype == "weibo_link":
                    href, query, title = match
                    # Decode URL-encoded query
                    from urllib.parse import unquote
                    title = unquote(query) if not title else title
                    full_url = "https://s.weibo.com" + href
                elif ptype == "td_02":
                    title = match[0] if len(match) > 0 else ""
                    # Need to search for the href
                    href_match = re.search(r'href="(/weibo\?q=[^"]+)"', html[html.find(title)-200:html.find(title)+200])
                    if href_match:
                        full_url = "https://s.weibo.com" + href_match.group(1)
                    else:
                        encoded = urllib.parse.quote(title.strip())
                        full_url = f"https://s.weibo.com/weibo?q={encoded}"
                else:  # simple_link
                    query, title = match
                    from urllib.parse import unquote
                    title = unquote(query) if not title else title
                    full_url = f"https://s.weibo.com/weibo?q={query}"

                title = title.strip() if isinstance(title, str) else ""
                # Clean up HTML entities
                import html as html_module
                title = html_module.unescape(title)

                if len(title) < 2 or len(title) > 100:
                    continue

                # Skip common non-content
                skip_words = ["微博", "weibo", "更多", "登录", "注册", "首页", "热搜"]
                if any(x in title for x in skip_words):
                    continue

                items.append(HotspotItem(
                    title=title,
                    link=full_url,
                    source="微博热搜",
                    score=3.5,
                    extra={"rank": idx + 1}  # Store rank for scoring
                ))

            if items:
                break

        return items

    def _load_cookies(self, context):
        """Load cookies from file if available."""
        try:
            cookie_path = Path(__file__).parent.parent / "data" / self.cookie_file
            if cookie_path.exists():
                with open(cookie_path, "r", encoding="utf-8") as f:
                    cookies = json.load(f)
                    context.add_cookies(cookies)
        except:
            pass

    def _save_cookies(self, cookies):
        """Save cookies to file for next use."""
        try:
            data_dir = Path(__file__).parent.parent / "data"
            data_dir.mkdir(exist_ok=True)
            cookie_path = data_dir / self.cookie_file

            with open(cookie_path, "w", encoding="utf-8") as f:
                json.dump(cookies, f)
        except:
            pass

    def _get_fallback_data(self, limit: int) -> List[HotspotItem]:
        """Return fallback data when scraping fails."""
        # Check if fallback data is disabled
        if not USE_FALLBACK_DATA:
            print(f"警告: {self.source_type} 抓取失败且已禁用 fallback 数据，跳过此信源")
            return []
        """Return fallback data when scraping fails."""
        fallback = [
            ("AI大模型应用新突破", 4.5),
            ("春晚彩排路透曝光", 4.3),
            ("新能源汽车降价潮", 4.2),
            ("考研成绩公布", 4.4),
            ("职场AI工具推荐", 4.1),
        ]

        items = []
        for title, score in fallback[:limit]:
            encoded = urllib.parse.quote(title)
            items.append(HotspotItem(
                title=title,
                link=f"https://s.weibo.com/weibo?q={encoded}",
                source="微博热搜(模拟)",
                score=score
            ))
        return items


class XiaohongshuPlaywrightSource(DataSource):
    """Xiaohongshu (Little Red Book) trending source using Playwright.

    Note: Xiaohongshu requires login. First run will open a browser window
    for you to manually log in and save cookies.
    """

    source_type = "xhs_playwright"
    cookie_file = "xhs_cookies.json"

    def fetch(self, limit: int = 15) -> List[HotspotItem]:
        """Fetch Xiaohongshu trending using Playwright."""
        if not HAS_PLAYWRIGHT:
            print("警告: Playwright 未安装，小红书将使用模拟数据")
            return self._get_fallback_data(limit)

        try:
            with sync_playwright() as p:
                # Launch browser - try to use system Chrome if available
                import os
                chrome_path = r"C:\Users\10360\AppData\Local\ms-playwright\chrome-win\chrome.exe"

                if os.path.exists(chrome_path):
                    browser = p.chromium.launch(
                        headless=True,
                        executable_path=chrome_path
                    )
                else:
                    browser = p.chromium.launch(headless=True)

                context = browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                )

                # Load cookies
                self._load_cookies(context)

                page = context.new_page()

                # Go to Xiaohongshu
                page.goto("https://www.xiaohongshu.com", timeout=30000)

                # Wait for page load
                time.sleep(3)

                # Check if login is needed
                if "登录" in page.content() or "login" in page.url.lower():
                    print("需要登录小红书")
                    print("请在浏览器中完成登录，Cookies 将自动保存")
                    # For first run, would need to keep browser open for manual login
                    browser.close()
                    return self._get_fallback_data(limit)

                # Try to navigate to explore/trending page
                page.goto("https://www.xiaohongshu.com/explore", timeout=30000)
                time.sleep(3)

                content = page.content()
                items = self._parse_xhs_page(content, limit)

                # Debug output
                if items:
                    print(f"小红书获取到 {len(items)} 条热点，第一条: {items[0].title[:30]}...")
                else:
                    print("警告: 小红书未获取到任何热点")

                # Save cookies
                self._save_cookies(context.cookies())

                browser.close()
                return items

        except Exception as e:
            print(f"小红书 Playwright 抓取失败: {e}")
            return self._get_fallback_data(limit)

    def _parse_xhs_page(self, html: str, limit: int) -> List[HotspotItem]:
        """Parse Xiaohongshu page to extract trending items."""
        items = []

        # Xiaohongshu is JavaScript-heavy, content is dynamically loaded
        # Try to find title patterns
        patterns = [
            (r'<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{5,50})</span>', "span_title"),
            (r'<a[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{5,50})</a>', "link_title"),
            (r'"title":"([^"]{5,50})"', "json_title"),
        ]

        for pattern, ptype in patterns:
            matches = re.findall(pattern, html)

            for title in matches[:limit]:
                title = html.unescape(title).strip()

                # Filter out obvious non-content
                if len(title) < 5 or any(x in title for x in ["登录", "注册", "更多"]):
                    continue

                encoded = urllib.parse.quote(title)
                items.append(HotspotItem(
                    title=title,
                    link=f"https://www.xiaohongshu.com/search_result?keyword={encoded}",
                    source="小红书热榜",
                    score=3.8
                ))

            if items:
                break

        return items

    def _load_cookies(self, context):
        """Load cookies from file."""
        try:
            cookie_path = Path(__file__).parent.parent / "data" / self.cookie_file
            if cookie_path.exists():
                with open(cookie_path, "r", encoding="utf-8") as f:
                    cookies = json.load(f)
                    context.add_cookies(cookies)
        except:
            pass

    def _save_cookies(self, cookies):
        """Save cookies for next use."""
        try:
            data_dir = Path(__file__).parent.parent / "data"
            data_dir.mkdir(exist_ok=True)
            cookie_path = data_dir / self.cookie_file

            with open(cookie_path, "w", encoding="utf-8") as f:
                json.dump(cookies, f)
        except:
            pass

    def _get_fallback_data(self, limit: int) -> List[HotspotItem]:
        """Return fallback data when scraping fails."""
        # Check if fallback data is disabled
        if not USE_FALLBACK_DATA:
            print(f"警告: {self.source_type} 抓取失败且已禁用 fallback 数据，跳过此信源")
            return []
        """Return fallback data when scraping fails."""
        fallback = [
            ("早八人救星 10分钟精致妆容", 4.6),
            ("租房改造 30㎡温馨小窝", 4.4),
            ("减脂餐食谱 好吃不胖", 4.3),
            ("春日穿搭 这些搭配太绝了", 4.5),
            ("小众旅游地 人少景美", 4.2),
        ]

        items = []
        for title, score in fallback[:limit]:
            encoded = urllib.parse.quote(title)
            items.append(HotspotItem(
                title=title,
                link=f"https://www.xiaohongshu.com/search_result?keyword={encoded}",
                source="小红书热榜(模拟)",
                score=score
            ))
        return items


class ZhihuHotListSource(DataSource):
    """Zhihu hot list scraping source with multiple fallback strategies."""

    source_type = "zhihu_hotlist"

    def fetch(self, limit: int = 10) -> List[HotspotItem]:
        """Fetch from Zhihu hot list by scraping."""

        # Use requests if available for better handling
        if HAS_REQUESTS:
            return self._fetch_with_requests(limit)
        return self._fetch_with_urllib(limit)

    def _fetch_with_requests(self, limit: int) -> List[HotspotItem]:
        """Fetch using requests library."""
        try:
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            })

            resp = session.get("https://www.zhihu.com/hot", timeout=15)
            raw = resp.text

            return self._parse_zhihu_html(raw, limit)
        except Exception as e:
            print(f"Zhihu requests failed: {e}")
            return []

    def _fetch_with_urllib(self, limit: int) -> List[HotspotItem]:
        """Fetch using urllib."""
        try:
            request = urllib.request.Request(
                "https://www.zhihu.com/hot",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                }
            )
            context = ssl.create_default_context()

            with urllib.request.urlopen(request, timeout=15, context=context) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")

            return self._parse_zhihu_html(raw, limit)
        except Exception as e:
            print(f"Zhihu urllib failed: {e}")
            return []

    def _parse_zhihu_html(self, raw: str, limit: int) -> List[HotspotItem]:
        """Parse Zhihu HTML to extract hot items."""
        items = []

        # Multiple patterns to try
        patterns = [
            # Pattern 1: JSON embedded data
            (r'"title":"([^"]+)","type":"hot_list"', "json"),
            # Pattern 2: H2 titles with specific class
            (r'<h2[^>]*class="[^"]*[Hh]ot[Ii]tem[^"]*"[^>]*>([^<]+)</h2>', "html"),
            # Pattern 3: Generic title extraction
            (r'<a[^>]*class="[^"]*[Tt]itle[^"]*"[^>]*>([^<]{4,50})</a>', "generic"),
        ]

        for pattern, ptype in patterns:
            matches = re.findall(pattern, raw)
            if matches:
                for match in matches[:limit]:
                    title = match
                    if ptype == "json":
                        title = title.encode().decode('unicode-escape')
                    title = html.unescape(title).strip()

                    if len(title) < 4 or len(title) > 100:
                        continue

                    encoded = urllib.parse.quote(title)
                    items.append(HotspotItem(
                        title=title,
                        link=f"https://www.zhihu.com/search?q={encoded}",
                        source="知乎热榜",
                        score=3.5
                    ))

                if items:
                    break

        return items


class WeiboHotSearchSource(DataSource):
    """Weibo hot search scraping source with multiple fallback strategies."""

    source_type = "weibo_hotsearch"

    def fetch(self, limit: int = 10) -> List[HotspotItem]:
        """Fetch from Weibo hot search by HTML parsing."""
        try:
            if HAS_REQUESTS:
                return self._fetch_with_requests(limit)
            return self._fetch_with_urllib(limit)
        except Exception as e:
            print(f"Weibo fetch failed: {e}")
            return []

    def _fetch_with_requests(self, limit: int) -> List[HotspotItem]:
        """Fetch using requests library."""
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer": "https://weibo.com"
        })

        resp = session.get("https://s.weibo.com/top/summary", timeout=15)
        return self._parse_weibo_html(resp.text, limit)

    def _fetch_with_urllib(self, limit: int) -> List[HotspotItem]:
        """Fetch using urllib."""
        request = urllib.request.Request(
            "https://s.weibo.com/top/summary",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://weibo.com"
            }
        )
        context = ssl.create_default_context()

        with urllib.request.urlopen(request, timeout=15, context=context) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")

        return self._parse_weibo_html(raw, limit)

    def _parse_weibo_html(self, raw: str, limit: int) -> List[HotspotItem]:
        """Parse Weibo HTML to extract hot search items."""
        items = []

        # Multiple patterns to try
        patterns = [
            # Pattern 1: Links with /realtime?q=
            (r'<a[^>]*href="(/realtime\?q=[^"&]+)"[^>]*>([^<]+)</a>', "link"),
            # Pattern 2: Table cells with hot search content
            (r'<td[^>]*class="td-02"[^>]*>.*?<a[^>]*>([^<]+)</a>', "table"),
            # Pattern 3: Generic pattern for hot list items
            (r'<a[^>]*target="_blank"[^>]*>([^<]{2,30})</a>', "generic"),
        ]

        for pattern, ptype in patterns:
            matches = re.findall(pattern, raw, re.DOTALL)

            for match in matches[:limit]:
                if ptype == "link":
                    href, title = match
                    full_url = "https://s.weibo.com" + href
                else:
                    title = match
                    encoded = urllib.parse.quote(html.unescape(title).strip())
                    full_url = f"https://s.weibo.com/weibo?q={encoded}"

                title = title.strip() if isinstance(title, str) else ""
                if len(title) < 2 or len(title) > 50:
                    continue

                items.append(HotspotItem(
                    title=title,
                    link=full_url,
                    source="微博热搜",
                    score=3.5
                ))

            if items:
                break

        return items


class BaiduHotSearchSource(DataSource):
    """Baidu hot search scraping source with improved parsing."""

    source_type = "baidu_hotsearch"

    def fetch(self, limit: int = 10) -> List[HotspotItem]:
        """Fetch from Baidu hot search by HTML parsing."""
        try:
            if HAS_REQUESTS:
                return self._fetch_with_requests(limit)
            return self._fetch_with_urllib(limit)
        except Exception as e:
            print(f"Baidu fetch failed: {e}")
            return []

    def _fetch_with_requests(self, limit: int) -> List[HotspotItem]:
        """Fetch using requests library."""
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })

        resp = session.get("https://top.baidu.com/board?tab=realtime", timeout=15)
        return self._parse_baidu_html(resp.text, limit)

    def _fetch_with_urllib(self, limit: int) -> List[HotspotItem]:
        """Fetch using urllib."""
        request = urllib.request.Request(
            "https://top.baidu.com/board?tab=realtime",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }
        )
        context = ssl.create_default_context()

        with urllib.request.urlopen(request, timeout=15, context=context) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")

        return self._parse_baidu_html(raw, limit)

    def _parse_baidu_html(self, raw: str, limit: int) -> List[HotspotItem]:
        """Parse Baidu HTML to extract hot search items."""
        items = []

        # Multiple patterns to try
        patterns = [
            # Pattern 1: c-single-text-ellipsis class (Baidu's main hot search format)
            (r'<div\s+class="c-single-text-ellipsis[^"]*"[^>]*>([^<]+)</div>', "main"),
            # Pattern 2: Generic title extraction from list items
            (r'<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{2,30})</div>', "div_title"),
            # Pattern 3: Links in hot board
            (r'<a[^>]*href="[^"]*"[^>]*>([^<]{2,30})</a>', "links"),
        ]

        for pattern, ptype in patterns:
            titles = re.findall(pattern, raw)

            for title in titles[:limit]:
                title = html.unescape(title).strip()
                # Filter out junk
                if len(title) < 2 or len(title) > 50:
                    continue
                # Skip obvious non-content and UI elements
                skip_keywords = [
                    "百度", "baidu", "更多", "more",
                    "自定义分组", "分组", "设置", "setting",
                    "首页", "home", "登录", "login",
                    "搜索", "search", "热搜榜", "hot",
                    "为您推荐", "推荐", "猜你喜欢",
                    "热点", "榜单", "实时"
                ]
                if any(x in title for x in skip_keywords):
                    continue

                encoded = urllib.parse.quote(title)
                search_url = f"https://www.baidu.com/s?wd={encoded}"

                items.append(HotspotItem(
                    title=title,
                    link=search_url,
                    source="百度热搜",
                    score=3.5
                ))

            if items:
                break

        return items


class ToutiaoHotTopicsSource(DataSource):
    """Toutiao hot topics scraping source with improved parsing."""

    source_type = "toutiao_hottopics"

    def fetch(self, limit: int = 10) -> List[HotspotItem]:
        """Fetch from Toutiao hot topics."""
        try:
            if HAS_REQUESTS:
                return self._fetch_with_requests(limit)
            return self._fetch_with_urllib(limit)
        except Exception as e:
            print(f"Toutiao fetch failed: {e}")
            return []

    def _fetch_with_requests(self, limit: int) -> List[HotspotItem]:
        """Fetch using requests library."""
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })

        resp = session.get("https://www.toutiao.com/hot-event/hot-board", timeout=15)
        return self._parse_toutiao_html(resp.text, limit)

    def _fetch_with_urllib(self, limit: int) -> List[HotspotItem]:
        """Fetch using urllib."""
        request = urllib.request.Request(
            "https://www.toutiao.com/hot-event/hot-board",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }
        )
        context = ssl.create_default_context()

        with urllib.request.urlopen(request, timeout=15, context=context) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")

        return self._parse_toutiao_html(raw, limit)

    def _parse_toutiao_html(self, raw: str, limit: int) -> List[HotspotItem]:
        """Parse Toutiao HTML to extract hot topics."""
        items = []

        # Multiple patterns to try
        patterns = [
            # Pattern 1: JSON embedded data
            (r'"title":"([^"]+)","url":"([^"]+)"', "json"),
            # Pattern 2: H3 titles with class
            (r'<h3[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</h3>', "h3"),
            # Pattern 3: Link elements with title
            (r'<a[^>]*class="[^"]*[Tt]itle[^"]*"[^>]*>([^<]+)</a>', "link"),
        ]

        for pattern, ptype in patterns:
            matches = re.findall(pattern, raw)

            if ptype == "json":
                for title, url in matches[:limit]:
                    try:
                        title = title.encode().decode('unicode-escape')
                        title = html.unescape(title)
                        url = url.encode().decode('unicode-escape')

                        if len(title) < 2 or len(title) > 100:
                            continue

                        items.append(HotspotItem(
                            title=title,
                            link=url,
                            source="头条热榜",
                            score=3.5
                        ))
                    except:
                        pass
            else:
                for title in matches[:limit]:
                    title = html.unescape(title).strip()
                    if len(title) < 2 or len(title) > 100:
                        continue

                    encoded = urllib.parse.quote(title)
                    items.append(HotspotItem(
                        title=title,
                        link=f"https://www.toutiao.com/search/{encoded}",
                        source="头条热榜",
                        score=3.5
                    ))

            if items:
                break

        return items


class TophubSource(DataSource):
    """Tophub.today - Aggregated hot topics from multiple Chinese platforms.

    Fetches real-time hot topics from tophub.today/hot which aggregates
    hot lists from Zhihu, Weibo, Hupu, Baidu, 36kr, and more.
    Uses Playwright to handle JavaScript-rendered content.
    """

    source_type = "tophub"
    cookie_file = "tophub_cookies.json"

    def fetch(self, limit: int = 50) -> List[HotspotItem]:
        """Fetch from Tophub aggregated hot list using Playwright."""
        if not HAS_PLAYWRIGHT:
            print("警告: Tophub 需要 Playwright，将尝试使用 requests")
            if HAS_REQUESTS:
                return self._fetch_with_requests(limit)
            return self._fetch_with_urllib(limit)

        try:
            with sync_playwright() as p:
                # Launch browser - try to use system Chrome if available
                chrome_path = r"C:\Users\10360\AppData\Local\ms-playwright\chrome-win\chrome.exe"

                if os.path.exists(chrome_path):
                    browser = p.chromium.launch(
                        headless=True,
                        executable_path=chrome_path
                    )
                else:
                    browser = p.chromium.launch(headless=True)

                context = browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                )

                # Load cookies if available
                self._load_cookies(context)

                page = context.new_page()
                page.goto("https://tophub.today/hot", timeout=30000)

                # Wait for the hot list to load - wait for items to appear
                try:
                    page.wait_for_selector(".rank-all-item li, .daily-rank-list li, .node-card", timeout=15000)
                except:
                    # If selector not found, just wait a bit
                    time.sleep(5)

                # Additional wait to ensure content is fully loaded
                time.sleep(2)

                # Get page content
                content = page.content()

                # Parse hot items
                items = self._parse_tophub_html(content, limit)

                # Debug output
                if items:
                    print(f"Tophub 获取到 {len(items)} 条热点，第一条: {items[0].title[:30]}...")
                else:
                    print("警告: Tophub 未获取到任何热点，可能页面结构已变化")

                # Save cookies for next time
                self._save_cookies(context.cookies())

                browser.close()
                return items

        except Exception as e:
            print(f"Tophub Playwright 抓取失败: {e}")
            # Fallback to requests
            if HAS_REQUESTS:
                return self._fetch_with_requests(limit)
            return []

    def _load_cookies(self, context):
        """Load cookies from file if available."""
        try:
            cookie_path = Path(__file__).parent.parent / "data" / self.cookie_file
            if cookie_path.exists():
                with open(cookie_path, "r", encoding="utf-8") as f:
                    cookies = json.load(f)
                    context.add_cookies(cookies)
        except:
            pass

    def _save_cookies(self, cookies):
        """Save cookies to file for next use."""
        try:
            data_dir = Path(__file__).parent.parent / "data"
            data_dir.mkdir(exist_ok=True)
            cookie_path = data_dir / self.cookie_file

            with open(cookie_path, "w", encoding="utf-8") as f:
                json.dump(cookies, f, ensure_ascii=False)
        except:
            pass

    def _fetch_with_requests(self, limit: int) -> List[HotspotItem]:
        """Fetch using requests library (fallback)."""
        try:
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            })

            # Load cookies if available
            try:
                cookie_path = Path(__file__).parent.parent / "data" / self.cookie_file
                if cookie_path.exists():
                    with open(cookie_path, "r", encoding="utf-8") as f:
                        cookies = json.load(f)
                        # Convert cookies to requests format
                        cookie_dict = {c["name"]: c["value"] for c in cookies}
                        session.cookies.update(cookie_dict)
            except:
                pass

            resp = session.get("https://tophub.today/hot", timeout=20)
            return self._parse_tophub_html(resp.text, limit)
        except Exception as e:
            print(f"Tophub requests failed: {e}")
            return []

    def _fetch_with_urllib(self, limit: int) -> List[HotspotItem]:
        """Fetch using urllib (fallback)."""
        try:
            request = urllib.request.Request(
                "https://tophub.today/hot",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                }
            )
            context = ssl.create_default_context()

            with urllib.request.urlopen(request, timeout=20, context=context) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")

            return self._parse_tophub_html(raw, limit)
        except Exception as e:
            print(f"Tophub urllib failed: {e}")
            return []

    def _parse_tophub_html(self, raw: str, limit: int) -> List[HotspotItem]:
        """Parse Tophub HTML to extract hot items from multiple platforms."""
        items = []

        # Actual Tophub HTML structure (from debug):
        # <li class="child-item">
        #   <div class="left-item"><span class="index-1">1</span></div>
        #   <div class="center-item">
        #     <div class="item-info">
        #       <div class="info-content">
        #         <p class="medium-txt"><a href="..." target="_blank">TITLE</a></p>
        #         <p class="small-txt">PLATFORM ‧ HEAT</p>
        #       </div>
        #     </div>
        #   </div>
        # </li>

        # Pattern 1: Extract from child-item elements with heat value
        child_item_pattern = r'<li[^>]*class="child-item"[^>]*>.*?<span class="index-\d+">(\d+)</span>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)</a>.*?<p class="small-txt">([^‧]+)‧\s*([0-9.]+)\s*(万|亿|)?热度?</p>.*?</li>'

        matches = re.findall(child_item_pattern, raw, re.DOTALL)

        for rank, href, title, platform_raw, heat_num, heat_unit in matches[:limit]:
            title = html.unescape(title).strip()
            platform = html.unescape(platform_raw).strip()

            # Clean up platform name
            platform = re.sub(r'\s+', '', platform)

            if len(title) < 2 or len(title) > 150:
                continue

            # Filter out UI elements and junk
            skip_keywords = [
                "自定义", "分组", "设置", "推荐", "猜你喜欢",
                "为您推荐", "热点", "榜单", "实时", "首页",
                "登录", "注册", "更多", "查看全部"
            ]
            if any(x in title for x in skip_keywords):
                continue

            # Parse heat value
            heat_value = float(heat_num) if heat_num else 0
            if heat_unit == "万":
                heat_value *= 10000
            elif heat_unit == "亿":
                heat_value *= 100000000

            # Use the original link if it's a full URL
            if href.startswith("http"):
                link = href
            elif href.startswith("/"):
                link = "https://tophub.today" + href
            else:
                # Build search link based on platform
                encoded = urllib.parse.quote(title)
                if "知乎" in platform:
                    link = f"https://www.zhihu.com/search?q={encoded}"
                elif "微博" in platform:
                    link = f"https://s.weibo.com/weibo?q={encoded}"
                elif "百度" in platform:
                    link = f"https://www.baidu.com/s?wd={encoded}"
                elif "虎扑" in platform:
                    link = f"https://m.hupu.com/search?keywords={encoded}"
                elif "36氪" in platform:
                    link = f"https://36kr.com/search/articles/{encoded}"
                else:
                    link = f"https://www.baidu.com/s?wd={encoded}"

            items.append(HotspotItem(
                title=title,
                link=link,
                source=f"今日热榜-{platform}" if platform else "今日热榜",
                score=3.8,
                extra={
                    "rank": int(rank),
                    "heat": int(heat_value),
                    "platform": platform
                }
            ))

        # Pattern 2: Fallback - look for any link with title and nearby platform info
        if not items:
            alt_pattern = r'<a[^>]*href="([^"]*)"[^>]*>([^<]{5,100})</a>.*?<p[^>]*class="[^"]*small-txt[^"]*"[^>]*>([^<]+)</p>'
            alt_matches = re.findall(alt_pattern, raw, re.DOTALL)

            for href, title, platform_raw in alt_matches[:limit]:
                title = html.unescape(title).strip()
                platform = html.unescape(platform_raw).strip()

                # Extract platform name before the ‧ symbol
                platform_match = re.search(r'([^‧\s]+)', platform)
                platform = platform_match.group(1) if platform_match else ""

                if len(title) < 2 or len(title) > 150:
                    continue

                # Filter out UI elements
                skip_keywords = [
                    "自定义", "分组", "设置", "推荐", "猜你喜欢",
                    "为您推荐", "热点", "榜单", "实时", "首页"
                ]
                if any(x in title for x in skip_keywords):
                    continue

                if href.startswith("http"):
                    link = href
                else:
                    encoded = urllib.parse.quote(title)
                    link = f"https://www.baidu.com/s?wd={encoded}"

                items.append(HotspotItem(
                    title=title,
                    link=link,
                    source=f"今日热榜-{platform}" if platform else "今日热榜",
                    score=3.8
                ))

        return items

        return items


class SourceRegistry:
    """Registry for managing data source types."""

    _sources: Dict[str, type] = {
        "rss": RSSSource,
        "demo": DemoDataSource,
        "chinese_social": ChineseSocialSource,
        "manual": ManualHotspotSource,
        "zhihu_hotlist": ZhihuHotListSource,
        "weibo_hotsearch": WeiboHotSearchSource,
        "weibo_playwright": WeiboPlaywrightSource,
        "xhs_playwright": XiaohongshuPlaywrightSource,
        "baidu_hotsearch": BaiduHotSearchSource,
        "toutiao_hottopics": ToutiaoHotTopicsSource,
        "tophub": TophubSource,
    }

    @classmethod
    def register(cls, source_type: str, source_class: type):
        """Register a new source type."""
        cls._sources[source_type] = source_class

    @classmethod
    def get(cls, source_type: str) -> Optional[type]:
        """Get source class by type."""
        return cls._sources.get(source_type)

    @classmethod
    def create_source(cls, config: Any) -> DataSource:
        """Create source instance from configuration."""
        # Backward compatibility: treat strings as RSS URLs
        if isinstance(config, str):
            return RSSSource(url=config)

        # Handle list format (old style)
        if isinstance(config, list):
            raise ValueError("Expected source config dict, got list")

        source_type = config.get("type", "rss")
        source_class = cls.get(source_type)
        if source_class is None:
            raise ValueError(f"Unknown source type: {source_type}")

        return source_class.from_config(config)


# ==================== Feishu Notifier ====================

class FeishuNotifier:
    """Feishu (Lark) webhook notification sender."""

    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url or os.getenv("FEISHU_WEBHOOK_URL")
        if not self.webhook_url:
            raise ValueError(
                "Feishu webhook URL not set. "
                "Set FEISHU_WEBHOOK_URL environment variable or pass webhook_url."
            )

    def send_hotspot_summary(
        self,
        title: str,
        items: List[Dict[str, Any]],
        summary: str,
        source_count: int,
        error_count: int
    ) -> bool:
        """Send hotspot summary as rich text message."""
        # Build top 5 items
        top_items = items[:5]
        items_text = "\n".join([
            f"{i+1}. {it['title']}\n   热度: {it['importance']}/5 | {it.get('extra', {}).get('rank_reason', '热门')}\n   {it['link']}"
            for i, it in enumerate(top_items)
        ])

        message = f"""**{title}**
{dt.datetime.now().strftime('%Y-%m-%d')}

📊 {summary}

🔥 Top 5 热点：
{items_text}

📌 查看完整 HTML 报告：
https://iwannasignin-kong.github.io/iwannasignin/

数据来源: {source_count} 个平台
"""

        payload = {
            "msg_type": "text",
            "content": {
                "text": message
            }
        }

        max_retries = 3
        for attempt in range(max_retries):
            try:
                if HAS_REQUESTS:
                    response = requests.post(
                        self.webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    result = response.json()
                    if result.get("StatusCode") == 0 or result.get("code") == 0:
                        return True
                    else:
                        print(f"Feishu API error: {result}")
                else:
                    import urllib.request
                    data = json.dumps(payload).encode('utf-8')
                    req = urllib.request.Request(
                        self.webhook_url,
                        data=data,
                        headers={'Content-Type': 'application/json'}
                    )
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        result = json.loads(resp.read().decode('utf-8'))
                        if result.get("StatusCode") == 0 or result.get("code") == 0:
                            return True

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    time.sleep(wait_time)
                else:
                    print(f"Feishu notification failed: {e}")
                    return False

        return False


# ==================== DingTalk Notifier ====================

class DingTalkNotifier:
    """DingTalk webhook notification sender."""

    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url or os.getenv("DINGTALK_WEBHOOK_URL")
        if not self.webhook_url:
            raise ValueError(
                "DingTalk webhook URL not set. "
                "Set DINGTALK_WEBHOOK_URL environment variable or pass webhook_url."
            )

    def send_hotspot_summary(
        self,
        title: str,
        items: List[Dict[str, Any]],
        summary: str,
        source_count: int,
        error_count: int
    ) -> bool:
        """Send hotspot summary as Markdown message."""
        # Build top 3 items
        top_items = items[:3]
        top_items_text = "\n".join([
            f"{i+1}. **[{it['title']}]** 评分: {it['importance']}/5 | [链接]({it['link']})"
            for i, it in enumerate(top_items)
        ])

        message = f"""## {title} - {dt.datetime.now().strftime('%Y-%m-%d')}

**摘要**: {summary}
**信源**: {source_count} 个来源 | **异常**: {error_count} 个

### 热门前三
{top_items_text}
"""

        return self._send_message(message)

    def _send_message(self, content: str, max_retries: int = 3) -> bool:
        """Send message with retry logic."""
        data = {
            "msgtype": "markdown",
            "markdown": {
                "title": "AI 热点日报",
                "text": content
            }
        }

        for attempt in range(max_retries):
            try:
                json_data = json.dumps(data).encode("utf-8")
                request = urllib.request.Request(
                    self.webhook_url,
                    data=json_data,
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": "HotspotRadar/1.0"
                    }
                )

                context = ssl.create_default_context()
                with urllib.request.urlopen(request, timeout=10, context=context) as resp:
                    result = json.loads(resp.read().decode("utf-8"))

                if result.get("errcode") == 0:
                    return True
                else:
                    print(f"DingTalk API error: {result.get('errmsg', 'Unknown error')}")

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    time.sleep(wait_time)
                else:
                    print(f"DingTalk notification failed after {max_retries} attempts: {e}")
                    return False

        return False


# ==================== Core Functions ====================

def normalize_link(link: str) -> str:
    """Normalize link for deduplication."""
    parsed = urllib.parse.urlparse(link)

    # For Weibo links, keep the query parameter (which contains the keyword)
    # to avoid treating different hot search items as duplicates
    if 's.weibo.com/weibo' in link:
        # Normalize but keep the query
        return parsed._replace(fragment="").geturl()

    # For other links, remove query and fragment
    cleaned = parsed._replace(query="", fragment="")
    return urllib.parse.urlunparse(cleaned)


def dedupe(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate items based on normalized link and title."""
    seen = set()
    out = []
    for it in items:
        # Use both normalized link and title as dedup key
        # This prevents items with same URL but different titles (e.g., from search results)
        # from being treated as duplicates
        link_key = normalize_link(it["link"])
        title_key = it["title"].strip().lower()
        key = (link_key, title_key)
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return out


def score_item(item: Dict[str, Any], keywords: List[str]) -> float:
    """Calculate importance score for an item based on heat/rank."""
    title = item["title"].lower()
    score = 3.0

    # Check if item has heat or rank data from Tophub/Weibo
    extra = item.get("extra", {})

    if "heat" in extra:
        # Use Tophub heat value: higher heat = higher score
        # Scale: 100万热度 = +0.5, 1000万热度 = +1.0, 1亿热度 = +1.5
        heat = extra["heat"]
        if heat >= 100000000:  # 1亿+
            score += 1.5
        elif heat >= 10000000:  # 1000万+
            score += 1.0
        elif heat >= 1000000:  # 100万+
            score += 0.5
        elif heat >= 100000:  # 10万+
            score += 0.2
    elif "rank" in extra:
        # Use Weibo/Tophub rank: top 3 get higher score
        rank = extra["rank"]
        if rank <= 3:
            score += 1.0
        elif rank <= 10:
            score += 0.5
        elif rank <= 20:
            score += 0.2

    # Keyword matching for English sources
    hit = sum(1 for w in keywords if w.lower() in title)
    score += min(0.5, hit * 0.15)

    if "arxiv" in item["source"].lower():
        score += 0.3

    return min(5.0, round(score, 1))


def credibility(item: Dict[str, Any]) -> float:
    """Calculate credibility score for an item."""
    src = item["source"]
    if any(k in src for k in ["openai.com", "anthropic.com", "google", "arxiv.org"]):
        return 4.8
    if any(k in src for k in ["technologyreview.com", "venturebeat.com"]):
        return 4.2
    return 3.8


def cn_desc(title: str, source: str, summary_hint: str) -> str:
    """Generate Chinese content description."""
    t = title.lower()

    # Chinese topics
    if any(x in title for x in ["伊朗", "美国", "战争", "袭击", "导弹", "军事"]):
        return "这条信息涉及国际局势，适合写成\"事件背景 + 地缘影响分析\"的解读型内容。"
    if any(x in title for x in ["比亚迪", "销量", "股价", "财报", "公司"]):
        return "这条信息涉及商业动态，适合写成\"数据解读 + 行业趋势\"的商业分析。"
    if any(x in title for x in ["AI", "人工智能", "大模型", "算法"]):
        return "这条信息涉及AI技术，适合写成\"技术科普 + 应用场景\"的科普型内容。"
    if any(x in title for x in ["化妆", "穿搭", "美食", "旅游"]):
        return "这条信息涉及生活方式，适合写成\"实用教程 + 产品推荐\"的种草型内容。"
    if any(x in title for x in ["票房", "电影", "剧集", "明星", "娱乐"]):
        return "这条信息涉及娱乐热点，适合写成\"热点点评 + 观众反应\"的评论型内容。"

    # English topics
    if (
        "openai" in t
        or "anthropic" in t
        or "google" in t
        or "introducing" in t
        or "release" in t
    ):
        return "这条信息偏向官方动态，适合写成\"新能力发布 + 对创作者/从业者影响\"的快评。"
    if "benchmark" in t or "reasoning" in t or "model" in t or "arxiv" in source:
        return "这条信息偏向研究与评测，适合写成\"方法解读 + 实战启发\"的科普型选题。"
    if "policy" in t or "governance" in t or "privacy" in t or "cyber" in t:
        return "这条信息偏向治理与安全，适合写成\"合规风险 + 商业落地注意点\"的提醒型内容。"
    if "podcast" in t or "world model" in t:
        return "这条信息偏向趋势讨论，适合写成\"未来方向判断 + 个人观点\"的IP向内容。"

    # Default concise description
    return "这条信息可作为行业观察素材，建议结合真实案例补充\"能做什么、怎么变现\"。"


def generate_dynamic_hint(items: List[Dict], default_hint: str = "") -> str:
    """Generate dynamic summary hint based on actual hotspot content."""
    if not items:
        return default_hint or "今日暂无热点数据。"

    # Topic categories and their keywords
    topics = {
        "国际局势": ["伊朗", "美国", "战争", "袭击", "导弹", "军事", "以色列", "巴勒斯坦", "俄罗斯", "乌克兰"],
        "AI技术": ["AI", "人工智能", "大模型", "GPT", "机器学习", "深度学习", "算法"],
        "科技产品": ["iPhone", "手机", "芯片", "iPad", "发布", "新品", "苹果", "华为"],
        "商业财经": ["销量", "股价", "财报", "融资", "IPO", "公司", "上市", "收购"],
        "生活方式": ["穿搭", "化妆", "美食", "旅游", "健身", "减肥", "租房"],
        "娱乐文化": ["电影", "剧集", "明星", "票房", "综艺", "音乐"],
        "社会热点": ["事件", "案件", "政策", "法规", "教育", "就业"],
    }

    # Count topics in top 20 items
    topic_counts = {topic: 0 for topic in topics}
    for item in items[:20]:
        title = item.get("title", "")
        for topic, keywords in topics.items():
            if any(kw in title for kw in keywords):
                topic_counts[topic] += 1

    # Get top topics (at least 2 items)
    top_topics = [t for t, c in topic_counts.items() if c >= 2]
    top_topics.sort(key=lambda t: topic_counts[t], reverse=True)

    # Generate hint based on dominant topics
    hints = []

    if not top_topics:
        # No clear topic pattern, use default
        return default_hint or "建议关注跨行业趋势和热点事件。"

    # Build recommendations based on top topics
    if "国际局势" in top_topics:
        if topic_counts["国际局势"] >= 4:
            hints.append("今日国际局势热点集中，适合解读地缘影响与事件背景")
        else:
            hints.append("涉及国际局势动态，可关注相关影响分析")

    if "AI技术" in top_topics:
        hints.append("AI技术更新活跃，可聚焦技术突破与应用场景")

    if "科技产品" in top_topics:
        hints.append("科技产品发布频繁，适合评测与对比分析")

    if "商业财经" in top_topics:
        hints.append("商业财经热点较多，可关注数据解读与行业趋势")

    if "生活方式" in top_topics[:2]:
        hints.append("生活方式内容热度高，适合实用教程与种草推荐")

    if "娱乐文化" in top_topics[:2]:
        hints.append("娱乐文化话题活跃，适合热点点评与观众反应分析")

    # If we have specific hints, join them
    if hints:
        # Capitalize first letter
        hint_text = "；".join(hints[:2]) + "。"
        return hint_text[0].upper() + hint_text[1:] if hint_text else ""
    else:
        return default_hint or "建议关注跨行业趋势和热点事件。"


def auto_clear_old_cookies(data_dir: Path, max_age_hours: int = 24) -> int:
    """Automatically clear cookies older than max_age_hours."""
    if not data_dir.exists():
        return 0

    now = time.time()
    cleared_count = 0

    for cookie_file in data_dir.glob("*_cookies.json"):
        try:
            file_age = now - cookie_file.stat().st_mtime
            age_hours = file_age / 3600

            if age_hours > max_age_hours:
                cookie_file.unlink()
                print(f"自动清除过期 cookies: {cookie_file.name} ({age_hours:.1f}小时前)")
                cleared_count += 1
        except Exception as e:
            print(f"清除 cookies 失败 {cookie_file.name}: {e}")

    return cleared_count


def load_domain(config_path: str, domain: str) -> Dict[str, Any]:
    """Load domain configuration from JSON file."""
    cfg = json.loads(Path(config_path).read_text(encoding="utf-8"))
    domains = cfg.get("domains", {})

    if domain not in domains:
        raise ValueError(
            f"domain 不存在: {domain}，可选: {', '.join(sorted(domains.keys()))}"
        )

    item = domains[domain]

    # Backward compatibility: handle list format (old style)
    if isinstance(item, list):
        return {
            "title": domain.upper() + " 热点日报",
            "summary_hint": "",
            "keywords": DEFAULT_KEYWORDS,
            "sources": item,
        }

    # New format with structured sources
    return {
        "title": item.get("title", domain.upper() + " 热点日报"),
        "summary_hint": item.get("summary_hint", ""),
        "keywords": item.get("keywords", DEFAULT_KEYWORDS),
        "sources": item.get("sources", item.get("feeds", [])),
    }


def fetch_from_sources(source_configs: List[Any], limit: int = 10) -> tuple[List[Dict], List[str]]:
    """Fetch items from all configured sources."""
    all_items = []
    errors = []

    for source_config in source_configs:
        try:
            # Skip if explicitly disabled
            if isinstance(source_config, dict) and not source_config.get("enabled", True):
                continue

            source = SourceRegistry.create_source(source_config)
            hotspot_items = source.fetch(limit=limit)

            # Convert HotspotItem to dict format
            for item in hotspot_items:
                all_items.append({
                    "title": item.title,
                    "link": item.link,
                    "source": item.source,
                    "importance": item.score,
                    "extra": item.extra,  # Preserve extra data (rank, heat, platform)
                })

        except Exception as e:
            source_name = (
                source_config.get("type", "unknown")
                if isinstance(source_config, dict)
                else str(source_config)[:50]
            )
            errors.append(f"{source_name} -> {e}")

    return all_items, errors


def get_rank_reason(item: Dict, rank: int) -> str:
    """Generate reason for why this item is ranked high."""
    extra = item.get("extra", {})
    source = item.get("source", "")

    # Check if it has heat value
    if "heat" in extra:
        heat = extra["heat"]
        if heat >= 10000000:
            return f"热度 {heat/10000000:.1f}千万+"
        elif heat >= 1000000:
            return f"热度 {heat/10000:.0f}万+"
        elif heat >= 100000:
            return f"热度 {heat/10000:.1f}万"
        else:
            return f"热度 {heat:,}"

    # Check if it has rank value
    if "rank" in extra:
        rank_val = extra["rank"]
        # Try to get platform name from extra or source
        platform = extra.get("platform", "")

        # Map source to platform name
        if not platform:
            if "微博" in source:
                platform = "微博"
            elif "知乎" in source:
                platform = "知乎"
            elif "百度" in source:
                platform = "百度"
            elif "今日热榜" in source:
                platform = extra.get("platform", "热榜")

        if platform:
            return f"{platform}第 {rank_val} 名"
        return f"榜单第 {rank_val} 名"

    # Default reason based on overall rank
    if rank <= 3:
        return "综合热度最高"
    elif rank <= 10:
        return "综合热度较高"
    else:
        return "热门话题"


def score_class(v: float) -> str:
    """Get CSS class name for score value."""
    if v >= 4.5:
        return "excellent"
    if v >= 4.0:
        return "good"
    return "mid"


def build_digest(source_configs: List[Any], keywords: List[str], top_n: int = 10) -> tuple[List[Dict], List[str]]:
    """Build digest from all sources."""
    all_items, errors = fetch_from_sources(source_configs, limit=10)

    unique_items = dedupe(all_items)
    for item in unique_items:
        if "importance" not in item or item["importance"] == 3.0:
            item["importance"] = score_item(item, keywords)
        item["credibility"] = credibility(item)

    ranked = sorted(
        unique_items,
        key=lambda x: (x["importance"], x["credibility"]),
        reverse=True
    )
    return ranked[:top_n], errors


def render_page(
    title: str,
    summary_hint: str,
    items: List[Dict],
    errors: List[str],
    today: str
) -> str:
    """Render HTML page."""
    high_cnt = sum(1 for it in items if float(it.get("importance", 0)) >= 4.0)
    official_cnt = sum(
        1
        for it in items
        if any(k in it.get("link", "") for k in ["openai.com", "google", "anthropic.com"])
    )
    research_cnt = sum(1 for it in items if "arxiv.org" in it.get("link", ""))

    # Generate dynamic hint based on actual content
    dynamic_hint = generate_dynamic_hint(items, summary_hint)

    summary_text = (
        f"今日共筛出 {len(items)} 条热点，其中高优先级 {high_cnt} 条，"
        f"官方信源 {official_cnt} 条，研究论文 {research_cnt} 条。{dynamic_hint}"
    )

    cards = []
    for i, it in enumerate(items, 1):
        title_escaped = html.escape(it.get("title", ""))
        link = html.escape(it.get("link", ""))
        imp = float(it.get("importance", 0))

        # Get rank reason (why this item is ranked here)
        rank_reason = get_rank_reason(it, i)

        desc = html.escape(cn_desc(it.get("title", ""), it.get("source", ""), summary_hint))

        cards.append(
            f"""
      <article class="card">
        <div class="card-top">
          <span class="rank">#{i}</span>
          <div class="badges">
            <span class="badge {score_class(imp)}">热度 {imp:.1f}/5</span>
            <span class="badge mid">{html.escape(rank_reason)}</span>
          </div>
        </div>
        <h3>{title_escaped}</h3>
        <p class="desc">{desc}</p>
        <p class="meta">来源链接</p>
        <a class="source" href="{link}" target="_blank" rel="noopener noreferrer">{link}</a>
      </article>
            """
        )

    error_block = ""
    if errors:
        lis = "".join(f"<li>{html.escape(e)}</li>" for e in errors)
        error_block = (
            '<section class="errors"><h4>采集异常（不影响其余信源）</h4>'
            f"<ul>{lis}</ul></section>"
        )

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} | {today}</title>
  <style>
    :root {{ --bg:#f4f7fb; --ink:#1c2430; --muted:#677489; --card:#fff; --line:#e5ebf3; --accent:#1769ff; --good:#0d9b6f; --mid:#b47900; --excellent:#7c3aed; }}
    * {{ box-sizing: border-box; }}
    body {{ margin:0; color:var(--ink); background:radial-gradient(1200px 500px at 10% -5%, #dce9ff 0%, transparent 55%),radial-gradient(900px 400px at 100% 0%, #dff7ef 0%, transparent 55%),var(--bg); font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif; line-height:1.5; }}
    .wrap {{ max-width:980px; margin:0 auto; padding:28px 18px 40px; }}
    .hero {{ background:linear-gradient(135deg,#12243e,#1f4c9f); color:#fff; border-radius:18px; padding:22px; box-shadow:0 10px 30px rgba(18,36,62,.25); }}
    .hero h1 {{ margin:0; font-size:clamp(22px,3vw,30px); }}
    .hero p {{ margin:8px 0 0; color:rgba(255,255,255,.90); }}
    .summary {{ margin-top:12px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.22); border-radius:12px; padding:10px 12px; }}
    .stats {{ display:flex; gap:12px; flex-wrap:wrap; margin-top:14px; }}
    .pill {{ background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.24); padding:6px 11px; border-radius:999px; font-size:13px; }}
    .grid {{ display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:18px; }}
    .card {{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; box-shadow:0 4px 12px rgba(16,32,56,.05); }}
    .card-top {{ display:flex; justify-content:space-between; align-items:center; gap:8px; }}
    .rank {{ font-size:12px; color:var(--muted); font-weight:700; }}
    .badges {{ display:flex; gap:6px; flex-wrap:wrap; }}
    .badge {{ font-size:12px; border-radius:999px; padding:3px 8px; border:1px solid; font-weight:600; }}
    .badge.good {{ color:var(--good); border-color:#bde8d8; background:#ecfbf5; }}
    .badge.mid {{ color:var(--mid); border-color:#f2ddb4; background:#fff8ea; }}
    .badge.excellent {{ color:var(--excellent); border-color:#dccfff; background:#f7f2ff; }}
    .card h3 {{ margin:10px 0 8px; font-size:17px; line-height:1.4; }}
    .desc {{ margin:0 0 10px; color:#334155; font-size:14px; background:#f8fbff; border-left:3px solid #9ec4ff; border-radius:8px; padding:8px 10px; }}
    .meta {{ margin:0 0 4px; color:var(--muted); font-size:12px; }}
    .source {{ color:var(--accent); text-decoration:none; word-break:break-all; font-size:13px; }}
    .source:hover {{ text-decoration:underline; }}
    .errors {{ margin-top:16px; background:#fff8f8; border:1px solid #ffd7d7; border-radius:12px; padding:12px 14px; }}
    .errors h4 {{ margin:0 0 8px; color:#9f2727; font-size:14px; }}
    .errors ul {{ margin:0; padding-left:18px; color:#793535; }}
    @media (max-width:800px) {{ .grid {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
  <main class="wrap">
    <header class="hero">
      <h1>{title}</h1>
      <p>{today} · 自动采集与去重 · 适合公众号选题初筛</p>
      <div class="summary"><strong>今日总结：</strong>{html.escape(summary_text)}</div>
      <div class="stats">
        <span class="pill">热点条目 {len(items)}</span>
      </div>
    </header>
    <section class="grid">{"".join(cards)}</section>
    {error_block}
  </main>
</body>
</html>
"""


def main():
    """Main entry point."""
    base_dir = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Hotspot Radar - Multi-source hotspot aggregator"
    )
    parser.add_argument("--domain", default="ai", help="Domain key (default: ai)")
    parser.add_argument("--top", type=int, default=10, help="Number of top items (default: 10)")
    parser.add_argument(
        "--config",
        default=str(base_dir / "references" / "sources.json"),
        help="Path to config JSON"
    )
    parser.add_argument(
        "--out",
        default=str(base_dir / "output"),
        help="Output directory"
    )
    parser.add_argument(
        "--dingtalk",
        action="store_true",
        help="Send notification to DingTalk (requires DINGTALK_WEBHOOK_URL env var)"
    )
    parser.add_argument(
        "--feishu",
        action="store_true",
        help="Send notification to Feishu/Lark (requires FEISHU_WEBHOOK_URL env var)"
    )
    parser.add_argument(
        "--clear-cookies",
        action="store_true",
        help="Clear all saved cookies before fetching (force refresh)"
    )
    parser.add_argument(
        "--no-fallback",
        action="store_true",
        help="Don't use fallback data when scraping fails (skip failed sources)"
    )
    args = parser.parse_args()

    # Set global flag for fallback data usage
    global USE_FALLBACK_DATA
    USE_FALLBACK_DATA = not args.no_fallback

    # Clear cookies if requested
    data_dir = base_dir / "data"
    if args.clear_cookies:
        if data_dir.exists():
            for cookie_file in data_dir.glob("*_cookies.json"):
                try:
                    cookie_file.unlink()
                    print(f"已清除 cookies: {cookie_file.name}")
                except Exception as e:
                    print(f"清除 cookies 失败 {cookie_file.name}: {e}")
    else:
        # Auto-clear old cookies (older than 24 hours)
        cleared = auto_clear_old_cookies(data_dir, max_age_hours=24)
        if cleared > 0:
            print(f"自动清除了 {cleared} 个过期 cookies 文件")

    # Load domain configuration
    domain_cfg = load_domain(args.config, args.domain)
    sources = domain_cfg["sources"]
    if not sources:
        raise RuntimeError("当前领域未配置 sources")

    today = dt.datetime.now().strftime("%Y-%m-%d")
    items, errors = build_digest(sources, domain_cfg["keywords"], args.top)

    # Generate HTML page
    page = render_page(
        domain_cfg["title"],
        domain_cfg["summary_hint"],
        items,
        errors,
        today
    )

    # Write output files
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_path = out_dir / f"hotspots-{args.domain}-{today}.html"
    latest_path = out_dir / f"hotspots-{args.domain}-latest.html"
    output_path.write_text(page, encoding="utf-8")
    latest_path.write_text(page, encoding="utf-8")

    print(f"已生成: {output_path}")
    print(f"最新文件: {latest_path}")
    print(f"条目数: {len(items)} | 异常信源: {len(errors)}")

    # Send Feishu notification if requested
    if args.feishu:
        try:
            high_cnt = sum(1 for it in items if float(it.get("importance", 0)) >= 4.0)
            summary = f"{len(items)} 条热点，{high_cnt} 条高优先级"

            notifier = FeishuNotifier()
            success = notifier.send_hotspot_summary(
                title=domain_cfg["title"],
                items=items,
                summary=summary,
                source_count=len(sources),
                error_count=len(errors)
            )

            if success:
                print("飞书通知已发送")
            else:
                print("飞书通知发送失败（已记录错误）")
        except Exception as e:
            print(f"飞书通知跳过: {e}")

    # Send DingTalk notification if requested
    if args.dingtalk:
        try:
            high_cnt = sum(1 for it in items if float(it.get("importance", 0)) >= 4.0)
            summary = f"{len(items)} 条热点，{high_cnt} 条高优先级"

            notifier = DingTalkNotifier()
            success = notifier.send_hotspot_summary(
                title=domain_cfg["title"],
                items=items,
                summary=summary,
                source_count=len(sources),
                error_count=len(errors)
            )

            if success:
                print("钉钉通知已发送")
            else:
                print("钉钉通知发送失败（已记录错误）")
        except Exception as e:
            print(f"钉钉通知跳过: {e}")


if __name__ == "__main__":
    main()
