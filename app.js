/* Respectful Message Guard 2.2.0 - consolidated production runtime */
/* Section 1: structured rewrite engine */
'use strict';

/*
 * Structured Chinese rewrite engine
 * ---------------------------------
 * Purpose: turn user-supplied structured work facts into natural Traditional
 * Chinese without using the raw/original message as generation material.
 *
 * Design constraints:
 * - high-quality weighted variation; text generation stays local;
 * - no network / no external model;
 * - never invent facts, legal conclusions, sanctions, dates, people or motives;
 * - basis/職務依據 is an internal safety field by default and is not exposed
 *   unless the user explicitly enables includeBasis;
 * - generate several candidates, score them for formulaic/repetitive wording,
 *   and probabilistically select among the highest-quality candidates.
 */

(function initRewriteEngine(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MESSAGE_REWRITE_ENGINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  const SAFE_CORPUS = (() => {
    if (typeof globalThis !== 'undefined' && globalThis.SAFE_MESSAGE_CORPUS_DATA) return globalThis.SAFE_MESSAGE_CORPUS_DATA;
    if (typeof module !== 'undefined' && module.exports) {
      try { return require('./safe-message-corpus.js'); } catch (_) { return { stylePatterns: {}, version: 'unavailable' }; }
    }
    return { stylePatterns: {}, version: 'unavailable' };
  })();

  // v2.1: embedded domain neural language model.  This is deliberately a
  // compact, task-specific GRU rather than a general-purpose cloud LLM.  It
  // runs entirely in the page and is used only to score fluency/transition
  // quality among already-safe candidates.  Safety and work-reasonableness
  // decisions remain in auditable rules.
  const DOMAIN_LM_DATA = (() => {
    if (typeof globalThis !== 'undefined' && globalThis.LOCAL_DOMAIN_LM_DATA) return globalThis.LOCAL_DOMAIN_LM_DATA;
    if (typeof module !== 'undefined' && module.exports) {
      try { return require('./model/local-domain-lm.js'); } catch (_) { return null; }
    }
    return null;
  })();

  function decodeFloat32Base64(value) {
    if (!value) return new Float32Array(0);
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
      const b = Buffer.from(value, 'base64');
      return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    }
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  function createDomainLanguageModel(data) {
    if (!data?.weights || !Array.isArray(data.tokens)) return null;
    let ready = false;
    let embedding, wih, whh, bih, bhh, outw, outb, stoi, byFirst;
    const V = Number(data.vocabSize || data.tokens.length);
    const E = Number(data.embeddingSize || 0);
    const H = Number(data.hiddenSize || 0);
    const cache = new Map();

    function ensure() {
      if (ready) return true;
      try {
        embedding = decodeFloat32Base64(data.weights.embedding);
        wih = decodeFloat32Base64(data.weights.weight_ih);
        whh = decodeFloat32Base64(data.weights.weight_hh);
        bih = decodeFloat32Base64(data.weights.bias_ih);
        bhh = decodeFloat32Base64(data.weights.bias_hh);
        outw = decodeFloat32Base64(data.weights.out_weight);
        outb = decodeFloat32Base64(data.weights.out_bias);
        stoi = new Map(data.tokens.map((t, i) => [t, i]));
        byFirst = new Map();
        for (const phrase of (data.phrases || [])) {
          if (!phrase || phrase.length < 2) continue;
          const list = byFirst.get(phrase[0]) || [];
          list.push(phrase); byFirst.set(phrase[0], list);
        }
        for (const list of byFirst.values()) list.sort((a, b) => b.length - a.length);
        ready = embedding.length === V * E && wih.length === 3 * H * E && whh.length === 3 * H * H;
      } catch (_) { ready = false; }
      return ready;
    }

    function tokenize(text) {
      if (!ensure()) return [];
      const ids = [stoi.get('<BOS>') ?? 1];
      const unk = stoi.get('<UNK>') ?? 3;
      const value = String(text || '').replace(/\s+/gu, '');
      let i = 0;
      while (i < value.length) {
        let picked = '';
        for (const phrase of (byFirst.get(value[i]) || [])) {
          if (value.startsWith(phrase, i)) { picked = phrase; break; }
        }
        if (picked) { ids.push(stoi.get(picked) ?? unk); i += picked.length; }
        else { ids.push(stoi.get(value[i]) ?? unk); i += 1; }
      }
      ids.push(stoi.get('<EOS>') ?? 2);
      return ids;
    }

    function sigmoid(x) { return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)); }

    function step(tokenId, h) {
      const gatesX = new Float32Array(3 * H);
      const eoff = tokenId * E;
      for (let g = 0; g < 3 * H; g++) {
        let sum = bih[g] || 0;
        const row = g * E;
        for (let j = 0; j < E; j++) sum += wih[row + j] * embedding[eoff + j];
        gatesX[g] = sum;
      }
      const r = new Float32Array(H), z = new Float32Array(H), n = new Float32Array(H);
      for (let i = 0; i < H; i++) {
        let hr = bhh[i] || 0, hz = bhh[H + i] || 0;
        const rr = i * H, rz = (H + i) * H;
        for (let j = 0; j < H; j++) { hr += whh[rr + j] * h[j]; hz += whh[rz + j] * h[j]; }
        r[i] = sigmoid(gatesX[i] + hr);
        z[i] = sigmoid(gatesX[H + i] + hz);
      }
      for (let i = 0; i < H; i++) {
        let hn = bhh[2 * H + i] || 0;
        const rn = (2 * H + i) * H;
        for (let j = 0; j < H; j++) hn += whh[rn + j] * h[j];
        n[i] = Math.tanh(gatesX[2 * H + i] + r[i] * hn);
      }
      const next = new Float32Array(H);
      for (let i = 0; i < H; i++) next[i] = (1 - z[i]) * n[i] + z[i] * h[i];
      return next;
    }

    function logProbTarget(h, target) {
      let max = -Infinity;
      const logits = new Float32Array(V);
      for (let v = 0; v < V; v++) {
        let x = outb[v] || 0;
        const row = v * H;
        for (let j = 0; j < H; j++) x += outw[row + j] * h[j];
        logits[v] = x; if (x > max) max = x;
      }
      let denom = 0;
      for (let v = 0; v < V; v++) denom += Math.exp(logits[v] - max);
      return logits[target] - max - Math.log(denom || 1);
    }

    function score(text) {
      const key = String(text || '');
      if (!key) return -20;
      if (cache.has(key)) return cache.get(key);
      if (!ensure()) return -6;
      const ids = tokenize(key);
      if (ids.length < 2) return -10;
      let h = new Float32Array(H), total = 0, count = 0;
      for (let i = 0; i < ids.length - 1; i++) {
        h = step(ids[i], h);
        total += logProbTarget(h, ids[i + 1]); count++;
      }
      const avg = total / Math.max(1, count);
      cache.set(key, avg);
      if (cache.size > 600) cache.delete(cache.keys().next().value);
      return avg;
    }

    return { score, version: data.version || 'unknown', type: data.type || 'domain-gru' };
  }

  const DOMAIN_LM = createDomainLanguageModel(DOMAIN_LM_DATA);

  // Corpus-derived transition model.  It gives every adjacent character/token
  // sequence a local weight based on how often it occurs in safe work messages
  // versus the bullying/high-risk lexicon.  This is the transparent "接龍"
  // layer: the candidate generator proposes several clause orders, then these
  // transition probabilities help choose combinations that actually read like
  // ordinary work communication instead of mechanically concatenated fields.
  const RISK_CORPUS_FOR_REWRITE = (() => {
    if (typeof globalThis !== 'undefined' && globalThis.BULLYING_CORPUS_DATA) return globalThis.BULLYING_CORPUS_DATA;
    if (typeof module !== 'undefined' && module.exports) {
      try { return require('./bullying-corpus.js'); } catch (_) { return { phraseEntries: [] }; }
    }
    return { phraseEntries: [] };
  })();

  const TRANSITION_MODEL = (() => {
    const safe2 = new Map(), safe3 = new Map(), risk2 = new Map(), risk3 = new Map();
    const compact = x => String(x || '').normalize('NFKC').replace(/[\s「」『』（）()【】\[\]]+/gu, '');
    const add = (map, gram, n = 1) => map.set(gram, (map.get(gram) || 0) + n);
    const grams = (text, n) => {
      const value = compact(text);
      const out = [];
      for (let i = 0; i <= value.length - n; i++) out.push(value.slice(i, i + n));
      return out;
    };
    for (const ex of (SAFE_CORPUS.examples || []).slice(0, 6000)) {
      for (const g of grams(ex.text, 2)) add(safe2, g);
      for (const g of grams(ex.text, 3)) add(safe3, g);
    }
    for (const entry of (RISK_CORPUS_FOR_REWRITE.phraseEntries || []).slice(0, 8000)) {
      const phrase = entry.phrase || '';
      const w = Math.max(1, Math.min(5, Number(entry.weight || 8) / 8));
      for (const g of grams(phrase, 2)) add(risk2, g, w);
      for (const g of grams(phrase, 3)) add(risk3, g, w);
    }
    function score(text) {
      let sum = 0, count = 0;
      for (const [n, sm, rm] of [[2, safe2, risk2], [3, safe3, risk3]]) {
        for (const g of grams(text, n)) {
          const s = sm.get(g) || 0, r = rm.get(g) || 0;
          // Smoothed log-odds. Common safe transitions are rewarded; transitions
          // disproportionately common in risk phrases are penalized.
          sum += Math.log((s + 1.5) / (r * 2.2 + 1.5));
          count += 1;
        }
      }
      if (!count) return 0;
      return Math.max(-10, Math.min(9, (sum / count) * 3.2));
    }
    return { score, safeBigramCount: safe2.size, safeTrigramCount: safe3.size, riskBigramCount: risk2.size };
  })();

  const END_PUNCT = /[。！？!?]$/u;

  const GENERIC_FORMULAIC = [
    '說明如下', '上述事項', '相關原因、影響或程序', '工作必要性或職務依據',
    '依既定規範、權限及正式程序辦理', '如有客觀困難', '請具體說明，以便協調後續處理', '以利後續作業'
  ];

  const PURPOSE_CLOSINGS = {
    remind: {
      cooperative: ['如果進度上有卡住的地方，也可以直接說，我們再一起確認。', '若目前有影響進度的情況，也請一併告知。'],
      directive: ['若無法如期完成，請在期限前告知目前進度與預計完成時間。', '如果時程有變動，請提早告知目前進度。', '若進度和原定時程不同，請先回覆預計完成時間。'],
      formal: ['如無法於期限內完成，請於期限前說明原因及預計完成時間。', '如預計無法如期完成，請於期限前回覆目前進度及後續時程。', '如時程需調整，請於原期限前提出並說明預計完成時間。']
    },
    correct: {
      cooperative: ['如果對版本或處理方式有不同理解，可以直接提出來確認。', '若有哪一處和你的理解不同，可以一起確認後再處理。'],
      directive: ['若對修正內容有疑問，請在處理前先確認。', '如果對要求有不同理解，請先提出來確認。', '若有不清楚的地方，先確認後再處理。'],
      formal: ['如對事實、版本或處理標準有疑義，請於期限前提出。', '如對修正範圍或判斷基準有疑義，請先提出具體內容確認。', '如對本次處理內容有不同理解，請於執行前提出說明。']
    },
    rule: {
      cooperative: ['如果實際執行上有特殊情況，可以提出來一起確認。'],
      directive: ['如有例外情形，請先說明具體狀況，再確認後續處理方式。', '若現場情況與一般規則不同，請先提出再確認處理方式。', '如果有特殊情況，先把具體狀況說明清楚再處理。'],
      formal: ['如有例外或無法依規定辦理之情形，請先提出具體事由並循正式程序確認。', '如有例外適用之必要，請先敘明具體事由並完成確認程序。', '如實際情形無法依一般規定辦理，請先提出具體事實及處理依據。']
    },
    refuse: {
      cooperative: ['如果需要，我可以再一起確認其他可行的處理方式。'],
      directive: ['如需改採其他方式，請提出具體需求後再確認。', '如果需要其他處理方式，請把需求說明清楚後再確認。', '若原方式不適用，可以提出其他可行方案再討論。'],
      formal: ['如需採行其他方案，請循正式程序提出並確認其適法性與可行性。', '如需變更處理方式，請提出具體方案並完成必要確認。', '如另有處理需求，請依權責及程序提出具體方案。']
    },
    schedule: {
      cooperative: ['如果時段上有衝突，也請告知可配合的時間，我們再調整。'],
      directive: ['若時段無法配合，請一併回覆可行的替代時間。', '如果原時段有衝突，請直接提供可以配合的時間。', '若目前排定時間不方便，請回覆替代時段。'],
      formal: ['如無法配合排定時段，請於期限前提出可行之替代時段。', '如排定時段有衝突，請於期限前回覆可配合之替代時間。', '如需調整時段，請於期限前提出可行時間，以利後續安排。']
    },
    general: {
      cooperative: ['如果有不同理解，也可以直接提出來確認。'],
      directive: ['如有需要釐清之處，請一併回覆。', '若有不同理解，請直接指出需要確認的地方。', '如果有哪一點需要再確認，請一併提出。'],
      formal: ['如對內容有疑義，請提出具體說明。', '如有不同意見或需補充之處，請提出具體內容。', '如需進一步釐清，請提出具體事項。']
    }
  };

  function normalize(text) {
    return String(text || '')
      .normalize('NFKC')
      .replace(/[\u200B\u200C\u2060\uFEFF]/gu, '')
      .replace(/\r\n?/g, '\n')
      .replace(/,/g, '，')
      .replace(/;/g, '；')
      .replace(/:/g, '：')
      .replace(/\?/g, '？')
      .replace(/!/g, '！')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*([，。；：、！？])\s*/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function stripEnd(text) {
    return normalize(text).replace(/[。！？!?；;，,\s]+$/gu, '').trim();
  }

  function sentence(text) {
    const value = normalize(text);
    if (!value) return '';
    return END_PUNCT.test(value) ? value : `${value}。`;
  }

  function stripLeadingAction(text) {
    return stripEnd(text)
      .replace(/^(?:麻煩|煩請|拜託)?(?:請)?(?:務必)?(?:協助)?(?:幫忙)?\s*/u, '')
      .replace(/^(?:請|麻煩|煩請|務必)\s*/u, '')
      .trim();
  }

  function stripLeadingReason(text) {
    return stripEnd(text)
      .replace(/^(?:原因(?:是|為)?|主要原因(?:是|為)?|因為|由於|考量|考慮到)\s*/u, '')
      .trim();
  }

  function naturalize(text) {
    let value = stripEnd(text);
    if (!value) return '';
    value = value
      .replace(/需於/g, '需要在')
      .replace(/須於/g, '需要在')
      .replace(/需在/g, '需要在')
      .replace(/尚未/g, '還沒有')
      .replace(/尚缺(?:少)?/g, '還缺')
      .replace(/此項/g, '這項')
      .replace(/該項/g, '這項')
      .replace(/未能/g, '無法')
      .replace(/予以(?=(?:確認|處理|回覆|提供|補充|修正|調整|說明|辦理|檢核|查核))/g, '')
      .replace(/以避免/g, '避免')
      .replace(/避免後續使用(?!到)/g, '避免後續使用到')
      .replace(/進行(?=(?:確認|回覆|處理|檢核|查核|修正|調整|彙整|上傳|簽核|安排|討論|說明))/g, '')
      .replace(/與(?=[\u3400-\u9FFF])/gu, '和');

    // 「且」直接改成「也」容易產生「也版本日期」這類殘句；
    // 一般工作訊息使用「而且」可保留原有主詞結構，又較自然。
    value = value.replace(/，且/g, '，而且');
    return value;
  }

  function formalize(text) {
    let value = stripEnd(text);
    if (!value) return '';
    value = value
      .replace(/我這邊/g, '目前')
      .replace(/跟/g, '與')
      .replace(/需要在/g, '需於')
      .replace(/麻煩/g, '請')
      .replace(/可以/g, '得');
    return value;
  }

  function normalizeDeadline(text, style) {
    const value = stripEnd(text);
    if (!value) return '';
    if (style === 'formal') return value.replace(/^在/u, '').replace(/^於/u, '');
    return value.replace(/^於/u, '').replace(/^在/u, '');
  }

  function deadlineForAction(text) {
    const value = stripEnd(text).replace(/^在/u, '').replace(/^於/u, '');
    if (!value) return '';
    // 欄位兼容「期限」與「回覆時間」：只有明確的單一時刻才自動補「前」。
    // 「明天上午」「三個工作日內」「8月10日前」等則原樣保留，避免改變語意。
    if (/(?:前|以前|之前|內|當日|當天|上午|下午|晚上|早上|中午|本週|下週|明天|今日|今天)/u.test(value)) return value;
    if (/^(?:凌晨|早上|上午|中午|下午|晚上)?\s*\d{1,2}(?::\d{2}|點|時)(?:\d{1,2}分)?$/u.test(value)) return `${value}前`;
    return value;
  }

  function personWords(audience) {
    if (audience === 'supervisor' || audience === 'client' || audience === 'student' || audience === 'public') {
      return { you: '您', possessive: '您的' };
    }
    return { you: '你', possessive: '你的' };
  }

  function actionSentence(action, deadline, tone, audience, style) {
    const rawAction = stripLeadingAction(style === 'formal' ? formalize(action) : naturalize(action));
    const time = deadlineForAction(normalizeDeadline(deadline, style));
    if (!rawAction) return '';

    const { you } = personWords(audience);
    const actionCore = rawAction;
    const temporal = actionCore.match(/^((?:排班|送出|執行|會議|上傳|處理|交付|簽核|發布|回覆)前)(?:，)?\s*(.+)$/u);
    const followUp = actionCore.match(/^後續(?:再)?\s*(.+)$/u);
    const conditional = actionCore.match(/^((?:如|若|如果)[^，。；]{1,90})[，,](.+)$/u);
    const thirdParty = /^(?:由|改由|交由|轉由|透過|經由)/u.test(actionCore);

    if (conditional && !time) {
      const tail = conditional[2].trim().replace(/^先/u, '請先').replace(/^(?!請)/u, '請');
      return `${conditional[1]}，${tail}${/[。！？!?]$/u.test(tail) ? '' : '。'}`;
    }

    if (temporal && !time) {
      const when = temporal[1];
      const core = temporal[2].replace(/^先/u, '');
      if (style === 'formal') return `${when}，請先${core}。`;
      if (style === 'concise') return `${when}請先${core}。`;
      if (audience === 'supervisor') return `${when}，請您先${core}。`;
      if (tone === 'cooperative') return `${when}，麻煩先${core}。`;
      return `${when}，請先${core}。`;
    }

    if (style === 'formal') {
      if (followUp) {
        const core = followUp[1];
        return time ? `後續請於${time}${core}。` : `後續請${core}。`;
      }
      if (time) return `請於${time}${actionCore}。`;
      return `請${actionCore}。`;
    }

    if (style === 'concise') {
      if (followUp) {
        const core = followUp[1];
        return time ? `${time}前後續請${core}。`.replace(/前前/u, '前') : `後續請${core}。`;
      }
      if (time) return `${time}請${actionCore.replace(/^請/u, '')}。`;
      return `請${actionCore}。`;
    }

    // 對服務對象／學生／民眾，第三方處理（「由個管師…」）不寫成「麻煩您由…」。
    if (audience === 'client' || audience === 'student' || audience === 'public') {
      if (thirdParty) {
        if (time) return `後續可在${time}${actionCore}。`;
        return `後續可${actionCore}。`;
      }
      if (followUp) {
        const core = followUp[1];
        if (time) return `後續再麻煩${you}在${time}${core}。`;
        return `後續再麻煩${you}${core}。`;
      }
      if (time) return `再麻煩${you}在${time}${actionCore}。`;
      return `再麻煩${you}${actionCore}。`;
    }

    // 對主管保持尊稱；對同事則避免每句都塞「你」。
    if (audience === 'supervisor') {
      if (followUp) {
        const core = followUp[1];
        if (time) return `後續再麻煩您在${time}${core}。`;
        return `後續再麻煩您${core}。`;
      }
      if (tone === 'cooperative') {
        if (time) return `麻煩您在${time}${actionCore}。`;
        return `麻煩您${actionCore}。`;
      }
      if (time) return `請您在${time}${actionCore}。`;
      return `請您${actionCore}。`;
    }

    if (followUp) {
      const core = followUp[1];
      if (tone === 'cooperative') return time ? `後續麻煩在${time}${core}。` : `後續麻煩${core}。`;
      return time ? `後續請在${time}${core}。` : `後續請${core}。`;
    }

    if (tone === 'cooperative') {
      if (time) return `麻煩在${time}${actionCore}。`;
      return `麻煩${actionCore}。`;
    }
    if (tone === 'formal') {
      if (time) return `請於${time}${actionCore}。`;
      return `請${actionCore}。`;
    }
    if (time) return `請在${time}${actionCore}。`;
    return `請${actionCore}。`;
  }

  function splitReasonClauses(reason, style) {
    const value = stripLeadingReason(style === 'formal' ? formalize(reason) : naturalize(reason));
    if (!value) return [];
    return value
      .split(/[；。\n]+/u)
      .flatMap(part => part.split(/，(?=(?:避免|確保|方便|以利|以便|供|為了|配合|需|須|應|需要|後續|明|今|本))/u))
      .map(stripEnd)
      .filter(Boolean);
  }

  function naturalReasonClause(clause, index = 0) {
    let raw = naturalize(clause);
    if (!raw) return '';

    // 「需要在明日上午會議前完成…」→「明日上午會議前還要完成…」較像真人工作訊息。
    raw = raw.replace(/^需要在(.+?前)(.+)$/u, '$1還要$2');
    raw = raw.replace(/^需要在((?:今天|今日|明天|明日|本週|下週|週[一二三四五六日天]|星期[一二三四五六日天]|上午|下午|晚上|早上|中午)[^，。]*?)(完成|確認|回覆|處理|提供|提交|補齊|彙整|上傳|簽核|安排|辦理)/u, '$1還要$2');

    if (/^以(?:利|便)/u.test(raw)) {
      const rest = raw.replace(/^以(?:利|便)/u, '');
      return `讓${rest}更順利`;
    }
    if (/^避免/u.test(raw)) return index > 0 ? raw.replace(/^避免/u, '也能避免') : raw;
    if (/^確保/u.test(raw)) return index > 0 ? raw.replace(/^確保/u, '也能確保') : raw;
    if (/^方便/u.test(raw)) return index > 0 ? raw.replace(/^方便/u, '也方便') : raw;
    if (/^供/u.test(raw)) return raw.replace(/^供/u, index > 0 ? '也方便' : '方便');
    if (/^需要(?:完成|進行|辦理|確認|彙整|審查|處理|提供|提交|上傳|簽核|安排)/u.test(raw)) {
      return raw.replace(/^需要/u, '後續還需要');
    }
    if (/^(?:需|須|應|需要)/u.test(raw) && index > 0) return `另外${raw}`;
    return raw;
  }

  function formalReasonClause(clause) {
    let raw = formalize(clause);
    if (!raw) return '';
    if (/^避免/u.test(raw)) return raw.replace(/^避免/u, '以避免');
    if (/^確保/u.test(raw)) return raw.replace(/^確保/u, '以確保');
    if (/^方便/u.test(raw)) return raw.replace(/^方便/u, '以利');
    if (/^供/u.test(raw)) return raw.replace(/^供/u, '以供');
    if (/^配合/u.test(raw)) return raw.replace(/^配合/u, '為配合');
    if (/^為了/u.test(raw)) return raw.replace(/^為了/u, '為');
    return raw;
  }

  function reasonSentence(reason, style) {
    const clauses = splitReasonClauses(reason, style);
    if (!clauses.length) return '';

    if (style === 'formal') {
      const rendered = clauses.map(formalReasonClause).filter(Boolean);
      if (!rendered.length) return '';
      if (rendered.length === 1) {
        const one = rendered[0];
        // 「以避免……。」單獨成句雖常見於公文片段，但不是完整自然句。
        if (/^以避免/u.test(one)) return sentence(`主要目的在於${one.replace(/^以/u, '')}`);
        if (/^以確保/u.test(one)) return sentence(`主要目的在於${one.replace(/^以/u, '')}`);
        if (/^以利/u.test(one)) return sentence(`此安排有助於${one.replace(/^以利/u, '')}`);
        if (/^以便/u.test(one)) return sentence(`此安排有助於${one.replace(/^以便/u, '')}`);
        if (/^(?:需|須|應|為|以供|為配合|作為)/u.test(one)) return sentence(one);
        return sentence(`此安排主要考量${one}`);
      }
      return sentence(rendered.join('，並'));
    }

    const rendered = clauses.map((c, i) => naturalReasonClause(c, i)).filter(Boolean);
    if (!rendered.length) return '';
    const text = rendered.join('，');
    if (/^(?:明|今|本|下週|後續|目前|需要|需|須|應)/u.test(text)) return sentence(text);
    if (/^(?:避免|確保|方便|供|配合|為了|以利|以便|降低|減少|讓)/u.test(text)) return sentence(`這樣可以${text}`);
    if (/^因/u.test(text)) return sentence(text);
    return sentence(`主要是因為${text}`);
  }

  function integratedActionReason(action, deadline, reason, tone, audience, style, purpose = 'general') {
    const actionBlock = actionSentence(action, deadline, tone, audience, style);
    const clauses = splitReasonClauses(reason, style);
    if (!actionBlock || !clauses.length) return actionBlock || reasonSentence(reason, style);

    const actionCore = actionBlock.replace(/[。！？!?]+$/u, '');
    if (style === 'formal') {
      const reasonBits = clauses.map(formalReasonClause).filter(Boolean);
      if (!reasonBits.length) return actionBlock;
      const first = reasonBits[0];
      const rest = reasonBits.slice(1);
      // 能作目的／效果補語者直接接在要求後；另有獨立義務時以分號區隔。
      if (/^(?:以利|以便|以避免|以確保|以供|為配合|為)/u.test(first)) {
        return `${actionCore}，${[first, ...rest].join('，並')}。`;
      }
      if (rest.length && rest.every(x => /^(?:以利|以便|以避免|以確保|以供|為配合|為)/u.test(x))) {
        return `${actionCore}；${first}，${rest.join('，並')}。`;
      }
      return `${actionCore}。${sentence(reasonBits.join('，並'))}`;
    }

    const reasonBits = clauses.map((c, i) => naturalReasonClause(c, i)).filter(Boolean);
    if (!reasonBits.length) return actionBlock;

    // 時間性使用需求（例如「明天會議需要使用」）本質上是此次要求的理由，
    // 自然版用「因為…，請…」連接，避免理由被切成孤立短句。
    if (reasonBits.length === 1 && /^(?:今天|明天|後天|本週|下週|後續)[^。]{0,36}(?:需要使用|要使用|會使用|會用到)/u.test(reasonBits[0])) {
      return `因為${reasonBits[0].replace(/^因為/u, '')}，${actionCore}。`;
    }

    // 若理由是獨立事實（例如「主管下午有會議安排」），自然訊息用「因為…，請…」而不是硬接逗號。
    if (reasonBits.length === 1 && !/^(?:避免|確保|方便|供|降低|減少|讓|明|今|本|下週|後續|需要|需|須|應|另外|以利|以便|為了|配合)/u.test(reasonBits[0])) {
      const why = reasonBits[0].replace(/^因為/u, '');
      return `因為${why}，${actionCore}。`;
    }

    // 拒絕／界線說明時，先交代理由再說替代處理方式，比「先下指令、後補理由」自然。
    if (purpose === 'refuse' && /^(?:需要|需|須|應)/u.test(reasonBits[0])) {
      const why = reasonBits.join('，').replace(/^需要/u, '仍需').replace(/^需/u, '仍需').replace(/^須/u, '仍須').replace(/^應/u, '仍應');
      return `因為${why}，${actionCore}。`;
    }

    // 自然版優先把「避免／確保／方便／期限需求」接回行動句，避免出現碎裂的公文式短句。
    const linked = reasonBits.map((bit, i) => {
      if (/^避免/u.test(bit)) return bit;
      if (/^也能(?:避免|確保)|^也方便/u.test(bit)) return bit;
      if (/^確保/u.test(bit)) return bit;
      if (/^方便/u.test(bit)) return `也${bit}`;
      if (/^供/u.test(bit)) return `也${bit}`;
      if (/^(?:明|今|本|下週|後續|.+前還要|.+還要|需要|另外需要)/u.test(bit)) return i === 0 ? bit : `另外${bit.replace(/^另外/u, '')}`;
      return bit;
    });
    return `${actionCore}，${linked.join('，')}。`;
  }

  function topicLead(topic, fact, purpose, audience, style) {
    const t = stripEnd(style === 'formal' ? formalize(topic) : naturalize(topic));
    const f = stripEnd(style === 'formal' ? formalize(fact) : naturalize(fact));
    if (!t) return '';

    // 若事實本身已清楚含主題，不再重複一次。
    if (f && (f.includes(t) || t.includes(f.slice(0, Math.min(10, f.length))))) return '';

    const { you } = personWords(audience);
    if (style === 'formal') return `關於${t}，`;
    if (style === 'concise') return f ? `針對${t}，` : `針對${t}。`;

    if (audience === 'client' || audience === 'student' || audience === 'public') {
      if (purpose === 'refuse' || purpose === 'rule') return `您好，關於${t}，`;
      return f ? `您好，想跟${you}確認${t}，` : `您好，想跟${you}確認${t}。`;
    }
    if (audience === 'supervisor') return f ? `想跟${you}確認${t}，` : `想跟${you}確認${t}。`;

    if (purpose === 'remind' || purpose === 'schedule') return f ? `想確認${t}，` : `想確認${t}。`;
    if (purpose === 'correct') return `針對${t}，`;
    if (purpose === 'rule' || purpose === 'refuse') return `關於${t}，`;
    return f ? `關於${t}，` : `關於${t}。`;
  }

  function factSentence(fact, purpose, audience, style, lead = '') {
    const f = stripEnd(style === 'formal' ? formalize(fact) : naturalize(fact));
    if (!f) return lead && /，$/u.test(lead) ? sentence(lead.replace(/，$/u, '')) : lead;

    if (style === 'formal') {
      if (lead && /，$/u.test(lead)) return sentence(`${lead}${f}`);
      return sentence(f);
    }
    if (style === 'concise') {
      if (lead && /，$/u.test(lead)) return sentence(`${lead}${f}`);
      if (lead && /。$/u.test(lead)) return `${lead}${sentence(f)}`;
      return sentence(f);
    }

    if (lead && /。$/u.test(lead)) {
      // 已有自然開頭，不再加「目前情形如下」。
      return `${lead}${sentence(f)}`;
    }
    if (lead && /，$/u.test(lead)) return sentence(`${lead}${f}`);

    if (audience === 'supervisor') return sentence(f);
    return sentence(f);
  }

  function chooseClosing(purpose, tone, style, seedText) {
    if (style === 'concise') return '';
    const bucket = PURPOSE_CLOSINGS[purpose] || PURPOSE_CLOSINGS.general;
    const list = style === 'formal' ? (bucket.formal || bucket.directive || []) : (bucket[tone] || bucket.directive || []);
    if (!list.length) return '';
    const idx = stableHash(seedText) % list.length;
    return list[idx];
  }

  function basisSentence(basis, style) {
    const value = stripEnd(style === 'formal' ? formalize(basis) : naturalize(basis));
    if (!value) return '';
    if (style === 'formal') return sentence(`本事項之職務依據為${value}`);
    return sentence(`這項安排的工作依據是${value}`);
  }

  function characterBigrams(text) {
    const value = stripEnd(text).replace(/[\s，。；：、！？!?「」『』（）()【】\[\]]+/gu, '');
    const grams = new Set();
    if (!value) return grams;
    if (value.length === 1) { grams.add(value); return grams; }
    for (let i = 0; i < value.length - 1; i += 1) grams.add(value.slice(i, i + 2));
    return grams;
  }

  function fieldRetained(source, output) {
    const src = stripEnd(source);
    const out = stripEnd(output);
    if (!src) return null;
    if (!out) return false;
    const compactSrc = src.replace(/[\s，。；：、！？!?「」『』（）()【】\[\]]+/gu, '');
    const compactOut = out.replace(/[\s，。；：、！？!?「」『』（）()【】\[\]]+/gu, '');
    if (compactOut.includes(compactSrc)) return true;
    const a = characterBigrams(src);
    const b = characterBigrams(out);
    if (!a.size) return true;
    let hit = 0;
    for (const gram of a) if (b.has(gram)) hit += 1;
    return hit / a.size >= (a.size <= 4 ? 0.5 : 0.62);
  }

  function coverageReport(substance, output, includeBasis) {
    return {
      topic: fieldRetained(substance.topic, output),
      fact: fieldRetained(substance.fact, output),
      action: fieldRetained(substance.action, output),
      deadline: fieldRetained(substance.deadline, output),
      reason: fieldRetained(substance.reason, output),
      basis: includeBasis ? fieldRetained(substance.basis, output) : null
    };
  }

  function topicRedundant(topic, fact, action) {
    const t = stripEnd(topic).replace(/(?:處理|確認|修正|安排|內容|事項|進度)$/u, '');
    if (!t || t.length < 2) return false;
    const combined = `${stripEnd(fact)} ${stripEnd(action)}`;
    return combined.includes(t);
  }

  // Purpose-aware candidate: facts first, then the concrete action, then only the
  // reason/impact supplied by the user. This deliberately avoids generic praise,
  // blame, legal conclusions and filler closings.
  function plannerCandidate(substance, options, style) {
    const topic = substance.topic || '';
    const fact = substance.fact || '';
    const action = substance.action || '';
    const deadline = substance.deadline || '';
    const reason = substance.reason || '';
    const basis = substance.basis || '';
    const tone = substance.tone || 'directive';
    const audience = options.audience || 'coworker';
    const purpose = options.purpose || 'general';
    const lead = topicRedundant(topic, fact, action) ? '' : topicLead(topic, fact, purpose, audience, style);
    const factBlock = factSentence(fact, purpose, audience, style, lead);
    const directFact = fact ? factSentence(fact, purpose, audience, style, '') : '';
    const actionBlock = actionSentence(action, deadline, tone, audience, style);
    const integrated = integratedActionReason(action, deadline, reason, tone, audience, style, purpose);
    const reasonBlock = reasonSentence(reason, style);
    const basisBlock = options.includeBasis ? basisSentence(basis, style) : '';

    let parts;
    if (purpose === 'refuse') {
      // A refusal reads better when the objective constraint is stated first and
      // the alternative follows; do not turn the boundary into a punitive command.
      parts = [factBlock || directFact, reasonBlock, actionBlock, basisBlock];
    } else if (purpose === 'rule') {
      parts = [factBlock || directFact, integrated || actionBlock, basisBlock];
    } else if (purpose === 'schedule') {
      parts = [factBlock || directFact, integrated || actionBlock, basisBlock];
    } else if (purpose === 'correct') {
      parts = [factBlock || directFact, integrated || actionBlock, basisBlock];
    } else if (purpose === 'remind') {
      parts = [factBlock || directFact, integrated || actionBlock, basisBlock];
    } else {
      parts = [factBlock || directFact, integrated || actionBlock, reason && !integrated ? reasonBlock : '', basisBlock];
    }
    return postProcess(parts.filter(Boolean).join(''), style, audience);
  }

  function buildCandidate(substance, options, style, layout) {
    const topic = substance.topic || '';
    const fact = substance.fact || '';
    const action = substance.action || '';
    const deadline = substance.deadline || '';
    const reason = substance.reason || '';
    const basis = substance.basis || '';
    const tone = substance.tone || 'directive';
    const audience = options.audience || 'coworker';
    const purpose = options.purpose || 'general';

    const lead = topicRedundant(topic, fact, action) ? '' : topicLead(topic, fact, purpose, audience, style);
    const factBlock = factSentence(fact, purpose, audience, style, lead);
    const actionBlock = actionSentence(action, deadline, tone, audience, style);
    const reasonBlock = reasonSentence(reason, style);
    const integratedBlock = integratedActionReason(action, deadline, reason, tone, audience, style, purpose);
    const shouldUseClosing = Boolean(deadline) && (purpose === 'remind' || purpose === 'schedule') && style !== 'concise';
    const closing = shouldUseClosing ? chooseClosing(purpose, tone, style, [topic, fact, action, deadline].join('|')) : '';
    const basisBlock = options.includeBasis ? basisSentence(basis, style) : '';

    let parts = [];
    switch (layout) {
      case 'integrated':
        parts = [factBlock, integratedBlock, basisBlock, closing];
        break;
      case 'integrated-no-closing':
        parts = [factBlock, integratedBlock, basisBlock];
        break;
      case 'direct': {
        const directFact = fact ? factSentence(fact, purpose, audience, style, '') : '';
        parts = [directFact, integratedBlock, basisBlock, closing];
        break;
      }
      case 'direct-no-closing': {
        const directFact = fact ? factSentence(fact, purpose, audience, style, '') : '';
        parts = [directFact, integratedBlock, basisBlock];
        break;
      }
      case 'reason-before-action':
        parts = [factBlock, reasonBlock, actionBlock, basisBlock, closing];
        break;
      case 'action-first': {
        const standaloneLead = lead
          ? (/，$/u.test(lead) ? sentence(lead.replace(/，$/u, '')) : lead)
          : '';
        parts = [standaloneLead, actionBlock, fact ? factSentence(fact, purpose, audience, style, '') : '', reasonBlock, basisBlock, closing];
        break;
      }
      case 'compact':
        parts = [factBlock, integratedBlock || actionBlock, basisBlock];
        break;
      case 'standard':
      default:
        parts = [factBlock, actionBlock, reasonBlock, basisBlock, closing];
        break;
    }

    let text = parts.filter(Boolean).join('');
    text = postProcess(text, style, audience);
    return text;
  }

  function postProcess(text, style, audience) {
    let value = normalize(text)
      .replace(/。{2,}/g, '。')
      .replace(/，，+/g, '，')
      .replace(/。([，；：])/g, '。')
      .replace(/請請/g, '請')
      .replace(/請先先/g, '請先')
      .replace(/請先於/g, '請於')
      .replace(/麻煩先先/g, '麻煩先')
      .replace(/麻煩請/g, '麻煩')
      .replace(/再麻煩您您/g, '再麻煩您')
      .replace(/前前/u, '前')
      .replace(/您好，您好，/g, '您好，')
      .replace(/主要是因為讓/g, '主要是為了讓')
      .replace(/主要是因為建立/g, '主要是為了建立')
      .replace(/主要是因為(降低|減少)/g, '這樣可以$1')
      .replace(/這樣可以讓([^。]{1,80})可以/gu, '這樣可以讓$1')
      .replace(/因為讓/g, '為了讓')
      .replace(/因為建立/g, '為了建立')
      .replace(/麻煩((?:如|若|如果)[^，。]{1,90})，/gu, '$1，麻煩')
      .replace(/請先((?:如|若|如果)[^，。]{1,90})，(?:先)?/gu, '$1，請先')
      .replace(/請((?:如|若|如果)[^，。]{1,90})，/gu, '$1，請')
      .replace(/完成必要確認，並重新確認並/g, '完成確認後，再')
      .replace(/完成必要確認，並確認並/g, '完成確認後，再');

    // 如果服務對象版本沒有任何問候，補一個最短問候即可；不在同事訊息強塞稱謂。
    if ((audience === 'client' || audience === 'student' || audience === 'public') && style !== 'formal' && value && !value.startsWith('您好')) {
      value = `您好，${value}`;
    }
    return value;
  }

  function splitSentences(text) {
    return normalize(text).split(/(?<=[。！？!?])/u).map(x => x.trim()).filter(Boolean);
  }

  const TOKEN_POLICY_WEIGHTS = [
    [/先(?:確認|說明|提出|回報|核對)/u, 4.5],
    [/(?:不確定|待確認|有疑問|有衝突)/u, 2.8],
    [/(?:具體|客觀|可核對|已知事實)/u, 2.3],
    [/(?:及早|提早|先回報|先提出)/u, 2.7],
    [/(?:一起確認|再一起|可以直接提出)/u, 1.8],
    [/(?:每次|總是|根本|到底|你懂嗎|聽懂嗎|有沒有在聽)/u, -8.0],
    [/(?:給我|不然|否則|要不然|做不到就|不要做了|不用做了)/u, -12.0],
    [/(?:白癡|智障|腦殘|廢物|笨蛋|很爛|爛透|瞎搞|亂搞)/u, -80.0]
  ];

  function lexicalPolicyScore(text, style, tone) {
    let score = 0;
    for (const [regex, weight] of TOKEN_POLICY_WEIGHTS) if (regex.test(text)) score += weight;
    if (style === 'formal' && /(?:麻煩一下|想確認一下|一起確認)/u.test(text)) score -= 3;
    if (tone === 'cooperative' && /(?:可以|一起|先確認)/u.test(text)) score += 1.5;
    if (tone === 'directive' && /請(?:先|於|在)/u.test(text)) score += 1.2;
    return score;
  }

  function chainPhraseVariants(substance, options, style) {
    const fact = stripEnd(style === 'formal' ? formalize(substance.fact || '') : naturalize(substance.fact || ''));
    const action = stripLeadingAction(style === 'formal' ? formalize(substance.action || '') : naturalize(substance.action || ''));
    const reason = stripLeadingReason(style === 'formal' ? formalize(substance.reason || '') : naturalize(substance.reason || ''));
    const deadline = normalizeDeadline(substance.deadline || '', style);
    if (!fact && !action) return [];
    const tone = substance.tone || 'directive';
    const audience = options.audience || 'coworker';
    const topic = stripEnd(substance.topic || '');
    const actionTime = deadline ? `${style === 'formal' ? '於' : '在'}${deadline}` : '';
    const actionCore = action.replace(/^請/u, '');
    const factS = fact ? sentence(fact) : '';
    const reasonCore = reason.replace(/^(?:因為|由於|為了|以利|以便)/u, '');
    const chains = [];

    const actionForms = [];
    if (actionCore) {
      // Temporal phrases such as 「排班前先確認…」 must stay at sentence start.
      // Never generate malformed chains like 「請排班前…」 or 「請先排班前…」.
      const temporalAction = !deadline
        ? actionCore.match(/^((?:排班|送出|執行|會議|上傳|處理|交付|簽核|發布|回覆)前)(?:，)?\s*(.+)$/u)
        : null;
      if (temporalAction) {
        const when = temporalAction[1];
        const rest = temporalAction[2].trim();
        const restWithoutPlease = rest.replace(/^請/u, '');
        const core = restWithoutPlease.startsWith('先') ? restWithoutPlease : `先${restWithoutPlease}`;
        if (style === 'formal') {
          actionForms.push(`${when}，請${core}。`);
          if (!/(?:不確定|疑義|衝突)[^。；]{0,24}(?:提出|確認|回報)/u.test(core)) {
            actionForms.push(`${when}，請${core}；如仍有疑義，請先提出具體事項確認。`);
          }
        } else if (tone === 'cooperative') {
          actionForms.push(`${when}，麻煩${core}。`);
          actionForms.push(`${when}，可以${core}。`);
        } else {
          actionForms.push(`${when}，請${core}。`);
          actionForms.push(`${when}，${core.replace(/^先/u, '請先')}。`);
        }
      } else if (style === 'formal') {
        actionForms.push(`請${actionTime}${actionCore}。`.replace('請於於','請於'));
        actionForms.push(`${actionTime ? `請${actionTime}` : '請'}${actionCore}；如有疑義，請先提出具體事項確認。`);
      } else if (tone === 'cooperative') {
        actionForms.push(`${actionTime ? `麻煩在${deadline}` : '麻煩'}${actionCore}。`);
        if (!/^先/u.test(actionCore)) actionForms.push(`${actionTime ? `可以在${deadline}` : '可以'}先${actionCore}。`);
      } else {
        actionForms.push(`${actionTime ? `請在${deadline}` : '請'}${actionCore}。`);
        if (!/^(?:先|避免|保留|讓|維持|持續|停止|不要|改為)/u.test(actionCore)) actionForms.push(`${actionTime ? `請在${deadline}` : '請'}先${actionCore}。`);
      }
    }

    // 只有主題＋行動時，不要輸出「針對○○。請……」這種欄位拼接痕跡；
    // 直接把主題當成談話框架，和行動接成一句自然工作訊息。
    if (!factS && actionForms.length) {
      const topicFrame = topic === '客戶修改內容' ? '這次客戶的修改內容' : topic ? `${topic}這部分` : '';
      for (const a of actionForms.slice(0, 2)) {
        const actionText = a.replace(/。$/u, '');
        if (topicFrame) {
          if (style === 'formal') chains.push(postProcess(`關於${topicFrame}，${actionText}。`, style, audience));
          else chains.push(postProcess(`${topicFrame}，${actionText}。`, style, audience));
        } else {
          chains.push(postProcess(`${actionText}。`, style, audience));
        }
      }
    }

    const temporalUseReason = /^(?:今天|明天|後天|本週|下週|後續)[^。]{0,36}(?:需要使用|要使用|會使用|會用到)/u.test(reasonCore);
    const reasonForms = reasonCore && !temporalUseReason ? [
      style === 'formal' ? `此舉可${reasonCore}。` : `這樣可以${reasonCore}。`,
      style === 'formal' ? `以${reasonCore}。` : `避免後續因資訊未確認而增加處理成本。`
    ] : [''];

    for (const a of actionForms.slice(0, 3)) {
      if (factS) chains.push(postProcess(`${factS}${a}`, style, audience));
      if (factS && reasonCore && temporalUseReason) {
        const actionWithoutEnd = a.replace(/[。！？!?]+$/u, '');
        chains.push(postProcess(`${factS}因為${reasonCore}，${actionWithoutEnd}。`, style, audience));
      } else if (factS && reasonCore) {
        chains.push(postProcess(`${factS}${a}${reasonForms[0]}`, style, audience));
        if (style !== 'concise') chains.push(postProcess(`${factS}${reasonForms[0]}${a}`, style, audience));
      }
    }

    // Human-like disclosure pattern: in coordination/scheduling contexts, make
    // uncertainty reportable instead of turning fear of being scolded into
    // silence.  This is a discourse connector, not a new factual allegation.
    const scheduleLike = /(?:排班|班表|班次|出勤|調班|人力)/u.test(`${topic} ${fact} ${action}`);
    const disclosureLike = /(?:不確定|確認|回報|提出|詢問|衝突|疑問)/u.test(`${fact} ${action}`);
    const alreadyDiscloses = /(?:不確定|衝突)[^。；]{0,20}(?:提出|確認|回報)/u.test(actionCore);
    if (scheduleLike && disclosureLike && actionCore && !alreadyDiscloses && !/(?:覆核|複核)/u.test(actionCore)) {
      const disclosure = style === 'formal'
        ? '如仍有未確認之班次或出勤資訊，請先標示並提出確認，不宜延至執行前才處理。'
        : tone === 'cooperative'
          ? '如果還有不確定或衝突的地方，可以先提出來，我們確認後再把班表定下來。'
          : '如果還有不確定或衝突的地方，請先提出確認，再完成班表。';
      chains.push(postProcess(`${factS}${actionForms[0] || actionSentence(action, deadline, tone, audience, style)}${disclosure}`, style, audience));
    }

    // Scheduling is a high-frequency human communication case. Generate several
    // semantically equivalent discourse orders so weighted selection has real
    // choices instead of randomizing punctuation around one fixed template.
    if (scheduleLike && style === 'natural' && factS && actionCore) {
      const strippedTemporal = actionCore.replace(/^排班前(?:，)?/u, '').replace(/^先/u, '');
      const conversational = strippedTemporal
        .replace(/向相關人員確認/u, '跟相關人員確認')
        .replace(/可出勤時段與班次/u, '可出勤時段和班次')
        .replace(/；有不確定或衝突時先提出確認，再完成班表/u, '；如果有不確定或衝突，先確認清楚再完成班表');
      if (conversational && conversational !== strippedTemporal) {
        chains.push(postProcess(`${factS}排班前，先${conversational}。`, style, audience));
        chains.push(postProcess(`${factS}先把可出勤時段和班次確認清楚，再完成班表；有不確定或衝突的地方請提早提出。`, style, audience));
        if (tone === 'cooperative') chains.push(postProcess(`${factS}可以先跟相關人員確認可出勤時段和班次；有不確定或衝突的地方先提出來，確認後再把班表定下來。`, style, audience));
      }
    }

    return [...new Set(chains.filter(Boolean))].slice(0, 24);
  }

  function scoreCandidate(text, style, tone = 'directive') {
    if (!text) return -9999;
    let score = 100;
    const sentences = splitSentences(text);

    for (const phrase of GENERIC_FORMULAIC) {
      if (text.includes(phrase)) score -= style === 'formal' ? 4 : 14;
    }
    const colonLabels = (text.match(/(?:期限|原因|依據|程序|事項|主題)[:：]/gu) || []).length;
    score -= colonLabels * 12;

    const pleaseCount = (text.match(/請/gu) || []).length;
    if (pleaseCount > 2) score -= (pleaseCount - 2) * 8;
    const troubleCount = (text.match(/麻煩/gu) || []).length;
    if (troubleCount > 1) score -= (troubleCount - 1) * 6;

    const unique = new Set(sentences.map(s => s.replace(/[。！？!?]/g, '')));
    if (unique.size < sentences.length) score -= (sentences.length - unique.size) * 18;
    if (sentences.length > 5) score -= (sentences.length - 5) * 5;
    if (style === 'concise' && text.length > 180) score -= Math.ceil((text.length - 180) / 15);
    if (style === 'natural' && text.startsWith('關於')) score -= 5;
    if (style === 'natural' && /^關於[^。]{1,28}，先說明目前狀況/u.test(text)) score -= 14;
    if (style === 'natural' && /^目前就[^。]{1,28}需要再確認一下/u.test(text)) score -= 12;
    if (style === 'natural' && /。因為[^。]{2,60}，請/u.test(text)) score += 11;
    // 一般工作訊息較自然的順序通常是「事實 → 行動 → 影響」。
    // 避免先丟出「這樣可以避免……」再告訴對方要做什麼，讀起來像模板拼接。
    if (style === 'natural' && /。(?:這樣可以|此舉可|避免)[^。]{2,90}。(?:請|排班前|送出前|上傳前|處理前|回覆前)/u.test(text)) score -= 18;
    if (/說明如下[。；：]/u.test(text)) score -= 20;
    if (/(?:需要要|請請|請先先|麻煩先先|麻煩請|請先(?:避免|保留|讓|維持|持續|停止|改為)|您您|也版本|也日期|也附件|也資料)/u.test(text)) score -= 35;
    if (/^(?:關於|針對)[^。]{1,28}。請/u.test(text)) score -= 22;
    if (/工作必要性|職務依據[:：]/u.test(text)) score -= 15;
    if (/相關原因|相關程序/u.test(text)) score -= 12;
    if (/。請[^。]+。請/u.test(text)) score -= 8;
    if (/，[，。]|。[,，]/u.test(text)) score -= 15;
    // 有客觀狀況時，工作訊息通常先交代狀況再提出行動；避免生成
    // 「請先做 X。現在其實發生 Y。」這種倒裝而顯得像機器拼句。
    if (/^請[^。]{1,90}。(?:目前|現階段|現在|本次|這次)/u.test(text)) score -= 14;
    if (/^(?:排班|送出|執行|會議|上傳|處理|交付|簽核|發布|回覆)前，?請[^。]{1,130}。(?:目前|現階段|現在|本次|這次)/u.test(text)) score -= 22;
    if (style === 'natural' && /^(?:目前|現階段|現在|本次|這次)[^。]{1,130}。(?:請|(?:排班|送出|執行|會議|上傳|處理|交付|簽核|發布|回覆)前)/u.test(text)) score += 7;

    // 自然版若完全沒有「關於／上述／說明如下」等公文套語，給小幅獎勵。
    if (style === 'natural' && !/(?:上述|說明如下|茲|爰|依既定)/u.test(text)) score += 6;
    if (style === 'natural') {
      if (tone === 'cooperative') {
        if (/(?:麻煩|想確認|可以|一起)/u.test(text)) score += 4;
        if (/(?:請於|務必|應立即)/u.test(text)) score -= 5;
      } else if (tone === 'formal') {
        if (/(?:請|後續|目前)/u.test(text)) score += 3;
        if (/(?:麻煩|想確認一下|這邊想|這邊先確認|所以想請|可以幫忙)/u.test(text)) score -= 30;
      } else {
        if (/請/u.test(text)) score += 2;
        if (/麻煩/u.test(text)) score -= 6;
      }
    }
    if (style === 'concise' && sentences.length <= 3) score += 5;

    // Every generated token/transition gets a learned fluency signal plus a
    // transparent policy weight.  The neural LM is a reranker only: a fluent
    // sentence cannot override a safety rule or reintroduce a blocked phrase.
    score += lexicalPolicyScore(text, style, tone);
    score += TRANSITION_MODEL.score(text);
    if (DOMAIN_LM) {
      const avgLogProb = DOMAIN_LM.score(text); // typical domain text ≈ -3 to -6
      score += Math.max(-14, Math.min(12, (avgLogProb + 5.2) * 5.0));
    }
    if (typeof globalThis !== 'undefined' && typeof globalThis.RMG_DYNAMIC_RISK_SCORE === 'function') {
      score -= Math.max(0, Number(globalThis.RMG_DYNAMIC_RISK_SCORE(text) || 0));
    }
    return score;
  }

  function stableHash(text) {
    let hash = 2166136261;
    for (const ch of String(text || '')) {
      hash ^= ch.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  function seededUnit(seedText) {
    let x = stableHash(seedText || `${Date.now()}|${Math.random()}`) || 0x9e3779b9;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  }

  function weightedBestOf(candidates, style, seedText = '', tone = 'directive') {
    const scored = [...new Set(candidates.filter(Boolean))]
      .map(text => ({ text, score: scoreCandidate(text, style, tone) }))
      .sort((a, b) => b.score - a.score || a.text.length - b.text.length);
    if (!scored.length) return { text: '', score: -9999 };
    let pool = scored;
    if (style === 'natural' && tone === 'formal') {
      const restrained = scored.filter(item => !/(?:麻煩|想確認|這邊想|這邊先確認|所以想請|可以幫忙)/u.test(item.text));
      if (restrained.length) pool = restrained;
    }
    const max = pool[0].score;
    const window = style === 'formal' ? 7 : style === 'natural' ? 13 : 9;
    const eligible = pool.filter(item => item.score >= max - window).slice(0, 10);
    if (eligible.length === 1) return eligible[0];
    const temperature = style === 'natural' ? 4.2 : 2.7;
    const weighted = eligible.map((item, index) => ({
      ...item,
      weight: Math.exp((item.score - max) / temperature) * (1 / (1 + index * 0.08))
    }));
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let cursor = seededUnit(`${seedText}|${style}|${eligible.map(x => x.text).join('|')}`) * total;
    for (const item of weighted) {
      cursor -= item.weight;
      if (cursor <= 0) return item;
    }
    return weighted[0];
  }

  function safeCorpusPatternCandidates(substance, options = {}, style = 'natural') {
    // 大型安全模板庫只在前一階段已明確命中安全情境時介入候選生成；
    // 避免一般手動結構化輸入被大量模板蓋過原本較成熟的語序規則。
    if (!options.safeCorpusScenarioId) return [];
    const tone = substance.tone || 'directive';
    let patterns = SAFE_CORPUS?.stylePatterns?.[style] || [];
    if (tone === 'directive') patterns = patterns.filter(p => !/(?:麻煩|可以幫忙|想確認一下|這邊想)/u.test(String(p)));
    if (tone === 'formal') patterns = patterns.filter(p => !/(?:麻煩|可以幫忙|想確認|這邊|一起處理|卡點)/u.test(String(p)));
    if (!patterns.length) return [];
    const topic = stripEnd(substance.topic || '');
    const fact = stripEnd(style === 'formal' ? formalize(substance.fact || '') : naturalize(substance.fact || ''));
    const action = stripLeadingAction(style === 'formal' ? formalize(substance.action || '') : naturalize(substance.action || ''));
    const reason = stripLeadingReason(style === 'formal' ? formalize(substance.reason || '') : naturalize(substance.reason || ''));
    const deadline = normalizeDeadline(substance.deadline || '', style);
    if (!fact || !action) return [];
    if (options.includeBasis && normalize(substance.basis || '')) return [];
    const factNoPrefix = fact.replace(/^(?:目前|現在|現階段)/u, '');
    const reasonNoPrefix = reason.replace(/^(?:以利|以便)/u, '');
    const actionWithDeadline = deadline ? `${style === 'formal' ? '於' : '在'}${deadline}${action}` : action;
    const values = { topic: topic || '這項工作', fact, fact_no_prefix: factNoPrefix, action: actionWithDeadline, reason: reason || '以利後續作業', reason_no_prefix: reasonNoPrefix || '後續作業順利進行' };
    const mustKeepTopic = Boolean(topic && !topicRedundant(topic, fact, action));
    return patterns.filter(pattern => !mustKeepTopic || String(pattern).includes('{topic}')).slice(0, 8).map((pattern, index) => {
      let text = String(pattern || '').replace(/\{(topic|fact|fact_no_prefix|action|reason|reason_no_prefix)\}/g, (_, key) => values[key] || '');
      text = text
        .replace(/請完成完成/g, '請完成')
        .replace(/請先完成完成/g, '請先完成')
        .replace(/請先先/g, '請先')
        .replace(/麻煩先先/g, '麻煩先')
        .replace(/請依相關規範與權責依/g, '請依相關規範與權責')
        .replace(/，以避免/g, '，避免')
        .replace(/，以確保/g, '，以確保')
        .replace(/。+/g, '。');
      return postProcess(text, style, options.audience || 'coworker');
    }).filter(text => Boolean(text) && (style !== 'formal' || /(?:關於|請於)/u.test(text)));
  }

  function rewriteStructuredMessage(substance, options = {}) {
    const style = options.rewriteStyle || 'natural';
    const corePresent = [substance.topic, substance.fact, substance.action, substance.deadline, substance.reason]
      .some(v => normalize(v));
    if (!corePresent) {
      return {
        text: '', copyable: false,
        notice: '尚未從原始訊息抽出足夠的工作內容。請補充實際工作事項；若只有抽取不準，也可以展開「確認／修正抽取結果」調整。',
        style,
        qualityScore: 0,
        variants: {},
        quality: {},
        coverage: {},
        variantCoverage: {}
      };
    }

    const styles = ['natural', 'concise', 'formal'];
    const purpose = options.purpose || 'general';
    const variants = {};
    const quality = {};
    for (const targetStyle of styles) {
      const naturalDirect = targetStyle === 'natural' && (purpose === 'rule' || purpose === 'refuse') && normalize(substance.fact);
      const layouts = targetStyle === 'concise'
        ? ['compact', 'integrated-no-closing', 'standard']
        : naturalDirect
          ? ['direct-no-closing', 'direct', 'integrated', 'integrated-no-closing', 'standard', 'reason-before-action', 'action-first']
          : ['integrated', 'integrated-no-closing', 'standard', 'reason-before-action', 'action-first'];
      const candidates = [
        plannerCandidate(substance, options, targetStyle),
        ...chainPhraseVariants(substance, options, targetStyle),
        ...safeCorpusPatternCandidates(substance, options, targetStyle),
        ...layouts.map(layout => buildCandidate(substance, options, targetStyle, layout))
      ];
      // Step 2 是 Step 1 抽取結果的「人工確認版」。使用者確認過的實質資訊，
      // 自然／正式版本不能因為某個短句比較流暢就把原因或期限整段省略。
      // 精簡版允許省略原因，但仍必須保留事實、行動與期限。
      const requiredFields = (targetStyle === 'concise' ? ['fact','action','deadline'] : ['fact','action','deadline','reason'])
        .filter(key => normalize(substance[key] || ''));
      const completeCandidates = candidates.filter(text => requiredFields.every(key => fieldRetained(substance[key], text) !== false));
      const candidatePool = completeCandidates.length ? completeCandidates : candidates;
      const best = weightedBestOf(candidatePool, targetStyle, `${options.randomSeed || 'default'}|${targetStyle}`, substance.tone || 'directive');
      variants[targetStyle] = best.text;
      quality[targetStyle] = best.score;
    }

    const selected = variants[style] || variants.natural || '';
    const styleLabel = style === 'formal' ? '正式書面' : style === 'concise' ? '精簡直接' : '自然工作訊息';
    return {
      text: selected,
      copyable: Boolean(selected),
      notice: options.includeBasis
        ? `已使用「${styleLabel}」潤稿；工作內容由原始訊息自動抽取，若有人工修正則以修正後內容生成。職務依據依你的設定納入文字；不直接照抄原始句子。`
        : `已使用「${styleLabel}」潤稿；工作內容由原始訊息自動抽取，若有人工修正則以修正後內容生成。職務依據預設只供合理性檢核；不直接照抄原始句子。`,
      style,
      qualityScore: quality[style] || 0,
      variants,
      quality,
      coverage: coverageReport(substance, selected, Boolean(options.includeBasis)),
      variantCoverage: Object.fromEntries(Object.entries(variants).map(([key, value]) => [key, coverageReport(substance, value, Boolean(options.includeBasis))]))
    };
  }

  return {
    rewriteStructuredMessage,
    domainLanguageModel: DOMAIN_LM ? { version: DOMAIN_LM.version, type: DOMAIN_LM.type } : null,
    transitionModel: { safeBigrams: TRANSITION_MODEL.safeBigramCount, safeTrigrams: TRANSITION_MODEL.safeTrigramCount, riskBigrams: TRANSITION_MODEL.riskBigramCount },
    buildCandidate,
    scoreCandidate,
    naturalize,
    formalize,
    normalize,
    plannerCandidate,
    coverageReport,
    safeCorpusPatternCandidates,
    safeCorpusVersion: SAFE_CORPUS.version || 'unknown'
  };
});

/* Section 2: raw-message intent extraction engine */
'use strict';

/*
 * Raw-message intent extraction engine.
 * Input: original Traditional Chinese work message.
 * Output: structured work intent only. Toxic/emotional material is treated as
 * noise, not as generation material. No cloud service is used.
 */
(function initIntentEngine(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MESSAGE_INTENT_ENGINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  const SAFE_CORPUS = (() => {
    if (typeof globalThis !== 'undefined' && globalThis.SAFE_MESSAGE_CORPUS_DATA) return globalThis.SAFE_MESSAGE_CORPUS_DATA;
    if (typeof module !== 'undefined' && module.exports) {
      try { return require('./safe-message-corpus.js'); } catch (_) { return { scenarios: [], examples: [], version: 'unavailable' }; }
    }
    return { scenarios: [], examples: [], version: 'unavailable' };
  })();
  const SAFE_SCENARIOS = Array.isArray(SAFE_CORPUS.scenarios) ? SAFE_CORPUS.scenarios : [];
  const END = /[。！？!?；;\n]+/u;
  const DEADLINE_PATTERNS = [
    // 先抓「日期／相對日期＋明確時間」，避免把威脅句中的單獨「今天」誤當成期限。
    /(?:今天|今日|明天|明日|後天|本週|這週|下週|週[一二三四五六日天]|星期[一二三四五六日天])\s*(?:上午|中午|下午|晚上|晚間|早上|凌晨)?\s*(?:(?:[一二三四五六七八九十兩]|\d{1,2})\s*[點時](?:半|\d{1,2}\s*分)?|\d{1,2}[:：]\d{2})\s*(?:前|以前|之前|內)?/u,
    /(?:\d{1,2}\s*月\s*\d{1,2}\s*日|\d{1,2}[\/\-]\d{1,2})(?:上午|中午|下午|晚上|晚間|早上)?\s*(?:\d{1,2}(?:[:：]\d{2})?|\d{1,2}\s*[點時])?\s*(?:前|以前|之前|內)?/u,
    /(?:\d+(?:\.\d+)?\s*(?:分鐘|小時|天|日|工作日|週|星期))\s*(?:內|之內|以前|前)/u,
    /(?:上午|中午|下午|晚上|晚間|早上|凌晨)\s*(?:[一二三四五六七八九十兩]|\d{1,2})(?:[:：]\d{2}|\s*[點時](?:半|\d{1,2}\s*分)?)\s*(?:前|以前|之前)?/u,
    /(?:[一二三四五六七八九十兩]|\d{1,2})(?:[:：]\d{2}|\s*[點時](?:半|\d{1,2}\s*分)?)\s*(?:前|以前|之前)/u,
    /(?:今天|今日|明天|明日|後天|本週|這週|下週|週[一二三四五六日天]|星期[一二三四五六日天])\s*(?:下班前|上班前|午休前|會議前|開會前|結束前|以前|之前|內)/u
  ];

  const TOXIC_ONLY = /^(?:你|妳|他|她)?\s*(?:到底|根本|真的|有夠|超級|非常)?\s*(?:白癡|智障|腦殘|廢物|垃圾|王八蛋|混蛋|低能|智商有問題|沒腦|有沒有腦|看不懂人話|聽不懂人話|滾|閉嘴|去死|幹你娘|幹妳娘|操你|綠茶婊|賤人|婊子|垃圾話|廢話)+\s*$/u;
  const THREAT_TAIL = /(?:不然|否則|再不|要不然|敢不|如果不|做不到就|沒做完就|再給我).*$/u;
  const POWER_THREAT = /(?:不用來了|不用做(?:這個|這項)?(?:專案|工作|案子)?了?|滾蛋|走人|開除|解僱|扣薪|扣你薪水|考績給你|讓你待不下去|封殺你|黑名單|不排班|砍班|不續約).*$/u;
  const EMOTION_PREFIX = /^(?:你到底|到底在|你是在|你是有|有沒有搞錯|搞什麼|是在搞什麼|講幾次|要講幾次|我不是說過|我講過幾次|你怎麼又|怎麼還|為什麼又|為什麼還)\s*/u;
  const POLITENESS_PREFIX = /^(?:麻煩|煩請|拜託|請|務必|給我|現在|立刻|馬上|趕快|趕緊|記得|需要|要)\s*/u;

  const ACTION_RULES = [
    [/(?:覆核|複核)/u, '覆核相關內容'],
    [/(?:修復|修成|改成|調整成)/u, '調整功能或內容'],
    [/重排(?:班)?|重新排班|調整班表|重排班表/u, '重新確認並調整排班'],
    [/重新?做|全部重做|重做/u, '重新檢查並修正'],
    [/補齊|補上|補好|補完|補件|補資料/u, '補上缺少的內容'],
    [/改掉|改好|改完|(?:需要|應|要)?改(?:掉|好|完)?|修好|修正|修改/u, '檢查並修正'],
    [/回我|回覆我|回覆|回信/u, '回覆目前處理情形'],
    [/交出來|交給我|繳交|提交/u, '提交完成版本'],
    [/上傳/u, '上傳更新版本'],
    [/(?:校對|核對|查核)/u, '重新檢查並確認'],
    [/確認/u, '確認相關內容'],
    [/處理/u, '完成相關處理'],
    [/整理/u, '整理相關資料'],
    [/補充/u, '補充必要內容'],
    [/說明/u, '說明目前狀況'],
    [/聯絡/u, '完成必要聯繫'],
    [/排班/u, '確認排班安排']
  ];

  const OBJECT_TERMS = [
    '核銷資料','請款資料','憑證','核銷','請款','報告','報表','附件','附件一','附件二','附件三','檔案','文件','資料','簡報','版本','紀錄','會議紀錄','病歷','表單','排班表','排班','名單','清單','合約','契約','企劃','計畫','專案','程式','網站','頁面','功能','需求','測試','結果','作業','工作','信件','訊息','申請','公文','預算','發票','收據','照片','圖片','表格','時程','進度'
  ];

  const FACT_MARKERS = /(?:目前|現在|仍|還|尚|已經|已|未|沒有|缺|少|錯|有誤|不一致|失敗|退件|沒過|未過|未完成|沒完成|未收到|沒收到|尚未|進度|版本|結果|狀況|情況)/u;
  const FACT_STATE_MARKERS = /(?:目前|現在|仍|還|尚|已經|已|未|沒有|缺|少|錯|有誤|不一致|不一樣|不同|失敗|退件|沒過|未過|未完成|沒完成|未收到|沒收到|尚未|當機|遺失|不見|衝突|異常|延誤|中斷|落差|無法)/u;
  const ACTION_MARKERS = /(?:請|麻煩|煩請|務必|需要|要|給我|幫我|協助|記得|完成|補|改|修|重做|回覆|回信|上傳|提供|確認|處理|提交|繳交|整理|說明|聯絡|排班|重排|調整|安排|校對|核對|查核|覆核|複核|修成|改成|調整成|修復|暫存|備份|停止|不要再)/u;
  const REASON_MARKERS = /(?:因為|由於|為了|避免|以免|以利|以便|影響|需要於|需於|供後續|後續要|才能|會議[^。！？!?]{0,12}(?:要用|需要使用)|(?:要給|需給)客戶|客戶[^。！？!?]{0,12}(?:要用|需要使用))/u;
  const EMOTIONAL_META = /(?:到底要(?:我)?講幾次|到底講幾次|要(?:我)?講幾次|講幾次才懂|到底懂不懂|到底會不會|有沒有搞錯|搞什麼|是在搞什麼|裝(?:作)?(?:聽不懂|看不懂|不知道|沒看到))/u;


  // v2.1：步驟二是步驟一的可編輯投影，因此抽取器必須先把同一句中的
  // 工作內容與霸凌／騷擾噪音分開，而不是把整個子句當成「事實」。
  const INTENT_SEXUAL_COERCION = /(?:來|到|給我來)(?:我)?床上|(?:跟|陪)我上床|(?:讓|弄|搞)(?:你|妳)?懷孕|(?:開房|陪睡|性行為)|(?:陰道|陰莖|乳房|胸部)[^。！？!?]{0,18}(?:懷孕|上床|開房|陪睡)/u;
  const INTENT_PERSONAL_ATTACK = /(?:你|妳)?(?:是不是|是)?(?:有病|白癡|智障|腦殘|廢物|垃圾|低能)|你什麼都不會|什麼都不會做|能不能(?:有點|稍微)?長進|可不可以(?:有點|稍微)?長進|一點長進都沒有/u;
  const INTENT_CATASTROPHE = /(?:大家|全組|團隊|公司|機構|部門|單位)[^。！？!?]{0,16}(?:一起)?(?:完蛋|倒閉|倒掉|陪葬|遭殃)/u;
  const INTENT_SCHEDULE = /(?:排班|班表|班次|輪班|值班|缺班|撞班|出勤時段|人力配置)/u;
  const INTENT_DISCLOSURE_DELAY = /(?:不敢問|不敢說|不敢講|怕被罵|怕被念|怕講錯|怕說錯|等出事|出事才|等到出事|等被發現|被抓包|最後才(?:說|講|回報|提出)|不確定[^。！？!?]{0,12}(?:不問|沒問|不講|不說))/u;
  const INTENT_FINANCE = /(?:核銷|請款|報帳|報銷|憑證|發票|收據)/u;
  const INTENT_WORK_OBJECT = /(?:排班|班表|班次|輪班|值班|核銷|請款|報告|報表|附件|檔案|文件|資料|簡報|版本|紀錄|病歷|表單|名單|合約|計畫|專案|程式|網站|頁面|功能|需求|測試|作業|信件|公文|預算)/u;

  function stripRiskSpansForIntent(text) {
    let value = normalize(text);
    if (!value) return '';
    value = value
      .replace(/(?:下次|這次|再)?[^，。！？!?；;]{0,10}(?:做錯|再錯)[^，。！？!?；;]{0,18}(?:來|到|給我來)(?:我)?床上/gu, ' ')
      .replace(/(?:來|到|給我來)(?:我)?床上/gu, ' ')
      .replace(/(?:跟|陪)我上床/gu, ' ')
      .replace(/(?:讓|弄|搞)(?:你|妳)?懷孕/gu, ' ')
      .replace(/(?:你|妳)?(?:是不是|是)?有病(?:啊|嗎|對不對)?/gu, ' ')
      .replace(/(?:你|妳)?什麼都不會(?:做)?(?:啊|啦|耶)?/gu, ' ')
      .replace(/(?:能不能|可不可以)?(?:有點|稍微)?長進(?:一點|點)?/gu, ' ')
      .replace(/(?:不要)?當(?:個)?(?:白癡|智障|腦殘|廢物|垃圾|低能)/gu, ' ')
      .replace(/(?:白癡|智障|腦殘|廢物|低能)/gu, ' ')
      .replace(/(?:大家|全組|團隊|公司|機構|部門|單位)[^，。！？!?；;]{0,16}(?:一起)?(?:完蛋|倒閉|倒掉|陪葬|遭殃)/gu, ' ')
      .replace(/(?:你懂嗎|懂不懂|到底懂不懂|要講幾次|到底要(?:我)?講幾次)/gu, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[，。；：、！？\s]+|[，。；：、！？\s]+$/gu, '')
      .trim();
    return value;
  }

  function clauseRiskScore(text) {
    const value = normalize(text);
    let score = 0;
    if (INTENT_SEXUAL_COERCION.test(value)) score += 8;
    if (INTENT_PERSONAL_ATTACK.test(value)) score += 5;
    if (INTENT_CATASTROPHE.test(value)) score += 4;
    if (/(?:滾|開除|解僱|扣薪|封殺|不續約|不用來|不用做)/u.test(value)) score += 5;
    if (EMOTIONAL_META.test(value)) score += 3;
    return score;
  }

  function clauseWorkScore(text) {
    const value = normalize(text);
    let score = 0;
    if (INTENT_WORK_OBJECT.test(value)) score += 4;
    if (ACTION_MARKERS.test(value)) score += 3;
    if (FACT_MARKERS.test(value)) score += 2;
    if (REASON_MARKERS.test(value)) score += 1;
    if (INTENT_DISCLOSURE_DELAY.test(value)) score += 2;
    return score - Math.min(6, clauseRiskScore(value));
  }

  function deriveCrossClauseIntent(raw) {
    const text = normalize(raw);
    // 專業脈絡中的身體／疾病術語要保留其工作資訊，不可先把詞彙當成辱罵或情色內容刪除。
    if (/(?:病歷|醫療|臨床|護理|照護|診斷|症狀|個案|病人|患者)/u.test(text) && /(?:陰道|子宮|乳房|乳頭|睪丸|陰莖|肛門|懷孕|出血|分泌物|病史)/u.test(text) && /(?:紀錄|觀察|評估|追蹤|交班|衛教|處置)/u.test(text)) {
      const medicalClauses = text.split(/[，。；]/u).map(x => x.trim()).filter(Boolean);
      const symptomClause = medicalClauses.find(c => /(?:陰道|子宮|乳房|乳頭|睪丸|陰莖|肛門|懷孕|出血|分泌物)/u.test(c) && /(?:出血|疼痛|分泌物|觀察|評估|追蹤|懷孕)/u.test(c));
      const historyClause = medicalClauses.find(c => /(?:病史|診斷|症狀)/u.test(c));
      const factMatch = symptomClause || historyClause || '';
      const actionMatch = text.match(/(?:請|麻煩)?((?:於|在)?[^，。；]{0,18}(?:完成|補上|更新|記錄|紀錄)[^，。；]{0,20})/u);
      return {
        topic: '醫療或照護紀錄',
        fact: factMatch ? canonicalFact(factMatch) : '目前有專業照護資訊需要記錄與追蹤',
        action: actionMatch ? canonicalAction(actionMatch[1], '醫療或照護紀錄') : '依照護需要完成必要紀錄',
        reason: '',
        evidence: { topic: '原始訊息具有醫療／照護紀錄脈絡', fact: factMatch || '原始訊息提及專業照護資訊', action: actionMatch ? actionMatch[1] : '原始訊息要求完成專業紀錄', reason: '' }
      };
    }
    // 高風險管理語句仍可能包著合理的工作目的；先抽出可執行核心，不把威嚇本身當任務。
    if (/(?:客戶|顧客|服務對象)[^。！？!?]{0,20}(?:罵人|辱罵|情緒激動|抱怨|客訴)/u.test(text) && /(?:整理|記錄|彙整)[^。！？!?]{0,24}(?:客訴|內容|事實|紀錄)/u.test(text)) {
      return {
        topic: '客訴處理',
        fact: '目前有客訴或服務溝通事件需要整理',
        action: /(?:主管|上級)[^。！？!?]{0,12}(?:接手|處理)/u.test(text)
          ? '整理客訴內容與可核對事實；必要時由主管接手處理'
          : '整理客訴內容與可核對事實',
        reason: '',
        evidence: { topic: '原始訊息提及客訴或服務溝通事件', fact: '原始訊息提及需要整理事件內容', action: '原始訊息要求整理客訴事實並視需要升級處理', reason: '' }
      };
    }
    if (/(?:每(?:15|十五)分鐘|定位|私人手機|螢幕錄影|隨時回報|不准離線)/u.test(text) && /(?:扣考績|扣薪|不然|否則|做不到)/u.test(text)) {
      return {
        topic: '工作監督方式',
        fact: '目前監督頻率與方式需要重新確認是否符合工作必要性',
        action: '改以明確里程碑、工作成果與合理頻率回報進度',
        reason: '讓管理集中在工作成果與必要風險',
        evidence: { topic: '原始訊息涉及高密度進度或位置回報', fact: '原始訊息把高密度監督與不利益後果連結', action: '工作重點應改回合理頻率與成果管理', reason: '' }
      };
    }
    if (/(?:工作就是[^。！？!?]{0,14}(?:陪酒|喝酒|續攤)|(?:一定要|必須|得|都要)[^。！？!?]{0,18}(?:陪酒|陪(?:客戶|主管)?喝酒|續攤)|下班後[^。！？!?]{0,22}(?:陪酒|陪(?:客戶|主管)?喝酒|續攤))/u.test(text)) {
      return {
        topic: '工作社交安排',
        fact: '目前需要確認下班後社交活動中哪些內容確屬必要工作',
        action: '將必要的業務溝通與飲酒、續攤等私人社交分開安排，並保留合理拒絕空間',
        reason: '讓合作安排回到實際業務需求與必要範圍',
        evidence: { topic: '原始訊息涉及下班後社交或飲酒安排', fact: '原始訊息把社交活動描述為工作義務', action: '工作重點應區分必要業務與可拒絕的私人社交', reason: '' }
      };
    }
    if (/(?:申訴|檢舉|投訴|告狀|找人資|勞工局|勞檢|工會)/u.test(text) && /(?:考績|不排班|排班.{0,8}(?:別想好過|不好過)|扣薪|不續約|開除|解僱|調職)/u.test(text)) {
      return {
        topic: '申訴或檢舉後的工作處理',
        fact: '目前涉及申訴或檢舉情境，申訴事項與其他工作事實需要分開處理',
        action: '對申訴事項依正式程序處理；如另有獨立工作問題，另以客觀事實與一致標準處理',
        reason: '',
        evidence: { topic: '原始訊息提及申訴或檢舉', fact: '原始訊息把申訴與考績或排班等不利益連結', action: '工作重點應回到正式程序與獨立事由', reason: '' }
      };
    }
    const derived = { topic:'', fact:'', action:'', reason:'', evidence:{} };
    if (INTENT_SCHEDULE.test(text) && INTENT_DISCLOSURE_DELAY.test(text)) {
      derived.topic = '排班';
      derived.fact = '目前排班遇到不確定或衝突時，回報與確認時間可能偏晚';
      derived.action = '排班前先向相關人員確認可出勤時段與班次；遇到不確定或衝突時先提出確認，再完成班表';
      derived.reason = INTENT_FINANCE.test(text)
        ? '避免排班問題延後發現並影響後續核銷作業'
        : '避免到執行前才發現人力或班次衝突';
      derived.evidence.topic = '原始訊息提及排班、班表或班次安排';
      derived.evidence.fact = '原始訊息提及遇到不確定時沒有及早詢問或等到問題出現後才處理';
      derived.evidence.action = '原始訊息的工作重點是排班前先確認，不確定處要先提出';
      derived.evidence.reason = INTENT_FINANCE.test(text) ? '原始訊息提及排班問題可能影響後續核銷' : '';
      return derived;
    }
    if (INTENT_SCHEDULE.test(text) && clauseRiskScore(text) >= 5) {
      derived.topic = '排班';
      derived.fact = '目前班表安排仍有需要確認的地方';
      derived.action = '先確認可出勤時段與班次安排，再完成班表';
      derived.reason = INTENT_FINANCE.test(text) ? '避免排班問題影響後續核銷作業' : '';
      derived.evidence.topic = '原始訊息提及排班、班表或班次安排';
      derived.evidence.fact = '原始訊息同時包含排班問題與大量情緒性內容，抽取時只保留工作事實';
      derived.evidence.action = '原始訊息要求重新確認或調整排班';
      derived.evidence.reason = INTENT_FINANCE.test(text) ? '原始訊息提及排班問題可能影響後續核銷' : '';
      return derived;
    }
    return null;
  }

  function normalize(text) {
    return String(text || '').normalize('NFKC')
      .replace(/[\u200B\u200C\u2060\uFEFF]/gu, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/,/g, '，').replace(/;/g, '；').replace(/:/g, '：')
      .replace(/\?/g, '？').replace(/!/g, '！').trim();
  }

  function cleanClause(text) {
    return normalize(text)
      .replace(/[😡🤬💢🙄😂🤣😒😤💩]+/gu, '')
      .replace(/\[(?:貼圖|sticker)\]|【貼圖】|\(貼圖\)/giu, '')
      .replace(THREAT_TAIL, '')
      .replace(POWER_THREAT, '')
      .replace(EMOTION_PREFIX, '')
      .replace(EMOTIONAL_META, '')
      .replace(/(?:你|妳)?\s*(?:到底)?\s*(?:是|是不是)?\s*(?:白癡|智障|腦殘|廢物|垃圾|低能|沒腦|有沒有腦|看不懂人話|聽不懂人話)(?:嗎|嘛|是不是)?/gu, '')
      .replace(/^(?:你|妳)\s*(?:到底)?\s*/u, '')
      .replace(/(?:有沒有腦|會不會做事|看不懂人話|聽不懂人話|搞什麼|是在搞什麼|到底懂不懂|到底在幹嘛|在幹嘛|很難嗎|這麼簡單也不會|裝(?:作)?(?:聽不懂|看不懂|不知道|沒看到)|到底要(?:我)?講幾次|要(?:我)?講幾次)/gu, '')
      .replace(/(?:垃圾|廢物|白癡|智障|腦殘|混蛋|王八蛋|賤人|婊子|幹你娘|幹妳娘|操你|滾蛋|去死)/gu, '')
      .replace(/(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|惡搞|搞砸|搞爛|雷包|豬隊友|拖油瓶|狗屁|鬼東西)/gu, '')
      .replace(/[~～%％]{2,}/gu, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[，。；：、！？\s]+|[，。；：、！？\s]+$/gu, '')
      .trim();
  }

  function splitClauses(raw) {
    return normalize(raw)
      .split(/[。！？!?；;\n，,]+/u)
      .map(cleanClause)
      .map(stripRiskSpansForIntent)
      .filter(Boolean)
      .filter(x => !TOXIC_ONLY.test(x))
      .filter(x => clauseWorkScore(x) > -2 || INTENT_WORK_OBJECT.test(x));
  }

  function extractDeadline(raw) {
    const text = normalize(raw);
    for (const regex of DEADLINE_PATTERNS) {
      const m = text.match(regex);
      if (m && m[0].trim()) return m[0].trim().replace(/\s+/g, ' ');
    }
    return '';
  }

  function removeDeadline(text, deadline) {
    if (!deadline) return text;
    return normalize(text).replace(deadline, '').replace(/^[，、\s]+|[，、\s]+$/gu, '').trim();
  }

  function detectObject(text) {
    const found = OBJECT_TERMS.filter(term => text.includes(term)).sort((a,b) => b.length - a.length);
    if (!found.length) return '';
    let obj = found[0];
    if (obj === '附件') {
      const m = text.match(/附件\s*[一二三四五六七八九十0-9A-Za-z-]*/u);
      if (m) obj = m[0].replace(/\s+/g, '');
    }
    return obj;
  }

  function canonicalAction(clause, topic) {
    let text = removeDeadline(cleanClause(clause), extractDeadline(clause));
    text = text.replace(POLITENESS_PREFIX, '').replace(/^(?:你|妳|您)\s*/u, '').replace(/^就/u,'').trim();
    const reviewer = text.match(/^由(.{1,24}?)(?:進行)?(?:覆核|複核)(.*)$/u);
    if (reviewer) {
      const who = reviewer[1].trim();
      const tail = reviewer[2].trim();
      const object = detectObject(tail) || detectObject(topic) || '';
      return `由${who}覆核${object ? object : '結果'}`;
    }
    const transform = text.match(/^(?:先)?(?:把)?(?:修成|改成|調整成)(.{2,70})$/u);
    if (transform) {
      const object = detectObject(topic) || '相關功能';
      return `將${object}調整為${transform[1].trim()}`;
    }
    const targetedConfirm = text.match(/^(?:先)?確認(.{2,60})$/u);
    if (targetedConfirm && /(?:可出勤時段|班次|人力|時段|日期|版本|欄位|內容|資料|進度|需求|規格)/u.test(targetedConfirm[1])) {
      return `確認${targetedConfirm[1].trim()}`;
    }
    // 優先保留可核對的局部修改目標，例如「第三頁數字要改」，
    // 法律、調查、研究語境中的「整理爭點與證據」本身就是具體任務，不應被泛化成「整理資料」。
    const issueEvidence = text.match(/(?:請|麻煩)?(?:先)?整理([^，。；]{0,28}(?:爭點|證據)[^，。；]{0,28})/u);
    if (issueEvidence) return `整理${issueEvidence[1].replace(/^(?:相關|本案)?/u,'').trim()}`;

    // 避免被泛化成沒有資訊量的「檢查並修正」。
    const targetedChange = text.match(/((?:第[一二三四五六七八九十0-9]+(?:頁|欄|項|段|張)|首頁|封面)[^，。；：]{0,28}?)(?:需要|應|要)?(?:改|修改|修正)(?:成[^，。；：]{1,24})?$/u);
    if (targetedChange) {
      const target = targetedChange[1]
        .replace(/(?:需要|應|要)?(?:改|修改|修正)(?:成.*)?$/u, '')
        .replace(/^(?:客戶說的修改(?:內容)?(?:就是|是)?)/u, '')
        .trim();
      if (target) return `修正${target}`;
    }
    const actionObject = detectObject(text);
    const topicObject = detectObject(topic);
    const object = (actionObject === '版本' && topicObject) ? topicObject : (actionObject || topicObject);

    const hasUpload = /上傳/u.test(text);
    for (const [regex, replacement] of ACTION_RULES) {
      if (!regex.test(text)) continue;
      if (replacement === '補上缺少的內容' && object) return hasUpload ? `補上缺少的${object}後上傳更新版本` : `補上缺少的${object}`;
      if (replacement === '檢查並修正' && object) return hasUpload ? `檢查並修正${object}後上傳更新版本` : `檢查並修正${object}`;
      if (replacement === '重新檢查並修正' && object) return hasUpload ? `重新檢查並修正${object}後上傳更新版本` : `重新檢查並修正${object}`;
      if (replacement === '上傳更新版本' && object && object !== '版本') return `上傳${object}的更新版本`;
      if (replacement === '提交完成版本' && object) return `提交${object}的完成版本`;
      if (replacement === '重新檢查並確認' && object) return `重新檢查並確認${object}內容`;
      if (replacement === '確認相關內容' && object) return `確認${object}內容`;
      if (replacement === '整理相關資料' && object) return `整理${object}`;
      return replacement;
    }

    // 保留可執行核心，但改寫命令語序，避免直接複製原句。
    text = text
      .replace(/^把/u, '')
      .replace(/一下$/u, '')
      .replace(/給我$/u, '')
      .replace(/好不好$/u, '')
      .trim();
    if (!text) return object ? `確認並處理${object}` : '';
    if (text.length > 70) text = text.slice(0, 70).replace(/[，；：、\s]+$/u, '');
    return text;
  }

  function canonicalFact(clause) {
    let text = cleanClause(clause)
      .replace(/^(?:目前)?(?:你|妳|您)\s*/u, '')
      .replace(/^(?:怎麼|為什麼)\s*/u, '')
      .trim();
    if (!text) return '';
    text = text
      .replace(/^(.{1,35})又少了(?=，|$)/u, '仍缺少$1')
      .replace(/^(.{1,35})(?:少了|缺了)(?=，|$)/u, '缺少$1')
      .replace(/^(?:現在)?(?:還沒|尚未)(?:回覆我|回我|回覆)$/u, '目前尚未收到回覆')
      .replace(/^(.{1,35})又少了$/u, '目前仍缺少$1')
      .replace(/^(.{1,35})(?:少了|缺了)$/u, '目前缺少$1')
      .replace(/^(.{1,35})又錯(?:一堆|很多|了)$/u, '目前$1仍有多處需要修正')
      .replace(/^(.{1,35})錯(?:一堆|很多)$/u, '目前$1有多處需要修正')
      .replace(/^(.{1,35})(?:有很多錯|錯誤很多)$/u, '目前$1有多處需要修正')
      .replace(/^(.{1,35})還沒(?:回覆|回我)$/u, '目前尚未收到回覆')
      .replace(/^現在還沒(?:回覆|回我)$/u, '目前尚未收到回覆')
      .replace(/版本日期也跟(.+?)講的不一樣/u, '版本日期與$1確認內容不一致')
      .replace(/版本日期跟(.+?)講的不一樣/u, '版本日期與$1確認內容不一致')
      .replace(/還沒/u, '尚未')
      .replace(/沒有收到/u, '尚未收到')
      .replace(/亂七八糟/u, '內容需要重新確認')
      .replace(/做成這樣/u, '版本需要修正');
    text = text
      .replace(/^現在才發現/u, '目前發現')
      .replace(/^(?:目前)?(?:結果|所以)?\s*(?:導致|造成|害得|弄得)\s*/u, '')
      .replace(/^(?:核銷|報帳)(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)$/u, '核銷作業未能完成')
      .replace(/^請款(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)$/u, '請款作業未能完成');
    text = text
      .replace(/^(.{1,45})就當機$/u, '$1時會發生當機')
      .replace(/^(?:資料)?(?:還會|會)不見$/u, '資料有遺失風險')
      .replace(/^(.+?)資料(?:還會|會)不見$/u, '$1資料有遺失風險')
      .replace(/^(.{1,45})(?:還會|會)不見$/u, '$1有遺失風險');
    if (!/^(?:目前|現在|仍|尚|已|未|這次|本次)/u.test(text)) text = `目前${text}`;
    if (text.length > 110) text = text.slice(0, 110).replace(/[，；：、\s]+$/u, '');
    return text;
  }

  function canonicalReason(clause) {
    let text = cleanClause(clause);
    text = text.replace(/^(?:因為|由於|為了|考量到|考量|主要是因為)\s*/u, '').trim();
    if (!text) return '';
    text = text
      .replace(/主管(.+?)要開會/u, '主管$1有會議安排')
      .replace(/(.+?)要開會/u, '$1有會議安排')
      .replace(/^(今天|明天|後天)?(?:的)?會議(?:就)?要用(?:了)?$/u, (_, day='') => `${day || '後續'}會議需要使用`)
      .replace(/^(今天|明天|後天)?(?:的)?會議需要使用$/u, (_, day='') => `${day || '後續'}會議需要使用`);
    if (/^(?:避免|以免|以利|以便|供)/u.test(text)) return text;
    if (/影響/u.test(text)) return text;
    if (/(?:有會議安排|需要使用|要使用|需使用|後續作業|後續處理)/u.test(text)) return text;
    return `需要${text}`;
  }

  function inferTopic(clauses, action, fact) {
    const combined = [fact, action, ...clauses].join(' ');
    if (/(?:客戶|客人)[^。！？!?]{0,24}(?:修改|調整|要求)|(?:修改|調整)[^。！？!?]{0,24}(?:客戶|客人)/u.test(combined)) return '客戶修改內容';
    if (/(?:第[一二三四五六七八九十0-9]+(?:頁|欄|項|段|張)|首頁|封面)[^。！？!?]{0,18}(?:數字|文字|內容|圖表|欄位)/u.test(combined)) return '修改內容';
    const mapping = {
      '排班':'排班','排班表':'排班','報告':'報告','報表':'報表','附件':'附件',
      '檔案':'檔案','文件':'文件','資料':'資料','簡報':'簡報','版本':'版本內容',
      '程式':'程式','網站':'網站','功能':'功能','需求':'需求','進度':'工作進度','紀錄':'紀錄',
      '核銷':'核銷與請款','核銷資料':'核銷與請款','請款':'核銷與請款','請款資料':'核銷與請款','憑證':'核銷與請款'
    };
    const actionObject = detectObject(action || '');
    if (actionObject) return mapping[actionObject] || actionObject;
    const factObject = detectObject(fact || '');
    if (factObject) return mapping[factObject] || factObject;
    const object = detectObject(combined);
    if (object) return mapping[object] || object;
    if (/回覆/u.test(combined)) return '回覆進度';
    return action ? '工作事項' : fact ? '工作狀況' : '';
  }

  function isMeaningfulAction(clause) {
    const value = stripRiskSpansForIntent(normalize(clause));
    if (!value) return false;
    if (clauseRiskScore(clause) >= 7 && clauseWorkScore(value) <= 1) return false;
    if (/(?:還沒|尚未|沒有|未)(?:收到)?(?:回覆|回信|處理|完成)/u.test(value) && !/(?:請|麻煩|給我|務必|今天|明天|前|內)/u.test(value)) return false;
    if (/^(?:你)?(?:不要|要|需要|務必|每次都|不要每次都|不要每次|可不可以|能不能)(?:了|啊|啦|喔|哦|嗎|嘛)?$/u.test(value)) return false;
    if (/^(?:如果|若|如)[^。！？!?]{0,50}(?:無法|不能|沒辦法)[^。！？!?]{0,20}(?:完成|處理|做到)$/u.test(value)) return false;
    if (value.length <= 8 && /^(?:你)?不要每次都/u.test(value)) return false;
    return ACTION_MARKERS.test(value) && !TOXIC_ONLY.test(value) && !EMOTIONAL_META.test(value);
  }
  function isMeaningfulFact(clause) {
    const value = stripRiskSpansForIntent(normalize(clause));
    if (!value) return false;
    if (INTENT_SEXUAL_COERCION.test(normalize(clause))) return false;
    if (/^(?:如果|若|如)[^。！？!?]{0,80}/u.test(value)) return false;
    if (clauseRiskScore(clause) >= 5 && clauseWorkScore(value) <= 1) return false;
    return FACT_STATE_MARKERS.test(value) && !REASON_MARKERS.test(value);
  }

  function safeActionLooksExecutable(action) {
    const value = normalize(action);
    if (!value) return false;
    if (/^(?:如果|若|如)[^。！？!?]{0,50}(?:無法|不能|沒辦法)[^。！？!?]{0,20}(?:完成|處理|做到)$/u.test(value)) return false;
    if (/(?:滾|離職|開除|解僱|扣薪|扣獎金|扣考績|不續約|黑名單|封殺|閉嘴|去死|做不好|不配合就|否則)/u.test(value)) return false;
    return /(?:確認|修正|修復|補|回覆|說明|提交|上傳|整理|提供|完成|覆核|複核|比對|更新|安排|提出|列出|停止|依|保留|通知|通報|處理|協調|調整|重排|排班|校對|查核|核對|檢查|確認並|改用|改以|移除|暫存|備份)/u.test(value);
  }

  function reasonLooksRecipientFacing(reason) {
    const value = normalize(reason);
    if (!value) return false;
    return !/(?:霸凌|騷擾|責罵|辱罵|威嚇|報復|噤聲|情緒性|情緒施壓|權勢施壓|程序不公|洗白|人身攻擊|人格攻擊)/u.test(value);
  }

  function factCarriesCoerciveRequirement(fact) {
    const value = normalize(fact);
    return /(?:一定要|必須|不得|不准|不准離線|得陪|都要陪|交出|定位開著|隨時回報|每(?:15|十五)分鐘回報|不續約|扣薪|扣考績|陪酒|陪(?:客戶|主管)?喝到|續攤)/u.test(value);
  }

  function scenarioEvidence(raw, scenario) {
    const text = normalize(raw).toLowerCase();
    const hits = [];
    let score = 0;
    for (const keyword of (scenario.keywords || [])) {
      const k = normalize(keyword).toLowerCase();
      if (!k || !text.includes(k)) continue;
      hits.push(keyword);
      score += Math.min(5, Math.max(1.2, k.length * 0.7));
    }
    const topic = normalize(scenario.topic || '').toLowerCase();
    if (topic && text.includes(topic)) score += 2.5;
    const issueHits = hits.filter(x => !String(scenario.topic || '').includes(x) && !String(x).includes(String(scenario.topic || '')));
    if (hits.length >= 2) score += 1.5;
    if (issueHits.length >= 1) score += 1.5;
    // 敏感情境（加班、監督、隱私、歧視、人事處分等）即使只有一個明確關鍵詞，
    // 也應優先帶出防護情境；這些情境本身禁止自動補入高風險命令。
    if (scenario.sensitive && hits.length >= 1) score += 2.4;
    const subjectiveComplaint = /(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|搞砸|搞爛|亂七八糟|很爛|超爛|爛透|垃圾|狗屁|鬼東西|雷包|豬隊友|拖油瓶)/u.test(text);
    if (!scenario.sensitive && subjectiveComplaint && hits.length >= 1) score += 1.8;
    if (subjectiveComplaint && /^doc_quality_/u.test(String(scenario.id || ''))) score += 2.2;
    if (scenario.id === 'complaint_nonretaliation' && /(?:申訴|檢舉|投訴|告狀|找人資|勞工局|勞檢|工會)/u.test(text) && /(?:不續約|開除|解僱|扣薪|扣考績|考績.{0,6}(?:難看|不好|很差)|調職|封殺|黑名單|不排班|排班.{0,8}(?:別想好過|不好過)|閉嘴|不准說)/u.test(text)) score += 18;
    if (scenario.id === 'monitoring_proportionality' && /(?:每(?:15|十五)分鐘|定位|私人手機|螢幕錄影|不准離線|隨時回報)/u.test(text) && /(?:不然|否則|扣考績|扣薪|一定要|必須|開著|不准離線)/u.test(text)) score += 16;
    return { score, hits, issueHits, subjectiveComplaint };
  }

  function intentSeedUnit(seedText) {
    let hash = 2166136261;
    for (const ch of String(seedText || `${Date.now()}|${Math.random()}`)) {
      hash ^= ch.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    let x = Math.abs(hash >>> 0) || 0x85ebca6b;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  }

  function weightedScenarioChoice(values, seed, field) {
    const list = (values || []).map(v => normalize(v)).filter(Boolean);
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    const base = [0.48, 0.29, 0.15, 0.08];
    const weights = list.map((_, i) => base[i] || Math.max(0.025, 0.08 / (i - 2)));
    const total = weights.reduce((a,b) => a+b, 0);
    let cursor = intentSeedUnit(`${seed}|${field}|${list.join('|')}`) * total;
    for (let i=0; i<list.length; i++) {
      cursor -= weights[i];
      if (cursor <= 0) return list[i];
    }
    return list[0];
  }

  function lowInformationExtractedText(text) {
    const value = normalize(text).replace(/[，。！？!?；;：:\s]/gu, '');
    if (!value) return true;
    if (value.length <= 3) return true;
    if (/^(?:目前)?(?:而已|而已啊|就是|這樣|那樣|工作事項|工作狀況|這件事|這個問題)$/u.test(value)) return true;
    if (/(?:笨|白癡|很爛|垃圾|你懂嗎|有沒有腦)/u.test(value)) return true;
    return false;
  }

  function usefulScenarioTopic(text) {
    const value = normalize(text);
    return Boolean(value && !/^(?:工作事項|工作狀況|工作問題|這件事|這個問題|事項)$/u.test(value) && !lowInformationExtractedText(value));
  }

  function retrieveSafeScenario(raw, current = {}, randomSeed = '') {
    const normalizedRaw = normalize(raw);
    // 飲酒、陪酒與下班後續攤若被綁成「工作義務」，不能只套用一般加班模板。
    // 先將真正可傳達的管理內容改回「必要工作 vs. 私人社交」的界線，再交給生成器。
    if (/(?:工作就是[^。！？!?]{0,14}(?:陪酒|喝酒|續攤)|(?:一定要|必須|得|都要)[^。！？!?]{0,18}(?:陪酒|陪(?:客戶|主管)?喝酒|續攤)|下班後[^。！？!?]{0,22}(?:陪酒|陪(?:客戶|主管)?喝酒|續攤))/u.test(normalizedRaw)) {
      return {
        scenarioId: 'forced_alcohol_boundary',
        category: '工作社交與飲酒界線',
        score: 99, matchedKeywords: ['飲酒／陪酒要求'], sensitive: true,
        guardrail: '飲酒、續攤或私人社交不應僅因業務合作而被自動推定為必要工作義務。',
        purpose: 'rule', topic: '工作社交安排',
        fact: '目前需要確認下班後社交活動中哪些內容確屬必要工作',
        action: '將必要的業務溝通與飲酒、續攤等私人社交分開安排，並保留合理拒絕空間',
        reason: '讓合作安排回到實際業務需求與必要範圍'
      };
    }
    const ranked = SAFE_SCENARIOS
      .map(sc => ({ scenario: sc, ...scenarioEvidence(raw, sc) }))
      .filter(item => item.score >= 4.2 && item.hits.length)
      .sort((a,b) => b.score - a.score || b.issueHits.length - a.issueHits.length || String(a.scenario.id).localeCompare(String(b.scenario.id)));
    const best = ranked[0];
    if (!best) return null;
    const sc = best.scenario;
    const currentAction = normalize(current.action);
    const rawCurrentFact = normalize(current.fact);
    const currentFact = lowInformationExtractedText(rawCurrentFact) ? '' : rawCurrentFact;
    const currentTopic = usefulScenarioTopic(current.topic) ? normalize(current.topic) : '';
    const hasIssueEvidence = best.issueHits.length > 0 || Boolean(best.subjectiveComplaint);
    const canAutofill = sc.safeAutofillAction !== false && hasIssueEvidence;
    const protectiveScenario = ['monitoring_proportionality','formal_performance_process','complaint_nonretaliation','overtime_process','privacy_minimization'].includes(String(sc.id || ''));
    const coerciveManagementCue = /(?:不然|否則|一定要|必須|不得|不准|交出|開著|隨時|每(?:15|十五)分鐘|扣(?:薪|考績|獎金)|不續約|開除|解僱|敢去申訴|敢申訴|敢檢舉)/u.test(normalize(raw));
    const canProtectiveAutofill = Boolean(sc.sensitive && sc.safeAutofillAction === false && protectiveScenario && hasIssueEvidence && coerciveManagementCue);
    const suggestion = {
      scenarioId: sc.id,
      category: sc.category,
      score: Math.round(best.score * 10) / 10,
      matchedKeywords: best.hits.slice(0, 8),
      sensitive: Boolean(sc.sensitive),
      guardrail: sc.guardrail || '',
      purpose: sc.purpose || 'general',
      topic: currentTopic || normalize(sc.topic),
      fact: (canProtectiveAutofill && factCarriesCoerciveRequirement(currentFact))
        ? weightedScenarioChoice(sc.facts, randomSeed, 'protective-fact')
        : (currentFact || (hasIssueEvidence ? weightedScenarioChoice(sc.facts, randomSeed, 'fact') : '')),
      action: safeActionLooksExecutable(currentAction) ? currentAction : ((canAutofill || canProtectiveAutofill) ? weightedScenarioChoice(sc.actions, randomSeed, 'action') : ''),
      // 一般情境的「原因／影響」只從原始訊息實際抽取，不因模板看起來完整就自行補理由。
      // 只有高風險管理要求被改寫成保護性替代方案時，才允許補入對應的安全目的。
      reason: normalize(current.reason) || (canProtectiveAutofill ? (() => { const candidate = weightedScenarioChoice(sc.reasons, randomSeed, 'reason'); return reasonLooksRecipientFacing(candidate) ? candidate : ''; })() : '')
    };
    // 如果原文直接呈現「怕被罵／怕講錯而不敢回報」，即使句中另有一個泛化行動，
    // 仍優先保留「提早揭露問題」這個真正工作意圖，而不是只留下「確認排班」。
    if (sc.id === 'early_issue_disclosure' && /(?:怕被罵|怕被念|不敢說|不敢講|怕講錯|怕說錯|被抓包|先講|先回報)/u.test(normalize(raw)) && canAutofill) {
      suggestion.action = weightedScenarioChoice(sc.actions, randomSeed, 'disclosure-action');
    }
    return suggestion;
  }

  function detectAudienceHint(raw) {
    const text = normalize(raw);
    const m = text.match(/^\s*(主管|經理|主任|組長|老闆|長官|教授|老師|客戶|家長|同學|同事|各位|您好)[您好\s，：,:]*/u);
    if (!m) return null;
    const cue = m[1];
    if (/^(?:主管|經理|主任|組長|老闆|長官|教授|老師)$/u.test(cue)) return { value: 'supervisor', label: cue, cue };
    if (/^(?:客戶)$/u.test(cue)) return { value: 'client', label: cue, cue };
    if (/^(?:家長|同學)$/u.test(cue)) return { value: 'student', label: cue, cue };
    if (/^(?:同事)$/u.test(cue)) return { value: 'coworker', label: cue, cue };
    if (/^(?:各位|您好)$/u.test(cue)) return { value: 'public', label: cue, cue };
    return null;
  }

  function extract(raw, manual = {}, options = {}) {
    const clauses = splitClauses(raw);
    const derivedIntent = deriveCrossClauseIntent(raw);
    const deadline = manual.deadline || extractDeadline(raw);
    const reasonClause = clauses.find(c => REASON_MARKERS.test(c) && clauseRiskScore(c) < 7) || '';
    const actionCandidates = clauses.filter(c => isMeaningfulAction(c) && c !== reasonClause).sort((a,b) => clauseWorkScore(b) - clauseWorkScore(a));
    const actionClause = actionCandidates[0] || '';
    const factCandidates = clauses.filter(c => c !== actionClause && c !== reasonClause && isMeaningfulFact(c)).sort((a,b) => clauseWorkScore(b) - clauseWorkScore(a));
    const factClause = factCandidates[0] || '';

    const provisionalAction = manual.action || (derivedIntent && derivedIntent.action) || canonicalAction(actionClause, manual.topic || '');
    const provisionalFact = manual.fact || (derivedIntent && derivedIntent.fact) || (factClause ? canonicalFact(removeDeadline(factClause, deadline)) : '');
    let topic = manual.topic || (derivedIntent && derivedIntent.topic) || inferTopic(clauses, provisionalAction, provisionalFact);
    let action = manual.action || (derivedIntent && derivedIntent.action) || (actionClause ? canonicalAction(actionClause, topic) : provisionalAction) || (topic && clauses.length ? canonicalAction(clauses[clauses.length - 1], topic) : '');
    let fact = manual.fact || (derivedIntent && derivedIntent.fact) || provisionalFact;
    let reason = manual.reason || (derivedIntent && derivedIntent.reason) || (reasonClause ? canonicalReason(removeDeadline(reasonClause, deadline)) : '');
    // 將「明天會議需要使用」補成自然但不新增事實的指涉句，避免輸出孤立的公文片段。
    if (!manual.reason && /^(?:今天|明天|後天|本週|下週|後續)會議需要使用$/u.test(reason)) {
      const objectLabel = /附件/u.test(topic) ? '附件' : /報告/u.test(topic) ? '報告' : /簡報/u.test(topic) ? '簡報' : /(?:文件|資料|表單|紀錄)/u.test(topic) ? '資料' : '';
      if (objectLabel) reason = reason.replace(/會議需要使用$/u, `會議會用到這份${objectLabel}`);
    }

    // 第二語料庫只在原文已有足夠情境證據時補上低風險、可執行的工作內容。
    // 敏感情境或僅有單一主題詞時不自動補出處分、加班、隱私蒐集等要求。
    const corpusSuggestion = retrieveSafeScenario(raw, { topic, fact, action, reason }, options.randomSeed || '');
    if (corpusSuggestion) {
      if (!manual.topic && (!topic || !usefulScenarioTopic(topic)) && corpusSuggestion.topic) topic = corpusSuggestion.topic;
      if (!manual.fact && corpusSuggestion.sensitive && corpusSuggestion.fact && factCarriesCoerciveRequirement(fact)) fact = corpusSuggestion.fact;
      if (!manual.fact && (!fact || lowInformationExtractedText(fact)) && corpusSuggestion.fact) fact = corpusSuggestion.fact;
      if (!manual.action && !safeActionLooksExecutable(action) && corpusSuggestion.action) action = corpusSuggestion.action;
      if (!manual.action && corpusSuggestion.scenarioId === 'early_issue_disclosure' && corpusSuggestion.action && /(?:怕被罵|怕被念|不敢說|不敢講|怕講錯|怕說錯|被抓包|先講|先回報)/u.test(normalize(raw))) action = corpusSuggestion.action;
      if (!manual.reason && !reason && corpusSuggestion.reason && reasonLooksRecipientFacing(corpusSuggestion.reason)) reason = corpusSuggestion.reason;
      if (!manual.topic && (!topic || topic === '工作事項' || topic === '工作狀況') && corpusSuggestion.topic) topic = corpusSuggestion.topic;
    }

    if (!manual.action && !derivedIntent) {
      const reviewerClause = actionCandidates.find(c => /(?:覆核|複核)/u.test(c));
      if (reviewerClause) {
        const reviewerAction = canonicalAction(reviewerClause, topic);
        if (reviewerAction && safeActionLooksExecutable(reviewerAction) && !normalize(action).includes(normalize(reviewerAction))) {
          action = safeActionLooksExecutable(action) ? `${action}；${reviewerAction}` : reviewerAction;
        }
      }
      const secondFactClause = factCandidates.find(c => c !== factClause && clauseWorkScore(c) >= 2);
      if (secondFactClause && fact) {
        const secondFact = canonicalFact(removeDeadline(secondFactClause, deadline));
        if (secondFact && !normalize(fact).includes(normalize(secondFact)) && !normalize(secondFact).includes(normalize(fact))) fact = `${fact}；${secondFact}`;
      }
    }
    if (!manual.action && /附件/u.test(topic) && /(?:又少(?:了)?|少了|缺少|缺了)[^。；]{0,18}(?:欄|欄位)/u.test(fact) && /補上缺少的附件/u.test(action)) action = '補上附件中缺少的欄位';
    // 「附件二又少了／請補齊並上傳正確版本」的工作物件在動作句裡只出現「版本」，
    // 不能因此誤寫成「補上缺少的版本」。優先用已抽取的客觀事實補回真正缺少的物件。
    if (!manual.action && /(?:補上缺少的版本|補上缺少的版本後上傳更新版本)/u.test(action)) {
      const missingObject = String(fact || '').match(/(?:仍缺少|目前缺少|缺少)([^；，。]{1,30})/u)?.[1]?.trim();
      if (missingObject) {
        action = /上傳/u.test(action) ? `補齊${missingObject}並上傳正確版本` : `補齊${missingObject}`;
      }
    }
    if (!manual.action && !safeActionLooksExecutable(action)) action = '';

    const substance = {
      topic,
      fact,
      action,
      deadline,
      reason,
      basis: manual.basis || '',
      tone: manual.tone || 'directive'
    };

    const topicEvidence = (derivedIntent && derivedIntent.evidence.topic) || clauses.find(c => topic && normalize(c).includes(normalize(topic))) || factClause || actionClause || '';
    const evidence = {
      topic: topicEvidence,
      fact: (derivedIntent && derivedIntent.evidence.fact) || factClause || '',
      action: (derivedIntent && derivedIntent.evidence.action) || actionClause || '',
      deadline: deadline || '',
      reason: (derivedIntent && derivedIntent.evidence.reason) || reasonClause || '',
      basis: ''
    };

    const extractedFields = Object.entries(substance)
      .filter(([k,v]) => k !== 'tone' && !String(manual[k] || '').trim() && String(v || '').trim())
      .map(([k]) => k);
    const confidence = derivedIntent && action ? 'high' : (action ? (fact || topic ? 'high' : 'medium') : (fact ? 'low' : 'insufficient'));
    const needsInput = !action && !fact;
    return {
      substance,
      clauses,
      audienceHint: detectAudienceHint(raw),
      corpusSuggestion,
      extractedFields,
      evidence,
      confidence,
      needsInput,
      notice: needsInput
        ? '原始訊息中沒有足夠的可執行工作內容；系統不會從辱罵或威脅自行捏造工作要求。請補充實際要對方處理的事項。'
        : `已從原始訊息抽取${extractedFields.length ? '並補入' : '確認'}工作意圖；原始羞辱、威脅與情緒性內容不會直接進入輸出。`
    };
  }

  function decopySubstance(input = {}) {
    const s = { ...input };
    const originalFact = normalize(s.fact);
    let fact = originalFact
      .replace(/^目前(.+?)仍有多處需要修正$/u, '目前$1有幾處內容需要調整')
      .replace(/^目前尚未收到回覆$/u, '目前還沒有收到回覆')
      .replace(/^仍缺少(.+)$/u, '目前$1尚未齊全')
      .replace(/^目前缺少(.+)$/u, '目前$1尚未齊全')
      .replace(/版本日期與(.+?)確認內容不一致/u, '版本日期目前和$1確認的內容有落差');
    if (fact && fact === originalFact) {
      fact = /^目前/u.test(fact) ? fact.replace(/^目前/u, '現階段') : `目前確認到：${fact}`;
    }

    const originalAction = normalize(s.action);
    let action = originalAction
      .replace(/^重新檢查並修正(.+)$/u, '完成$1的重新檢查與修正')
      .replace(/^檢查並修正(.+?)後上傳更新版本$/u, '完成$1檢查與修正後，再上傳更新版本')
      .replace(/^補上缺少的(.+?)後上傳更新版本$/u, '將$1補齊後，再上傳更新版本')
      .replace(/^補上缺少的(.+)$/u, '將$1補齊')
      .replace(/^回覆目前處理情形$/u, '說明目前的處理進度')
      .replace(/^上傳(.+?)的更新版本$/u, '完成更新後上傳$1')
      .replace(/^確認(.+?)內容$/u, '完成$1內容確認');
    if (action && action === originalAction) action = `依目前需求完成「${action}」`;

    const originalReason = normalize(s.reason);
    let reason = originalReason
      .replace(/^主管(.+?)有會議安排$/u, '$1另有主管會議時程');
    if (reason && reason === originalReason && !/^(?:避免|以免|以利|以便|供)/u.test(reason)) reason = `考量${reason}`;

    return { ...s, fact, action, reason };
  }

  function normalizedForSimilarity(text) {
    return normalize(text).replace(/[，。；：、！？\s]/gu, '');
  }

  function copiedSentenceRisk(source, output) {
    const src = normalizedForSimilarity(source);
    const sentences = normalize(output).split(/[。！？!?]/u).map(normalizedForSimilarity).filter(x => x.length >= 10);
    const copied = sentences.filter(s => src.includes(s));
    return { copied: copied.length > 0, fragments: copied };
  }

  return { extract, normalize, splitClauses, extractDeadline, canonicalAction, canonicalFact, detectAudienceHint, decopySubstance, copiedSentenceRisk, retrieveSafeScenario, safeActionLooksExecutable, safeCorpusVersion: SAFE_CORPUS.version || 'unknown' };
});

/* Section 3: fully offline hybrid execution bridge */
'use strict';

(function initHybridBridge(root) {
  const mode = 'hybrid-local';
  let statusCallback = null;

  function report(state, detail) {
    if (typeof statusCallback === 'function') statusCallback({ state, detail, mode });
  }

  async function initialize({ onStatus } = {}) {
    if (onStatus) statusCallback = onStatus;
    const model = root.MESSAGE_REWRITE_ENGINE?.domainLanguageModel;
    const detail = model
      ? `本機混合語言模型（領域神經語言模型＋情境接龍＋風險規則）`
      : '本機混合語言引擎（情境接龍＋風險規則）';
    report('ready', detail);
    return mode;
  }

  function jsProcess(payload) {
    const intent = root.MESSAGE_INTENT_ENGINE.extract(payload.raw || '', payload.substance || {}, payload.options || {});
    const rawSubstance = intent.substance;
    const sanitized = typeof root.RMG_SANITIZE_STRUCTURED === 'function'
      ? root.RMG_SANITIZE_STRUCTURED(rawSubstance, payload.options || {})
      : { substance: rawSubstance, blocked: 0 };
    const s = sanitized.substance;
    intent.substance = s;
    const rewrite = root.MESSAGE_REWRITE_ENGINE.rewriteStructuredMessage(s, payload.options || {});
    const variants = rewrite.variants || {};
    let selected = rewrite.text || '';
    const copyRisk = root.MESSAGE_INTENT_ENGINE.copiedSentenceRisk(payload.raw || '', selected);
    if (copyRisk.copied) {
      const alternateStyle = (payload.options?.rewriteStyle || 'natural') === 'formal' ? 'natural' : 'formal';
      selected = variants[alternateStyle] || selected;
    }
    return {
      engine: mode,
      engineVersion: '2.2.0',
      extraction: intent,
      substance: s,
      ...rewrite,
      text: intent.needsInput ? '' : selected,
      copyable: Boolean(!intent.needsInput && selected),
      notice: intent.needsInput
        ? intent.notice
        : `本機混合語言模型已${intent.extractedFields.length ? '抽取工作意圖並補全' : '依確認後工作內容'}，再以情境接龍、詞彙權重與神經流暢度重新排序候選；不會直接複製原句。`
    };
  }

  async function process(payload) {
    return jsProcess(payload);
  }

  root.MESSAGE_ENGINE_BRIDGE = { initialize, process, getMode: () => mode, jsProcess };
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* Section 4: application and risk analysis */
'use strict';

const INTRO_SESSION_KEY = 'rmg:intro-acknowledged';
function safeSessionGet(key) {
  try { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null; }
  catch (_) { return null; }
}
function safeSessionSet(key, value) {
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value); }
  catch (_) { /* 部分隱私模式／本機檔案禁止 sessionStorage；不影響核心功能。 */ }
}
let clipboardImageDetected = false;
let lastAnalysisResult = null;
let activeRewriteVariant = 'natural';
let selectedPresetScenarioId = '';
let activeSpeechRecognition = null;
let activeVoiceButton = null;
let activeVoiceSession = null;

// v2.1: Step 2 is an editable projection of Step 1, not an independent form.
const STRUCTURED_FIELD_IDS = { topic:'topicText', fact:'factText', action:'actionText', deadline:'deadlineText', reason:'reasonText', basis:'basisText' };
const manualOverrideFields = new Set();
const autoFieldValues = Object.create(null);
let programmaticFieldUpdate = false;
let liveExtractionTimer = null;
let latestLiveExtraction = null;
let findingPage = 1;
let findingFilter = 'all';
const FINDING_PAGE_SIZE = 6;

const CORPUS = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.BULLYING_CORPUS_DATA) return globalThis.BULLYING_CORPUS_DATA;
  if (typeof module !== 'undefined' && module.exports) return require('./bullying-corpus.js');
  throw new Error('離線霸凌／高風險主語料庫未載入。');
})();

