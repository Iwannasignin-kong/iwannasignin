#!/usr/bin/env python3
"""Manual login for Tophub to save cookies."""

from playwright.sync_api import sync_playwright
import json
import os
import time
from pathlib import Path

print("=" * 60)
print("正在打开 Tophub 浏览器...")
print("=" * 60)
print("请在浏览器中完成以下操作：")
print("1. 如果有验证码，请完成验证")
print("2. 如果需要登录，请登录账号")
print("3. 确保能看到热点列表内容")
print("4. 等待 60 秒后自动保存 cookies...")
print("=" * 60)

with sync_playwright() as p:
    chrome_path = r"C:\Users\10360\AppData\Local\ms-playwright\chrome-win\chrome.exe"

    if os.path.exists(chrome_path):
        browser = p.chromium.launch(
            headless=False,  # 显示浏览器窗口
            executable_path=chrome_path
        )
    else:
        browser = p.chromium.launch(headless=False)

    context = browser.new_context(
        viewport={"width": 1280, "height": 800},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )

    page = context.new_page()
    page.goto("https://tophub.today/hot")

    # Wait for user to complete login/verification
    for i in range(60, 0, -5):
        print(f"等待中... {i} 秒后自动保存")
        time.sleep(5)

    # Save cookies
    cookies = context.cookies()
    data_dir = Path(__file__).parent.parent / "data"
    data_dir.mkdir(exist_ok=True)
    cookie_path = data_dir / "tophub_cookies.json"

    with open(cookie_path, "w", encoding="utf-8") as f:
        json.dump(cookies, f, ensure_ascii=False, indent=2)

    print(f"\nCookies 已保存到: {cookie_path}")
    print(f"共保存 {len(cookies)} 个 cookies")

    browser.close()

print("\n登录完成！现在可以正常使用 Tophub 数据源了。")
