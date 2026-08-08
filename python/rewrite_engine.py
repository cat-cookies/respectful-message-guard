# -*- coding: utf-8 -*-
"""Traditional-Chinese intent extraction + quality-weighted rewrite engine.

Runs locally (localhost server) or inside Pyodide. It does not call any API.
"""
import json
import re
import random
import math
import hashlib
from pathlib import Path
from typing import Dict, Any, List

VERSION = "1.10.0"



def _load_safe_corpus() -> Dict[str, Any]:
    # Browser/Pyodide injects this JSON once at engine startup. Local Python
    # reads the exact same JS corpus file, so both paths use one source of truth.
    injected = globals().get("safe_corpus_json")
    if injected:
        try:
            return json.loads(str(injected))
        except Exception:
            pass
    try:
        path = Path(__file__).resolve().parent.parent / "safe-message-corpus.js"
        text = path.read_text(encoding="utf-8")
        m = re.search(r"/\*__JSON_START__\*/\s*(.*?)\s*/\*__JSON_END__\*/", text, re.S)
        if m:
            return json.loads(m.group(1))
    except Exception:
        pass
    return {"scenarios": [], "examples": [], "version": "unavailable"}


SAFE_CORPUS = _load_safe_corpus()
SAFE_SCENARIOS = SAFE_CORPUS.get("scenarios", []) if isinstance(SAFE_CORPUS, dict) else []
SAFE_STYLE_PATTERNS = SAFE_CORPUS.get("stylePatterns", {}) if isinstance(SAFE_CORPUS, dict) else {}

def _rng(seed: str, salt: str = "") -> random.Random:
    digest = hashlib.sha256((str(seed) + "|" + str(salt)).encode("utf-8")).digest()
    return random.Random(int.from_bytes(digest[:8], "big"))

def weighted_list_choice(values, seed: str, field: str) -> str:
    vals = [normalize(x) for x in (values or []) if normalize(x)]
    if not vals: return ""
    if len(vals) == 1: return vals[0]
    base = [0.48, 0.29, 0.15, 0.08]
    weights = [base[i] if i < len(base) else max(0.025, 0.08 / max(1, i-2)) for i in range(len(vals))]
    cursor = _rng(seed, field).random() * sum(weights)
    for val, weight in zip(vals, weights):
        cursor -= weight
        if cursor <= 0: return val
    return vals[0]

DEADLINE_PATTERNS = [
    re.compile(r"(?:今天|今日|明天|明日|後天|本週|這週|下週|週[一二三四五六日天]|星期[一二三四五六日天])(?:上午|中午|下午|晚上|晚間|早上|凌晨|下班)?\s*(?:(?:[一二三四五六七八九十兩]|\d{1,2})\s*[點時](?:\d{1,2}\s*分)?|\d{1,2}[:：]\d{2})?\s*(?:前|以前|之前|內)?"),
    re.compile(r"(?:\d{1,2}\s*月\s*\d{1,2}\s*日|\d{1,2}[/-]\d{1,2})(?:上午|中午|下午|晚上|晚間|早上)?\s*(?:\d{1,2}(?:[:：]\d{2})?|\d{1,2}\s*[點時])?\s*(?:前|以前|之前|內)?"),
    re.compile(r"(?:\d+(?:\.\d+)?\s*(?:分鐘|小時|天|日|工作日|週|星期))\s*(?:內|之內|以前|前)"),
    re.compile(r"(?:上午|中午|下午|晚上|晚間|早上|凌晨)\s*(?:[一二三四五六七八九十兩]|\d{1,2})(?:[:：]\d{2}|\s*[點時](?:\d{1,2}\s*分)?)\s*(?:前|以前|之前)?"),
    re.compile(r"(?:[一二三四五六七八九十兩]|\d{1,2})(?:[:：]\d{2}|\s*[點時](?:\d{1,2}\s*分)?)\s*(?:前|以前|之前)"),
    re.compile(r"(?:今天|今日|明天|明日|本週|這週|下週)?\s*下班前")
]

TOXIC_TERMS = [
    "白癡","智障","腦殘","廢物","垃圾","王八蛋","混蛋","低能","沒腦","有沒有腦","看不懂人話","聽不懂人話",
    "幹你娘","幹妳娘","操你","綠茶婊","賤人","婊子","滾蛋","去死","搞什麼","是在搞什麼","這麼簡單也不會"
]
THREAT_TAIL = re.compile(r"(?:不然|否則|再不|要不然|敢不|如果不|做不到就|沒做完就|再給我).*$")
POWER_THREAT = re.compile(r"(?:不用來了|不用做了|滾蛋|走人|開除|解僱|扣薪|扣你薪水|考績給你|讓你待不下去|封殺你|黑名單|不排班|砍班|不續約).*$")
EMOTION_PREFIX = re.compile(r"^(?:你到底|到底在|你是在|你是有|有沒有搞錯|搞什麼|是在搞什麼|講幾次|要講幾次|我不是說過|我講過幾次|你怎麼又|怎麼還|為什麼又|為什麼還)\s*")
POLITE_PREFIX = re.compile(r"^(?:麻煩|煩請|拜託|請|務必|給我|現在|立刻|馬上|趕快|趕緊|記得|需要|要)\s*")