const REWRITE_ENGINE = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.MESSAGE_REWRITE_ENGINE) return globalThis.MESSAGE_REWRITE_ENGINE;
  throw new Error('離線潤稿引擎未載入。');
})();

const INTENT_ENGINE = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.MESSAGE_INTENT_ENGINE) return globalThis.MESSAGE_INTENT_ENGINE;
  return null;
})();

const ENGINE_BRIDGE = (typeof globalThis !== 'undefined' && globalThis.MESSAGE_ENGINE_BRIDGE)
  ? globalThis.MESSAGE_ENGINE_BRIDGE
  : null;

const EXPERT_ENTRIES = Array.isArray(CORPUS.expertEntries) ? CORPUS.expertEntries : [];
const EXPERT_CORPUS = { version: CORPUS.version, entryCount: EXPERT_ENTRIES.length, entries: EXPERT_ENTRIES };
const SAFE_MESSAGE_CORPUS = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.SAFE_MESSAGE_CORPUS_DATA) return globalThis.SAFE_MESSAGE_CORPUS_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    try { return require('./safe-message-corpus.js'); } catch (_) { return { scenarios: [], examples: [], version: 'unavailable' }; }
  }
  return { scenarios: [], examples: [], version: 'unavailable' };
})();

const SIMPLIFIED_TO_TRADITIONAL = new Map(Object.entries({
  '爱':'愛','单':'單','这':'這','个':'個','们':'們','说':'說','话':'話','来':'來','时':'時','会':'會','发':'發','后':'後','里':'裡','还':'還','没':'沒','让':'讓','从':'從','对':'對','过':'過','给':'給','开':'開','关':'關','门':'門','间':'間','应':'應','实':'實','当':'當','见':'見','观':'觀','学':'學','长':'長','车':'車','书':'書','电':'電','网':'網','东':'東','乐':'樂','风':'風','业':'業','产':'產','员':'員','职':'職','权':'權','无':'無','与':'與','体':'體','国':'國','进':'進','运':'運','马':'馬','气':'氣','万':'萬','众':'眾','优':'優','伤':'傷','么':'麼','听':'聽','边':'邊','务':'務','办':'辦','动':'動','势':'勢','试':'試','该':'該','岁':'歲','历':'歷','归':'歸','怀':'懷','复':'復','达':'達','认':'認','现':'現','数':'數','线':'線','条':'條','别':'別','资':'資','调':'調','显':'顯','销':'銷','录':'錄','验':'驗','质':'質','软':'軟','围':'圍','构':'構','简':'簡','译':'譯','览':'覽','户':'戶','页':'頁','侧':'側','层':'層','项':'項','处':'處','觉':'覺','虽':'雖','医':'醫','护':'護','湾':'灣','华':'華','协':'協','属':'屬','级':'級','导':'導','诉':'訴','疗':'療','举':'舉','奖':'獎','罚':'罰','证':'證','离':'離','仅':'僅','亲':'親','爷':'爺','妇':'婦','恶':'惡','晒':'曬','轻':'輕','词':'詞','愿':'願','龄':'齡','师':'師','临':'臨','区':'區','劳':'勞','将':'將','备':'備','带':'帶','审':'審','续':'續','记':'記','样':'樣','档':'檔','设':'設','签':'簽','报':'報','预':'預','统':'統','扩':'擴','组':'組','监':'監','严':'嚴','击':'擊','坚':'堅','卖':'賣','买':'買','张':'張','欢':'歡','坏':'壞','败':'敗','拥':'擁','赔':'賠','术':'術','艺':'藝','诊':'診','药':'藥','类':'類','释':'釋','争':'爭','执':'執','据':'據','窥':'窺','终':'終','够':'夠','转':'轉','图':'圖','问':'問','规':'規','训':'訓','险':'險','专':'專','写':'寫','滚':'滾','赶':'趕'
}));

