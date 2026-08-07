# -*- coding: utf-8 -*-
"""Deterministic Traditional-Chinese intent extraction + rewrite engine.

Runs locally (localhost server) or inside Pyodide. It does not call any API.
"""
import json
import re
from pathlib import Path
from typing import Dict, Any, List

VERSION = "1.8.0"



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
    "會議紀錄","排班表","附件一","附件二","附件三","報告","報表","附件","檔案","文件","資料","簡報","版本","紀錄","病歷","表單","排班","名單","清單","合約","契約","企劃","計畫","專案","程式","網站","頁面","功能","需求","測試","結果","作業","工作","信件","訊息","申請","公文","預算","發票","收據","照片","圖片","表格","時程","進度"
]
FACT_MARKERS = re.compile(r"(?:目前|現在|仍|還|尚|已經|已|未|沒有|缺|少|錯|有誤|不一致|未完成|沒完成|未收到|沒收到|尚未|進度|版本|結果|狀況|情況)")
ACTION_MARKERS = re.compile(r"(?:請|麻煩|煩請|務必|需要|要|給我|幫我|協助|記得|完成|補|改|修|重做|回覆|回信|上傳|提供|確認|處理|提交|繳交|整理|說明|聯絡|排班|停止|不要再)")
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
    s = re.sub(r"(?:你|妳)?\s*(?:到底)?\s*(?:是|是不是)?\s*(?:白癡|智障|腦殘|廢物|垃圾|低能|沒腦|有沒有腦|看不懂人話|聽不懂人話)(?:嗎|嘛|是不是)?", "", s)
    s = re.sub(r"^(?:你|妳)\s*(?:到底)?\s*", "", s)
    for term in TOXIC_TERMS:
        s = s.replace(term, "")
    s = re.sub(r"[~～%％]{2,}", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip(" ，。；：、！？\t\n")


def split_clauses(raw: str) -> List[str]:
    first = re.split(r"[。！？!?；;\n]+|，(?=(?:因為|由於|為了|避免|以免|以利|以便|今天|今日|明天|明日|後天|本週|這週|下週|上午|中午|下午|晚上|晚間|早上|凌晨|下班|現在|目前|請|麻煩|給我|務必|需要|要))", normalize(raw))
    parts = []
    for part in first:
        parts.extend(re.split(r"，(?=[^，]{0,28}(?:還沒|尚未|沒有收到|少了|缺了|又錯|不一致|未完成|沒完成))", part))
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
        (r"重新?做|全部重做|重做", lambda: (f"重新檢查並修正{obj}後上傳更新版本" if has_upload else f"重新檢查並修正{obj}") if obj else "重新檢查並修正相關內容"),
        (r"補齊|補上|補件|補資料", lambda: (f"補上缺少的{obj}後上傳更新版本" if has_upload else f"補上缺少的{obj}") if obj else "補上缺少的內容"),
        (r"改掉|改好|改完|修好|修正|修改", lambda: (f"檢查並修正{obj}後上傳更新版本" if has_upload else f"檢查並修正{obj}") if obj else "檢查並修正相關內容"),
        (r"回我|回覆我|回覆|回信", lambda: "回覆目前處理情形"),
        (r"交出來|交給我|繳交|提交", lambda: f"提交{obj}的完成版本" if obj else "提交完成版本"),
        (r"上傳", lambda: f"上傳{obj}的更新版本" if obj and obj != "版本" else "上傳更新版本"),
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
    return bool(re.search(r"(?:確認|修正|補|回覆|說明|提交|上傳|整理|提供|完成|比對|更新|安排|提出|列出|停止|依|保留|通知|通報|處理|協調|核對|檢查|改用|移除)", value))


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
    return {"score": score, "hits": hits, "issueHits": issue_hits}


def retrieve_safe_scenario(raw: str, current: Dict[str, Any]) -> Dict[str, Any] | None:
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
    can_autofill = sc.get("safeAutofillAction") is not False and bool(ev["issueHits"])
    return {
        "scenarioId": sc.get("id", ""), "category": sc.get("category", ""), "score": round(score, 1),
        "matchedKeywords": ev["hits"][:8], "sensitive": bool(sc.get("sensitive")), "guardrail": sc.get("guardrail", ""),
        "purpose": sc.get("purpose", "general"),
        "topic": normalize(current.get("topic", "")) or normalize(sc.get("topic", "")),
        "fact": current_fact or (normalize((sc.get("facts") or [""])[0]) if ev["issueHits"] else ""),
        "action": current_action if safe_action_looks_executable(current_action) else (normalize((sc.get("actions") or [""])[0]) if can_autofill else ""),
        "reason": normalize(current.get("reason", "")) or (normalize((sc.get("reasons") or [""])[0]) if can_autofill else "")
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


def extract_intent(raw: str, manual: Dict[str, Any]) -> Dict[str, Any]:
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
    corpus_suggestion = retrieve_safe_scenario(raw, {"topic":topic,"fact":fact,"action":action,"reason":reason})
    if corpus_suggestion:
        if not manual.get("topic") and (not topic or topic in ("工作事項", "工作狀況")):
            topic = corpus_suggestion.get("topic", "") or topic
        if not manual.get("fact") and not fact and corpus_suggestion.get("fact"):
            fact = corpus_suggestion["fact"]
        if not manual.get("action") and not safe_action_looks_executable(action) and corpus_suggestion.get("action"):
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
        if style == "formal":
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
    extraction = extract_intent(raw, manual)
    substance = extraction["substance"]
    styles = ("natural","concise","formal")
    audience = options.get("audience", "coworker")
    purpose = options.get("purpose", "general")
    variants = {variant_style: rewrite_variant(substance, variant_style, audience, purpose) for variant_style in styles}

    # 每一個候選版本都獨立做原句複製防護，避免切換版本後繞過限制。
    if raw:
        for variant_style in styles:
            candidate = variants.get(variant_style, "")
            if not candidate or not similarity_guard(raw, candidate):
                continue
            decopied = decopy_substance(substance)
            replacement = rewrite_variant(decopied, variant_style, audience, purpose)
            if similarity_guard(raw, replacement):
                replacement = ""
            variants[variant_style] = replacement

    requested_style = options.get("rewriteStyle", "natural")
    style = requested_style if variants.get(requested_style) else next((s for s in styles if variants.get(s)), requested_style)
    selected = variants.get(style, "")
    copyable = bool(selected and not extraction["needsInput"])
    notice = ("Python 引擎已從原始訊息抽取工作意圖並重新生成文字；三種候選皆檢查原句直接複製風險。" if copyable else "原始訊息中缺少足夠的可執行工作內容，或候選版本未通過原句複製防護；Python 引擎未自行捏造要求。")
    safe_variants = variants if copyable else {}
    return {"engine":"python","engineVersion":VERSION,"extraction":extraction,"substance":substance,"text":selected if copyable else "","copyable":copyable,"notice":notice,"style":style,"qualityScore":100 if copyable else 0,"variants":safe_variants,"quality":{k:(100 if variants.get(k) else 0) for k in styles},"coverage":{},"variantCoverage":{}}


def process_json(payload_json: str) -> str:
    return json.dumps(process(json.loads(payload_json)), ensure_ascii=False)


if __name__ == "__main__":
    import sys
    payload = json.loads(sys.stdin.read() or "{}")
    print(json.dumps(process(payload), ensure_ascii=False, indent=2))