OBJECT_TERMS = [
    "核銷資料","請款資料","會議紀錄","排班表","附件一","附件二","附件三","憑證","核銷","請款",
    "報告","報表","附件","檔案","文件","資料","簡報","版本","紀錄","病歷","表單","排班","名單","清單",
    "合約","契約","企劃","計畫","專案","程式","網站","頁面","功能","需求","測試","結果","作業","工作",
    "信件","訊息","申請","公文","預算","發票","收據","照片","圖片","表格","時程","進度"
]
FACT_MARKERS = re.compile(r"(?:目前|現在|仍|還|尚|已經|已|未|沒有|缺|少|錯|有誤|不一致|失敗|退件|沒過|未過|未完成|沒完成|未收到|沒收到|尚未|進度|版本|結果|狀況|情況)")
ACTION_MARKERS = re.compile(r"(?:請|麻煩|煩請|務必|需要|要|給我|幫我|協助|記得|完成|補|改|修|重做|回覆|回信|上傳|提供|確認|校對|核對|查核|處理|提交|繳交|整理|說明|聯絡|排班|重排|調整|安排|停止|不要再)")
REASON_MARKERS = re.compile(r"(?:因為|由於|為了|避免|以免|以利|以便|影響|需要於|需於|供後續|後續要|才能)")
EMOTIONAL_META = re.compile(r"(?:到底要講幾次|到底講幾次|要講幾次|講幾次才懂|到底懂不懂|到底會不會|有沒有搞錯|搞什麼|是在搞什麼)")