function toTraditionalChinese(text) {
  let value = Array.from(String(text || ''), ch => SIMPLIFIED_TO_TRADITIONAL.get(ch) || ch).join('');
  return value
    .replace(/老板/g, '老闆')
    .replace(/周末/g, '週末')
    .replace(/软件/g, '軟體')
    .replace(/网络/g, '網路')
    .replace(/视频/g, '影片')
    .replace(/信息/g, '資訊')
    .replace(/项目/g, '專案')
    .replace(/文件夹/g, '資料夾')
    .replace(/鼠标/g, '滑鼠')
    .replace(/屏幕/g, '螢幕')
    .replace(/默认/g, '預設')
    .replace(/用户/g, '使用者')
    .replace(/点击/g, '點選')
    .replace(/后台/g, '後端')
    .replace(/优化/g, '最佳化')
    .replace(/质量/g, '品質')
    .replace(/通过/g, '通過')
    .replace(/裡程碑/g, '里程碑');
}

const LEGAL_CATALOG = CORPUS.legalCatalog || {};
const SOURCE_CATALOG = CORPUS.sourceCatalog || {};
const PHRASE_ENTRIES = CORPUS.phraseEntries || [];
const PATTERN_ENTRIES = (CORPUS.patternEntries || []).map(entry => ({
  ...entry,
  regex: new RegExp(entry.pattern, 'giu')
}));
const CONTEXT_ENTRIES = (CORPUS.contextRules || []).map(entry => ({
  ...entry,
  regex: new RegExp(entry.pattern, 'giu')
}));

