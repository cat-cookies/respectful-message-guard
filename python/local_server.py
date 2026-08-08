# -*- coding: utf-8 -*-
"""Local launcher: serves the static site and Python rewrite API on localhost."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import os
import sys
import webbrowser

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from rewrite_engine import process, VERSION

HOST = "127.0.0.1"
PORT = int(os.environ.get("RMG_PORT", "8765"))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/api/health":
            self._json({"ok": True, "engine": "python", "version": VERSION})
            return
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/rewrite":
            self.send_error(404)
            return
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 200000)
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self._json(process(payload))
        except Exception as exc:
            self._json({"ok": False, "error": str(exc)}, status=400)

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Do not log request bodies; static/API paths only.
        sys.stdout.write("[local] " + (fmt % args) + "\n")

if __name__ == "__main__":
    url = f"http://{HOST}:{PORT}/"
    print(f"訊息溝通風險檢核器 v{VERSION}")
    print(f"Python 潤稿引擎：{url}")
    print("關閉此視窗即可停止本機服務。輸入文字不會離開本機。")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
