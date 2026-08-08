# -*- coding: utf-8 -*-
"""Local launcher + loopback LLM proxy for Respectful Message Guard 2.3.0.

The browser UI and risk corpora are served from 127.0.0.1. Qwen3.5-0.8B-GGUF
is expected to be loaded by LM Studio, llama.cpp server, or another local
OpenAI-compatible server. This proxy only forwards to loopback addresses and
never stores request/response text.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import os
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = int(os.environ.get("RMG_PORT", "8765"))
VERSION = "2.3.0"
MAX_BODY = 2 * 1024 * 1024
TIMEOUT = 120


def _loopback_base(value: str) -> str:
    raw = (value or "http://127.0.0.1:1234/v1").strip().rstrip("/")
    parsed = urlparse(raw)
    if parsed.scheme != "http":
        raise ValueError("本機 LLM proxy 只允許 http loopback 端點")
    host = (parsed.hostname or "").lower()
    if host not in {"127.0.0.1", "localhost", "::1"}:
        raise ValueError("本機 LLM proxy 只允許 127.0.0.1／localhost／::1")
    path = parsed.path.rstrip("/")
    if not path.endswith("/v1"):
        path = (path + "/v1").replace("//", "/")
    port = f":{parsed.port}" if parsed.port else ""
    authority = f"[{host}]{port}" if ":" in host and host != "localhost" else f"{host}{port}"
    return f"http://{authority}{path}"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Never print request bodies. Normal static/API paths only.
        print("[local] " + (fmt % args))

    def _json(self, status: int, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            raise ValueError("請求內容大小不正確")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def _forward(self, url: str, api_key: str = "", payload=None, method="GET"):
        headers = {"Accept": "application/json"}
        body = None
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        req = Request(url, data=body, headers=headers, method=method)
        try:
            with urlopen(req, timeout=TIMEOUT) as res:
                data = res.read()
                self.send_response(res.status)
                self.send_header("Content-Type", res.headers.get("Content-Type", "application/json; charset=utf-8"))
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except HTTPError as e:
            data = e.read() or json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8")
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json; charset=utf-8"))
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except (URLError, TimeoutError) as e:
            self._json(502, {"error": f"無法連線本機 LLM：{e}"})

    def do_POST(self):
        if self.path not in {"/api/llm/models", "/api/llm/chat"}:
            return self._json(404, {"error": "Not found"})
        try:
            incoming = self._read_json()
            base = _loopback_base(str(incoming.get("baseUrl", "")))
            key = str(incoming.get("apiKey", "") or "")
            if self.path == "/api/llm/models":
                return self._forward(f"{base}/models", key, method="GET")
            request_payload = incoming.get("request")
            if not isinstance(request_payload, dict):
                raise ValueError("缺少 chat completion request")
            return self._forward(f"{base}/chat/completions", key, payload=request_payload, method="POST")
        except (ValueError, json.JSONDecodeError) as e:
            self._json(400, {"error": str(e)})
        except Exception as e:
            self._json(500, {"error": f"本機 LLM proxy 錯誤：{e}"})


if __name__ == "__main__":
    url = f"http://{HOST}:{PORT}/"
    print(f"訊息溝通風險檢核器 v{VERSION}")
    print(f"本機網站：{url}")
    print("LLM：Qwen3.5-0.8B-GGUF（LM Studio／OpenAI-compatible，預設 127.0.0.1:1234）")
    print("本機 proxy 只允許 loopback LLM 端點，不保存訊息。")
    print("關閉此視窗即可停止本機服務。")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