const LEGAL_REFERENCES = [
  {
    title: '職場霸凌核心法制',
    body: '職場霸凌須綜合職務或權勢關係、業務必要且合理範圍、持續性或重大情節，以及對身心健康的危害。雇主另有預防、申訴、調查、保護、保密與禁止報復義務。',
    href: 'https://laws.mol.gov.tw/FLAW/PrintFLAWDOC01.aspx?flno=22-1&id=FL015013',
    link: '職業安全衛生法第22條之1至第22條之3'
  },
  {
    title: '職場霸凌防治與調查程序',
    body: '準則明列排擠冷落、妨礙工作、權勢欺壓、不合理工作分派、散布謠言或揭露隱私等審酌態樣，並規範申訴、調查、迴避、申復、保密、反報復與紀錄保存。',
    href: 'https://laws.mol.gov.tw/FLAW/FLAWDAT01.aspx?id=FL106701',
    link: '職場霸凌防治措施準則'
  },
  {
    title: '執行職務遭受不法侵害',
    body: '除事業單位內部霸凌外，顧客、服務對象、案家或其他第三人造成的身體或精神不法侵害，也涉及職業安全衛生的預防、行為規範、訓練、申訴及事件處理。',
    href: 'https://laws.mol.gov.tw/FLAW/PrintFLAWDOC01.aspx?flno=324-3&id=FL015021',
    link: '職業安全衛生設施規則第324條之3'
  },
  {
    title: '人事處分、調動與申訴保護',
    body: '解僱、資遣、調動、減薪、排班、考績或懲處，應依具體事實、權限、勞動法令及正式程序處理，不宜作為情緒性威嚇或申訴後報復。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001',
    link: '勞動基準法相關規定'
  },
  {
    title: '工作場所性騷擾',
    body: '性要求、性意味或性別歧視的言詞、行為、圖片或貼圖，若造成敵意、脅迫或冒犯性工作環境，可能進入工作場所性騷擾制度；利用權勢或交換工作利益時風險更高。',
    href: 'https://laws.mol.gov.tw/FLAW/FLAWDAT0201.aspx?id=FL015149',
    link: '性別平等工作法第12條、第13條'
  },
  {
    title: '一般性騷擾與跟蹤騷擾',
    body: '非職場或校園特別制度時，可能另依性騷擾防治法分流。反覆或持續、違反意願的通訊干擾、守候、尾隨、威脅或掌握行蹤，若符合其他法定要件，亦可能涉及跟蹤騷擾。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0080211',
    link: '跟蹤騷擾防制法'
  },
  {
    title: '個人資料與隱私',
    body: '姓名、電話、地址、身分證字號、病歷、醫療與健康資訊等，應遵守特定目的、必要範圍、誠實信用與安全維護原則；申訴與調查資訊亦有保密要求。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021',
    link: '個人資料保護法'
  },
  {
    title: '人格權、名譽與刑事風險',
    body: '侮辱、威脅、散布隱私、侵害名譽或以強制手段迫使他人服從，依具體情境可能衍生民事或刑事責任；本工具只提示風險，不直接認定構成要件成立。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=B0000001',
    link: '民法與刑法相關規定'
  },
  {
    title: '歧視與差別待遇',
    body: '以性別、性傾向、年齡、族群、國籍、語言、身心障礙等受保障身分作為羞辱或不利處理依據，可能另涉就業歧視及平等保障。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0090001',
    link: '就業服務法第5條及相關平等法制'
  },
  {
    title: '公務人員與校園分流',
    body: '公務人員職場霸凌、校園霸凌及校園性別事件各有專門的防護、調查與救濟程序，不能直接套用一般民間職場流程。',
    href: 'https://www.csptc.gov.tw/News.aspx?n=4555&sms=12512',
    link: '公務人員保障法第19條與保訓會職場霸凌防治專區'
  }
];

const PII_RULES = [
  {
    id: 'national-id',
    title: '身分證統一編號',
    regex: /\b[A-Z][12]\d{8}\b/giu,
    replacement: '【身分證字號已遮罩】',
    reason: '身分證字號具有高度識別性，通常不應出現在一般工作或服務訊息。'
  },
  {
    id: 'person-name-context',
    title: '姓名與聯絡或醫療資訊並列',
    regex: /[\u3400-\u9FFF]{2,4}(?=的(?:電話|手機|地址|病歷|病歷號|身分證|電子郵件))/gu,
    replacement: '【姓名已遮罩】',
    reason: '姓名與電話、地址、病歷等資料並列時，識別風險顯著提高，宜先去識別化。'
  },
  {
    id: 'phone-mobile',
    title: '行動電話',
    regex: /(?<!\d)09\d{2}[-\s]?\d{3}[-\s]?\d{3}(?!\d)/gu,
    replacement: '【電話已遮罩】',
    reason: '聯絡電話應限於業務必要範圍，避免轉貼或群組揭露。'
  },
  {
    id: 'phone-landline',
    title: '市內電話',
    regex: /(?<!\d)\(?0[2-8]\d?\)?[-\s]?\d{3,4}[-\s]?\d{4}(?!\d)/gu,
    replacement: '【電話已遮罩】',
    reason: '市內電話亦屬可識別個人的聯絡資訊。'
  },
  {
    id: 'email',
    title: '電子郵件',
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
    replacement: '【電子郵件已遮罩】',
    reason: '電子郵件可能直接識別個人或組織帳號，應確認傳送對象與必要性。'
  },
  {
    id: 'medical-record',
    title: '病歷號或個案編號',
    regex: /(病歷號|病歷編號|個案編號|案號)\s*[:：#]?\s*[A-Z0-9-]{5,}/giu,
    replacement: '$1：【編號已遮罩】',
    reason: '病歷與個案編號可與其他資料結合識別個人，不宜在非必要訊息中揭露。'
  },
  {
    id: 'address',
    title: '疑似完整地址',
    regex: /(?:臺|台)?(?:北|中|南|東|桃園|新北|新竹|苗栗|彰化|雲林|嘉義|高雄|屏東|宜蘭|花蓮|臺東|台東|澎湖|基隆|金門|連江)[^，。；\n]{0,12}(?:市|縣)[^，。；\n]{0,18}(?:區|鄉|鎮|市)[^，。；\n]{0,24}(?:路|街|大道|巷|弄)[^，。；\n]{0,12}(?:號|樓)/gu,
    replacement: '【地址已遮罩】',
    reason: '完整住居所或服務地點可能造成隱私與人身安全風險。'
  }
];

const HEALTH_TERMS = /(診斷|病歷|病史|精神科|身心科|失智|憂鬱症|躁鬱症|癌症|愛滋|HIV|懷孕|流產|身心障礙|用藥|處方|手術|住院|急診|血壓|血糖|心衰竭|心律不整)/giu;
const STICKER_REGEX = /(\[貼圖\]|【貼圖】|\(貼圖\)|〈貼圖〉|\[sticker\]|<sticker>|貼圖一張)/giu;
const EMOJI_REGEX = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu;
const EXCESSIVE_PUNCTUATION = /([!?！？])\1{1,}/gu;
const OBFUSCATION_SEPARATOR = '[\\s·・._*＊xX\\-—~～%％#＃@＠]*';

const PURPOSE_FALLBACK = {
  remind: '請協助確認目前辦理進度，並於可行時間內回覆。',
  correct: '請協助確認上述差異並依既定標準修正。',
  rule: '後續請依既定規範辦理；如有特殊情形，請先提出具體說明。',
  refuse: '目前無法依原要求辦理；如需其他可行方案，請透過正式管道提出。',
  schedule: '後續排班、分工或服務安排將依既定程序與實際需求辦理。',
  general: '請協助確認上述事項，並回覆後續處理方式。'
};

const OPENING_BY_AUDIENCE = {
  coworker: '',
  supervisor: '',
  client: '您好，',
  student: '您好，',
  public: '您好，'
};

const TONE_CLOSING = {
  cooperative: '如有不同理解或執行困難，請具體說明，以便協調後續處理。',
  directive: '請依上述事項辦理；如有客觀困難，請於期限前具體說明。',
  formal: '後續將依既定規範、權限及正式程序辦理；如對事實或標準有不同意見，請提出具體說明。'
};

const PHRASE_MATCHERS = PHRASE_ENTRIES.map(entry => ({
  entry,
  regex: phraseToFlexibleRegex(entry.phrase)
}));

function $(id) {
  return document.getElementById(id);
}

function phraseToFlexibleRegex(phrase) {
  const escapedChars = Array.from(normalizeText(phrase)).map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escapedChars.join(OBFUSCATION_SEPARATOR), 'giu');
}

function normalizeText(text) {
  return toTraditionalChinese(String(text || ''))
    .normalize('NFKC')
    .replace(/[\u200B\u200C\u2060\uFEFF]/gu, '');
}

const FEEDBACK_STORAGE_KEY = 'rmg:feedback-v2';

function emptyFeedbackStore() {
  return { version: 2, totalAnalyses: 0, updatedAt: '', terms: {} };
}

function normalizeFeedbackTerm(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[\s，。；：、！？!?「」『』（）()【】\[\]…—–_-]+/gu, '')
    .slice(0, 80);
}

function loadFeedbackStore() {
  try {
    if (typeof localStorage === 'undefined') return emptyFeedbackStore();
    const parsed = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || 'null');
    if (!parsed || parsed.version !== 2 || typeof parsed.terms !== 'object') return emptyFeedbackStore();
    return { ...emptyFeedbackStore(), ...parsed, terms: parsed.terms || {} };
  } catch (_) { return emptyFeedbackStore(); }
}

function saveFeedbackStore(store) {
  try {
    if (typeof localStorage === 'undefined') return false;
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (_) { return false; }
}

function addFeedbackTerm(rawTerm, kind = 'risk', category = '其他') {
  const display = cleanText(rawTerm).slice(0, 120);
  const key = normalizeFeedbackTerm(display);
  if (!key || key.length < 2) return { ok: false, message: '請至少輸入兩個可辨識字元。' };
  const store = loadFeedbackStore();
  const current = store.terms[key] || { display, risk: 0, falsePositive: 0, category, lastSeen: '' };
  current.display = display || current.display || key;
  current.category = category || current.category || '其他';
  current[kind === 'falsePositive' ? 'falsePositive' : 'risk'] = Number(current[kind === 'falsePositive' ? 'falsePositive' : 'risk'] || 0) + 1;
  current.lastSeen = new Date().toISOString();
  store.terms[key] = current;
  saveFeedbackStore(store);
  return { ok: true, key, entry: current, store };
}

function feedbackTermStats(entry) {
  const risk = Number(entry?.risk || 0);
  const fp = Number(entry?.falsePositive || 0);
  const total = risk + fp;
  const rate = total ? risk / total : 0;
  // Bayesian smoothing prevents one click from becoming a strong automatic rule.
  const confidence = (risk + 1) / (total + 2);
  const evidence = Math.min(1, Math.log2(total + 1) / 3.2);
  const weight = Math.max(0, Math.min(24, (confidence - 0.48) * 34 * evidence));
  return { risk, fp, total, rate, confidence, weight };
}

function activeFeedbackTerms() {
  const store = loadFeedbackStore();
  return Object.entries(store.terms || {})
    .map(([key, entry]) => ({ key, ...entry, ...feedbackTermStats(entry) }))
    .filter(item => item.risk >= 2 && item.rate >= 0.60 && item.weight >= 1.5)
    .sort((a, b) => b.weight - a.weight || b.total - a.total)
    .slice(0, 240);
}

function dynamicFeedbackRiskScore(text) {
  const normalized = normalizeFeedbackTerm(text);
  if (!normalized) return 0;
  let score = 0;
  for (const item of activeFeedbackTerms()) {
    if (item.key.length >= 2 && normalized.includes(item.key)) score += item.weight;
  }
  return Math.min(30, score);
}

if (typeof globalThis !== 'undefined') globalThis.RMG_DYNAMIC_RISK_SCORE = dynamicFeedbackRiskScore;

function incrementFeedbackAnalysisCount() {
  const store = loadFeedbackStore();
  store.totalAnalyses = Number(store.totalAnalyses || 0) + 1;
  saveFeedbackStore(store);
}

function scanFeedbackCorpus(text, source = '原始訊息') {
  const normalized = normalizeFeedbackTerm(text);
  if (!normalized) return { findings: [], score: 0 };
  const findings = [];
  let score = 0;
  for (const item of activeFeedbackTerms()) {
    if (!normalized.includes(item.key)) continue;
    const weight = Math.round(item.weight);
    score += weight;
    findings.push({
      type: 'tone', source,
      corpusId: `LOCAL-FEEDBACK-${item.key.slice(0, 18)}`,
      title: `本機回報：${item.category || '自訂高風險說法'}`,
      severity: item.risk >= 5 && item.rate >= 0.78 ? 'severe' : 'moderate',
      fragment: item.display || item.key,
      canonicalPhrase: item.display || item.key,
      reason: `此詞／片段已在本機回饋中被標記為不妥 ${item.risk} 次、誤判 ${item.fp} 次；目前不妥率 ${Math.round(item.rate * 100)}%。回饋只調整本機輔助權重，不取代正式語料與法律判斷。`,
      safeAction: '先確認真正工作目的，再改寫為可核對的事實、具體行動、合理期限與必要原因。',
      legalNotes: [], sourceNotes: [], safeScenarioIds: [], localFeedback: true
    });
  }
  return { findings, score };
}

function cleanText(text) {
  return normalizeText(text)
    .replace(/,/g, '，')
    .replace(/;/g, '；')
    .replace(/:/g, '：')
    .replace(/\?/g, '？')
    .replace(/!/g, '！')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*([，。；：、！？])\s*/g, '$1')
    .replace(/\s*([,.;:!?])\s*/g, '$1')
    .replace(/([，；：、]){2,}/g, '$1')
    .replace(/([,;:]){2,}/g, '$1')
    .replace(/([。！？])[，,；;：:、]+/g, '$1')
    .replace(/[，,；;：:、]+([。！？])/g, '$1')
    .replace(/([。！？])[。！？]+/g, '$1')
    .replace(/。{2,}/g, '。')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[，。；：、！？,.;:!?\s]+|[，；：、,;:\s]+$/g, '')
    .trim();
}

function ensureSentence(text) {
  const value = cleanText(text);
  if (!value) return '';
  return /[。！？]$/.test(value) ? value : `${value}。`;
}

function sentenceWithoutLeadingPlease(text) {
  const value = cleanText(text);
  if (!value) return '';
  if (/^(請|麻煩|建議|後續|請勿|務必|需|應)/.test(value)) return ensureSentence(value);
  return ensureSentence(`請${value}`);
}

function getLegalNotes(keys) {
  return (keys || [])
    .map(key => LEGAL_CATALOG[key])
    .filter(Boolean);
}

function safeScenarioIdsForCategory(category = '') {
  const map = CORPUS.riskToSafeScenarioMap || {};
  const label = String(category || '');
  const ids = [];
  for (const [key, values] of Object.entries(map)) {
    if (label.includes(key)) ids.push(...(Array.isArray(values) ? values : []));
  }
  return [...new Set(ids)].slice(0, 8);
}

function getSourceNotes(keys) {
  return (keys || [])
    .map(key => SOURCE_CATALOG[key] ? ({ id: key, ...SOURCE_CATALOG[key] }) : null)
    .filter(Boolean);
}

function dedupeFindings(findings) {
  const result = [];
  const indexByKey = new Map();
  const sourcePriority = source => source === '原始訊息' ? 3 : source === '實質內容' ? 2 : 1;
  for (const item of findings || []) {
    const fragment = String(item.fragment || '').trim();
    const key = fragment ? `${item.corpusId || item.title}|${fragment}` : `${item.source}|${item.corpusId || item.title}|${item.title}`;
    if (!indexByKey.has(key)) {
      indexByKey.set(key, result.length);
      result.push(item);
      continue;
    }
    const idx = indexByKey.get(key);
    if (sourcePriority(item.source) > sourcePriority(result[idx].source)) result[idx] = item;
  }
  return result;
}