def normalize(text: Any) -> str:
    s = str(text or "").replace("\r\n", "\n").replace("\r", "\n")
    s = s.replace(",", "，").replace(";", "；").replace(":", "：").replace("?", "？").replace("!", "！")
    s = re.sub(r"[\u200B\u200C\u2060\uFEFF]", "", s)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def clean_clause(text: str) -> str:
    s = normalize(text)
    s = re.sub(r"\[(?:貼圖|sticker)\]|【貼圖】|\(貼圖\)", "", s, flags=re.I)
    s = THREAT_TAIL.sub("", s)
    s = POWER_THREAT.sub("", s)
    s = EMOTION_PREFIX.sub("", s)
    s = EMOTIONAL_META.sub("", s)
    s = re.sub(r"(?:到底在幹嘛|在幹嘛)", "", s)
    s = re.sub(r"(?:你|妳)?\s*(?:到底)?\s*(?:是|是不是)?\s*(?:白癡|智障|腦殘|廢物|垃圾|低能|沒腦|有沒有腦|看不懂人話|聽不懂人話)(?:嗎|嘛|是不是)?", "", s)
    s = re.sub(r"^(?:你|妳)\s*(?:到底)?\s*", "", s)
    for term in TOXIC_TERMS:
        s = s.replace(term, "")
    s = re.sub(r"(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|惡搞|搞砸|搞爛|雷包|豬隊友|拖油瓶|狗屁|鬼東西)", "", s)
    s = re.sub(r"[~～%％]{2,}", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip(" ，。；：、！？\t\n")


def split_clauses(raw: str) -> List[str]:
    parts = re.split(r"[。！？!?；;\n，,]+", normalize(raw))
    return [x for x in (clean_clause(p) for p in parts) if x]


def extract_deadline(raw: str) -> str:
    text = normalize(raw)
    for rx in DEADLINE_PATTERNS:
        m = rx.search(text)
        if m:
            return re.sub(r"\s+", " ", m.group(0)).strip()
    return ""


def remove_deadline(text: str, deadline: str) -> str:
    return clean_clause(text.replace(deadline, "") if deadline else text)


def detect_object(text: str) -> str:
    for term in OBJECT_TERMS:
        if term in text:
            if term == "附件":
                m = re.search(r"附件\s*[一二三四五六七八九十0-9A-Za-z-]*", text)
                if m:
                    return re.sub(r"\s+", "", m.group(0))
            return term
    return ""


def canonical_action(clause: str, topic: str = "") -> str:
    text = remove_deadline(clean_clause(clause), extract_deadline(clause))
    text = POLITE_PREFIX.sub("", text)
    text = re.sub(r"^(?:你|妳|您)\s*", "", text).strip()
    action_obj = detect_object(text)
    topic_obj = detect_object(topic)
    obj = topic_obj if action_obj == "版本" and topic_obj else (action_obj or topic_obj)
    has_upload = "上傳" in text
    rules = [
        (r"重排(?:班)?|重新排班|調整班表|重排班表", lambda: "重新確認並調整排班"),
        (r"重新?做|全部重做|重做", lambda: (f"重新檢查並修正{obj}後上傳更新版本" if has_upload else f"重新檢查並修正{obj}") if obj else "重新檢查並修正相關內容"),
        (r"補齊|補上|補件|補資料", lambda: (f"補上缺少的{obj}後上傳更新版本" if has_upload else f"補上缺少的{obj}") if obj else "補上缺少的內容"),
        (r"改掉|改好|改完|修好|修正|修改", lambda: (f"檢查並修正{obj}後上傳更新版本" if has_upload else f"檢查並修正{obj}") if obj else "檢查並修正相關內容"),
        (r"回我|回覆我|回覆|回信", lambda: "回覆目前處理情形"),
        (r"交出來|交給我|繳交|提交", lambda: f"提交{obj}的完成版本" if obj else "提交完成版本"),
        (r"上傳", lambda: f"上傳{obj}的更新版本" if obj and obj != "版本" else "上傳更新版本"),
        (r"校對|核對|查核", lambda: f"重新檢查並確認{obj}內容" if obj else "重新檢查並確認相關內容"),
        (r"確認", lambda: f"確認{obj}內容" if obj else "確認相關內容"),
        (r"處理", lambda: "完成相關處理"),
        (r"整理", lambda: f"整理{obj}" if obj else "整理相關資料"),
        (r"補充", lambda: "補充必要內容"),
        (r"說明", lambda: "說明目前狀況"),
        (r"聯絡", lambda: "完成必要聯繫"),
        (r"排班", lambda: "確認排班安排")
    ]
    for pattern, fn in rules:
        if re.search(pattern, text):
            return fn()
    text = re.sub(r"^把", "", text)
    text = re.sub(r"(?:一下|給我|好不好)$", "", text).strip()
    return text[:70].rstrip("，；：、 ")



SUBJECTIVE_WORK_LABEL_RX = re.compile(r"(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|惡搞|搞砸|搞爛|亂七八糟|一團亂|爛透|爛到不行|很爛|超爛|有夠爛|垃圾|狗屁|鬼東西|雷包|豬隊友|拖油瓶)")
PERSON_ATTACK_RX = re.compile(r"(?:白癡|智障|腦殘|低能|廢物|沒腦|腦袋有洞|腦子進水|沒帶腦|蠢蛋|笨蛋|弱智|神經病)")
FINANCE_RX = re.compile(r"(?:核銷|請款|報帳|報銷|發票|收據|憑證|費用|帳務|會計)")
SCHEDULE_RX = re.compile(r"(?:排班|班表|班次|輪班|值班|調班|缺班|出勤|人力配置|時段衝突)")
DOCUMENT_RX = re.compile(r"(?:報告|報表|文件|簡報|附件|版本|表單|紀錄|公文|企劃|計畫書)")

def concrete_topic_from_text(text: str) -> str:
    value = normalize(text)
    if not value: return ""
    if FINANCE_RX.search(value):
        return "核銷" if "核銷" in value else ("請款" if "請款" in value else "核銷與請款")
    if SCHEDULE_RX.search(value): return "排班"
    m = re.search(r"(?:報告|報表|簡報|附件|公文|文件|表單|紀錄|企劃|計畫書)", value)
    if m: return m.group(0)
    if re.search(r"(?:網站|程式|系統|功能|頁面|當機|閃退)", value):
        return "網站" if "網站" in value else ("程式" if "程式" in value else "系統")
    return ""

def neutralize_fact_semantics(text: str, topic: str = "") -> str:
    value = normalize(text)
    if not value: return ""
    had = bool(SUBJECTIVE_WORK_LABEL_RX.search(value) or PERSON_ATTACK_RX.search(value))
    value = re.sub(r"^(?:(?:你|妳|他|她|這|那)?\s*(?:在|又|一直|根本)?\s*)?(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|惡搞|搞砸|搞爛)(?:了)?\s*[，,；;：:]?\s*(?:(?:結果|所以)?\s*(?:導致|造成|害得|弄得)\s*)?", "", value)
    value = re.sub(r"^(?:目前|現階段|現在)?\s*(?:結果|所以)?\s*(?:導致|造成|害得|弄得)\s*", lambda m: "目前" if re.match(r"^(?:目前|現階段|現在)", m.group(0)) else "", value)
    value = SUBJECTIVE_WORK_LABEL_RX.sub("", value)
    value = PERSON_ATTACK_RX.sub("", value)
    value = re.sub(r"(?:核銷|報帳)(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)", "核銷作業未能完成", value)
    value = re.sub(r"請款(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)", "請款作業未能完成", value)
    value = value.strip(" ，。；：、！？")
    if not value and had and topic:
        if SCHEDULE_RX.search(topic): value = "目前排班安排需要重新確認"
        elif FINANCE_RX.search(topic): value = "目前核銷或請款內容需要重新確認"
        else: value = f"目前{topic}內容需要重新確認"
    if value.startswith(("核銷作業","請款作業")): value = "目前" + value
    return normalize(value)

def neutralize_action_semantics(text: str, topic: str = "", fact: str = "", reason: str = "") -> str:
    value = normalize(text)
    if not value: return ""
    value = PERSON_ATTACK_RX.sub("", SUBJECTIVE_WORK_LABEL_RX.sub("", value))
    value = re.sub(r"^(?:給我|馬上|立刻|現在就|趕快|趕緊|務必給我)\s*", "", value)
    value = re.sub(r"(?:不然|否則|要不然).*$", "", value)
    value = re.sub(r"^(?:請|麻煩|煩請)\s*", "", value).strip()
    context = f"{fact} {topic} {reason}"
    concrete = concrete_topic_from_text(context)
    if re.fullmatch(r"(?:校對|核對|檢查|確認)(?:一下)?", value):
        if FINANCE_RX.search(context): return "重新核對核銷資料與相關憑證"
        if SCHEDULE_RX.search(context): return "重新確認班表與班次安排"
        if concrete: return f"重新檢查並確認{concrete}內容"
        return "重新檢查並確認相關內容"
    if re.fullmatch(r"(?:處理|弄好|弄完|改好)(?:一下)?", value):
        return f"確認{concrete}目前狀況並完成必要處理" if concrete else "確認目前狀況並完成必要處理"
    return normalize(value)

def reconcile_structured_meaning(substance: Dict[str, Any]) -> Dict[str, Any]:
    s = dict(substance)
    selected = normalize(s.get("topic", ""))
    details = normalize(" ".join(str(s.get(k, "")) for k in ("fact","action","reason")))
    inferred = concrete_topic_from_text(details)
    if not selected or not details or not inferred: return s
    ss, sf, sd = bool(SCHEDULE_RX.search(selected)), bool(FINANCE_RX.search(selected)), bool(DOCUMENT_RX.search(selected))
    ds, df, dd = bool(SCHEDULE_RX.search(details)), bool(FINANCE_RX.search(details)), bool(DOCUMENT_RX.search(details))
    mismatch = (ss and not ds and (df or dd)) or (sf and not df and (ds or dd)) or (sd and not dd and (ds or df))
    if mismatch: s["topic"] = inferred
    return s

def canonical_fact(clause: str) -> str:
    text = clean_clause(clause)
    text = re.sub(r"^(?:目前)?(?:你|妳|您)\s*", "", text)
    text = re.sub(r"^(?:怎麼|為什麼)\s*", "", text).strip()
    text = re.sub(r"^(.{1,35})又少了(?=，|$)", r"仍缺少\1", text)
    text = re.sub(r"^(.{1,35})(?:少了|缺了)(?=，|$)", r"缺少\1", text)
    text = re.sub(r"^(?:現在)?(?:還沒|尚未)(?:回覆我|回我|回覆)$", "目前尚未收到回覆", text)
    m = re.match(r"^(.{1,35})又少了$", text)
    if m: text = "目前仍缺少" + m.group(1)
    else:
        m = re.match(r"^(.{1,35})(?:少了|缺了)$", text)
        if m: text = "目前缺少" + m.group(1)
    m = re.match(r"^(.{1,35})又錯(?:一堆|很多|了)$", text)
    if m:
        text = "目前" + m.group(1) + "仍有多處需要修正"
    else:
        m = re.match(r"^(.{1,35})錯(?:一堆|很多)$", text)
        if m:
            text = "目前" + m.group(1) + "有多處需要修正"
        else:
            m = re.match(r"^(.{1,35})(?:有很多錯|錯誤很多)$", text)
            if m:
                text = "目前" + m.group(1) + "有多處需要修正"
    text = re.sub(r"^(.{1,35})還沒(?:回覆|回我)$", "目前尚未收到回覆", text)
    text = re.sub(r"^現在還沒(?:回覆|回我)$", "目前尚未收到回覆", text)
    text = re.sub(r"版本日期也跟(.+?)講的不一樣", r"版本日期與\1確認內容不一致", text)
    text = re.sub(r"版本日期跟(.+?)講的不一樣", r"版本日期與\1確認內容不一致", text)
    text = text.replace("還沒", "尚未").replace("沒有收到", "尚未收到").replace("亂七八糟", "內容需要重新確認").replace("做成這樣", "版本需要修正")
    text = re.sub(r"^現在才發現", "目前發現", text)
    text = re.sub(r"^(?:目前)?(?:結果|所以)?\s*(?:導致|造成|害得|弄得)\s*", "", text)
    text = re.sub(r"^(?:核銷|報帳)(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)$", "核銷作業未能完成", text)
    text = re.sub(r"^請款(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)$", "請款作業未能完成", text)
    if text and not re.match(r"^(?:目前|現在|仍|尚|已|未|這次|本次)", text):
        text = "目前" + text
    return text[:110].rstrip("，；：、 ")


def canonical_reason(clause: str) -> str:
    text = clean_clause(clause)
    text = re.sub(r"^(?:因為|由於|為了|考量到|考量|主要是因為)\s*", "", text).strip()
    if not text:
        return ""
    text = re.sub(r"主管(.+?)要開會", r"主管\1有會議安排", text)
    text = re.sub(r"(.+?)要開會", r"\1有會議安排", text)
    if re.match(r"^(?:避免|以免|以利|以便|供)", text) or "影響" in text:
        return text
    if re.search(r"(?:有會議安排|需要使用|要使用|需使用|後續作業|後續處理)", text):
        return text
    return "需要" + text


def infer_topic(clauses: List[str], action: str, fact: str) -> str:
    combined = " ".join([fact, action] + clauses)
    obj = detect_object(combined)
    mapping = {"排班":"排班安排","排班表":"排班表","報告":"報告","報表":"報表","附件":"附件","檔案":"檔案","文件":"文件","資料":"資料","簡報":"簡報","版本":"版本內容","程式":"程式","網站":"網站","功能":"功能","需求":"需求","進度":"工作進度","紀錄":"紀錄"}
    if obj:
        return mapping.get(obj, obj)
    if "回覆" in combined:
        return "回覆進度"
    return "工作事項" if action else ("工作狀況" if fact else "")



def safe_action_looks_executable(action: str) -> bool:
    value = normalize(action)
    if not value:
        return False
    if re.search(r"(?:滾|離職|開除|解僱|扣薪|扣獎金|扣考績|不續約|黑名單|封殺|閉嘴|去死|做不好|不配合就|否則)", value):
        return False
    return bool(re.search(r"(?:確認|修正|補|回覆|說明|提交|上傳|整理|提供|完成|比對|更新|安排|提出|列出|停止|依|保留|通知|通報|處理|協調|調整|重排|排班|校對|查核|核對|檢查|改用|移除)", value))


def scenario_evidence(raw: str, scenario: Dict[str, Any]) -> Dict[str, Any]:
    text = normalize(raw).lower()
    hits = []
    score = 0.0
    for keyword in scenario.get("keywords", []) or []:
        k = normalize(keyword).lower()
        if k and k in text:
            hits.append(keyword)
            score += min(5.0, max(1.2, len(k) * 0.7))
    topic = normalize(scenario.get("topic", "")).lower()
    if topic and topic in text:
        score += 2.5
    issue_hits = [x for x in hits if str(x) not in str(scenario.get("topic", "")) and str(scenario.get("topic", "")) not in str(x)]
    if len(hits) >= 2:
        score += 1.5
    if issue_hits:
        score += 1.5
    # 敏感情境即使只有一個強烈關鍵詞，也應帶出防護情境；
    # 這些情境的 safeAutofillAction=false，故只提高防護檢索，不會捏造命令。
    if scenario.get("sensitive") and hits:
        score += 2.4
    subjective_complaint = bool(re.search(r"(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|搞砸|搞爛|亂七八糟|很爛|超爛|爛透|垃圾|狗屁|鬼東西|雷包|豬隊友|拖油瓶)", text))
    if not scenario.get("sensitive") and subjective_complaint and hits:
        score += 1.8
    if subjective_complaint and str(scenario.get("id", "")).startswith("doc_quality_"):
        score += 2.2
    return {"score": score, "hits": hits, "issueHits": issue_hits, "subjectiveComplaint": subjective_complaint}


def retrieve_safe_scenario(raw: str, current: Dict[str, Any], random_seed: str = "") -> Dict[str, Any] | None:
    ranked = []
    for sc in SAFE_SCENARIOS:
        ev = scenario_evidence(raw, sc)
        if ev["score"] >= 4.2 and ev["hits"]:
            ranked.append((ev["score"], len(ev["issueHits"]), str(sc.get("id", "")), sc, ev))
    if not ranked:
        return None
    ranked.sort(key=lambda x: (-x[0], -x[1], x[2]))
    score, _, _, sc, ev = ranked[0]
    current_action = normalize(current.get("action", ""))
    current_fact = normalize(current.get("fact", ""))
    has_issue_evidence = bool(ev["issueHits"]) or bool(ev.get("subjectiveComplaint"))
    can_autofill = sc.get("safeAutofillAction") is not False and has_issue_evidence
    chosen_action = current_action if safe_action_looks_executable(current_action) else (weighted_list_choice(sc.get("actions"), random_seed, "action") if can_autofill else "")
    if sc.get("id") == "early_issue_disclosure" and re.search(r"(?:怕被罵|怕被念|不敢說|不敢講|怕講錯|怕說錯|被抓包|先講|先回報)", normalize(raw)) and can_autofill:
        chosen_action = weighted_list_choice(sc.get("actions"), random_seed, "disclosure-action")
    return {
        "scenarioId": sc.get("id", ""), "category": sc.get("category", ""), "score": round(score, 1),
        "matchedKeywords": ev["hits"][:8], "sensitive": bool(sc.get("sensitive")), "guardrail": sc.get("guardrail", ""),
        "purpose": sc.get("purpose", "general"),
        "topic": normalize(current.get("topic", "")) or normalize(sc.get("topic", "")),
        "fact": current_fact or (weighted_list_choice(sc.get("facts"), random_seed, "fact") if has_issue_evidence else ""),
        "action": chosen_action,
        "reason": normalize(current.get("reason", "")) or (weighted_list_choice(sc.get("reasons"), random_seed, "reason") if can_autofill else "")
    }


def detect_audience_hint(raw: str):
    text = normalize(raw)
    m = re.match(r"^\s*(主管|經理|主任|組長|老闆|長官|教授|老師|客戶|家長|同學|同事|各位|您好)[您好\s，：,:]*", text)
    if not m:
        return None
    cue = m.group(1)
    if re.match(r"^(?:主管|經理|主任|組長|老闆|長官|教授|老師)$", cue):
        value = "supervisor"
    elif cue == "客戶":
        value = "client"
    elif cue in ("家長", "同學"):
        value = "student"
    elif cue == "同事":
        value = "coworker"
    else:
        value = "public"
    return {"value": value, "label": cue, "cue": cue}


def extract_intent(raw: str, manual: Dict[str, Any], random_seed: str = "") -> Dict[str, Any]:
    clauses = split_clauses(raw)
    deadline = manual.get("deadline") or extract_deadline(raw)
    reason_clause = next((c for c in clauses if REASON_MARKERS.search(c)), "")
    action_clause = next((c for c in clauses if c != reason_clause and ACTION_MARKERS.search(c) and not EMOTIONAL_META.search(c) and not (re.search(r"(?:還沒|尚未|沒有|未)(?:收到)?(?:回覆|回信|處理|完成)", c) and not re.search(r"(?:請|麻煩|給我|務必|今天|明天|前|內)", c))), "")
    fact_clause = next((c for c in clauses if c not in (action_clause, reason_clause) and FACT_MARKERS.search(c) and not REASON_MARKERS.search(c)), "")
    action0 = manual.get("action") or canonical_action(action_clause, manual.get("topic", ""))
    fact0 = manual.get("fact") or (canonical_fact(remove_deadline(fact_clause, deadline)) if fact_clause else "")
    topic = manual.get("topic") or infer_topic(clauses, action0, fact0)
    action = manual.get("action") or (canonical_action(action_clause, topic) if action_clause else action0) or (canonical_action(clauses[-1], topic) if topic and clauses else "")
    fact = manual.get("fact") or fact0
    reason = manual.get("reason") or (canonical_reason(remove_deadline(reason_clause, deadline)) if reason_clause else "")
    corpus_suggestion = retrieve_safe_scenario(raw, {"topic":topic,"fact":fact,"action":action,"reason":reason}, random_seed)
    if corpus_suggestion:
        if not manual.get("topic") and (not topic or topic in ("工作事項", "工作狀況")):
            topic = corpus_suggestion.get("topic", "") or topic
        if not manual.get("fact") and not fact and corpus_suggestion.get("fact"):
            fact = corpus_suggestion["fact"]
        if not manual.get("action") and not safe_action_looks_executable(action) and corpus_suggestion.get("action"):
            action = corpus_suggestion["action"]
        if not manual.get("action") and corpus_suggestion.get("scenarioId") == "early_issue_disclosure" and corpus_suggestion.get("action") and re.search(r"(?:怕被罵|怕被念|不敢說|不敢講|怕講錯|怕說錯|被抓包|先講|先回報)", normalize(raw)):
            action = corpus_suggestion["action"]
        if not manual.get("reason") and not reason and corpus_suggestion.get("reason"):
            reason = corpus_suggestion["reason"]
    if not manual.get("action") and not safe_action_looks_executable(action):
        action = ""
    substance = {"topic":topic,"fact":fact,"action":action,"deadline":deadline,"reason":reason,"basis":manual.get("basis", ""),"tone":manual.get("tone", "directive")}
    fields = [k for k in ("topic","fact","action","deadline","reason","basis") if not str(manual.get(k, "")).strip() and str(substance.get(k, "")).strip()]
    confidence = "high" if action and (fact or topic) else ("medium" if action else ("low" if fact else "insufficient"))
    return {"substance":substance,"clauses":clauses,"audienceHint":detect_audience_hint(raw),"corpusSuggestion":corpus_suggestion,"extractedFields":fields,"confidence":confidence,"needsInput":not action and not fact}


def sentence(text: str) -> str:
    text = normalize(text).strip("。！？ ")
    return text + "。" if text else ""


def _reason_for_link(reason: str, style: str) -> str:
    value = normalize(reason).strip("。！？ ")
    if not value:
        return ""
    if style == "formal":
        if value.startswith("避免"):
            return "以避免" + value[2:]
        if value.startswith("確保"):
            return "以確保" + value[2:]
        if value.startswith(("以利", "以便", "以避免", "以確保", "為配合", "為")):
            return value
        if value.startswith("方便"):
            return "以利" + value[2:]
        return value
    return value


def rewrite_variant(s: Dict[str, Any], style: str, audience: str, purpose: str) -> str:
    topic, fact, action, deadline, reason = [normalize(s.get(k, "")) for k in ("topic","fact","action","deadline","reason")]
    polite = "您" if audience in ("supervisor","client","student","public") else "你"
    greeting = "您好，" if audience in ("client","student","public") and style != "formal" else ""
    topic_core = re.sub(r"(?:處理|確認|修正|安排|內容|事項|進度)$", "", topic)
    topic_redundant = bool(topic_core and len(topic_core) >= 2 and topic_core in (fact + action))

    fact_text = fact
    if topic and fact and not topic_redundant and topic not in fact:
        fact_text = f"關於{topic}，{fact}"
    elif topic and not fact and not topic_redundant:
        fact_text = f"關於{topic}"

    if action:
        cond = re.match(r"^((?:如|若|如果)[^，。；]{1,90})[，,](.+)$", action)
        if cond and not deadline:
            tail = cond.group(2).strip()
            if tail.startswith("先"):
                tail = "請先" + tail[1:]
            elif not tail.startswith("請"):
                tail = "請" + tail
            action_text = cond.group(1) + "，" + tail
        elif style == "formal":
            action_text = f"請於{deadline}{action}" if deadline else f"請{action}"
        elif style == "concise":
            action_text = f"請在{deadline}{action}" if deadline else f"請{action}"
        else:
            tone = s.get("tone", "directive")
            if polite == "您":
                verb = "麻煩您" if tone == "cooperative" else "請您"
            else:
                verb = "麻煩" if tone == "cooperative" else "請"
            action_text = f"{verb}在{deadline}{action}" if deadline else f"{verb}{action}"
    else:
        action_text = ""

    reason_text = _reason_for_link(reason, style)

    # 精簡版刻意只保留「狀況＋下一步」，避免和自然版只差標點。
    if style == "concise":
        text = "".join([sentence(fact_text) if fact_text else "", sentence(action_text) if action_text else ""])
        text = re.sub(r"。{2,}", "。", text).replace("請請", "請")
        if greeting and text and not text.startswith("您好"):
            text = greeting + text
        return text

    pieces = []
    if fact_text:
        pieces.append(sentence(fact_text))

    # 將目的／風險理由接回工作行動，避免生成「避免……。」這類碎裂句。
    if action_text:
        if reason_text and re.match(r"^(?:避免|確保|方便|供|以利|以便|以避免|以確保|為配合|為)", reason_text):
            pieces.append(sentence(f"{action_text}，{reason_text}"))
        elif reason_text and purpose == "refuse":
            pieces.append(sentence(reason_text))
            pieces.append(sentence(action_text))
        elif reason_text:
            pieces.append(sentence(f"因為{reason_text}，{action_text}"))
        else:
            pieces.append(sentence(action_text))
    elif reason_text:
        pieces.append(sentence(reason_text))

    text = "".join(pieces)
    text = re.sub(r"。{2,}", "。", text)
    text = text.replace("請請", "請").replace("麻煩請", "麻煩")
    if greeting and text and not text.startswith("您好"):
        text = greeting + text
    return text



def _post_process_candidate(text: str, style: str, audience: str) -> str:
    value = normalize(text)
    value = re.sub(r"。{2,}", "。", value)
    value = value.replace("請請", "請").replace("請先先", "請先").replace("麻煩先先", "麻煩先").replace("麻煩請", "麻煩").replace("您您", "您")
    value = value.replace("請完成完成", "請完成").replace("請先完成完成", "請先完成").replace("主要是因為讓", "主要是為了讓").replace("主要是因為建立", "主要是為了建立").replace("因為讓", "為了讓").replace("因為建立", "為了建立")
    value = re.sub(r"麻煩((?:如|若|如果)[^，。]{1,90})，", r"\1，麻煩", value)
    value = re.sub(r"請先((?:如|若|如果)[^，。]{1,90})，(?:先)?", r"\1，請先", value)
    value = re.sub(r"請((?:如|若|如果)[^，。]{1,90})，", r"\1，請", value)
    value = value.replace("完成必要確認，並重新確認並", "完成確認後，再").replace("完成必要確認，並確認並", "完成確認後，再")
    value = value.replace("，，", "，")
    if audience in ("client", "student", "public") and style != "formal" and value and not value.startswith("您好"):
        value = "您好，" + value
    return value


def _score_candidate(text: str, style: str, tone: str = "directive") -> float:
    if not text: return -9999
    score = 100.0
    sentences = [x for x in re.split(r"(?<=[。！？!?])", text) if x.strip()]
    for phrase in ("說明如下", "相關原因", "相關程序", "工作必要性：", "職務依據："):
        if phrase in text: score -= 12 if style != "formal" else 5
    if style == "natural" and text.startswith("關於"): score -= 5
    if style == "natural" and not re.search(r"(?:上述|茲|爰|說明如下)", text): score += 6
    if style == "natural":
        if tone == "cooperative":
            if re.search(r"(?:麻煩|想確認|可以|一起)", text): score += 4
            if re.search(r"(?:請於|務必|應立即)", text): score -= 5
        elif tone == "formal":
            if re.search(r"(?:請|後續|目前)", text): score += 3
            if re.search(r"(?:麻煩|想確認一下|這邊想|這邊先確認|所以想請|可以幫忙)", text): score -= 30
        else:
            if "請" in text: score += 2
            if "麻煩" in text: score -= 1
    if style == "concise" and len(sentences) <= 3: score += 5
    if style == "concise" and len(text) > 180: score -= (len(text)-180)/12
    please = text.count("請")
    if please > 2: score -= (please-2)*8
    if text.count("麻煩") > 1: score -= (text.count("麻煩")-1)*6
    if re.search(r"(?:請請|請先先|麻煩先先|麻煩請|需要要|您您|，，|。。)", text): score -= 35
    if re.search(r"^請[^。]{1,90}。(?:目前|現階段|現在|本次|這次)", text): score -= 14
    if style == "natural" and re.search(r"^(?:目前|現階段|現在|本次|這次)[^。]{1,100}。請", text): score += 5
    if re.search(r"^關於[^。]{1,24}。請", text): score -= 18
    if len(set(x.strip("。！？!? ") for x in sentences)) < len(sentences): score -= 16
    return score


def _pattern_candidates(s: Dict[str, Any], style: str, audience: str, scenario_id: str) -> List[str]:
    if not scenario_id: return []
    patterns = list(SAFE_STYLE_PATTERNS.get(style, []) or [])[:10]
    if not patterns: return []
    topic, fact, action, deadline, reason = [normalize(s.get(k, "")) for k in ("topic","fact","action","deadline","reason")]
    if not fact or not action: return []
    fact_no = re.sub(r"^(?:目前|現在|現階段)", "", fact)
    reason_no = re.sub(r"^(?:以利|以便)", "", reason)
    action_value = (("於" if style == "formal" else "在") + deadline + action) if deadline else action
    values = {"topic":topic or "這項工作","fact":fact,"fact_no_prefix":fact_no,"action":action_value,"reason":reason or "以利後續作業","reason_no_prefix":reason_no or "後續作業順利進行"}
    out=[]
    for pattern in patterns:
        text=str(pattern)
        for key,val in values.items(): text=text.replace("{"+key+"}", val)
        if audience in ("supervisor","client","student","public") and style == "natural":
            text = re.sub(r"(?<!您)麻煩(?!您)", "麻煩您", text, count=1)
            text = re.sub(r"(?<!您)請(?!您)", "請您", text, count=1)
        out.append(_post_process_candidate(text, style, audience))
    return out


def _common_candidates(s: Dict[str, Any], style: str, audience: str, purpose: str) -> List[str]:
    base = rewrite_variant(s, style, audience, purpose)
    topic, fact, action, deadline, reason = [normalize(s.get(k, "")) for k in ("topic","fact","action","deadline","reason")]
    tone = s.get("tone", "directive")
    if not action: return [base]
    who = "您" if audience in ("supervisor","client","student","public") else ""
    if style == "formal":
        act = f"請於{deadline}{action}" if deadline else f"請{action}"
        alts = [f"{sentence(fact)}{sentence(act + (('，' + _reason_for_link(reason, style)) if reason else ''))}", f"{sentence('就' + topic + '部分，' + fact if topic and fact else fact)}{sentence(act)}", f"{sentence(fact)}{sentence('後續' + act)}"]
    elif style == "concise":
        act = f"請在{deadline}{action}" if deadline else f"請{action}"
        alts = [f"{sentence(fact)}{sentence(act)}", f"{sentence(fact)}{sentence('下一步' + act)}"]
    else:
        verb = ("麻煩" + who) if tone == "cooperative" else ("請" + who)
        act = f"{verb}在{deadline}{action}" if deadline else f"{verb}{action}"
        alts = [f"{sentence(fact)}{sentence(act + (('，' + reason) if reason else ''))}", f"{sentence('這邊先確認一下' + topic if topic else '')}{sentence(fact)}{sentence(act)}", f"{sentence(fact)}{sentence('後續' + act)}", f"{sentence(fact + '，所以想請' + ('您' if who else '') + action)}{sentence(reason) if reason else ''}"]
    return [_post_process_candidate(x, style, audience) for x in [base, *alts] if x]


def weighted_rewrite_variant(s: Dict[str, Any], style: str, audience: str, purpose: str, scenario_id: str, seed: str) -> tuple[str, float]:
    candidates = _common_candidates(s, style, audience, purpose) + _pattern_candidates(s, style, audience, scenario_id)
    unique=[]; seen=set()
    for text in candidates:
        text=_post_process_candidate(text, style, audience)
        if text and text not in seen: seen.add(text); unique.append(text)
    scored=sorted(((text,_score_candidate(text,style,s.get("tone","directive"))) for text in unique), key=lambda x:(-x[1],len(x[0])))
    if not scored: return "", -9999
    pool = scored
    if style == "natural" and s.get("tone", "directive") == "formal":
        restrained = [x for x in scored if not re.search(r"(?:麻煩|想確認|這邊想|這邊先確認|所以想請|可以幫忙)", x[0])]
        if restrained:
            pool = restrained
    max_score=pool[0][1]; window=7 if style=="formal" else 9
    eligible=[x for x in pool if x[1]>=max_score-window][:10]
    if len(eligible)==1: return eligible[0]
    temperature=3.2 if style=="natural" else 2.7
    weights=[math.exp((score-max_score)/temperature)*(1/(1+i*.08)) for i,(_,score) in enumerate(eligible)]
    cursor=_rng(seed,f"rewrite|{style}").random()*sum(weights)
    for item,weight in zip(eligible,weights):
        cursor-=weight
        if cursor<=0: return item
    return eligible[0]


def decopy_substance(source: Dict[str, Any]) -> Dict[str, Any]:
    s = dict(source or {})
    original_fact = normalize(s.get("fact", ""))
    fact = re.sub(r"^目前(.+?)仍有多處需要修正$", r"目前\1有幾處內容需要調整", original_fact)
    fact = re.sub(r"^目前尚未收到回覆$", "目前還沒有收到回覆", fact)
    fact = re.sub(r"^(?:仍|目前)缺少(.+)$", r"目前\1尚未齊全", fact)
    fact = re.sub(r"版本日期與(.+?)確認內容不一致", r"版本日期目前和\1確認的內容有落差", fact)
    if fact and fact == original_fact:
        fact = re.sub(r"^目前", "現階段", fact) if fact.startswith("目前") else "目前確認到：" + fact

    original_action = normalize(s.get("action", ""))
    action = re.sub(r"^重新檢查並修正(.+)$", r"完成\1的重新檢查與修正", original_action)
    action = re.sub(r"^檢查並修正(.+?)後上傳更新版本$", r"完成\1檢查與修正後，再上傳更新版本", action)
    action = re.sub(r"^補上缺少的(.+?)後上傳更新版本$", r"將\1補齊後，再上傳更新版本", action)
    action = re.sub(r"^補上缺少的(.+)$", r"將\1補齊", action)
    action = re.sub(r"^回覆目前處理情形$", "說明目前的處理進度", action)
    action = re.sub(r"^上傳(.+?)的更新版本$", r"完成更新後上傳\1", action)
    action = re.sub(r"^確認(.+?)內容$", r"完成\1內容確認", action)
    if action and action == original_action:
        action = f"依目前需求完成「{action}」"

    original_reason = normalize(s.get("reason", ""))
    reason = re.sub(r"^主管(.+?)有會議安排$", r"\1另有主管會議時程", original_reason)
    if reason and reason == original_reason and not re.match(r"^(?:避免|以免|以利|以便|供)", reason):
        reason = "考量" + reason
    s.update({"fact": fact, "action": action, "reason": reason})
    return s


def similarity_guard(source: str, output: str) -> bool:
    src = re.sub(r"[，。；：、！？!?\s]", "", normalize(source))
    sentences = [re.sub(r"[，。；：、！？!?\s]", "", x) for x in re.split(r"[。！？!?]", normalize(output))]
    return any(len(s) >= 10 and s in src for s in sentences)


def process(payload: Dict[str, Any]) -> Dict[str, Any]:
    raw = payload.get("raw", "")
    manual = payload.get("substance") or {}
    options = payload.get("options") or {}
    random_seed = str(options.get("randomSeed") or "default")
    extraction = extract_intent(raw, manual, random_seed)
    substance = dict(extraction["substance"])
    substance["fact"] = neutralize_fact_semantics(substance.get("fact", ""), substance.get("topic", ""))
    substance["action"] = neutralize_action_semantics(substance.get("action", ""), substance.get("topic", ""), substance.get("fact", ""), substance.get("reason", ""))
    substance["reason"] = normalize(PERSON_ATTACK_RX.sub("", SUBJECTIVE_WORK_LABEL_RX.sub("", substance.get("reason", ""))))
    substance = reconcile_structured_meaning(substance)
    extraction["substance"] = substance
    extraction["needsInput"] = not bool(substance.get("action") or substance.get("fact"))
    styles = ("natural","concise","formal")
    audience = options.get("audience", "coworker")
    purpose = options.get("purpose", "general")
    scenario_id = options.get("safeCorpusScenarioId") or (extraction.get("corpusSuggestion") or {}).get("scenarioId", "")
    weighted = {variant_style: weighted_rewrite_variant(substance, variant_style, audience, purpose, scenario_id, random_seed) for variant_style in styles}
    variants = {k:v[0] for k,v in weighted.items()}
    quality = {k:round(v[1],1) for k,v in weighted.items()}

    # 每一個候選版本都獨立做原句複製防護，避免切換版本後繞過限制。
    if raw:
        for variant_style in styles:
            candidate = variants.get(variant_style, "")
            if not candidate or not similarity_guard(raw, candidate):
                continue
            decopied = decopy_substance(substance)
            replacement = weighted_rewrite_variant(decopied, variant_style, audience, purpose, scenario_id, random_seed + "|decopy")[0]
            if similarity_guard(raw, replacement):
                replacement = ""
            variants[variant_style] = replacement

    requested_style = options.get("rewriteStyle", "natural")
    style = requested_style if variants.get(requested_style) else next((s for s in styles if variants.get(s)), requested_style)
    selected = variants.get(style, "")
    copyable = bool(selected and not extraction["needsInput"])
    notice = ("Python 引擎已從原始訊息抽取工作意圖並重新生成文字；三種候選皆檢查原句直接複製風險。" if copyable else "原始訊息中缺少足夠的可執行工作內容，或候選版本未通過原句複製防護；Python 引擎未自行捏造要求。")
    safe_variants = variants if copyable else {}
    return {"engine":"python","engineVersion":VERSION,"extraction":extraction,"substance":substance,"text":selected if copyable else "","copyable":copyable,"notice":notice,"style":style,"qualityScore":quality.get(style,0) if copyable else 0,"variants":safe_variants,"quality":quality,"coverage":{},"variantCoverage":{}}


def process_json(payload_json: str) -> str:
    return json.dumps(process(json.loads(payload_json)), ensure_ascii=False)


if __name__ == "__main__":
    import sys
    payload = json.loads(sys.stdin.read() or "{}")
    print(json.dumps(process(payload), ensure_ascii=False, indent=2))
