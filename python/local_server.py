# -*- coding: utf-8 -*-
"""Local static launcher for Respectful Message Guard 2.1.1.

The rewrite model, corpora and scoring engine run in the browser. Python is used
only to serve the bundled files from 127.0.0.1 so browser APIs work under a
normal HTTP origin. No text is posted to this server and no network access is
required.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = int(os.environ.get("RMG_PORT", "8765"))
VERSION = "2.1.1"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, fmt, *args):
        print("[local] " + (fmt % args))

if __name__ == "__main__":
    url = f"http://{HOST}:{PORT}/"
    print(f"訊息溝通風險檢核器 v{VERSION}")
    print(f"本機網站：{url}")
    print("文字模型、語料庫與潤稿皆在瀏覽器本機執行；Python 只提供靜態網站。")
    print("關閉此視窗即可停止本機服務。")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