const LINGUISTIC_RULES = [
  ['LING-PERSON-COGNITION','人格貶低：智力、理解與學習能力羞辱','severe',26,/(?:白癡|智障|腦殘|沒腦|沒帶腦|(?:你|妳)?(?:怎麼)?(?:這麼|那麼)(?:笨|蠢)|腦袋(?:裝|進水|壞|有問題)|智商(?:低|有問題|等於零)|理解能力(?:有問題|有缺陷|太差|低)|看不懂人話|聽不懂人話|(?:連)?(?:這|這點|基本|字|話)[^。！？!?]{0,10}(?:都不會|都不懂|都看不懂)|小學生[^。！？!?]{0,12}(?:都比你|都會)|幼兒園[^。！？!?]{0,12}(?:都比你|都會))/u],
  ['LING-THREAT-CONDITIONAL-EXPEL','權勢壓迫：以工作結果作為立即驅逐或離職威嚇','severe',34,/(?:再|今天|這次|下次|這回)?[^。！？!?]{0,8}(?:做|弄|處理|完成)?不好[^。！？!?]{0,8}(?:就|你就)?(?:給我)?(?:滾|走人|不用來|別來|離職|自己走)|(?:做不完|沒做完)[^。！？!?]{0,10}(?:就)?(?:滾|不用來|走人)/u],
  ['LING-WORK-OUTPUT-CONTEMPT','工作成果貶抑：以情緒性標籤取代具體缺失','moderate',16,/(?:設計|報告|簡報|作品|成果|系統|功能|程式|網站|東西)[^。！？!?]{0,8}(?:真的|實在|也)?[^。！？!?]{0,4}(?:很|超|超級|有夠)?(?:爛|垃圾|廢|鳥|狗屎)/u],
  ['LING-EMOTIONAL-REPETITION','情緒施壓：以反覆責問取代具體工作說明','moderate',18,/(?:你)?到底要(?:我)?講幾次|(?:我)?要講幾次(?:你才|才)?(?:懂|會|知道)|講幾次才(?:懂|會|知道)/u],
  ['LING-GUILT-CATASTROPHE','情緒施壓：以災難化或連帶後果製造罪惡感','moderate',20,/(?:再這樣|你再這樣|因為你|都是你)[^。！？!?]{0,14}(?:大家|全組|公司|團隊|機構|部門|單位)[^。！？!?]{0,10}(?:一起)?(?:完蛋|倒閉|倒掉|陪葬|遭殃)|(?:大家|全組|團隊|機構|部門|單位)[^。！？!?]{0,8}(?:一起)?(?:完蛋|倒閉|倒掉|陪葬)/u],
  ['LING-THREAT-ROLE-REMOVAL','權勢壓迫：以撤除工作或專案資格作為威嚇','severe',30,/(?:不然|否則|再這樣|做不好|弄不好)[^。！？!?]{0,18}(?:不用|別)(?:再)?做(?:這個|這項)?(?:專案|工作|案子)|(?:我看)?你[^。！？!?]{0,10}(?:也)?不用做(?:這個|這項)?(?:專案|工作|案子)(?:了)?/u],
  ['LING-PERSON-ANIMAL','人格貶低：動物化、物化或非人化羞辱','severe',24,/(?:豬都比你|狗都比你|連狗都不如|公司養你不如養狗|寄生蟲|害群之馬|老鼠屎|蛀蟲|米蟲|草履蟲|單細胞生物|畜生|像(?:豬|狗|猴子|烏龜|蝸牛|樹懶)[^。！？!?]{0,10}(?:一樣|似的)?)/u],
  ['LING-PERSON-WORTH','人格貶低：存在價值與職業價值全盤否定','severe',26,/(?:公司的?累贅|團隊的?累贅|負資產|毒瘤|拖油瓶|沒產值|沒有價值|毫無價值|一文不值|最爛的?(?:人|員工|同事)|全公司最爛|公司最錯誤的決定就是錄用你|不配(?:領薪水|留在|做這份工作)|吃白飯|白吃白喝|浪費公司(?:資源|薪水|空氣)|你(?:這輩子|一輩子)也就這樣)/u],
  ['LING-ANGER-EXPEL','情緒暴力：咆哮、驅逐與噁心羞辱','severe',26,/(?:看到你[^。！？!?]{0,8}(?:就火大|就生氣|就噁心)|滾(?:出去|蛋|回去|開)|消失在我眼前|閉嘴|這裡輪不到你說話|看著你的臉[^。！？!?]{0,8}噁心|給我滾|馬上滾)/u],
  ['LING-THREAT-VIOLENCE','威脅：人身安全、報復或暴力暗示','severe',34,/(?:被車撞|死得很難看|活得不耐煩|欠修理|一巴掌|不要逼我動手|讓你全家不得安寧|跟我作對[^。！？!?]{0,12}沒有好下場|讓你後悔一輩子|走在路上[^。！？!?]{0,8}被打|玩死你|弄死你|殺了你|讓你生不如死)/u],
  ['LING-THREAT-CAREER','權勢壓迫：職涯封殺、黑名單與逼退','severe',32,/(?:業界黑掉|列入黑名單|讓你在(?:這一行|業界)[^。！？!?]{0,12}(?:混不下去|消失|永不錄用)|打一通電話[^。！？!?]{0,12}(?:封殺|沒工作)|自動離職|自己遞辭呈|自己提離職|受不了就走|不爽就走|大門沒鎖[^。！？!?]{0,10}走|讓你待不下去|看你能撐多久)/u],
  ['LING-THREAT-PAY','權勢壓迫：薪資、考績、獎金與工作利益威脅','severe',30,/(?:不想要薪水|是不是不想要薪水|扣(?:你)?(?:薪|薪水|半薪|全勤|考績|獎金)|年終[^。！？!?]{0,12}(?:別想|不發|一毛都沒有)|考績[^。！？!?]{0,12}(?:最後一名|丙等|丁等|扣分|降一級)|不給(?:加薪|升遷|排班|續約)|不排班|砍班|少排班|薪水減半)/u],
  ['LING-RETALIATION','權勢壓迫：申訴、檢舉或求助後報復','severe',36,/(?:敢|如果|要是)?[^。！？!?]{0,4}(?:申訴|檢舉|告狀|找人資|找勞工局|找勞檢|找工會|投訴)[^。！？!?]{0,24}(?:開除|解僱|黑名單|封殺|調職|減薪|扣考績|考績(?:難看|不好|很差)|不續約|不排班|排班[^。！？!?]{0,8}(?:別想好過|不好過)|吃虧|死得很難看)|(?:申訴|檢舉)[^。！？!?]{0,20}沒用[^。！？!?]{0,20}(?:我熟|有關係)/u],
  ['LING-GASLIGHT','心理操控：煤氣燈、否定記憶與責任轉嫁','moderate',22,/(?:你記錯了|你聽錯了|裝(?:作)?(?:聽不懂|看不懂|不知道|沒看到|死)|我什麼時候說過|你是不是有妄想|產生幻覺|受害妄想|你太敏感|玻璃心|只是玩笑|開不起玩笑|明明是你的錯|都是你自己的問題|你自己工作沒做好[^。！？!?]{0,12}(?:才會|所以)|全公司就你問題最多|大家都覺得我對你很好)/u],
  ['LING-PSEUDO-COACH','心理操控：以「為你好／培訓」合理化羞辱','moderate',22,/(?:我是為(?:了)?你好|為了激發你的潛能|這叫提升你的抗壓性|這叫合理指導|這叫職場洗禮|以後你會感謝我|因為看重你才|我願意花時間罵你[^。！？!?]{0,10}(?:感激|謝恩)|被罵是學習|罵你是為你好)/u],
  ['LING-EXCLUSION','冷暴力：集體孤立、排除與空氣化','severe',28,/(?:大家不要理(?:他|她|你)|不准跟(?:他|她|你)[^。！？!?]{0,10}(?:講話|吃飯|聯絡)|誰敢幫(?:他|她|你)[^。！？!?]{0,12}(?:一起滾|一起處理)|集體已讀不回|當(?:他|她|你)是空氣|故意不通知[^。！？!?]{0,12}(?:會議|活動)|群組[^。！？!?]{0,12}(?:不要拉|踢出|移出)|不讓[^。！？!?]{0,12}參加(?:會議|活動)|沒有(?:他|她|你)的群組|所有人[^。！？!?]{0,12}不要跟)/u],
  ['LING-RUMOR','冷暴力：造謠、中傷與人格標籤','severe',27,/(?:聽說[^。！？!?]{0,28}(?:偷|睡|墮胎|欠債|精神有問題|靠關係|同性戀|私生活很亂)|散布[^。！？!?]{0,20}(?:謠言|八卦)|手腳不乾淨|靠睡[^。！？!?]{0,8}(?:拿到|升官|合約)|抓耙仔|告密仔|心理變態|精神病[^。！？!?]{0,12}(?:發瘋|打人))/u],
  ['LING-PUBLIC-SHAME','權勢壓迫：公開公審、連帶懲罰與羞辱','severe',28,/(?:全組公審|公開檢討|當眾道歉|全公司[^。！？!?]{0,12}(?:看|知道)[^。！？!?]{0,12}(?:不適任|錯誤)|輪流說[^。！？!?]{0,10}缺點|全組不准下班|因為(?:他|她|你)一個人[^。！？!?]{0,20}(?:獎金|考績)|連帶責任|大家看看[^。！？!?]{0,16}就是因為)/u],
  ['LING-MICROMANAGE','過度監督：微觀管理、私人裝置與行蹤控制','severe',27,/(?:每(?:15|十五)分鐘[^。！？!?]{0,12}(?:回報|日誌)|每小時[^。！？!?]{0,16}(?:自拍|回報)|滑鼠[^。！？!?]{0,12}(?:沒動|軌跡)|螢幕錄影|螢幕共享[^。！？!?]{0,12}監控|離開座位[^。！？!?]{0,12}(?:報告|LINE)|上廁所[^。！？!?]{0,16}(?:幾次|幾分鐘|偷懶)|交出(?:你的|妳的|您的)?私人手機|聊天紀錄[^。！？!?]{0,10}(?:拿來|給我看)|(?:看|查看|檢查)[^。！？!?]{0,6}聊天紀錄|定位紀錄|隨時回報[^。！？!?]{0,12}在哪裡)/u],
  ['LING-UNREASONABLE-WORK','職權刁難：不可能期限、過量工作與不得離開','severe',29,/(?:今晚不用睡|通宵[^。！？!?]{0,12}(?:做完|完成)|今天[^。！？!?]{0,20}(?:100頁|200頁|500筆|全部)[^。！？!?]{0,16}(?:做完|交出)|三倍[^。！？!?]{0,10}(?:工作量|一個人做)|沒做完[^。！？!?]{0,14}(?:不准下班|不用回家)|我沒說可以下班[^。！？!?]{0,12}(?:不能走|留著)|不准刷退勤|不眠不休)/u],
  ['LING-DESKILL','職權刁難：去技能化、降職羞辱與懲罰性雜務','severe',28,/(?:高階[^。！？!?]{0,10}(?:掃廁所|訂便當|洗杯子|倒垃圾)|從今天開始[^。！？!?]{0,18}(?:掃廁所|洗杯子|訂便當|看牆壁|罰站)|降職[^。！？!?]{0,12}(?:新人|助理)|只配[^。！？!?]{0,10}(?:影印|跑腿|倒水|雜務)|去倉庫報到|位置[^。！？!?]{0,12}(?:茶水間|廁所門口|影印機旁))/u],
  ['LING-RESOURCE-BLOCK','職權刁難：刻意封鎖資訊、權限或必要資源','severe',29,/(?:不給[^。！？!?]{0,10}(?:帳號|密碼|系統權限|資料|規格|交接|電腦)|故意[^。！？!?]{0,8}(?:隱瞞|漏掉)[^。！？!?]{0,12}(?:資訊|通知|會議)|權限全部鎖死|撤除[^。！？!?]{0,10}(?:電腦|辦公桌|權限)|只給[^。！？!?]{0,8}唯讀|不讓[^。！？!?]{0,10}(?:收到|知道)[^。！？!?]{0,8}(?:公告|資料))/u],
  ['LING-MOVING-GOAL','職權刁難：反覆改標準與顯微鏡式刁難','moderate',23,/(?:雖然沒錯[^。！？!?]{0,12}全部重做|重寫(?:10|十|20|二十)遍|換(?:50|五十)種|字距[^。！？!?]{0,16}(?:退件|重寫)|字體大小[^。！？!?]{0,12}(?:重做|退件)|每天變更[^。！？!?]{0,12}(?:標準|驗收)|標準[^。！？!?]{0,12}一直改|眨眼睛[^。！？!?]{0,12}(?:挑釁|不耐煩)|文具[^。！？!?]{0,12}(?:位置|擺放)[^。！？!?]{0,12}考績)/u],
  ['LING-SEX-BODY','性騷擾：身體、外貌、衣著與性生活評論','severe',32,/(?:胸(?:部|圍)?[^。！？!?]{0,12}(?:大|小|緊|扣子)|屁股[^。！？!?]{0,10}(?:大|翹)|腿[^。！？!?]{0,12}(?:絲襪|好看)|低胸|多露一點|穿性感|黑絲襪|身材[^。！？!?]{0,12}(?:好|誘人|胖|瘦)|性生活[^。！？!?]{0,12}(?:不協調|多久|次數)|欲求不滿|很久沒有[^。！？!?]{0,8}性生活|香水[^。！？!?]{0,12}(?:勾引|男人))/u],
  ['LING-SEX-EXCHANGE','性騷擾：權勢交換、升遷續約與性／親密要求綁定','severe',38,/(?:陪我[^。！？!?]{0,12}(?:吃飯|喝酒|回家|辦公室)[^。！？!?]{0,18}(?:升遷|續約|考績|年終)|讓我高興[^。！？!?]{0,16}(?:升遷|主管|考績|違規)|做我的(?:女朋友|男朋友)[^。！？!?]{0,18}(?:幫你|升遷|扛)|想留下來續約[^。！？!?]{0,16}(?:私事|辦公室)|付出點代價[^。！？!?]{0,12}(?:職涯|高薪|升官)|懂得怎麼討主管歡心)/u],
  ['LING-SEX-COERCION','性騷擾／性暴力風險：性行為要求、懷孕威脅或私密空間施壓','severe',42,/(?:來|到|給我來)(?:我)?床上|(?:跟|陪)我上床|(?:讓|弄|搞)(?:你|妳)?懷孕|(?:做錯|再錯|不聽話|不配合)[^。！？!?]{0,24}(?:上床|床上|開房|陪睡|懷孕|性行為)|(?:上床|開房|陪睡|性行為)[^。！？!?]{0,24}(?:升遷|續約|排班|考績|工作|不然|否則)/u],
  ['LING-CONDESCENDING-GROWTH','能力貶抑：以「長進」等人格式責備取代具體改善內容','moderate',14,/(?:能不能|可不可以|拜託你)?(?:有點|稍微)?長進(?:一點|點)?|一點長進都沒有/u],
  ['LING-SEX-TOUCH','性騷擾：合理化不受歡迎的身體接觸','severe',34,/(?:摸一下[^。！？!?]{0,12}不會少塊肉|摟腰[^。！？!?]{0,12}(?:正常|社交)|主管摸你[^。！？!?]{0,12}看得起|碰到(?:腿|腰|手|身體)[^。！？!?]{0,14}(?:大驚小怪|正常|而已)|捏捏肩膀[^。！？!?]{0,12}(?:放鬆|防衛)|擁抱[^。！？!?]{0,12}(?:國際禮儀|公司文化)|摸衣服[^。！？!?]{0,12}(?:材質|研究))/u],
  ['LING-GENDER-STEREO','性別歧視：性別刻板印象、男性氣概與女性角色羞辱','severe',30,/(?:女生果然不適合|女人[^。！？!?]{0,12}(?:不適合|回家|嫁人|花瓶)|頭髮長腦袋短|月經來了|更年期[^。！？!?]{0,8}(?:情緒|亂咬)|大男人[^。！？!?]{0,12}(?:哭|痛|不是男人)|娘娘腔|男生[^。！？!?]{0,12}(?:不能哭|不會喝酒|做秘書)|女生[^。！？!?]{0,12}(?:行政|不用升遷|只要漂亮|撒嬌))/u],
  ['LING-PREGNANCY','就業歧視：懷孕、產假、育兒與工作不利益綁定','severe',34,/(?:懷孕[^。！？!?]{0,22}(?:沒獎金|不錄用|不續約|位置沒了|不能升遷|麻煩|拖累)|產假[^。！？!?]{0,20}(?:位置|沒了|不續約|考績)|產檢[^。！？!?]{0,18}(?:拿薪水|拖累|請假太多)|接小孩[^。！？!?]{0,16}(?:心思不在|考績)|集乳室[^。！？!?]{0,12}(?:上班|擠奶)|媽媽員工[^。！？!?]{0,12}(?:包袱|絆腳石))/u],
  ['LING-HEALTH-DISCRIM','歧視：疾病、身心狀況與障礙污名','severe',31,/(?:身心科[^。！？!?]{0,14}(?:神經病|發瘋)|憂鬱症[^。！？!?]{0,16}(?:免死金牌|脆弱|不升遷)|精神病史[^。！？!?]{0,16}(?:開除|不適任)|恐慌發作[^。！？!?]{0,12}(?:住精神病院|不適任)|殘障嗎|耳朵有問題[^。！？!?]{0,10}(?:殘障|聽不清楚)|走路一拐一拐[^。！？!?]{0,12}(?:形象|後線))/u],
  ['LING-IDENTITY-DISCRIM','歧視：年齡、國籍、文化、宗教、性傾向或信念羞辱','severe',31,/(?:外籍[^。！？!?]{0,18}(?:沒素養|加班費|回你祖國)|口音[^。！？!?]{0,12}(?:土|鄉下|落後)|老員工[^。！？!?]{0,14}(?:化石|老油條|毒瘤)|年紀大[^。！？!?]{0,14}(?:沒人要|退休|等死)|同性戀[^。！？!?]{0,14}(?:噁心|愛滋|偷看)|跨性別[^。！？!?]{0,14}(?:噁心|廁所)|宗教[^。！？!?]{0,14}(?:邪門|不乾淨|不給面子)|政治立場[^。！？!?]{0,14}(?:不忠誠|處理掉))/u],
  ['LING-PRIVACY','隱私侵害：婚育、健康、財務與私人生活刺探','moderate',24,/(?:交過幾個[^。！？!?]{0,8}(?:男朋友|女朋友)|有沒有同居|做到哪一步|什麼時候生小孩|為什麼不結婚|存款有多少|買房[^。！？!?]{0,12}錢哪裡來|看了什麼科|藥袋拿來|診斷書拍來|主治醫生[^。！？!?]{0,12}(?:名字|診間)|週末跟誰出去|聊天紀錄拿來|(?:看|查看|檢查)[^。！？!?]{0,6}聊天紀錄|交出(?:你的|妳的|您的)?私人手機|私人社群[^。！？!?]{0,12}(?:加我|不准封鎖))/u],
  ['LING-DIGITAL-HARASS','數位騷擾：群組壓迫、社群監控與非工作時間轟炸','moderate',24,/(?:半夜[^。！？!?]{0,12}(?:30則|三十則|連續)[^。！？!?]{0,12}訊息|群組[^。！？!?]{0,16}(?:3分鐘|三分鐘|5分鐘|五分鐘)[^。！？!?]{0,12}(?:回覆|收到)|不加主管[^。！？!?]{0,12}(?:Facebook|Instagram|臉書|IG)[^。！？!?]{0,14}考績|退群組[^。！？!?]{0,14}(?:申誡|不合群)|公開[^。！？!?]{0,10}(?:定位|睡姿照片|私人失誤))/u]
].map(([id, category, severity, weight, regex]) => ({
  id, category, severity, weight, regex,
  warning: category.includes('工作成果貶抑') ? '這類表達只有負面標籤，沒有指出可核對的缺失；應把「很爛、垃圾」轉成具體功能、品質或流程問題。'
    : category.includes('性騷擾') ? '這類言詞可能涉及性要求、性意味、性別歧視、權勢交換或身體界線；工作場合應特別避免。'
    : category.includes('歧視') ? '這類言詞把個人身分、健康或性別特徵作為羞辱或不利益依據，具有明顯差別待遇風險。'
    : category.includes('威脅') || category.includes('權勢壓迫') ? '這類言詞把權力、人事、薪資、職涯或人身不利益當作施壓工具，具有高度權勢濫用風險。'
    : category.includes('職權刁難') || category.includes('過度監督') ? '這類內容可能逾越合理管理範圍，形成不合理工作分派、過度監督、資源阻礙或懲罰性管理。'
    : category.includes('冷暴力') ? '這類內容可能形成孤立、排除、造謠、公開羞辱或敵意工作環境。'
    : category.includes('心理操控') ? '這類內容可能透過否定記憶、感受或合理界線，將責任轉回對方並合理化不當管理。'
    : '這類言詞已從工作事實轉向人格、尊嚴或敵意攻擊，應改回可核對的工作內容。',
  safeAction: category.includes('工作成果貶抑') ? '刪除情緒性評價，改成「目前出現什麼問題、在哪裡發生、希望怎麼調整、何時確認」的可執行回饋。'
    : category.includes('性騷擾') ? '刪除性意味、身體評論、親密暗示與權勢交換，改以客觀工作任務和職能標準溝通。'
    : category.includes('歧視') ? '移除對身分、健康、性別、年齡或文化的評價，只使用與職務直接相關的客觀標準。'
    : category.includes('職權刁難') || category.includes('過度監督') ? '重新確認工作必要性、合理期限、資源、權限與一致標準，避免懲罰性或去技能化安排。'
    : category.includes('冷暴力') ? '停止孤立、造謠與公開羞辱；必要會議、資訊與資源應依職務公平提供。'
    : category.includes('威脅') || category.includes('權勢壓迫') ? '人事、薪酬與懲處應依獨立事由和正式程序辦理，不用威嚇或報復語句推動。'
    : '刪除人格與尊嚴評價，改寫成具體事實、工作標準、行動與期限。',
  legal: category.includes('性騷擾') ? ['GEEA12','GEEA13'] : category.includes('歧視') ? ['EMPLOYMENT_EQUALITY','OSH22-1'] : ['OSH22-1','WBB2','CIVIL_DIGNITY']
}));

// 不是所有帶有「交給別人」的分工調整都屬霸凌；但若它與「你不會、你不行」
// 等全盤能力否定綁在一起，就應提醒改回具體缺失、支援、覆核與正式分工依據。
LINGUISTIC_RULES.push({
  id: 'LING-DELEGATION-CONTEXT',
  category: '管理語句：工作分工調整需回到具體能力與程序',
  severity: 'moderate',
  weight: 10,
  regex: /(?:不會|做不好|一直做錯)[^。！？!?]{0,18}(?:排班|班表|這件事|這項工作|工作)?[^。！？!?]{0,12}(?:交給別人|別做|不要做|不要排|換別人做)/u,
  warning: '重新分工、覆核或改由其他人處理本身可能具有合理工作目的；但若只用「你不會、你不行」作為理由，容易變成人格式否定，且無法讓對方知道應改善什麼。',
  safeAction: '若確有品質或能力問題，請說明具體錯誤、需要的支援或覆核方式，以及何時、依何種工作標準調整分工。',
  legal: ['OSH22-1','WBB2']
});

const WORK_LINGUISTIC_RULES = [
  ['WORK-EXCLUDE-PEERS','工作內容：要求集體孤立或禁止同事互動',/(?:不准|禁止|不要)[^。！？!?]{0,10}(?:跟|幫|理)[^。！？!?]{0,12}(?:他|她|你)|誰敢幫[^。！？!?]{0,12}(?:一起滾|一起調職)|集體已讀不回|不准跟[^。！？!?]{0,8}吃飯/u],
  ['WORK-PUBLIC-SHAME','工作內容：公開公審、強迫羞辱或連帶懲罰',/(?:全組公審|輪流說[^。！？!?]{0,10}缺點|公開朗讀[^。！？!?]{0,10}(?:檢討|失敗)|當眾道歉|全組不准下班|全組[^。！？!?]{0,12}(?:寫檢討|考績降))/u],
  ['WORK-MICRO-SURVEIL','工作內容：超密度監控、私人裝置或行蹤回報',/(?:每(?:15|十五)分鐘[^。！？!?]{0,12}(?:進度|日誌)|每小時[^。！？!?]{0,12}自拍|交出私人手機|螢幕錄影|滑鼠[^。！？!?]{0,12}(?:沒動|軌跡)|上廁所[^。！？!?]{0,14}(?:次|分鐘)|隨時回報[^。！？!?]{0,12}在哪裡)/u],
  ['WORK-DESKILL-HUMILIATE','工作內容：懲罰性去技能化或降職羞辱',/(?:掃廁所|刷馬桶|洗全組(?:杯子|咖啡杯)|幫全組訂便當|坐著看牆壁|去旁邊罰站|高階[^。！？!?]{0,12}(?:影印|跑腿|倒水)|降職[^。！？!?]{0,10}新人助理)/u],
  ['WORK-RESOURCE-SABOTAGE','工作內容：故意阻斷必要資訊、帳號、設備或資源',/(?:故意不給[^。！？!?]{0,14}(?:帳號|資料|規格|交接|電腦|權限)|撤除[^。！？!?]{0,10}(?:辦公桌|電腦|權限)|權限全部鎖死|不提供[^。！？!?]{0,10}(?:系統帳號|工作資料)|隱瞞重要[^。！？!?]{0,12}(?:通知|資訊))/u],
  ['WORK-MOVING-STANDARD','工作內容：任意反覆改變標準或無實質必要重工',/(?:每天變更[^。！？!?]{0,12}(?:驗收標準|工作標準)|雖然沒錯[^。！？!?]{0,10}(?:全部重做|重做一遍)|重寫(?:10|十|20|二十)遍|換(?:50|五十)種[^。！？!?]{0,8}(?:顏色|版本))/u],
  ['WORK-FORCED-PRIVATE-SOCIAL','工作內容：強迫私人社交或私人帳號連結工作利益',/(?:不加主管[^。！？!?]{0,10}(?:Facebook|Instagram|LINE|私人社群)[^。！？!?]{0,14}(?:考績|不合群|記過)|週末跟誰出去[^。！？!?]{0,12}(?:報告|交代)|聊天紀錄[^。！？!?]{0,12}(?:拿來|交出))/u],
  ['WORK-FORCED-ALCOHOL-SOCIAL','工作內容：將飲酒、續攤或下班後私人社交強制作為工作義務',/(?:工作就是[^。！？!?]{0,12}(?:陪酒|喝酒|續攤)|(?:一定要|必須|得|都要)[^。！？!?]{0,16}(?:陪酒|陪(?:客戶|主管)?喝酒|續攤)|下班後[^。！？!?]{0,20}(?:陪(?:客戶|主管)?喝到|陪酒|續攤)[^。！？!?]{0,20}(?:不然|否則|才有|合作))/u],
  ['WORK-SEXUAL-BOUNDARY','工作內容：性化服裝、身體接觸或親密互動要求',/(?:穿低胸|穿黑絲襪|多露一點|穿性感|撒嬌[^。！？!?]{0,10}(?:客戶|主管)|陪(?:客戶|主管)[^。！？!?]{0,12}(?:摟腰|摸|喝高興)|摸一下[^。！？!?]{0,8}不會少塊肉|出差[^。！？!?]{0,12}一起住)/u],
  ['WORK-FAMILY-PENALTY','工作內容：懷孕、產假、育兒與不利益或額外懲罰綁定',/(?:懷孕[^。！？!?]{0,20}(?:沒獎金|不續約|位置沒了|不能加班[^。！？!?]{0,8}沒資格)|產假[^。！？!?]{0,18}(?:不續約|位置|考績)|接小孩[^。！？!?]{0,14}(?:扣考績|心思不在)|產檢[^。！？!?]{0,14}(?:扣薪|扣考績|拿滿額薪水))/u]
].map(([id, category, regex]) => ({id, category, regex, severity:'severe', weight:34, blockOutput:true,
  warning:'這項要求的風險不只在語氣，而是工作安排本身可能涉及職權濫用、羞辱、差別待遇、隱私或性別界線；不應只靠潤稿把它包裝成較禮貌的命令。',
  safeAction:'先修正工作要求本身，回到必要性、比例性、合法權限、合理期限、客觀職務標準與可拒絕界線後，再撰寫訊息。',
  legal:['OSH22-1','WBB2','GEEA12','EMPLOYMENT_EQUALITY']
}));

const EXPERT_RISK_ANCHORS = /(?:白癡|智障|腦殘|低能|笨蛋|蠢|豬|狗|畜生|寄生蟲|廢物|垃圾|累贅|毒瘤|米蟲|沒用|無能|最爛|噁心|滾|閉嘴|欠修理|薪水|扣薪|扣考績|扣獎金|年終|開除|解僱|不續約|黑名單|黑掉|封殺|玩死|弄死|死得很難看|申訴|檢舉|勞工局|勞檢|不准下班|不准請假|通宵|24小時|二十四小時|隨傳隨到|監控|定位|交出手機|螢幕錄影|廁所|排擠|孤立|已讀不回|踢出群組|不准跟他|造謠|公審|性騷擾|胸|屁股|裙子|低胸|黑絲襪|摸|摟腰|陪睡|上床|性交|肛交|口交|做愛|裸照|懷孕|產假|育嬰|同性戀|跨性別|外籍|口音|宗教|憂鬱症|精神病|妄想|幻覺|太敏感|玻璃心|為你好|不識好歹|自願離職|遞辭呈|調到最遠|掃廁所|洗杯子|訂便當|撤權限|不給資料|故意不通知)/u;
const EXPERT_STOP_CHARS = /[的了是在就都你妳您我他她它這那又而也還把被跟和與給對讓一個很太真再只才要會有沒不]/gu;

function compactExpertText(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, '')
    .replace(EXPERT_STOP_CHARS, '');
}

function makeNgrams(text, n) {
  const value = compactExpertText(text);
  const grams = new Set();
  if (!value) return grams;
  if (value.length <= n) { grams.add(value); return grams; }
  for (let i = 0; i <= value.length - n; i += 1) grams.add(value.slice(i, i + n));
  return grams;
}

const EXPERT_PREPARED = EXPERT_ENTRIES.map((entry, index) => ({
  entry,
  index,
  compact: compactExpertText(entry.text),
  grams2: makeNgrams(entry.text, 2),
  grams3: makeNgrams(entry.text, 3)
}));
function exactExpertKey(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, '');
}

const EXPERT_EXACT_INDEX = (() => {
  const map = new Map();
  for (const item of EXPERT_PREPARED) {
    const key = exactExpertKey(item.entry.text || '');
    if (key && !map.has(key)) map.set(key, item);
  }
  return map;
})();

const EXPERT_BIGRAM_INDEX = (() => {
  const map = new Map();
  for (const item of EXPERT_PREPARED) {
    for (const gram of item.grams2) {
      if (!map.has(gram)) map.set(gram, []);
      const list = map.get(gram);
      if (list.length < 320) list.push(item.index);
    }
  }
  return map;
})();

function overlapCount(a, b) {
  if (!a.size || !b.size) return 0;
  let count = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const value of small) if (large.has(value)) count += 1;
  return count;
}

function expertSimilarityScore(fragment, prepared) {
  const compact = compactExpertText(fragment);
  if (!compact || compact.length < 3 || !prepared.compact) return 0;
  if ((prepared.compact.includes(compact) || compact.includes(prepared.compact)) && Math.min(compact.length, prepared.compact.length) >= 4) return 0.99;
  const g2 = makeNgrams(fragment, 2);
  const g3 = makeNgrams(fragment, 3);
  const i2 = overlapCount(g2, prepared.grams2);
  const i3 = overlapCount(g3, prepared.grams3);
  const dice2 = (2 * i2) / Math.max(1, g2.size + prepared.grams2.size);
  const dice3 = (2 * i3) / Math.max(1, g3.size + prepared.grams3.size);
  const contain2 = i2 / Math.max(1, Math.min(g2.size, prepared.grams2.size));
  const contain3 = i3 / Math.max(1, Math.min(g3.size, prepared.grams3.size));
  const lengthRatio = Math.min(compact.length, prepared.compact.length) / Math.max(compact.length, prepared.compact.length);
  return Math.min(1, Math.max(dice3, dice2 * 0.92, contain3 * 0.82, contain2 * 0.74) + (lengthRatio > 0.65 ? 0.04 : 0));
}

function scanExpertCorpus(text, source = '原始訊息') {
  if (!EXPERT_PREPARED.length) return { findings: [], score: 0 };
  const findings = [];
  let score = 0;
  const usedEntryIds = new Set();
  const usedDomains = new Set();

  const addFinding = (prepared, similarity, fragment) => {
    if (!prepared?.entry) return false;
    const entry = prepared.entry;
    if (usedEntryIds.has(entry.id)) return false;
    usedEntryIds.add(entry.id);
    if (usedDomains.has(entry.domain) && findings.length >= 5) return false;
    usedDomains.add(entry.domain);
    score += Math.round((entry.weight || 18) * Math.min(1, Math.max(0.65, similarity)));
    findings.push({
      type: 'tone',
      source,
      corpusId: entry.id,
      title: entry.domain,
      severity: entry.severity || 'moderate',
      fragment,
      canonicalPhrase: similarity >= 0.995 ? '完整案例直接命中' : '完整案例相似語句',
      reason: similarity >= 0.995
        ? `${entry.warning} 本句直接命中離線案例「${entry.category}」。`
        : `${entry.warning} 本句與離線案例「${entry.category}」的語言結構相近（相似度 ${Math.round(similarity * 100)}%）。`,
      safeAction: entry.safeAction,
      legalNotes: getLegalNotes(entry.legal),
      sourceNotes: [],
      safeScenarioIds: safeScenarioIdsForCategory(entry.domain),
      matchedExample: entry.text,
      expertSimilarity: Math.round(similarity * 100),
      expertDomain: entry.domain
    });
    return true;
  };

  // 完整案例本身必須可被完整案例庫命中。此索引只做正規化後的直接比對，
  // 不會把一般工作詞的低相似度誤判成霸凌。
  const wholeExact = EXPERT_EXACT_INDEX.get(exactExpertKey(text));
  if (wholeExact) {
    addFinding(wholeExact, 1, normalizeText(text));
    return { findings: dedupeFindings(findings), score };
  }

  const fragments = normalizeText(text)
    .split(/(?<=[。！？!?；;\n])/u)
    .map(x => x.trim())
    .filter(x => exactExpertKey(x).length >= 3);

  for (const fragment of fragments.slice(0, 80)) {
    const exact = EXPERT_EXACT_INDEX.get(exactExpertKey(fragment));
    if (exact) {
      addFinding(exact, 1, fragment);
      if (findings.length >= 12) break;
      continue;
    }

    const compact = compactExpertText(fragment);
    if (!EXPERT_RISK_ANCHORS.test(fragment) && compact.length < 10) continue;
    const candidateCounts = new Map();
    for (const gram of makeNgrams(fragment, 2)) {
      for (const idx of (EXPERT_BIGRAM_INDEX.get(gram) || [])) candidateCounts.set(idx, (candidateCounts.get(idx) || 0) + 1);
    }
    const candidates = [...candidateCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([idx]) => EXPERT_PREPARED[idx]);

    let best = null;
    for (const prepared of candidates) {
      const similarity = expertSimilarityScore(fragment, prepared);
      if (!best || similarity > best.similarity) best = { prepared, similarity };
    }
    if (!best) continue;
    const anchored = EXPERT_RISK_ANCHORS.test(fragment);
    // 沒有任何風險錨點時，只接受高度接近的案例。長句單靠共通工作詞
    // （例如「工作成果」「回報進度」）不應因 40% 左右字面相似就被判成霸凌。
    const minThreshold = anchored
      ? (compact.length <= 7 ? 0.60 : compact.length <= 14 ? 0.48 : 0.42)
      : (compact.length <= 14 ? 0.66 : 0.62);
    if (best.similarity < minThreshold) continue;
    addFinding(best.prepared, best.similarity, fragment);
    if (findings.length >= 12) break;
  }
  return { findings: dedupeFindings(findings), score };
}

function textWindowAround(text, fragment, radius = 42) {
  const value = normalizeText(text);
  const needle = normalizeText(fragment);
  const idx = needle ? value.indexOf(needle) : -1;
  if (idx < 0) return value.slice(0, radius * 2);
  return value.slice(Math.max(0, idx - radius), Math.min(value.length, idx + needle.length + radius));
}

function professionalLanguageContext(text = '', substance = {}) {
  const value = normalizeText([text, substance.topic, substance.fact, substance.action, substance.reason, substance.basis].filter(Boolean).join(' '));
  return /(?:醫療|臨床|照護|病歷|病史|診斷|症狀|治療|手術|衛教|醫學|護理|個案|病人|患者|法律|法規|判決|訴訟|偵查|司法|教育|教學|教材|性教育|研究|學術|倫理審查|犯罪調查|專業訓練|解剖|生理)/u.test(value);
}

function sexualCoercionContext(text = '') {
  const value = normalizeText(text);
  return /(?:來|到|給我來)(?:我)?床上|(?:跟|陪)我上床|(?:讓|弄|搞)(?:你|妳)?懷孕|(?:上床|開房|陪睡|性行為)[^。！？!?]{0,24}(?:升遷|續約|排班|考績|工作|不然|否則)|(?:做錯|再錯|不聽話|不配合)[^。！？!?]{0,24}(?:上床|床上|開房|陪睡|懷孕|性行為)/u.test(value);
}

function contextualizeLexiconMatch(entry, fragment, fullText, options = {}) {
  const windowText = textWindowAround(fullText, fragment, 54);
  const phrase = normalizeText(entry.phrase || fragment);
  const professional = Boolean(options.professionalContext) || professionalLanguageContext(windowText, options.substance || {});
  const coerciveSexual = sexualCoercionContext(windowText);
  if (phrase === '有病' || entry.id === 'INSULT-030') {
    const medicalUse = /(?:有病史|患有|罹患|疾病|病況|病歷|診斷|症狀|病人|個案|患者|醫療|治療)/u.test(windowText);
    const insultUse = /(?:你|妳|他|她)(?:是不是|到底|根本|真的|就是)?有病|有病(?:啊|嗎|喔|欸|耶|對不對)/u.test(windowText);
    if (medicalUse && !insultUse) {
      return { severity:'info', weightFactor:.04, contextLabel:'描述性／專業語境', contextReason:'此處較像健康或醫療事實描述，不宜僅因出現「有病」二字就判為辱罵。若改成對人的責罵，例如「你是不是有病」，判讀會不同。' };
    }
  }
  if (entry.contextSensitive && professional && !coerciveSexual) {
    return { severity:'info', weightFactor:.06, contextLabel:'專業必要語境可能合理', contextReason:'此詞本身具有性／身體意涵，但目前同時出現醫療、法律、教育、研究等專業脈絡。若確與職務目的直接相關，可屬必要專業用語；仍應限制在適當對象與最小必要範圍。' };
  }
  if (entry.contextSensitive && coerciveSexual) {
    return { severity:'severe', weightFactor:1.25, contextLabel:'與性要求／權勢施壓連用', contextReason:'這不是單純出現身體或性器官術語，而是和上床、懷孕、私密空間或工作不利益等要求連在一起，風險明顯提高。' };
  }
  return {
    severity: entry.severity,
    weightFactor: 1,
    contextLabel: entry.severity === 'severe' ? '依目前語境屬較高風險' : '依目前語境需要調整',
    contextReason: entry.contextSensitive ? '此詞需要結合前後文判斷；目前沒有足夠專業必要脈絡可降低風險。' : '目前命中的是完整高風險詞句或結構，而非只憑單一中性詞作判斷。'
  };
}

function addFinalContextInterpretation(finding, sourceText, substance = {}, options = {}) {
  if (finding.contextLabel && finding.contextReason) return finding;
  const windowText = textWindowAround(sourceText, finding.fragment || '', 58);
  const professional = professionalLanguageContext(windowText, substance) || hasProfessionalBasis(substance.basis || '');
  const coerciveSexual = sexualCoercionContext(windowText);
  if (finding.corpusId === 'PII-HEALTH') {
    finding.contextLabel = '是否需要提醒取決於收件情境';
    finding.contextReason = '健康或懷孕資訊不等於「不能寫」。若是本人照護、必要人事程序或專業工作可有正當用途；重點是收件者、必要範圍與是否會被不當轉傳。';
  } else if (finding.corpusId === 'LING-DELEGATION-CONTEXT') {
    finding.contextLabel = '分工調整本身不一定有問題';
    finding.contextReason = '若確有排班品質、能力或人力配置問題，重新分工可以是合理管理措施；需要調整的是把「你不會」這類人格化評價改成具體缺失、支援／覆核安排與分工依據。';
  } else if (finding.contextSensitive && professional && !coerciveSexual) {
    finding.contextLabel = '專業必要語境可能合理';
    finding.contextReason = '目前可辨識到醫療、法律、教育或研究脈絡。專業術語本身不當然構成騷擾，但仍應確認使用目的、對象與必要範圍。';
  } else if (finding.severity === 'severe') {
    finding.contextLabel = coerciveSexual ? '目前語境呈現性要求／施壓' : '依目前語境屬較高風險';
    finding.contextReason = coerciveSexual ? '前後文把性行為、私密空間或懷孕與對方服從／工作關係連在一起，不能視為單純專業詞彙。' : '目前不是只命中一個可能中性的詞，而是命中具體辱罵、威脅、權勢、騷擾或不合理要求的語句／結構。';
  } else if (finding.severity === 'info') {
    finding.contextLabel = '提醒，不代表內容本身一定不當';
    finding.contextReason = '這一項主要是提醒確認對象、目的、必要性或隱私範圍，不等於系統已認定內容不合法或不應使用。';
  } else {
    finding.contextLabel = '需結合上下文判斷';
    finding.contextReason = '目前有需要調整的語言訊號，但是否構成霸凌、騷擾或不當管理仍需結合權勢關係、頻率、目的與實際工作必要性。';
  }
  return finding;
}

function linguisticRuleContext(rule, fragment, fullText, options = {}) {
  const windowText = textWindowAround(fullText, fragment, 70);
  const substance = options.substance || {};
  const professional = Boolean(options.professionalContext) || professionalLanguageContext(windowText, substance);
  const analyticalCue = /(?:判決|裁判|法規|案件|本案|案例|語料|研究|論文|教材|教學|性教育|病歷|醫療紀錄|引述|引用|記載|整理[^。！？!?]{0,16}(?:爭點|證據|言詞)|分析[^。！？!?]{0,16}(?:語句|用語|言詞|風險)|報告[^。！？!?]{0,10}(?:事件|騷擾))/u.test(windowText);
  const quoteCue = /[「『“"]|(?:所稱|所說|曾說|表示|言詞|用語)/u.test(windowText);
  const directDemand = /(?:你|妳|給我|必須|一定要|不然|否則|敢|再做錯|不配合)[^。！？!?]{0,20}/u.test(windowText) && !analyticalCue;
  if (professional && analyticalCue && (quoteCue || /(?:判決|案例|語料|研究|教材|病歷)/u.test(windowText)) && !directDemand) {
    return {
      severity: 'info', weightFactor: 0.04,
      contextLabel: '引用／分析或專業紀錄語境',
      contextReason: '目前是在描述、引用或分析高風險言詞，而不是把該言詞直接用來要求或攻擊收件者。保留原文可能具有查證、紀錄、研究或教育必要性。'
    };
  }
  if (rule.id === 'LING-DELEGATION-CONTEXT') {
    return {
      severity: 'moderate', weightFactor: 1,
      contextLabel: '分工調整本身不一定有問題',
      contextReason: '若確有排班品質、能力或人力配置問題，重新分工可以是合理管理措施；需要調整的是把人格化否定改成具體缺失、支援／覆核安排與分工依據。'
    };
  }
  return {
    severity: rule.severity, weightFactor: 1,
    contextLabel: rule.severity === 'severe' ? '依目前語境屬較高風險' : '依目前語境需要調整',
    contextReason: rule.category.includes('性騷擾') || rule.category.includes('性暴力')
      ? '前後文命中性要求、性暗示、權勢交換或身體界線結構；不是只因單一性／身體詞彙而提示。'
      : '此項由整段語句結構觸發，而非只憑單一詞彙。'
  };
}

function scanCorpus(text, options, source = '原始訊息') {
  const normalized = normalizeText(text);
  const findings = [];
  let score = 0;

  for (const matcher of PHRASE_MATCHERS) {
    const { entry, regex } = matcher;
    if (entry.audiences && !entry.audiences.includes(options.audience)) continue;
    regex.lastIndex = 0;
    const match = regex.exec(normalized);
    if (!match) continue;

    const contextual = contextualizeLexiconMatch(entry, match[0] || entry.phrase, normalized, options);
    score += Math.round(entry.weight * contextual.weightFactor);
    findings.push({
      type: 'tone',
      source,
      corpusId: entry.id,
      title: entry.category,
      severity: contextual.severity,
      fragment: match[0] || entry.phrase,
      contextLabel: contextual.contextLabel,
      contextReason: contextual.contextReason,
      canonicalPhrase: entry.phrase,
      reason: entry.warning,
      safeAction: entry.safeAction,
      legalNotes: getLegalNotes(entry.legal),
      sourceNotes: getSourceNotes(entry.sources),
      safeScenarioIds: safeScenarioIdsForCategory(entry.category),
      workContentRisk: Boolean(entry.workContentRisk),
      contextSensitive: Boolean(entry.contextSensitive)
    });
  }

  for (const entry of PATTERN_ENTRIES) {
    entry.regex.lastIndex = 0;
    const match = entry.regex.exec(normalized);
    if (!match) continue;

    score += entry.weight;
    findings.push({
      type: 'tone',
      source,
      corpusId: entry.id,
      title: entry.category,
      severity: entry.severity,
      fragment: match[0],
      canonicalPhrase: '結構語句',
      reason: entry.warning,
      safeAction: entry.safeAction,
      legalNotes: getLegalNotes(entry.legal),
      sourceNotes: getSourceNotes(entry.sources),
      safeScenarioIds: safeScenarioIdsForCategory(entry.category),
      workContentRisk: Boolean(entry.workContentRisk),
      contextSensitive: Boolean(entry.contextSensitive)
    });
  }

  for (const rule of LINGUISTIC_RULES) {
    const flags = rule.regex.flags.includes('g') ? rule.regex.flags : `${rule.regex.flags}g`;
    const matcher = new RegExp(rule.regex.source, flags);
    const seenFragments = new Set();
    let emitted = 0;
    for (const match of normalized.matchAll(matcher)) {
      const fragment = String(match[0] || '').trim();
      if (!fragment || seenFragments.has(fragment)) continue;
      seenFragments.add(fragment);
      const contextual = linguisticRuleContext(rule, fragment, normalized, options);
      score += Math.round(rule.weight * contextual.weightFactor);
      findings.push({
        type: 'tone', source, corpusId: rule.id, title: rule.category, severity: contextual.severity,
        fragment, canonicalPhrase: '語言學結構規則', reason: rule.warning, safeAction: rule.safeAction,
        contextLabel: contextual.contextLabel,
        contextReason: contextual.contextReason,
        legalNotes: getLegalNotes(rule.legal), sourceNotes: [], safeScenarioIds: safeScenarioIdsForCategory(rule.category), linguisticRule: true
      });
      emitted += 1;
      if (emitted >= 8) break;
    }
  }

  const feedback = scanFeedbackCorpus(normalized, source);
  findings.push(...feedback.findings);
  score += feedback.score;

  const expert = scanExpertCorpus(normalized, source);
  findings.push(...expert.findings);
  score += expert.score;

  return { findings: dedupeFindings(findings), score };
}

function inspectNonLexical(text, source, options) {
  const findings = [];
  let score = 0;

  if (!options.removeEmoji) return { findings, score };

  const stickerMatches = [...normalizeText(text).matchAll(STICKER_REGEX)].map(match => match[0]);
  if (stickerMatches.length) {
    score += 6;
    findings.push({
      type: 'tone',
      source,
      corpusId: 'FORMAT-STICKER',
      title: '貼圖或貼圖標記',
      severity: 'info',
      fragment: [...new Set(stickerMatches)].join('、'),
      reason: '貼圖語意高度依賴圖像與上下文，可能含嘲諷、性意味、威脅或可識別資訊；正式工作訊息不宜依靠貼圖表達關鍵意思。',
      safeAction: '改用可清楚留存與查證的文字表達。',
      legalNotes: [LEGAL_CATALOG['OSH22-1'], LEGAL_CATALOG['GEEA12'], LEGAL_CATALOG['PDPA5']].filter(Boolean)
    });
  }

  const emojiMatches = normalizeText(text).match(EMOJI_REGEX) || [];
  if (emojiMatches.length) {
    score += 4;
    findings.push({
      type: 'tone',
      source,
      corpusId: 'FORMAT-EMOJI',
      title: '表情符號',
      severity: 'info',
      fragment: [...new Set(emojiMatches)].join(' '),
      reason: '表情符號可能放大輕蔑、憤怒、嘲弄或性意味，也不利於日後還原正式工作指示。',
      safeAction: '關鍵工作訊息以文字、事實、要求與期限表達。',
      legalNotes: [LEGAL_CATALOG['OSH22-1'], LEGAL_CATALOG['GEEA12']].filter(Boolean)
    });
  }

  const punctuation = normalizeText(text).match(EXCESSIVE_PUNCTUATION) || [];
  if (punctuation.length) {
    score += 3;
    findings.push({
      type: 'tone',
      source,
      corpusId: 'FORMAT-PUNCT',
      title: '過度標點',
      severity: 'info',
      fragment: [...new Set(punctuation)].join('、'),
      reason: '連續驚嘆號或問號容易被理解為怒斥、嘲諷或施壓。',
      safeAction: '保留單一必要標點即可。',
      legalNotes: [LEGAL_CATALOG['OSH22-1']].filter(Boolean)
    });
  }

  return { findings, score };
}

function scanPii(text, source = '原始訊息') {
  const normalized = normalizeText(text);
  const findings = [];
  let score = 0;

  for (const rule of PII_RULES) {
    rule.regex.lastIndex = 0;
    const matches = [...normalized.matchAll(rule.regex)];
    if (!matches.length) continue;
    score += 10;
    findings.push({
      type: 'privacy',
      source,
      corpusId: `PII-${rule.id}`,
      title: rule.title,
      severity: 'severe',
      fragment: matches.slice(0, 3).map(match => match[0]).join('、'),
      reason: rule.reason,
      safeAction: '確認是否確有傳送必要；若無必要，請刪除或遮罩。',
      legalNotes: [LEGAL_CATALOG['PDPA5']].filter(Boolean)
    });
  }

  HEALTH_TERMS.lastIndex = 0;
  const healthMatches = [...normalized.matchAll(HEALTH_TERMS)].map(match => match[0]);
  if (healthMatches.length) {
    score += 5;
    findings.push({
      type: 'privacy',
      source,
      corpusId: 'PII-HEALTH',
      title: '健康或醫療資訊',
      severity: 'info',
      fragment: [...new Set(healthMatches)].slice(0, 8).join('、'),
      reason: '健康與醫療資訊高度敏感。即使傳送給本人，也應確認收件者、群組成員、轉傳風險與是否真的需要寫入。',
      safeAction: '僅在照護或業務必要範圍內提供，避免無關群組或轉傳。',
      legalNotes: [LEGAL_CATALOG['PDPA5']].filter(Boolean)
    });
  }

  return { findings, score };
}

function hasProfessionalContext(substance = {}) {
  const text = normalizeText([
    substance.topic, substance.fact, substance.action, substance.reason, substance.basis
  ].filter(Boolean).join(' '));
  return /(?:醫療|臨床|照護|衛教|法律|法規|判決|訴訟|偵查|司法|教育|教學|教材|性教育|研究|學術|倫理審查|犯罪調查|專業訓練|健康風險|醫學)/u.test(text);
}

function hasPlausibleWorkBasis(basis = '') {
  const text = normalizeText(basis).trim();
  if (text.length < 8) return false;
  if (/(?:因為我是老闆|因為我是老闆|主管說了算|照做就對|沒有理由|我高興|我想要|不需要理由)/u.test(text)) return false;
  return /(?:職務|職務說明|勞動契約|工作規則|專案|客戶|服務|會議|業務|公務|組織任務|法定|法規|政策|作業程序|標準作業程序|排班|輪值|值班|研究|醫療|臨床|教學|教育|採購|稽核|調查|安全|照護|合約|契約)/u.test(text);
}

function hasProfessionalBasis(basis = '') {
  const text = normalizeText(basis).trim();
  return text.length >= 6 && /(?:醫療|臨床|照護|衛教|法律|法規|判決|訴訟|偵查|司法|教育|教學|教材|性教育|研究|學術|倫理審查|犯罪調查|專業訓練|健康風險|醫學)/u.test(text);
}

function scanWorkContext(substance = {}, options = {}) {
  const combined = normalizeText([
    substance.topic, substance.fact, substance.action, substance.deadline, substance.reason, substance.basis
  ].filter(Boolean).join(' '));
  if (!combined) return { findings: [], blocking: [], score: 0 };

  const basis = normalizeText(substance.basis || '');
  const basisAdequate = hasPlausibleWorkBasis(basis);
  const professional = hasProfessionalBasis(basis);
  const findings = [];
  const blocking = [];
  let score = 0;

  for (const entry of CONTEXT_ENTRIES) {
    entry.regex.lastIndex = 0;
    const match = entry.regex.exec(combined);
    if (!match) continue;

    let severity = entry.severity;
    let blocked = Boolean(entry.blockOutput);
    let reason = entry.warning;
    let safeAction = entry.safeAction;

    if (entry.professionalException && professional) {
      severity = 'info';
      blocked = false;
      reason = `${entry.warning} 本次另偵測到醫療、法律、教育、研究或調查等專業目的線索，因此不直接攔截，但仍應確認對象、目的與最小必要性。`;
      safeAction = `${entry.safeAction} 專業術語應保留中性、必要且可說明其目的。`;
    } else if (entry.requiresBasis) {
      if (basisAdequate) {
        severity = 'info';
        blocked = false;
        reason = `${entry.warning} 本次已提供可辨識的工作必要性／職務依據，系統降為人工確認提醒；是否合理仍應依實際職務、契約、工時、安全、自願性與權勢關係判斷。`;
      } else if (entry.blockOutputWhenNoBasis) {
        blocked = true;
        reason = basis
          ? `${entry.warning} 雖已填寫「工作必要性／職務依據」，但內容過短、過於抽象或未能指出職務、專案、客戶、法規、程序等可核對依據，因此仍不作為解除攔截的理由。`
          : entry.warning;
      }
    }

    const finding = {
      type: 'work',
      source: '實質工作內容',
      corpusId: entry.id,
      title: entry.category,
      severity,
      fragment: match[0],
      canonicalPhrase: '工作內容結構',
      reason,
      safeAction,
      legalNotes: getLegalNotes(entry.legal),
      sourceNotes: getSourceNotes(entry.sources),
      blocking: blocked,
      professionalException: Boolean(entry.professionalException),
      requiresBasis: Boolean(entry.requiresBasis)
    };

    findings.push(finding);
    if (severity !== 'info') score += entry.weight || 0;
    if (blocked) blocking.push(finding);
  }

  for (const entry of WORK_LINGUISTIC_RULES) {
    entry.regex.lastIndex = 0;
    const match = entry.regex.exec(combined);
    if (!match) continue;
    const finding = {
      type: 'work', source: '實質工作內容', corpusId: entry.id, title: entry.category, severity: entry.severity,
      fragment: match[0], canonicalPhrase: '工作內容語言學規則', reason: entry.warning, safeAction: entry.safeAction,
      legalNotes: getLegalNotes(entry.legal), sourceNotes: [], blocking: true
    };
    findings.push(finding); blocking.push(finding); score += entry.weight;
  }

  return { findings: dedupeFindings(findings), blocking: dedupeFindings(blocking), score };
}


// v1.10: structured fields are user input, not trusted facts.  Even manually
// edited fields are neutralized before generation so insults, blame labels and
// vague commands cannot bypass the raw-message safety layer.
const SUBJECTIVE_WORK_LABEL = /(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|惡搞|搞砸|搞爛|亂七八糟|一團亂|爛透|爛到不行|很爛|超爛|有夠爛|垃圾|狗屁|鬼東西|雷包|豬隊友|拖油瓶)/gu;
const PERSON_ATTACK_WORDS = /(?:白癡|智障|腦殘|低能|廢物|沒腦|腦袋有洞|腦子進水|沒帶腦|蠢蛋|笨蛋|弱智|神經病)/gu;
const FINANCE_TERMS = /(?:核銷|請款|報帳|報銷|發票|收據|憑證|費用|帳務|會計)/u;
const SCHEDULE_TERMS = /(?:排班|班表|班次|輪班|值班|調班|缺班|出勤|人力配置|時段衝突)/u;
const DOCUMENT_TERMS = /(?:報告|報表|文件|簡報|附件|版本|表單|紀錄|公文|企劃|計畫書)/u;
const SYSTEM_TERMS = /(?:網站|程式|系統|功能|頁面|版本|錯誤|bug|BUG|當機|閃退)/u;

function concreteTopicFromText(text) {
  const value = cleanText(text);
  if (!value) return '';
  if (FINANCE_TERMS.test(value)) return /核銷/u.test(value) ? '核銷' : /請款/u.test(value) ? '請款' : '核銷與請款';
  if (SCHEDULE_TERMS.test(value)) return '排班';
  const doc = value.match(/(?:報告|報表|簡報|附件|公文|文件|表單|紀錄|企劃|計畫書)/u);
  if (doc) return doc[0];
  if (SYSTEM_TERMS.test(value)) return /網站/u.test(value) ? '網站' : /程式/u.test(value) ? '程式' : '系統';
  return '';
}

function neutralizeTopicSemantics(text) {
  let value = cleanText(text);
  if (!value) return { text: '', changed: false };
  const original = value;
  value = value
    .replace(PERSON_ATTACK_WORDS, '')
    .replace(SUBJECTIVE_WORK_LABEL, '')
    .replace(/(?:你|妳|他|她)?(?:每次|一直|總是|根本)?(?:都)?(?:排不好|做不好|弄不好|搞不好|不會弄|不會做)/gu, '')
    .replace(/(?:你懂嗎|知道嗎|聽懂嗎|可以嗎|行不行)/gu, '')
    .replace(/(?:可不可以|能不能|拜託)?不要再/gu, '')
    .replace(/[，。；：、！？\s]+/gu, ' ')
    .trim();
  const full = `${original} ${value}`;
  if (SCHEDULE_TERMS.test(full)) value = '排班';
  else if (FINANCE_TERMS.test(full)) value = /核銷/u.test(full) ? '核銷' : /請款/u.test(full) ? '請款' : '核銷與請款';
  else {
    const doc = full.match(/(?:報告|報表|簡報|附件|版本|公文|文件|表單|紀錄|企劃|計畫書)/u);
    if (doc) value = doc[0];
    else if (SYSTEM_TERMS.test(full)) value = /網站/u.test(full) ? '網站' : /程式/u.test(full) ? '程式' : '系統';
  }
  return { text: cleanText(value), changed: cleanText(value) !== cleanText(original) };
}

function structuredGarbleScore(text) {
  const value = cleanText(text);
  if (!value) return 0;
  let score = 0;
  if (/(.)\1{3,}/u.test(value)) score += 2;
  if (/(?:一一|恩恩|嗯嗯|那個那個|就是就是|然後然後|排班排班)/u.test(value)) score += 2;
  if ((value.match(/(?:就是|那個|然後|然後呢|你懂|知道|我跟你講)/gu) || []).length >= 2) score += 2;
  if (/^(?:知道|就是|那個|然後|你看|我覺得)[^。！？]{15,}$/u.test(value)) score += 1;
  const meaningful = (value.match(/(?:排班|班表|班次|出勤|調班|確認|回報|詢問|衝突|缺班|人力|核銷|請款|報告|附件|版本|進度|時程|修正|上傳|交接)/gu) || []).length;
  if (value.length > 28 && meaningful <= 1) score += 1;
  return score;
}

function repairScheduleFact(text, context = {}) {
  const value = cleanText(text);
  const combined = `${context.topic || ''} ${value} ${context.action || ''}`;
  if (!SCHEDULE_TERMS.test(combined)) return value;
  const hasAttendance = /(?:出勤|時段|班次|值班|輪班|調班|缺班|撞班|人力)/u.test(value);
  const hasProblem = /(?:問題|不對|錯|衝突|不一致|沒確認|不確定|排不好|亂|漏)/u.test(value);
  const garbled = structuredGarbleScore(value) >= 2 || /(?:你|妳)(?:就|會|都|每次)[^。！？]{8,}(?:嗎|懂嗎)/u.test(value);
  if (garbled || /(?:排班).*?(?:排不好|有問題)/u.test(value)) {
    return hasAttendance
      ? '目前排班資訊、可出勤時段或班次安排仍有需要確認的地方'
      : '目前班表安排仍有需要確認的地方';
  }
  if (hasProblem && !/^(?:目前|現階段|現在|本次|這次)/u.test(value)) return `目前${value.replace(/^(?:你|妳|他|她)/u,'')}`;
  return value;
}

function repairScheduleAction(text, context = {}) {
  let value = cleanText(text);
  const combined = `${context.topic || ''} ${context.fact || ''} ${value}`;
  if (!SCHEDULE_TERMS.test(combined)) return value;
  // 已經是「確認＋覆核／複核」這類完整可執行流程時，不應再被泛化模板蓋掉。
  if (/(?:覆核|複核)/u.test(value) && /(?:確認|排班|班表|班次|出勤)/u.test(value) && structuredGarbleScore(value) < 2) return value;
  const wantsCommunication = /(?:跟|和|向|問|詢問|講|說).*?(?:別人|同事|相關人員|對方)|(?:怎麼|如何).*?(?:講話|溝通|確認|詢問)|(?:確認|詢問).*?(?:出勤|班次|時段|能不能上班)/u.test(value);
  const coerciveMeta = /(?:如果|你如果).*?(?:沒有打算|不想).*?(?:不要做|別做)|(?:一定要|你要知道).*?(?:怎麼|如何).*?(?:講話|確認)|(?:你懂嗎|知道嗎|聽懂嗎)/u.test(value);
  const garbled = structuredGarbleScore(value) >= 2;
  if (wantsCommunication || coerciveMeta || garbled) {
    return '排班前先向相關人員確認可出勤時段與班次；有不確定或衝突時先提出確認，再完成班表';
  }
  if (/^(?:重新)?確認(?:班表|排班|班次)(?:與|和)?(?:班次|出勤)?(?:安排)?$/u.test(value)) {
    return '先確認可出勤時段與班次安排，再完成班表';
  }
  return value;
}

function semanticRepairStructuredSubstance(substance) {
  const s = { ...substance };
  const topicResult = neutralizeTopicSemantics(s.topic || '');
  s.topic = topicResult.text;
  s.fact = repairScheduleFact(s.fact || '', s);
  s.action = repairScheduleAction(s.action || '', s);

  // General meta-scolding is not an executable action.  Convert only when the
  // underlying intent is evident from nearby structured fields; otherwise
  // leave it blank and let the UI ask the user to clarify.
  const metaOnly = /^(?:你|妳)?(?:要|一定要|應該要)?(?:知道|學會|懂得)(?:怎麼|如何).*(?:講話|溝通|確認|做事)|^(?:你|妳)?(?:如果)?(?:不想|沒打算).*?(?:不要做|別做)/u;
  if (metaOnly.test(cleanText(s.action || '')) && !SCHEDULE_TERMS.test(`${s.topic} ${s.fact}`)) s.action = '';
  return { substance: s, changed: topicResult.changed };
}

function neutralizeFactSemantics(text, context = {}) {
  let value = cleanText(text);
  if (!value) return { text: '', changed: false };
  const original = value;
  const hadSubjective = SUBJECTIVE_WORK_LABEL.test(value) || PERSON_ATTACK_WORDS.test(value);
  SUBJECTIVE_WORK_LABEL.lastIndex = 0;
  PERSON_ATTACK_WORDS.lastIndex = 0;

  // If an emotional label is followed by an observable consequence, keep the
  // consequence and drop the blame.  This deliberately weakens causal claims.
  value = value
    .replace(/^(?:(?:你|妳|他|她|這|那)?\s*(?:在|又|一直|根本)?\s*)?(?:瞎搞|亂搞|胡搞|鬼搞|亂來|瞎弄|亂弄|亂做|惡搞|搞砸|搞爛)(?:了)?\s*[，,；;：:]?\s*(?:(?:結果|所以)?\s*(?:導致|造成|害得|弄得)\s*)?/u, '')
    .replace(/^(?:目前|現階段|現在)?\s*(?:結果|所以)?\s*(?:導致|造成|害得|弄得)\s*/u, match => /^(?:目前|現階段|現在)/u.test(match) ? '目前' : '')
    .replace(SUBJECTIVE_WORK_LABEL, '')
    .replace(PERSON_ATTACK_WORDS, '')
    .replace(/(?:你|妳)到底(?:在)?(?:做|弄)什麼(?:鬼)?/gu, '')
    .replace(/(?:這|那)?到底是什麼(?:鬼)?(?:東西)?/gu, '')
    .replace(/(?:連)?(?:三歲小孩|小學生|幼稚園|猴子)都會/gu, '')
    .replace(/\b(?:很|超級|超|有夠|真的)\s*(?:扯|離譜|誇張|荒謬)\b/gu, '');

  // Turn common blame-heavy outcomes into observable status descriptions.
  value = value
    .replace(/(?:核銷|報帳)(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)/gu, '核銷作業未能完成')
    .replace(/請款(?:作業)?(?:失敗|沒過|未過|被退(?:件)?|退件了?)/gu, '請款作業未能完成')
    .replace(/(?:發票|收據|憑證)(?:全都|全部)?(?:錯了?|有錯|錯很多|錯一堆)/gu, '$&')
    .replace(/^(.{1,30})(?:錯很多|錯一堆|一堆錯|全錯)$/u, '目前$1有多處需要重新確認')
    .replace(/^(.{1,30})(?:很爛|超爛|爛透|爛到不行)$/u, '目前$1內容需要重新確認')
    .replace(/(?:目前)?(?:排班)?(?:撞班|班次衝突|時段衝突)[^。！？!?]{0,8}(?:你|妳|他|她)?(?:還)?(?:藏|瞞|拖)(?:到)?最後/gu, '目前排班衝突直到較後階段才被提出')
    .replace(/(?:你|妳|他|她)?(?:還)?(?:藏|瞞|拖)(?:到)?最後/gu, '相關問題直到較後階段才被提出');

  value = cleanText(value)
    .replace(/^(?:導致|造成|害得|弄得)\s*/u, '')
    .replace(/^(?:目前)?(?:你|妳|他|她)\s*/u, '')
    .replace(/^[，。；：、！？\s]+|[，；：、\s]+$/gu, '');

  if (!value && hadSubjective) {
    const topic = cleanText(context.topic || '');
    if (topic) {
      if (SCHEDULE_TERMS.test(topic)) value = '目前排班安排需要重新確認';
      else if (FINANCE_TERMS.test(topic)) value = '目前核銷或請款內容需要重新確認';
      else value = `目前${topic}內容需要重新確認`;
    }
  }

  if (value && !/^(?:目前|現階段|現在|本次|這次|已|尚|未|仍)/u.test(value)) {
    if (/^(?:核銷作業|請款作業)/u.test(value)) value = `目前${value}`;
  }
  return { text: cleanText(value), changed: cleanText(value) !== cleanText(original) };
}

function neutralizeActionSemantics(text, context = {}) {
  let value = cleanText(text);
  if (!value) return { text: '', changed: false };
  const original = value;
  value = value
    .replace(PERSON_ATTACK_WORDS, '')
    .replace(SUBJECTIVE_WORK_LABEL, '')
    .replace(/^(?:給我|馬上|立刻|現在就|趕快|趕緊|務必給我)\s*/u, '')
    .replace(/(?:不然|否則|要不然).*/u, '')
    .replace(/(?:做不到|沒做完|再錯|再犯).*$/u, '')
    .replace(/^(?:請|麻煩|煩請)\s*/u, '')
    .trim();

  const contextText = `${context.fact || ''} ${context.topic || ''} ${context.reason || ''}`;
  const concrete = concreteTopicFromText(contextText);
  if (/^(?:校對|核對|檢查|確認)(?:一下)?$/u.test(value)) {
    if (FINANCE_TERMS.test(contextText)) value = '重新核對核銷資料與相關憑證';
    else if (SCHEDULE_TERMS.test(contextText)) value = '重新確認班表與班次安排';
    else if (concrete) value = `重新檢查並確認${concrete}內容`;
    else value = '重新檢查並確認相關內容';
  } else if (/^(?:處理|弄好|弄完|改好)(?:一下)?$/u.test(value)) {
    if (concrete) value = `確認${concrete}目前狀況並完成必要處理`;
    else value = '確認目前狀況並完成必要處理';
  }
  return { text: cleanText(value), changed: cleanText(value) !== cleanText(original) };
}

function neutralizeReasonSemantics(text) {
  let value = cleanText(text);
  if (!value) return { text: '', changed: false };
  const original = value;
  value = value
    .replace(PERSON_ATTACK_WORDS, '')
    .replace(SUBJECTIVE_WORK_LABEL, '')
    .replace(/(?:都是|就是)你(?:害的|造成的|的錯)/gu, '')
    .replace(/(?:免得|省得)你又.*/gu, '')
    .replace(/(?:讓大家看笑話|丟臉|很難看)/gu, '')
    .replace(/讓團隊有時間確認與補救[，,]?不要等到最後才被動處理/gu, '讓團隊有時間確認與補救，避免問題到最後階段才處理')
    .replace(/不要等到最後才被動處理/gu, '避免問題到最後階段才處理')
    .replace(/^[，。；：、！？\s]+|[，；：、\s]+$/gu, '');
  return { text: cleanText(value), changed: cleanText(value) !== cleanText(original) };
}

function reconcileStructuredMeaning(substance) {
  const s = { ...substance };
  const details = cleanText(`${s.fact || ''} ${s.action || ''} ${s.reason || ''}`);
  const selected = cleanText(s.topic || '');
  const inferred = concreteTopicFromText(details);
  if (!selected || !details || !inferred) return s;

  const selectedSchedule = SCHEDULE_TERMS.test(selected);
  const selectedFinance = FINANCE_TERMS.test(selected);
  const selectedDocument = DOCUMENT_TERMS.test(selected);
  const detailsSchedule = SCHEDULE_TERMS.test(details);
  const detailsFinance = FINANCE_TERMS.test(details);
  const detailsDocument = DOCUMENT_TERMS.test(details);

  const mismatched =
    (selectedSchedule && !detailsSchedule && (detailsFinance || detailsDocument)) ||
    (selectedFinance && !detailsFinance && (detailsSchedule || detailsDocument)) ||
    (selectedDocument && !detailsDocument && (detailsSchedule || detailsFinance));
  if (mismatched) s.topic = inferred;
  return s;
}

function sanitizeOutputField(text, options, context = {}) {
  let output = normalizeText(text);
  let blocked = 0;

  if (options.removeEmoji) {
    output = output.replace(STICKER_REGEX, '');
    output = output.replace(EMOJI_REGEX, '');
    output = output.replace(EXCESSIVE_PUNCTUATION, '$1');
  }

  for (const matcher of PHRASE_MATCHERS) {
    const { entry, regex } = matcher;
    if (entry.audiences && !entry.audiences.includes(options.audience)) continue;
    if (entry.contextSensitive && context.allowProfessionalTerms) continue;
    // 「有病史」是常見醫療紀錄語句，不能因為其中包含辱罵詞形「有病」而被切成「有史」。
    if (context.allowProfessionalTerms && (entry.id === 'INSULT-030' || entry.phrase === '有病') && /(?:有病史|既往病史|疾病史)/u.test(output)) continue;
    regex.lastIndex = 0;
    if (!regex.test(output)) continue;
    regex.lastIndex = 0;
    output = output.replace(regex, '');
    blocked += 1;
  }

  for (const entry of PATTERN_ENTRIES) {
    entry.regex.lastIndex = 0;
    if (!entry.regex.test(output)) continue;
    output = removeSentencesContaining(output, entry.regex);
    blocked += 1;
  }

  if (options.maskPii) {
    for (const rule of PII_RULES) {
      rule.regex.lastIndex = 0;
      if (!rule.regex.test(output)) continue;
      rule.regex.lastIndex = 0;
      output = output.replace(rule.regex, rule.replacement);
      blocked += 1;
    }
  }

  return { text: cleanText(output), blocked };
}

function removeSentencesContaining(text, regex) {
  const flags = regex.flags.replace('g', '');
  const tester = new RegExp(regex.source, flags);
  return normalizeText(text)
    .split(/(?<=[。！？!?；;\n])/u)
    .map(segment => {
      tester.lastIndex = 0;
      return tester.test(segment) ? '' : segment;
    })
    .join('');
}

function sanitizeSubstance(substance, options) {
  const keys = ['topic', 'fact', 'action', 'deadline', 'reason', 'basis'];
  const cleaned = {};
  let blocked = 0;
  const professional = Boolean(options.professionalContext) || hasProfessionalBasis(substance.basis || '');

  for (const key of keys) {
    const result = sanitizeOutputField(substance[key] || '', options, { allowProfessionalTerms: professional });
    cleaned[key] = result.text;
    blocked += result.blocked;
  }

  const topicResult = neutralizeTopicSemantics(cleaned.topic);
  cleaned.topic = topicResult.text;
  blocked += Number(topicResult.changed);

  const factResult = neutralizeFactSemantics(cleaned.fact, cleaned);
  cleaned.fact = factResult.text;
  const actionResult = neutralizeActionSemantics(cleaned.action, cleaned);
  cleaned.action = actionResult.text;
  const reasonResult = neutralizeReasonSemantics(cleaned.reason);
  cleaned.reason = reasonResult.text;
  blocked += Number(factResult.changed) + Number(actionResult.changed) + Number(reasonResult.changed);

  const semanticRepair = semanticRepairStructuredSubstance(cleaned);
  Object.assign(cleaned, semanticRepair.substance);
  blocked += Number(semanticRepair.changed);

  cleaned.tone = substance.tone || 'directive';
  return { substance: reconcileStructuredMeaning(cleaned), blocked };
}

if (typeof globalThis !== 'undefined') globalThis.RMG_SANITIZE_STRUCTURED = sanitizeSubstance;

function composeSafeMessage(substance, options) {
  // 重要安全不變量：
  // 1. 本函式只接收結構化「實質工作內容」，沒有 raw/original message 參數。
  // 2. 職務依據預設只供合理性檢核，不自動出現在對外訊息。
  // 3. 潤稿引擎不得新增使用者未提供的事實、日期、人名、制裁或法律結論。
  return REWRITE_ENGINE.rewriteStructuredMessage(substance, options);
}

function analyzeMessage(raw, substance = {}, options = {}) {
  incrementFeedbackAnalysisCount();
  const normalizedOptions = {
    audience: options.audience || 'coworker',
    purpose: options.purpose || 'general',
    removeEmoji: options.removeEmoji !== false,
    maskPii: options.maskPii !== false,
    recordableTone: options.recordableTone !== false,
    clipboardImageDetected: Boolean(options.clipboardImageDetected),
    rewriteStyle: options.rewriteStyle || 'natural',
    includeBasis: Boolean(options.includeBasis),
    safeCorpusScenarioId: options.safeCorpusScenarioId || '',
    randomSeed: options.randomSeed || '',
    precomputedRewrite: options.precomputedRewrite || null,
    sourceForCopyGuard: options.sourceForCopyGuard || raw || '',
    substance,
    professionalContext: professionalLanguageContext(raw, substance) || hasProfessionalBasis(substance.basis || '')
  };

  const findings = [];
  let score = 0;

  const rawCorpus = scanCorpus(raw, normalizedOptions, '原始訊息');
  findings.push(...rawCorpus.findings);
  score += rawCorpus.score;

  const rawFormat = inspectNonLexical(raw, '原始訊息', normalizedOptions);
  findings.push(...rawFormat.findings);
  score += rawFormat.score;

  const rawPii = scanPii(raw, '原始訊息');
  findings.push(...rawPii.findings);
  score += rawPii.score;

  const substanceCombined = [substance.topic, substance.fact, substance.action, substance.deadline, substance.reason, substance.basis]
    .filter(Boolean)
    .join('\n');

  if (substanceCombined) {
    const substanceCorpus = scanCorpus(substanceCombined, normalizedOptions, '實質內容');
    findings.push(...substanceCorpus.findings);
    score += substanceCorpus.score;

    const substanceFormat = inspectNonLexical(substanceCombined, '實質內容', normalizedOptions);
    findings.push(...substanceFormat.findings);
    score += substanceFormat.score;

    const substancePii = scanPii(substanceCombined, '實質內容');
    findings.push(...substancePii.findings);
    score += substancePii.score;
  }

  const workContext = scanWorkContext(substance, normalizedOptions);
  findings.push(...workContext.findings);
  score += workContext.score;

  if (normalizedOptions.clipboardImageDetected) {
    score += 6;
    findings.push({
      type: 'tone',
      source: '原始訊息',
      corpusId: 'FORMAT-PASTE-IMAGE',
      title: '剪貼簿圖片或貼圖',
      severity: 'info',
      fragment: '圖片內容未讀取',
      reason: '剪貼簿含圖片或貼圖。本網站基於資料最小化不讀取、不辨識、不上傳影像，因此無法判斷其中是否含羞辱、性意味、威脅或個資。',
      safeAction: '重要工作內容改用可留存文字；必要影像另依組織規範處理。',
      legalNotes: [LEGAL_CATALOG['OSH22-1'], LEGAL_CATALOG['GEEA12'], LEGAL_CATALOG['PDPA5']].filter(Boolean)
    });
  }

  const sanitized = sanitizeSubstance(substance, normalizedOptions);
  const composed = normalizedOptions.precomputedRewrite
    ? {
        ...normalizedOptions.precomputedRewrite,
        coverage: normalizedOptions.precomputedRewrite.coverage && Object.keys(normalizedOptions.precomputedRewrite.coverage).length
          ? normalizedOptions.precomputedRewrite.coverage
          : REWRITE_ENGINE.coverageReport(sanitized.substance, normalizedOptions.precomputedRewrite.text || '', Boolean(normalizedOptions.includeBasis)),
        variantCoverage: normalizedOptions.precomputedRewrite.variantCoverage && Object.keys(normalizedOptions.precomputedRewrite.variantCoverage).length
          ? normalizedOptions.precomputedRewrite.variantCoverage
          : Object.fromEntries(Object.entries(normalizedOptions.precomputedRewrite.variants || {}).map(([key, value]) => [key, REWRITE_ENGINE.coverageReport(sanitized.substance, value, Boolean(normalizedOptions.includeBasis))]))
      }
    : composeSafeMessage(sanitized.substance, normalizedOptions);

  // 工作內容本身若出現高風險，不應用「禮貌改寫」漂白成可執行命令。
  // 必須先修正工作要求或補足必要的職務依據。
  let safeText = composed.text;
  let copyable = composed.copyable;
  let outputNotice = composed.notice;
  let residualCount = 0;
  let effectiveRewriteStyle = composed.style || normalizedOptions.rewriteStyle || 'natural';
  const safeVariants = { ...(composed.variants || {}) };

  // 三種候選版本都必須各自通過「原句複製＋高風險＋個資」防漏，避免切換分頁後繞過檢核。
  if (Object.keys(safeVariants).length) {
    const professionalContext = hasProfessionalBasis(substance.basis || '');
    for (const [variantStyle, variantText] of Object.entries(safeVariants)) {
      if (!variantText) continue;
      const copyRisk = INTENT_ENGINE && normalizedOptions.sourceForCopyGuard
        ? INTENT_ENGINE.copiedSentenceRisk(normalizedOptions.sourceForCopyGuard, variantText)
        : { copied: false };
      let checkedText = variantText;
      if (copyRisk.copied && INTENT_ENGINE?.decopySubstance) {
        const decopied = INTENT_ENGINE.decopySubstance(sanitized.substance);
        const regenerated = REWRITE_ENGINE.rewriteStructuredMessage(decopied, { ...normalizedOptions, rewriteStyle: variantStyle });
        if (regenerated?.text && !INTENT_ENGINE.copiedSentenceRisk(normalizedOptions.sourceForCopyGuard, regenerated.text).copied) {
          checkedText = regenerated.text;
        }
      }
      const finalCopyRisk = INTENT_ENGINE && normalizedOptions.sourceForCopyGuard
        ? INTENT_ENGINE.copiedSentenceRisk(normalizedOptions.sourceForCopyGuard, checkedText)
        : { copied: false };
      const variantCorpus = scanCorpus(checkedText, normalizedOptions, `建議版本防漏-${variantStyle}`);
      const severeVariant = variantCorpus.findings.filter(item =>
        item.severity !== 'info' && !(professionalContext && item.contextSensitive)
      );
      const variantPii = normalizedOptions.maskPii ? [] : scanPii(checkedText, `建議版本防漏-${variantStyle}`).findings.filter(item => item.severity === 'severe');
      if (finalCopyRisk.copied || severeVariant.length || variantPii.length) {
        safeVariants[variantStyle] = '';
      } else {
        safeVariants[variantStyle] = checkedText;
      }
    }
    const requestedStyle = composed.style || normalizedOptions.rewriteStyle || 'natural';
    if (!safeVariants[requestedStyle]) {
      const fallback = ['natural', 'concise', 'formal'].find(key => safeVariants[key]);
      if (fallback) {
        safeText = safeVariants[fallback];
        effectiveRewriteStyle = fallback;
        outputNotice = `${composed.notice || ''} 原選取版本未通過完整防漏，已改用其他重新生成版本。`.trim();
      }
    } else {
      safeText = safeVariants[requestedStyle];
      effectiveRewriteStyle = requestedStyle;
    }
    copyable = Boolean(safeText && composed.copyable);
  }

  if (workContext.blocking.length) {
    const labels = [...new Set(workContext.blocking.map(item => item.title))].slice(0, 3).join('、');
    safeText = '';
    copyable = false;
    outputNotice = `實質工作內容本身出現「${labels}」風險，系統不會把可能不合理的要求包裝成較禮貌的命令。請先修正工作內容，或在適用規則允許時補充具體職務依據。`;
    residualCount += workContext.blocking.length;
  }


  if (safeText && copyable) {
    const residualCorpus = scanCorpus(safeText, normalizedOptions, '建議版本防漏');
    const residualPii = normalizedOptions.maskPii ? { findings: [], score: 0 } : scanPii(safeText, '建議版本防漏');
    const professionalContext = hasProfessionalBasis(substance.basis || '');
    const severeResidual = residualCorpus.findings.filter(item =>
      item.severity !== 'info' && !(professionalContext && item.contextSensitive)
    );

    if (severeResidual.length || residualPii.findings.some(item => item.severity === 'severe')) {
      residualCount = severeResidual.length + residualPii.findings.length;
      findings.push({
        type: 'tone',
        source: '系統防漏',
        corpusId: 'OUTPUT-BLOCK',
        title: '建議版本仍含高風險內容，已阻止複製',
        severity: 'severe',
        fragment: severeResidual.map(item => item.fragment).slice(0, 6).join('、') || '仍有高風險內容',
        reason: '第二層防漏仍偵測到高風險用語或未遮罩的敏感資訊。為避免把不當訊息重新輸出，系統不提供可複製版本。',
        safeAction: '請調整「實質內容」欄位後重新產生。',
        legalNotes: []
      });
      const selectedStyle = composed.style || normalizedOptions.rewriteStyle || 'natural';
      safeVariants[selectedStyle] = '';
      const fallbackStyle = ['natural', 'concise', 'formal'].find(key => safeVariants[key]);
      safeText = fallbackStyle ? safeVariants[fallbackStyle] : '';
      if (fallbackStyle) effectiveRewriteStyle = fallbackStyle;
      copyable = Boolean(safeText);
      outputNotice = fallbackStyle
        ? '原選取版本因防漏檢核未通過，已切換到另一個通過檢核的重新生成版本。'
        : '所有建議版本均因防漏檢核未通過而被阻止。請修改實質內容欄位後重新產生。';
      score += 30;
    }
  }

  const deduped = dedupeFindings(findings).map(item => {
    const sourceText = String(item.source || '').startsWith('原始') ? raw : substanceCombined;
    return addFinalContextInterpretation(item, sourceText, sanitized.substance, normalizedOptions);
  });
  const privacyCount = deduped.filter(item => item.type === 'privacy').length;
  const toneRiskCount = deduped.filter(item => item.type === 'tone' && item.severity !== 'info').length;
  const workRiskCount = deduped.filter(item => item.type === 'work' && item.severity !== 'info').length;
  const corpusHitCount = deduped.filter(item => item.corpusId && !item.corpusId.startsWith('PII-') && !item.corpusId.startsWith('FORMAT-') && item.corpusId !== 'OUTPUT-BLOCK').length;

  score = Math.min(100, score);
  const level = score >= 55 ? 'high' : score >= 20 ? 'medium' : 'low';
  const label = level === 'high'
    ? (copyable ? '原始訊息含高風險片段；下方建議版本已移除並重寫' : '高風險內容仍未能安全重寫：請先修正工作內容')
    : level === 'medium'
      ? (copyable ? '原始訊息有需要調整的表達；下方已提供重寫版本' : '已有明顯風險訊號：建議先調整')
      : '目前未見明顯高風險訊號';

  if (!deduped.length) {
    deduped.push({
      type: 'system',
      source: '系統',
      corpusId: 'SYSTEM-NO-HIT',
      title: '未命中目前離線語料庫',
      severity: 'info',
      fragment: '無',
      reason: '目前未命中離線高風險用語、結構規則或明顯個資格式；仍可能存在上下文、權勢關係、頻率、貼圖內容、反話或隱含語意風險。',
      safeAction: '送出前仍應人工確認事實、目的、對象與必要性。',
      legalNotes: [LEGAL_CATALOG['OSH22-1']].filter(Boolean)
    });
  }

  const normalizedFieldChanges = ['topic', 'fact', 'action', 'deadline', 'reason', 'basis']
    .filter(key => cleanText(substance[key] || '') !== cleanText(sanitized.substance[key] || ''));

  return {
    safeText,
    copyable,
    sanitizedSubstance: sanitized.substance,
    normalizedFieldChanges,
    outputNotice,
    findings: deduped,
    score,
    level,
    label,
    privacyCount,
    toneRiskCount,
    workRiskCount,
    severeFindingCount: deduped.filter(item => item.severity === 'severe').length,
    contextualFindingCount: deduped.filter(item => item.severity === 'moderate' || (item.contextSensitive && item.severity !== 'info')).length,
    infoFindingCount: deduped.filter(item => item.severity === 'info').length,
    corpusHitCount,
    blockedCount: sanitized.blocked + residualCount,
    rewriteStyle: effectiveRewriteStyle,
    rewriteQualityScore: composed.qualityScore || 0,
    rewriteVariants: safeVariants,
    rewriteCoverage: composed.coverage || {},
    rewriteVariantCoverage: composed.variantCoverage || {},
    corpusVersion: CORPUS.version,
    corpusPhraseCount: PHRASE_ENTRIES.length,
    corpusPatternCount: PATTERN_ENTRIES.length,
    corpusContextCount: CONTEXT_ENTRIES.length,
    corpusSourceCount: Object.keys(SOURCE_CATALOG).length,
    expertCorpusCount: EXPERT_ENTRIES.length,
    generatedRiskPhraseCount: Number(CORPUS.generatedPhraseCount || 0),
    safeScenarioCount: Number(SAFE_MESSAGE_CORPUS.scenarioCount || 0),
    safeTemplateCount: Number(SAFE_MESSAGE_CORPUS.exampleCount || 0),
    safeCorpusVersion: SAFE_MESSAGE_CORPUS.version || 'unknown'
  };
}

function readSubstanceFromForm() {
  return {
    topic: $('topicText').value, fact: $('factText').value, action: $('actionText').value,
    deadline: $('deadlineText').value, reason: $('reasonText').value, basis: $('basisText').value, tone: $('toneSelect').value
  };
}

function readManualOverrides() {
  const current = readSubstanceFromForm();
  const out = { tone: current.tone };
  for (const key of manualOverrideFields) out[key] = current[key] || '';
  if (String(current.basis || '').trim()) out.basis = current.basis;
  return out;
}

function setStructuredFieldProgrammatically(key, value) {
  const node = $(STRUCTURED_FIELD_IDS[key]); if (!node) return;
  programmaticFieldUpdate = true;
  try { node.value = String(value || ''); autoFieldValues[key] = node.value; }
  finally { programmaticFieldUpdate = false; }
}

function setFieldOrigin(key, mode, evidence = '') {
  const badge = $(`${key}OriginBadge`), ev = $(`${key}Evidence`);
  if (badge) {
    badge.className = `field-origin-badge ${mode === 'manual' ? 'manual' : mode === 'auto' ? 'auto' : 'neutral'}`;
    badge.textContent = mode === 'manual' ? '人工修正' : mode === 'auto' ? '由原始訊息抽取' : '尚未抽取';
  }
  if (ev) ev.textContent = evidence ? `抽取依據：${String(evidence).replace(/\s+/gu,' ').slice(0,120)}` : '';
}

function renderLiveExtraction(extraction) {
  latestLiveExtraction = extraction || null;
  const summary = $('liveExtractionSummary'), confidence = $('liveExtractionConfidence');
  if (!summary || !confidence) return;

  // 不使用 innerHTML 字串插值；改用 DOM API，避免未定義的轉義輔助函式造成流程中斷，
  // 同時降低 XSS 與依賴遺漏風險。
  summary.replaceChildren();
  if (!extraction || extraction.needsInput) {
    confidence.className = 'live-confidence neutral';
    confidence.textContent = extraction ? '資訊不足' : '等待輸入';
    summary.textContent = extraction?.notice || '輸入原始訊息後，系統會自動把可用工作內容同步到下一區。';
    return;
  }

  const labels = { topic:'主題', fact:'事實', action:'行動', deadline:'期限', reason:'原因' };
  let rendered = 0;
  for (const key of ['topic','fact','action','deadline','reason']) {
    const value = String(extraction.substance?.[key] || '').trim();
    if (!value) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'live-extraction-chip';
    button.dataset.jumpField = key;
    const strong = document.createElement('strong');
    strong.textContent = labels[key];
    const span = document.createElement('span');
    span.textContent = value.slice(0, 100);
    button.append(strong, span);
    button.addEventListener('click', () => {
      const node = $(STRUCTURED_FIELD_IDS[key]);
      node?.scrollIntoView({ behavior:'smooth', block:'center' });
      node?.focus();
    });
    summary.appendChild(button);
    rendered += 1;
  }

  const confidenceLabels = { high:'高', medium:'中', low:'低', insufficient:'資訊不足' };
  confidence.className = `live-confidence ${extraction.confidence || 'neutral'}`;
  confidence.textContent = `可信度：${confidenceLabels[extraction.confidence] || '未標示'}`;
  if (!rendered) summary.textContent = extraction.notice || '尚未抽到可用工作內容';
}

function applyLiveExtraction(extraction, { overwriteManual = false } = {}) {
  if (!extraction?.substance) return;
  if (overwriteManual) manualOverrideFields.clear();
  for (const key of ['topic','fact','action','deadline','reason']) {
    if (manualOverrideFields.has(key)) { setFieldOrigin(key,'manual',extraction.evidence?.[key] || ''); continue; }
    setStructuredFieldProgrammatically(key, extraction.substance[key] || '');
    setFieldOrigin(key, extraction.substance[key] ? 'auto' : 'neutral', extraction.evidence?.[key] || '');
  }
  if (manualOverrideFields.has('basis')) setFieldOrigin('basis','manual','');
  syncPresetControlsFromSubstance(extraction.substance, extraction?.corpusSuggestion?.scenarioId || '');
  renderLiveExtraction(extraction);
}

function extractionOptions() {
  return { audience:$('audienceSelect').value, purpose:$('purposeSelect').value, safeCorpusScenarioId:selectedPresetScenarioId || '', randomSeed:createRandomSeed() };
}

function refreshLiveExtraction({ overwriteManual = false } = {}) {
  const raw = $('sourceText').value.trim();
  if (!raw || !INTENT_ENGINE) {
    if (!raw) renderLiveExtraction(null);
    return null;
  }
  try {
    const manual = overwriteManual ? { tone:$('toneSelect').value } : readManualOverrides();
    const extraction = INTENT_ENGINE.extract(raw, manual, extractionOptions());
    applyLiveExtraction(extraction, { overwriteManual });
    renderExtractionStatus(extraction, '本機混合語言模型');
    return extraction;
  } catch (error) {
    console.error('即時工作意圖抽取失敗', error);
    const status = $('extractionStatus');
    if (status) {
      status.textContent = `自動抽取暫時失敗：${error?.message || error}。仍可直接修正下方欄位後產生版本。`;
      status.dataset.confidence = 'insufficient';
    }
    return null;
  }
}
function scheduleLiveExtraction(delay = 420) { if (liveExtractionTimer) clearTimeout(liveExtractionTimer); liveExtractionTimer = setTimeout(() => refreshLiveExtraction(), delay); }
function markFieldManual(key) { if (programmaticFieldUpdate) return; manualOverrideFields.add(key); setFieldOrigin(key,'manual',latestLiveExtraction?.evidence?.[key] || ''); const note=$('reviewDirtyNotice'); if(note && lastAnalysisResult) note.hidden=false; }
function resetFieldToAuto(key) { manualOverrideFields.delete(key); refreshLiveExtraction(); $(STRUCTURED_FIELD_IDS[key])?.focus(); }

function openExtractionEditor(focusFirst = true) {
  const editor = $('extractionEditor');
  if (editor) editor.open = true;
  const target = $('extractionEditor') || $('topicText');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (focusFirst) setTimeout(() => $('topicText')?.focus(), 120);
}

function setAnalyzeBusy(busy) {
  const primary = $('analyzeButton');
  const apply = $('applyReviewButton');
  if (primary) {
    primary.disabled = busy;
    primary.textContent = busy ? '正在產生…' : '直接檢核並產生';
  }
  if (apply) {
    apply.disabled = busy;
    apply.textContent = busy ? '正在更新…' : '套用修正並更新結果';
  }
}

async function handleAnalyze() {
  const raw = $('sourceText').value.trim();
  let formSubstance = readSubstanceFromForm();

  if (!raw) {
    $('inputError').textContent = '請先貼上原始訊息。系統會自動抽取並直接產生；需要時再修正抽取結果。';
    $('inputError').hidden = false;
    $('sourceText').focus();
    return;
  }

  $('inputError').hidden = true;
  setAnalyzeBusy(true);

  const options = {
    audience: $('audienceSelect').value,
    purpose: $('purposeSelect').value,
    removeEmoji: $('removeEmojiOption').checked,
    maskPii: $('maskPiiOption').checked,
    recordableTone: true,
    clipboardImageDetected,
    rewriteStyle: $('rewriteStyleSelect').value,
    includeBasis: $('includeBasisOption').checked,
    safeCorpusScenarioId: selectedPresetScenarioId || '',
    randomSeed: createRandomSeed()
  };

  let extraction = latestLiveExtraction;
  let engineLabel = '本機混合語言模型';

  try {
    // 按下產生時強制以「現在的原始訊息＋現在的人工修正」重跑一次抽取。
    // 這一步消除 debounce 尚未執行、語音剛結束、或欄位仍是舊抽取結果的競態。
    if (raw && INTENT_ENGINE) {
      const manualOverrides = readManualOverrides();
      extraction = INTENT_ENGINE.extract(raw, manualOverrides, options);
      applyLiveExtraction(extraction);
      renderExtractionStatus(extraction, engineLabel);
    }

    // 這裡才讀取表單：現在的值已是「原始訊息自動抽取＋使用者人工修正」的最終確認版。
    // 後續風險檢核與潤稿都只使用這份確認內容；原始訊息仍完整用於風險掃描與內容來源追溯。
    formSubstance = readSubstanceFromForm();
    const sanitizedForRewrite = sanitizeSubstance(formSubstance, options).substance;
    const rewriteOptions = {
      ...options,
      safeCorpusScenarioId: extraction?.corpusSuggestion?.scenarioId || options.safeCorpusScenarioId || ''
    };

    let rewritten;
    if (ENGINE_BRIDGE) {
      rewritten = await ENGINE_BRIDGE.process({ raw: '', substance: sanitizedForRewrite, options: rewriteOptions });
      engineLabel = rewritten?.engine === 'javascript' ? '本機 JavaScript' : '本機混合語言模型';
    } else {
      rewritten = { ...composeSafeMessage(sanitizedForRewrite, rewriteOptions), engine: 'hybrid-local' };
    }

    const precomputedRewrite = {
      text: rewritten?.text || '',
      copyable: Boolean(rewritten?.copyable),
      notice: rewritten?.notice || '已依確認後的工作內容重新生成訊息。',
      style: rewritten?.style || options.rewriteStyle,
      qualityScore: rewritten?.qualityScore || 0,
      variants: rewritten?.variants || {},
      quality: rewritten?.quality || {},
      coverage: rewritten?.coverage || {},
      variantCoverage: rewritten?.variantCoverage || {}
    };

    const result = analyzeMessage(raw, formSubstance, {
      ...options,
      precomputedRewrite,
      sourceForCopyGuard: raw
    });
    result.extraction = extraction;
    result.engineLabel = engineLabel;

    // 將去責罵化／事實化後的確認內容回寫，讓使用者看到實際拿去生成的資料，而不是隱藏轉換。
    applySanitizedSubstanceToForm(result.sanitizedSubstance || formSubstance);
    renderExtractionStatus(extraction, engineLabel, result);
    renderResult(result);
  } catch (error) {
    console.error(error);
    $('inputError').textContent = `潤稿引擎執行失敗：${error?.message || error}。這是程式錯誤，不會把失敗內容當成結果；請保留下方抽取欄位並再試一次。`;
    $('inputError').hidden = false;
  } finally {
    setAnalyzeBusy(false);
  }
}

function applyExtractedSubstance(substance, originalManual, extraction) {
  for (const key of ['topic','fact','action','deadline','reason']) {
    if (manualOverrideFields.has(key)) { setFieldOrigin(key,'manual',extraction?.evidence?.[key] || ''); continue; }
    setStructuredFieldProgrammatically(key, substance[key] || '');
    setFieldOrigin(key, substance[key] ? 'auto' : 'neutral', extraction?.evidence?.[key] || '');
  }
  if (String(substance.basis || '').trim()) { setStructuredFieldProgrammatically('basis', substance.basis); setFieldOrigin('basis','manual',''); }
  syncPresetControlsFromSubstance(substance, extraction?.corpusSuggestion?.scenarioId || '');
  renderLiveExtraction(extraction);
  if (extraction?.needsInput) $('extractionStatus').dataset.confidence = 'insufficient';
}

function applySanitizedSubstanceToForm(substance) {
  if (!substance) return;
  const fieldMap = {
    topic: 'topicText', fact: 'factText', action: 'actionText', deadline: 'deadlineText', reason: 'reasonText', basis: 'basisText'
  };
  for (const [key, id] of Object.entries(fieldMap)) {
    const node = $(id);
    if (!node) continue;
    const normalized = String(substance[key] || '').trim();
    if (node.value.trim() !== normalized) { programmaticFieldUpdate = true; try { node.value = normalized; } finally { programmaticFieldUpdate = false; } }
  }
  syncPresetControlsFromSubstance(substance, selectedPresetScenarioId || '');
}

function renderExtractionStatus(extraction, engineLabel, result = null) {
  const target = $('extractionStatus');
  if (!target) return;
  const normalizedLabels = { topic: '工作主題', fact: '客觀事實', action: '要求行動', deadline: '期限', reason: '原因／影響', basis: '職務依據' };
  const normalizedFields = (result?.normalizedFieldChanges || []).map(key => normalizedLabels[key] || key);
  const normalizedNote = normalizedFields.length ? `；已將「${normalizedFields.join('、')}」去除責罵／模糊語意並改成較客觀、可執行的內容` : '';
  if (!extraction) {
    target.textContent = `本次未啟用自動抽取；使用 ${engineLabel} 依目前欄位潤稿${normalizedNote}。`;
    target.dataset.confidence = 'manual';
    return;
  }
  const labels = { topic: '工作主題', fact: '客觀事實', action: '要求行動', deadline: '期限', reason: '原因／影響', basis: '職務依據' };
  const fields = (extraction.extractedFields || []).map(key => labels[key] || key);
  const audienceLabels = { coworker: '同事或部屬', supervisor: '主管', client: '案家、服務對象或家屬', student: '學生、家長或受訓者', public: '一般民眾或外部合作對象' };
  const audienceHint = extraction.audienceHint?.value ? `；對象線索：${audienceLabels[extraction.audienceHint.value] || extraction.audienceHint.label || extraction.audienceHint.value}` : '';
  target.dataset.confidence = extraction.confidence || 'unknown';
  const confidenceLabels = { high:'高', medium:'中', low:'低', insufficient:'資訊不足' };
  target.textContent = extraction.needsInput
    ? `${engineLabel}：原始訊息沒有足夠的可執行工作內容，未從辱罵或威脅自行捏造要求。請補充實際工作事項。${audienceHint}`
    : `${engineLabel}：已抽取${fields.length ? `「${fields.join('、')}」` : '工作意圖'}${audienceHint}；可信度：${confidenceLabels[extraction.confidence] || '未標示'}${normalizedNote}。抽取結果已準備好；你可以直接產生，或打開編輯區修正後再更新結果。`;
}

function renderFeedbackStats() {
  const target = $('feedbackStats');
  if (!target) return;
  const store = loadFeedbackStore();
  const entries = Object.values(store.terms || {});
  const active = activeFeedbackTerms();
  const totalVotes = entries.reduce((sum, item) => sum + Number(item.risk || 0) + Number(item.falsePositive || 0), 0);
  const top = active.slice(0, 4).map(item => `${item.display || item.key}（${Math.round(item.rate * 100)}%）`).join('、');
  target.replaceChildren();
  const stats = [
    ['已分析訊息', Number(store.totalAnalyses || 0)],
    ['回報詞／片段', entries.length],
    ['回報判定次數', totalVotes],
    ['目前啟用自訂權重', active.length]
  ];
  for (const [label, value] of stats) {
    const box = document.createElement('div');
    box.className = 'feedback-stat';
    const strong = document.createElement('strong'); strong.textContent = String(value);
    const span = document.createElement('span'); span.textContent = label;
    box.append(strong, span); target.appendChild(box);
  }
  if (top) {
    const box = document.createElement('div');
    box.className = 'feedback-stat';
    box.style.gridColumn = '1 / -1';
    const strong = document.createElement('strong'); strong.textContent = '目前權重較高';
    const span = document.createElement('span'); span.textContent = top;
    box.append(strong, span); target.appendChild(box);
  }
}

function feedbackStatus(message, error = false) {
  const node = $('feedbackStatus');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('error-message', Boolean(error));
}

function currentFeedbackTerm() {
  return cleanText($('feedbackTermInput')?.value || '');
}

function handleFeedbackVote(kind) {
  const term = currentFeedbackTerm();
  const category = $('feedbackCategorySelect')?.value || '其他';
  const result = addFeedbackTerm(term, kind, category);
  if (!result.ok) {
    feedbackStatus(result.message || '無法儲存回報。', true);
    return;
  }
  const stat = feedbackTermStats(result.entry);
  const label = kind === 'falsePositive' ? '誤判' : '不OK';
  feedbackStatus(`已在本機記錄「${result.entry.display}」為${label}。目前：不OK ${stat.risk} 次、誤判 ${stat.fp} 次、不妥率 ${Math.round(stat.rate * 100)}%。`);
  renderFeedbackStats();
}

function bringSelectedSourceToFeedback() {
  const source = $('sourceText');
  const input = $('feedbackTermInput');
  if (!source || !input) return;
  const start = Number.isInteger(source.selectionStart) ? source.selectionStart : 0;
  const end = Number.isInteger(source.selectionEnd) ? source.selectionEnd : 0;
  const selected = cleanText(source.value.slice(start, end));
  if (!selected) {
    feedbackStatus('請先在「原始訊息」中反白選取要回報的短詞或片段。', true);
    source.focus();
    return;
  }
  input.value = selected.slice(0, 120);
  input.focus();
  feedbackStatus('已帶入選取文字；請確認類型後標記為「不OK」或「誤判」。');
}

function exportFeedbackData() {
  const store = loadFeedbackStore();
  const payload = {
    format: 'respectful-message-guard-feedback-v2',
    exportedAt: new Date().toISOString(),
    ...store
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `message-risk-feedback-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedbackStatus(`已匯出 ${Object.keys(store.terms || {}).length} 個回報詞／片段的統計檔。`);
}

function mergeFeedbackPayload(payload) {
  if (!payload || typeof payload !== 'object' || typeof payload.terms !== 'object') throw new Error('檔案格式不正確');
  const store = loadFeedbackStore();
  let merged = 0;
  const sourceEntries = Object.entries(payload.terms).slice(0, 2000);
  for (const [rawKey, incoming] of sourceEntries) {
    const key = normalizeFeedbackTerm(rawKey || incoming?.display || '');
    if (!key || key.length < 2) continue;
    const current = store.terms[key] || { display: cleanText(incoming?.display || key).slice(0,120), risk: 0, falsePositive: 0, category: incoming?.category || '其他', lastSeen: '' };
    current.risk = Math.min(1000000, Number(current.risk || 0) + Math.max(0, Math.min(1000000, Number(incoming?.risk || 0))));
    current.falsePositive = Math.min(1000000, Number(current.falsePositive || 0) + Math.max(0, Math.min(1000000, Number(incoming?.falsePositive || 0))));
    current.category = cleanText(incoming?.category || current.category || '其他').slice(0,60);
    current.display = cleanText(incoming?.display || current.display || key).slice(0,120);
    current.lastSeen = new Date().toISOString();
    store.terms[key] = current;
    merged += 1;
  }
  store.totalAnalyses = Math.min(100000000, Number(store.totalAnalyses || 0) + Math.max(0, Math.min(100000000, Number(payload.totalAnalyses || 0))));
  saveFeedbackStore(store);
  return merged;
}

function importFeedbackFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    feedbackStatus('回報統計檔過大；請使用 5 MB 以下的 JSON。', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || ''));
      const merged = mergeFeedbackPayload(payload);
      feedbackStatus(`已合併 ${merged} 個回報詞／片段；權重會依累積「不OK／誤判」比例重新計算。`);
      renderFeedbackStats();
    } catch (error) {
      feedbackStatus(`匯入失敗：${error?.message || error}`, true);
    }
  };
  reader.onerror = () => feedbackStatus('無法讀取回報統計檔。', true);
  reader.readAsText(file, 'utf-8');
}

function renderResult(result) {
  lastAnalysisResult = result;
  if ($('reviewDirtyNotice')) $('reviewDirtyNotice').hidden = true;
  activeRewriteVariant = result.rewriteStyle || 'natural';
  $('emptyState').hidden = true;
  $('resultContent').hidden = false;
  $('safeText').value = result.safeText;
  $('safeText').placeholder = result.copyable ? '' : '目前沒有可直接複製的版本。請依上方提示補充或修正實質工作內容。';
  renderRewriteVariantControls(result);
  renderCoverage(result.rewriteCoverage || {});

  $('riskBadge').className = `risk-badge ${result.level}`;
  $('riskBadge').textContent = result.level === 'high' ? `高風險提示｜${result.severeFindingCount || 0} 項需優先看` : result.level === 'medium' ? `需要調整｜${result.findings.length} 項提示` : `目前風險較低｜${result.findings.length} 項提醒`;
  $('riskBadge').title = `內部風險分數 ${result.score}／100；此分數只用於排序提醒，不是法律認定。`;

  $('corpusHitCount').textContent = result.corpusHitCount;
  $('privacyCount').textContent = result.privacyCount;
  $('workRiskCount').textContent = result.workRiskCount;
  $('blockedCount').textContent = result.blockedCount;

  $('outputSourceNotice').textContent = result.outputNotice;
  $('outputSourceNotice').className = result.copyable ? 'output-source-notice safe' : 'output-source-notice warning';

  $('copyButton').disabled = !result.copyable;
  if ($('regenerateButton')) $('regenerateButton').disabled = !result.copyable;
  $('copyStatus').textContent = '';

  findingPage = 1;
  renderFindingPage();
  renderFeedbackStats();
  $('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function findingMatchesFilter(finding, filter) {
  if (filter === 'all') return true;
  if (filter === 'severe') return finding.severity === 'severe';
  if (filter === 'info') return finding.severity === 'info';
  if (filter === 'context') return finding.severity === 'moderate' || Boolean(finding.contextSensitive) || /上下文|語境|專業/u.test(`${finding.contextLabel || ''}${finding.contextReason || ''}`);
  return true;
}
function buildFindingCard(finding) {
  const card=document.createElement('article'); card.className=`finding-card ${finding.severity==='severe'?'severe':finding.severity==='info'?'info':''}`;
  const top=document.createElement('div'); top.className='finding-top'; const titleWrap=document.createElement('div');
  const title=document.createElement('div'); title.className='finding-title'; title.textContent=finding.title; const meta=document.createElement('div'); meta.className='finding-meta'; meta.textContent=`${finding.source}｜${finding.corpusId}`; titleWrap.append(title,meta);
  const severity=document.createElement('span'); severity.className='severity-label'; severity.textContent=finding.severity==='severe'?'較高風險':finding.severity==='info'?'提醒':'需看情境'; top.append(titleWrap,severity);
  const quote=document.createElement('div'); quote.className='finding-fragment'; quote.textContent=finding.fragment;
  const context=document.createElement('div'); context.className=`context-interpretation ${finding.severity||'moderate'}`; const ct=document.createElement('strong'); ct.textContent=`目前上下文：${finding.contextLabel||'需人工判斷'}`; const cx=document.createElement('span'); cx.textContent=finding.contextReason||'請結合對象、目的、權勢關係與前後文判斷。'; context.append(ct,cx);
  const reason=document.createElement('p'); reason.textContent=finding.reason; const safer=document.createElement('p'); safer.className='safe-action'; safer.textContent=`較安全處理：${finding.safeAction}`; card.append(top,quote,context,reason,safer);
  if (finding.matchedExample || finding.legalNotes?.length || finding.sourceNotes?.length) {
    const evidence=document.createElement('details'); evidence.className='finding-evidence-details'; const summary=document.createElement('summary'); summary.textContent='查看法制、語料與相似案例依據'; evidence.appendChild(summary);
    if (finding.matchedExample) { const p=document.createElement('p'); p.className='matched-example-text'; p.textContent=`相似離線案例（${finding.expertSimilarity||0}%）：${finding.matchedExample}`; evidence.appendChild(p); }
    if (finding.legalNotes?.length) { const box=document.createElement('div'); box.className='legal-note-list'; for (const legal of finding.legalNotes) { const p=document.createElement('p'); p.className='legal-note'; p.textContent=`法制提示｜${legal.label}：${legal.note}`; box.appendChild(p); } evidence.appendChild(box); }
    if (finding.sourceNotes?.length) { const box=document.createElement('div'); box.className='evidence-source-list'; const head=document.createElement('div'); head.className='evidence-source-title'; head.textContent='語料／判讀依據'; box.appendChild(head); for (const source of finding.sourceNotes) { const row=document.createElement('p'); row.className='evidence-source'; if (source.url) { const a=document.createElement('a'); a.href=source.url; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=`${source.kind}｜${source.label}`; row.appendChild(a); } else row.textContent=`${source.kind}｜${source.label}`; box.appendChild(row); } evidence.appendChild(box); }
    card.appendChild(evidence);
  }
  return card;
}
function renderFindingPage() {
  const result=lastAnalysisResult, list=$('findingList'); if(!result||!list)return;
  const filtered=result.findings.filter(item=>findingMatchesFilter(item,findingFilter)); const pages=Math.max(1,Math.ceil(filtered.length/FINDING_PAGE_SIZE)); findingPage=Math.min(Math.max(1,findingPage),pages);
  const start=(findingPage-1)*FINDING_PAGE_SIZE, current=filtered.slice(start,start+FINDING_PAGE_SIZE), fragment=document.createDocumentFragment(); current.forEach(f=>fragment.appendChild(buildFindingCard(f)));
  if(!current.length){const empty=document.createElement('div');empty.className='empty-finding-filter';empty.textContent='這個分類目前沒有項目。';fragment.appendChild(empty);} list.replaceChildren(fragment);
  if($('findingResultCount')) {
    const severeCount=result.findings.filter(x=>x.severity==='severe').length;
    const contextCount=result.findings.filter(x=>x.severity==='moderate').length;
    const infoCount=result.findings.filter(x=>x.severity==='info').length;
    $('findingResultCount').textContent=findingFilter==='all'
      ? `共 ${filtered.length} 項｜較高風險 ${severeCount}｜需看情境 ${contextCount}｜提醒 ${infoCount}`
      : `${filtered.length} 項｜每頁 ${FINDING_PAGE_SIZE} 項`;
  }
  if($('findingPageLabel'))$('findingPageLabel').textContent=`第 ${findingPage} / ${pages} 頁`;
  if($('findingPrevButton'))$('findingPrevButton').disabled=findingPage<=1;
  if($('findingNextButton'))$('findingNextButton').disabled=findingPage>=pages;
}

function renderRewriteVariantControls(result) {
  const labels = { natural: '自然工作訊息', concise: '精簡直接', formal: '正式書面' };
  for (const style of Object.keys(labels)) {
    const button = $(`variant${style[0].toUpperCase()}${style.slice(1)}Button`);
    if (!button) continue;
    const available = Boolean(result.copyable && result.rewriteVariants && result.rewriteVariants[style]);
    button.disabled = !available;
    button.classList.toggle('active', style === activeRewriteVariant && available);
    button.setAttribute('aria-pressed', style === activeRewriteVariant && available ? 'true' : 'false');
  }
  if ($('variantHint')) {
    $('variantHint').textContent = result.copyable
      ? '三種版本都來自同一份原始訊息；若你修正過抽取內容，會以修正後的工作重點重新生成。'
      : '工作內容尚未通過檢核，因此不提供可複製版本。';
  }
}

function renderCoverage(coverage = {}) {
  const target = $('coverageList');
  if (!target) return;
  const labels = {
    topic: '主題', fact: '客觀事實', action: '要求行動', deadline: '期限', reason: '原因／影響', basis: '職務依據'
  };
  const fragment = document.createDocumentFragment();
  for (const [key, label] of Object.entries(labels)) {
    const status = coverage[key];
    if (status === null || typeof status === 'undefined') continue;
    const chip = document.createElement('span');
    chip.className = `coverage-chip ${status ? 'ok' : 'check'}`;
    chip.textContent = status ? `${label}：已保留` : `${label}：請人工確認`;
    fragment.appendChild(chip);
  }
  if (!fragment.childNodes.length) {
    const chip = document.createElement('span');
    chip.className = 'coverage-chip neutral';
    chip.textContent = '尚無可檢核的實質內容';
    fragment.appendChild(chip);
  }
  target.replaceChildren(fragment);
}

function switchRewriteVariant(style) {
  if (!lastAnalysisResult || !lastAnalysisResult.copyable) return;
  const text = lastAnalysisResult.rewriteVariants?.[style];
  if (!text) return;
  activeRewriteVariant = style;
  $('safeText').value = text;
  $('rewriteStyleSelect').value = style;
  const coverage = lastAnalysisResult.rewriteVariantCoverage?.[style] || lastAnalysisResult.rewriteCoverage || {};
  renderCoverage(coverage);
  renderRewriteVariantControls(lastAnalysisResult);
  $('copyStatus').textContent = '';
}

function renderSourceCatalog() {
  const target = $('sourceCatalogList');
  const count = $('sourceCatalogCount');
  if (!target || !count) return;

  const entries = Object.entries(SOURCE_CATALOG);
  count.textContent = String(entries.length);
  const fragment = document.createDocumentFragment();
  for (const [id, source] of entries) {
    const card = document.createElement('article');
    card.className = 'source-catalog-card';

    const meta = document.createElement('div');
    meta.className = 'source-catalog-meta';
    meta.textContent = `${source.kind || '來源'}｜${id}`;

    const title = document.createElement('h3');
    title.textContent = source.label || id;

    const note = document.createElement('p');
    note.textContent = source.note || '';

    card.append(meta, title, note);
    if (source.url) {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '開啟來源查證';
      card.appendChild(link);
    }
    fragment.appendChild(card);
  }
  target.replaceChildren(fragment);
}


function createRandomSeed() {
  try {
    if (globalThis.crypto?.getRandomValues) {
      const values = new Uint32Array(4);
      globalThis.crypto.getRandomValues(values);
      return [...values].map(v => v.toString(16)).join('-');
    }
  } catch (_) {}
  return `${Date.now()}-${Math.random()}-${Math.random()}`;
}

function uniqueStrings(values) {
  return [...new Set((values || []).map(v => String(v || '').trim()).filter(Boolean))];
}

function scenarioById(id) {
  return (SAFE_MESSAGE_CORPUS.scenarios || []).find(sc => sc.id === id) || null;
}

function scenariosForTopic(topic) {
  const value = String(topic || '').trim();
  if (!value) return [];
  return (SAFE_MESSAGE_CORPUS.scenarios || []).filter(sc => {
    const scTopic = String(sc.topic || '').trim();
    return scTopic === value || scTopic.includes(value) || value.includes(scTopic) || (sc.keywords || []).some(k => value.includes(k) || String(k).includes(value));
  }).slice(0, 10);
}

function resetSelect(select, placeholder) {
  if (!select) return;
  select.replaceChildren();
  const option = document.createElement('option');
  option.value = '';
  option.textContent = placeholder;
  select.appendChild(option);
  select.value = '';
  select.classList.remove('has-value');
}

function appendPresetOptions(select, records) {
  if (!select) return;
  for (const record of records) {
    const option = document.createElement('option');
    option.value = record.value;
    option.textContent = record.label || record.value;
    if (record.scenarioId) option.dataset.scenarioId = record.scenarioId;
    select.appendChild(option);
  }
}

function initializeSmartFields() {
  const select = $('topicPresetSelect');
  if (!select) return;
  resetSelect(select, '常用選項：先選工作主題');
  const priority = ['排班', '核銷與請款', '文件校對', '問題或錯誤提前回報', '工作進度', '工作時程', '報告', '簡報', '附件', '會議紀錄', '工作交接', '工作錯誤與改善', '工作表現回饋', '團隊溝通', '客訴處理', '外部合作進度', '研究工作與資料品質', '醫療或照護紀錄'];
  const byTopic = new Map();
  for (const scenario of SAFE_MESSAGE_CORPUS.scenarios || []) {
    const topic = String(scenario.topic || '').trim();
    if (!topic || byTopic.has(topic)) continue;
    byTopic.set(topic, scenario);
  }
  const topics = [...byTopic.keys()].sort((a, b) => {
    const ai = priority.indexOf(a), bi = priority.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.localeCompare(b, 'zh-Hant');
  });
  appendPresetOptions(select, topics.map(topic => {
    const scenario = byTopic.get(topic);
    return { value: topic, label: `${topic}｜${scenario.category}`, scenarioId: scenario.id };
  }));
  refreshDetailPresets('');
}

function presetRecordsFor(scenarios, key) {
  const records = [];
  const seen = new Set();
  for (const sc of scenarios) {
    for (const value of (sc[key] || [])) {
      const text = String(value || '').trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      records.push({ value: text, label: text, scenarioId: sc.id });
    }
  }
  return records;
}

function refreshDetailPresets(preferScenarioId = '', preserveKind = '') {
  const topic = $('topicText')?.value || '';
  let scenarios = scenariosForTopic(topic);
  const preferred = scenarioById(preferScenarioId || selectedPresetScenarioId);
  if (preferred && !scenarios.some(s => s.id === preferred.id)) scenarios = [preferred, ...scenarios];
  if (preferred) scenarios = [preferred, ...scenarios.filter(s => s.id !== preferred.id)];
  const configs = [
    ['fact', 'factPresetSelect', 'facts', '常用選項：依工作主題提供目前狀況'],
    ['action', 'actionPresetSelect', 'actions', '常用選項：依工作主題提供下一步'],
    ['reason', 'reasonPresetSelect', 'reasons', '常用選項：依工作主題提供原因或影響']
  ];
  for (const [kind, id, key, placeholder] of configs) {
    const select = $(id);
    const keepValue = preserveKind === kind ? select?.value : '';
    resetSelect(select, scenarios.length ? placeholder : '請先選擇工作主題，或直接自行輸入');
    appendPresetOptions(select, presetRecordsFor(scenarios, key));
    if (keepValue && [...select.options].some(o => o.value === keepValue)) {
      select.value = keepValue;
      select.classList.add('has-value');
    }
  }
}

function handleTopicPresetChange(event) {
  const select = event.currentTarget;
  const value = select.value;
  select.classList.toggle('has-value', Boolean(value));
  if (!value) return;
  const option = select.options[select.selectedIndex];
  selectedPresetScenarioId = option?.dataset?.scenarioId || '';
  $('topicText').value = value;
  manualOverrideFields.add('topic'); setFieldOrigin('topic','manual',latestLiveExtraction?.evidence?.topic||'');
  const scenario = scenarioById(selectedPresetScenarioId);
  if (scenario?.purpose && $('purposeSelect')) $('purposeSelect').value = scenario.purpose;
  refreshDetailPresets(selectedPresetScenarioId);
  $('factPresetSelect')?.focus();
}

function handleDetailPresetChange(kind, event) {
  const select = event.currentTarget;
  const value = select.value;
  select.classList.toggle('has-value', Boolean(value));
  if (!value) return;
  const option = select.options[select.selectedIndex];
  selectedPresetScenarioId = option?.dataset?.scenarioId || selectedPresetScenarioId;
  const scenario = scenarioById(selectedPresetScenarioId);
  if (scenario?.purpose && $('purposeSelect')) $('purposeSelect').value = scenario.purpose;
  const targetMap = { fact: 'factText', action: 'actionText', reason: 'reasonText' };
  const target = $(targetMap[kind]);
  if (target) target.value = value;
  manualOverrideFields.add(kind); setFieldOrigin(kind,'manual',latestLiveExtraction?.evidence?.[kind]||'');
  refreshDetailPresets(selectedPresetScenarioId, kind);
}

function setSelectIfOptionExists(select, value) {
  if (!select || !value) return false;
  const found = [...select.options].find(o => o.value === value);
  if (!found) return false;
  select.value = value;
  select.classList.add('has-value');
  return true;
}

function syncPresetControlsFromSubstance(substance = {}, scenarioId = '') {
  if (scenarioId) selectedPresetScenarioId = scenarioId;
  const topic = String(substance.topic || '').trim();
  if (topic) setSelectIfOptionExists($('topicPresetSelect'), topic);
  refreshDetailPresets(scenarioId || selectedPresetScenarioId);
  setSelectIfOptionExists($('factPresetSelect'), String(substance.fact || '').trim());
  setSelectIfOptionExists($('actionPresetSelect'), String(substance.action || '').trim());
  setSelectIfOptionExists($('reasonPresetSelect'), String(substance.reason || '').trim());
}

function resetPresetControls() {
  selectedPresetScenarioId = '';
  if (!$('topicPresetSelect')) return;
  $('topicPresetSelect').value = '';
  $('topicPresetSelect').classList.remove('has-value');
  refreshDetailPresets('');
}

function voiceBiasTerms(targetId) {
  const common = ['排班','班表','核銷','請款','報帳','發票','收據','憑證','校對','核對','班次','輪班','值班','回報','風險','錯誤','異常','不確定','交接','附件','版本','上傳','報告','簡報','進度','時程','會議紀錄','客觀事實','申訴','病歷','資料','需求','修正','確認'];
  const topic = String($('topicText')?.value || '').trim();
  const scenarios = scenariosForTopic(topic);
  const preferred = scenarioById(selectedPresetScenarioId);
  const pool = preferred ? [preferred, ...scenarios.filter(s => s.id !== preferred.id)] : scenarios;
  const contextual = [];
  for (const sc of pool.slice(0, 4)) contextual.push(sc.topic, ...(sc.keywords || []), ...(sc.objects || []));
  if (targetId === 'topicText') contextual.push(...(SAFE_MESSAGE_CORPUS.scenarios || []).slice(0, 40).map(s => s.topic));
  return uniqueStrings([...contextual, ...common]).filter(x => x && x.length <= 18).slice(0, 70);
}

function chooseSpeechAlternative(result, targetId) {
  const terms = voiceBiasTerms(targetId);
  let best = null;
  for (let i = 0; i < result.length; i++) {
    const alt = result[i];
    const transcript = String(alt.transcript || '').trim();
    let score = Number(alt.confidence || 0) * 8;
    for (const term of terms) if (transcript.includes(term)) score += Math.min(5, 1.2 + term.length * .35);
    if (/[排班回報交接附件版本時程進度修正確認]/u.test(transcript)) score += 1.2;
    if (!best || score > best.score) best = { transcript, score };
  }
  return best?.transcript || String(result[0]?.transcript || '').trim();
}

function normalizeRecognizedText(text, targetId) {
  let value = String(text || '').trim();
  const topic = String($('topicText')?.value || '');
  const scheduleContext = /排班|班表|班次|輪班|值班/u.test(`${topic} ${value}`);
  if (scheduleContext) value = value.replace(/牌班|排行班|排板/g, '排班').replace(/班錶|班標/g, '班表');
  value = value.replace(/回抱/g, '回報').replace(/時成/g, '時程').replace(/進成/g, '進度');
  if (targetId !== 'sourceText') value = value.replace(/\s+/g, ' ');
  return value;
}

function insertVoiceText(target, text) {
  if (!target || !text) return;
  const start = Number.isInteger(target.selectionStart) ? target.selectionStart : target.value.length;
  const end = Number.isInteger(target.selectionEnd) ? target.selectionEnd : start;
  let insert = text;
  if (start > 0 && end === start) {
    const prev = target.value.slice(0, start);
    if (prev && !/[\s，。；：、！？!?]$/u.test(prev) && !/^[，。；：、！？!?]/u.test(insert)) insert = `，${insert}`;
  }
  if (typeof target.setRangeText === 'function') target.setRangeText(insert, start, end, 'end');
  else target.value += insert;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

function setVoiceStatus(text, state = '') {
  const status = $('voiceStatus');
  if (!status) return;
  status.textContent = text;
  status.className = `voice-status${state ? ` ${state}` : ''}`;
}

function stopVoiceInput(manual = true) {
  const session = activeVoiceSession;
  if (session) {
    session.manualStop = Boolean(manual);
    if (session.restartTimer) clearTimeout(session.restartTimer);
    session.restartTimer = null;
  }
  try { activeSpeechRecognition?.stop?.(); } catch (_) {
    try { activeSpeechRecognition?.abort?.(); } catch (_) {}
  }
  if (activeVoiceButton) setVoiceButtonState(activeVoiceButton, false);
  activeSpeechRecognition = null;
  activeVoiceButton = null;
  if (manual) activeVoiceSession = null;
}

function setVoiceButtonState(button, listening) {
  if (!button) return;
  button.classList.toggle('listening', Boolean(listening));
  if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent;
  button.textContent = listening ? '■ 停止語音' : button.dataset.defaultLabel;
  button.setAttribute('aria-pressed', listening ? 'true' : 'false');
}

function createBasicSpeechRecognition(Recognition, preferLocal = false) {
  const recognition = new Recognition();
  recognition.lang = 'zh-TW';
  // Newer Chromium builds may expose on-device recognition. Prefer it when the
  // zh-TW language pack is already installed; never auto-download a pack.
  if (preferLocal && 'processLocally' in recognition) {
    try { recognition.processLocally = true; } catch (_) {}
  }
  // Chromium may still end a recognition session after a silence/server-side
  // chunk even when continuous=true. onend below therefore auto-restarts until
  // the user explicitly presses 「停止語音」.
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;
  // Do NOT set SpeechRecognition.phrases. Some Chromium builds expose it but
  // reject it at runtime with phrases-not-supported. Returned alternatives are
  // reranked locally with work-context terms instead.
  return recognition;
}

function voiceErrorMessage(code) {
  return ({
    'not-allowed':'麥克風權限未開啟，請允許此網站使用麥克風。',
    'service-not-allowed':'瀏覽器目前不允許使用語音辨識服務，請檢查網站權限。',
    'audio-capture':'找不到可用麥克風，請確認麥克風已連接且未被其他程式占用。',
    'no-speech':'暫時沒有辨識到語音，會繼續聆聽。',
    'network':'瀏覽器的語音辨識服務目前無法連線，而且目前沒有可用的繁體中文裝置端語音模型。文字潤稿仍可完全離線使用。',
    'language-not-supported':'目前瀏覽器的語音服務不支援繁體中文（zh-TW）。',
    'phrases-not-supported':'瀏覽器不支援實驗性詞組偏置；本站未使用此功能。請重新整理頁面後再試。',
    'aborted':'語音辨識暫停。'
  })[code] || `語音辨識失敗：${code || '未知原因'}`;
}

function appendSpeechFinal(session, rawText) {
  const normalized = normalizeRecognizedText(rawText, session.targetId);
  if (!normalized) return;
  // Browsers occasionally replay the last final segment after an automatic
  // restart. Drop only an immediate exact duplicate, not ordinary repetitions.
  const now = Date.now();
  if (session.lastFinal === normalized && now - session.lastFinalAt < 2400) return;
  session.lastFinal = normalized;
  session.lastFinalAt = now;
  insertVoiceText(session.target, normalized);
  session.committed = true;
  if (session.targetId === 'sourceText') updateCharCount();
  if (session.targetId === 'topicText') refreshDetailPresets(selectedPresetScenarioId);
  setVoiceStatus(`已輸入：${normalized}｜仍在持續聆聽，按「停止語音」才結束。`, 'success active');
}

function startVoiceRecognitionCycle(session, delay = 0) {
  if (!session || session.manualStop || activeVoiceSession !== session) return;
  if (session.restartTimer) clearTimeout(session.restartTimer);
  session.restartTimer = setTimeout(() => {
    if (session.manualStop || activeVoiceSession !== session) return;
    const recognition = createBasicSpeechRecognition(session.Recognition, session.preferLocal);
    activeSpeechRecognition = recognition;
    session.recognition = recognition;

    recognition.onresult = event => {
      let finalText = '', interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const picked = chooseSpeechAlternative(result, session.targetId);
        if (result.isFinal) finalText += picked; else interimText += picked;
      }
      if (interimText) setVoiceStatus(`辨識中：${interimText}｜持續聆聽中`, 'active');
      if (finalText) appendSpeechFinal(session, finalText);
    };

    recognition.onerror = event => {
      const code = event.error || '';
      session.lastError = code;
      const fatal = ['not-allowed','service-not-allowed','audio-capture','network','language-not-supported','phrases-not-supported'].includes(code);
      if (fatal) {
        session.manualStop = true;
        setVoiceStatus(voiceErrorMessage(code), 'error');
      } else if (code === 'no-speech') {
        setVoiceStatus('暫時沒有收到語音，正在繼續聆聽…', 'active');
      }
    };

    recognition.onend = () => {
      if (activeVoiceSession !== session) return;
      activeSpeechRecognition = null;
      if (session.manualStop) {
        setVoiceButtonState(session.button, false);
        activeVoiceButton = null;
        activeVoiceSession = null;
        return;
      }
      // Web Speech implementations often cut a session on their own. Treat the
      // end as a chunk boundary and immediately reopen the microphone.
      setVoiceButtonState(session.button, true);
      setVoiceStatus('瀏覽器已自動切段，正在續聽…按「停止語音」才會真正結束。', 'active');
      startVoiceRecognitionCycle(session, 180);
    };

    try {
      recognition.start();
      setVoiceButtonState(session.button, true);
      setVoiceStatus(session.preferLocal
        ? '裝置端離線語音辨識中…只有按「停止語音」才結束；瀏覽器若自行切段會自動續聽。'
        : '持續聆聽繁體中文中…只有按「停止語音」才結束；瀏覽器若自行切段會自動續聽。', 'active');
      session.target.focus();
    } catch (error) {
      // Starting too soon after a browser-forced end can throw InvalidStateError.
      // Retry briefly instead of making the user press the button again.
      if (!session.manualStop && activeVoiceSession === session) {
        setVoiceStatus('語音服務正在重新啟動…', 'active');
        startVoiceRecognitionCycle(session, 420);
      } else {
        setVoiceStatus(`無法啟動語音辨識：${error?.message || error}`, 'error');
      }
    }
  }, delay);
}

async function detectOnDeviceSpeechAvailability(Recognition) {
  // `available({processLocally:true})` is still experimental. Use it only as an
  // optional capability probe and do not make voice input depend on it.
  if (typeof Recognition?.available !== 'function') return { supported: false, available: false, state: 'unsupported' };
  try {
    const state = await Recognition.available({ langs: ['zh-TW'], processLocally: true });
    return { supported: true, available: state === 'available', state };
  } catch (_) {
    return { supported: false, available: false, state: 'error' };
  }
}

async function startVoiceInput(button) {
  const targetId = button?.dataset?.voiceTarget;
  const target = targetId ? $(targetId) : null;
  if (!target) return;
  const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!Recognition) {
    setVoiceStatus('目前瀏覽器不支援網頁語音辨識；可使用作業系統本機聽寫。', 'error');
    target.focus();
    return;
  }

  if (activeVoiceSession && activeVoiceButton === button) {
    stopVoiceInput(true);
    setVoiceStatus('已依你的操作停止語音輸入。');
    return;
  }
  if (activeVoiceSession) stopVoiceInput(true);

  const localProbe = await detectOnDeviceSpeechAvailability(Recognition);
  const session = {
    Recognition, targetId, target, button,
    manualStop: false, committed: false,
    lastFinal: '', lastFinalAt: 0,
    restartTimer: null, recognition: null, lastError: '',
    preferLocal: Boolean(localProbe.available), localProbeState: localProbe.state
  };
  if (localProbe.supported && !localProbe.available) {
    const msg = localProbe.state === 'downloadable' || localProbe.state === 'downloading'
      ? '瀏覽器支援裝置端辨識，但繁體中文離線語言包尚未安裝；目前改用瀏覽器既有語音服務。'
      : '此瀏覽器目前沒有可用的繁體中文裝置端語音模型；目前改用瀏覽器既有語音服務。';
    setVoiceStatus(msg, 'active');
  }
  activeVoiceSession = session;
  activeVoiceButton = button;
  setVoiceButtonState(button, true);
  startVoiceRecognitionCycle(session, 0);
}

function initializeVoiceInput() {
  const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!Recognition) {
    document.querySelectorAll('[data-voice-target]').forEach(button => {
      button.disabled = true;
      button.title = '目前瀏覽器不支援網頁語音辨識';
    });
  }
}

function initialize() {
  renderLegalReferences();
  renderSourceCatalog();
  bindEvents();
  updateCharCount();
  renderCorpusStats();
  renderFeedbackStats();
  initializeSmartFields();
  initializeVoiceInput();
  initializeRewriteBridge();
  for(const key of ['topic','fact','action','deadline','reason']) setFieldOrigin(key,'neutral',''); setFieldOrigin('basis','manual',''); renderLiveExtraction(null);

  // 產品主流程直接可用；使用說明改為按需開啟，不再阻擋工作。
  enterApplication(false);
}

function initializeRewriteBridge() {
  const status = $('engineStatus');
  if (!ENGINE_BRIDGE) {
    if (status) status.textContent = '本機混合語言模型';
    return;
  }
  ENGINE_BRIDGE.initialize({
    onStatus(info) {
      if (!status) return;
      status.textContent = info.detail || info.state || '本機混合語言模型';
      status.classList.toggle('engine-ready', info.state === 'ready');
    }
  }).catch(() => {
    if (status) status.textContent = '本機混合語言模型';
  });
}

function bindEvents() {
  $('enterAppButton').addEventListener('click', () => enterApplication(true));
  $('showIntroButton').addEventListener('click', showIntro);
  $('showPrivacyButton').addEventListener('click', () => $('privacyDialog').showModal());
  $('closePrivacyButton').addEventListener('click', () => $('privacyDialog').close());
  $('privacyDialog').addEventListener('click', event => {
    if (event.target === $('privacyDialog')) $('privacyDialog').close();
  });

  $('feedbackSelectionButton')?.addEventListener('click', bringSelectedSourceToFeedback);
  $('feedbackRiskButton')?.addEventListener('click', () => handleFeedbackVote('risk'));
  $('feedbackFalsePositiveButton')?.addEventListener('click', () => handleFeedbackVote('falsePositive'));
  $('exportFeedbackButton')?.addEventListener('click', exportFeedbackData);
  $('importFeedbackButton')?.addEventListener('click', () => $('feedbackImportFile')?.click());
  $('feedbackImportFile')?.addEventListener('change', event => {
    const file = event.target?.files?.[0];
    importFeedbackFile(file);
    if (event.target) event.target.value = '';
  });

  $('sourceText').addEventListener('input', () => { updateCharCount(); scheduleLiveExtraction(); });
  $('sourceText').addEventListener('paste', handlePasteInspection);
  $('loadExampleButton').addEventListener('click', loadExample);
  $('analyzeButton').addEventListener('click', handleAnalyze);
  $('applyReviewButton')?.addEventListener('click', handleAnalyze);
  $('reviewExtractionButton')?.addEventListener('click', () => openExtractionEditor(true));
  $('editExtractionFromResultButton')?.addEventListener('click', () => openExtractionEditor(true));
  $('clearButton').addEventListener('click', clearAll);
  $('copyButton').addEventListener('click', () => copyText($('safeText').value, '已複製建議版本。'));
  $('regenerateButton')?.addEventListener('click', handleAnalyze);
  $('topicPresetSelect')?.addEventListener('change', handleTopicPresetChange);
  $('factPresetSelect')?.addEventListener('change', event => handleDetailPresetChange('fact', event));
  $('actionPresetSelect')?.addEventListener('change', event => handleDetailPresetChange('action', event));
  $('reasonPresetSelect')?.addEventListener('change', event => handleDetailPresetChange('reason', event));
  $('topicText')?.addEventListener('change', () => refreshDetailPresets(selectedPresetScenarioId));
  for (const [key,id] of Object.entries(STRUCTURED_FIELD_IDS)) { const node=$(id); if(node) node.addEventListener('input',()=>{ if(!programmaticFieldUpdate) markFieldManual(key); if(key==='topic') refreshDetailPresets(selectedPresetScenarioId); }); }
  document.querySelectorAll('[data-reset-auto]').forEach(button=>button.addEventListener('click',()=>resetFieldToAuto(button.dataset.resetAuto)));
  $('reextractButton')?.addEventListener('click',()=>refreshLiveExtraction());
  $('resetAutoExtractionButton')?.addEventListener('click',()=>refreshLiveExtraction({overwriteManual:true}));
  $('jumpToStructuredButton')?.addEventListener('click',()=>openExtractionEditor(true));
  $('findingFilterSelect')?.addEventListener('change',event=>{findingFilter=event.target.value||'all';findingPage=1;renderFindingPage();});
  $('findingPrevButton')?.addEventListener('click',()=>{findingPage=Math.max(1,findingPage-1);renderFindingPage();});
  $('findingNextButton')?.addEventListener('click',()=>{findingPage+=1;renderFindingPage();});
  document.querySelectorAll('[data-voice-target]').forEach(button => {
    button.addEventListener('click', () => startVoiceInput(button));
  });
  for (const style of ['Natural', 'Concise', 'Formal']) {
    const button = $(`variant${style}Button`);
    if (button) button.addEventListener('click', () => switchRewriteVariant(style.toLowerCase()));
  }
}

function renderCorpusStats() {
  const transition = REWRITE_ENGINE.transitionModel || {};
  const text = `${PHRASE_ENTRIES.length} 筆高風險詞彙（含 ${Number(CORPUS.generatedPhraseCount || 0)} 筆生成變體）＋${EXPERT_ENTRIES.length} 筆完整案例＋${PATTERN_ENTRIES.length} 組語句結構＋${CONTEXT_ENTRIES.length} 組工作內容規則；安全生成庫另含 ${Number(SAFE_MESSAGE_CORPUS.scenarioCount || 0)} 種情境與 ${Number(SAFE_MESSAGE_CORPUS.exampleCount || 0)} 筆三風格例句；接龍模型使用 ${Number(transition.safeBigrams || 0)} 組安全二連詞與 ${Number(transition.safeTrigrams || 0)} 組安全三連詞`;
  if ($('corpusStats')) $('corpusStats').textContent = text;
  if ($('corpusVersion')) $('corpusVersion').textContent = CORPUS.version;
  if ($('privacyCorpusStats')) $('privacyCorpusStats').textContent = text;
}

function enterApplication(saveSessionPreference) {
  if (saveSessionPreference && $('hideIntroSession').checked) {
    safeSessionSet(INTRO_SESSION_KEY, '1');
  }
  $('introScreen').hidden = true;
  $('appShell').hidden = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
  $('sourceText').focus();
}

function showIntro() {
  $('appShell').hidden = true;
  $('introScreen').hidden = false;
  $('hideIntroSession').checked = safeSessionGet(INTRO_SESSION_KEY) === '1';
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function updateCharCount() {
  $('charCount').textContent = `${$('sourceText').value.length} / 8000`;
}

function handlePasteInspection(event) {
  const items = [...(event.clipboardData?.items || [])];
  if (items.some(item => item.type.startsWith('image/'))) {
    clipboardImageDetected = true;
    $('pasteNotice').hidden = false;
  }
}

function loadExample() {
  $('audienceSelect').value = 'coworker';
  $('purposeSelect').value = 'correct';
  $('toneSelect').value = 'directive';
  $('rewriteStyleSelect').value = 'natural';
  $('includeBasisOption').checked = false;
  $('sourceText').value = '你到底有沒有腦？附件二又少了，版本日期也跟昨天會議講的不一樣。今天下午 5 時前給我補齊、上傳正確版本，不然你就不用來了。';
  $('topicText').value = '';
  $('factText').value = '';
  $('actionText').value = '';
  $('deadlineText').value = '';
  $('reasonText').value = '';
  $('basisText').value = '';
  resetPresetControls();
  if ($('extractionStatus')) $('extractionStatus').textContent = '示例已載入；按下檢核後會自動抽取工作意圖。';
  updateCharCount();
  refreshLiveExtraction({ overwriteManual: true });
  $('sourceText').focus();
}

function clearAll() {
  manualOverrideFields.clear();
  for (const key of Object.keys(autoFieldValues)) delete autoFieldValues[key];
  latestLiveExtraction=null; findingPage=1; findingFilter='all';
  stopVoiceInput();
  for (const id of ['sourceText', 'topicText', 'factText', 'actionText', 'deadlineText', 'reasonText', 'basisText', 'safeText']) {
    $(id).value = '';
  }
  $('resultContent').hidden = true;
  $('emptyState').hidden = false;
  $('riskBadge').className = 'risk-badge neutral';
  $('riskBadge').textContent = '尚未檢核';
  $('findingList').innerHTML = '';
  $('copyStatus').textContent = '';
  $('inputError').hidden = true;
  $('copyButton').disabled = false;
  if ($('regenerateButton')) $('regenerateButton').disabled = false;
  $('rewriteStyleSelect').value = 'natural';
  $('includeBasisOption').checked = false;
  if ($('extractionStatus')) { $('extractionStatus').textContent = '尚未抽取。'; $('extractionStatus').dataset.confidence = ''; }
  renderLiveExtraction(null); for(const key of ['topic','fact','action','deadline','reason'])setFieldOrigin(key,'neutral',''); setFieldOrigin('basis','manual',''); if($('findingFilterSelect'))$('findingFilterSelect').value='all';
  resetPresetControls();
  if ($('extractionEditor')) $('extractionEditor').open = false;
  if ($('reviewDirtyNotice')) $('reviewDirtyNotice').hidden = true;
  clipboardImageDetected = false;
  $('pasteNotice').hidden = true;
  updateCharCount();
  $('sourceText').focus();
}

async function copyText(text, successMessage) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    $('copyStatus').textContent = successMessage;
  } catch (error) {
    $('safeText').focus();
    $('safeText').select();
    const copied = document.execCommand('copy');
    $('copyStatus').textContent = copied ? successMessage : '瀏覽器未允許自動複製，請手動選取文字。';
  }
}

function renderLegalReferences() {
  const fragment = document.createDocumentFragment();
  for (const item of LEGAL_REFERENCES) {
    const card = document.createElement('article');
    card.className = 'reference-card';

    const title = document.createElement('h3');
    title.textContent = item.title;
    const body = document.createElement('p');
    body.textContent = item.body;
    const link = document.createElement('a');
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.link;

    card.append(title, body, link);
    fragment.appendChild(card);
  }
  $('legalReferenceGrid').replaceChildren(fragment);
}

if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', initialize);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    analyzeMessage,
    scanCorpus,
    scanExpertCorpus,
    scanPii,
    scanWorkContext,
    sanitizeOutputField,
    sanitizeSubstance,
    neutralizeTopicSemantics,
    neutralizeFactSemantics,
    neutralizeActionSemantics,
    semanticRepairStructuredSubstance,
    reconcileStructuredMeaning,
    composeSafeMessage,
    cleanText,
    normalizeText,
    REWRITE_ENGINE,
    INTENT_ENGINE,
    CORPUS,
    EXPERT_CORPUS
  };
}
