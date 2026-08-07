'use strict';

/*
 * Structured Chinese rewrite engine
 * ---------------------------------
 * Purpose: turn user-supplied structured work facts into natural Traditional
 * Chinese without using the raw/original message as generation material.
 *
 * Design constraints:
 * - deterministic and fully local;
 * - no network / no external model;
 * - never invent facts, legal conclusions, sanctions, dates, people or motives;
 * - basis/職務依據 is an internal safety field by default and is not exposed
 *   unless the user explicitly enables includeBasis;
 * - generate several candidates, score them for formulaic/repetitive wording,
 *   and keep the best candidate.
 */

(function initRewriteEngine(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MESSAGE_REWRITE_ENGINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  const END_PUNCT = /[。！？!?]$/u;

  const GENERIC_FORMULAIC = [
    '說明如下', '上述事項', '相關原因、影響或程序', '工作必要性或職務依據',
    '依既定規範、權限及正式程序辦理', '如有客觀困難', '請具體說明，以便協調後續處理'
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
    const followUp = actionCore.match(/^後續(?:再)?\s*(.+)$/u);
    const thirdParty = /^(?:由|改由|交由|轉由|透過|經由)/u.test(actionCore);

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
        if (/^(?:需|須|應|為|以利|以便|以避免|以確保|以供|為配合|作為)/u.test(one)) return sentence(one);
        return sentence(`此安排主要考量${one}`);
      }
      return sentence(rendered.join('，並'));
    }

    const rendered = clauses.map((c, i) => naturalReasonClause(c, i)).filter(Boolean);
    if (!rendered.length) return '';
    const text = rendered.join('，');
    if (/^(?:明|今|本|下週|後續|目前|需要|需|須|應)/u.test(text)) return sentence(text);
    if (/^(?:避免|確保|方便|供|配合|為了|以利|以便)/u.test(text)) return sentence(`這樣可以${text}`);
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
    if (style === 'concise') return f ? `針對${t}，` : `針對${t}。`;
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
    const lead = topicLead(topic, fact, purpose, audience, style);
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

    const lead = topicLead(topic, fact, purpose, audience, style);
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
      .replace(/麻煩請/g, '麻煩')
      .replace(/再麻煩您您/g, '再麻煩您')
      .replace(/前前/u, '前')
      .replace(/您好，您好，/g, '您好，');

    // 如果服務對象版本沒有任何問候，補一個最短問候即可；不在同事訊息強塞稱謂。
    if ((audience === 'client' || audience === 'student' || audience === 'public') && style !== 'formal' && value && !value.startsWith('您好')) {
      value = `您好，${value}`;
    }
    return value;
  }

  function splitSentences(text) {
    return normalize(text).split(/(?<=[。！？!?])/u).map(x => x.trim()).filter(Boolean);
  }

  function scoreCandidate(text, style) {
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
    if (/說明如下[。；：]/u.test(text)) score -= 20;
    if (/(?:需要要|請請|麻煩請|您您|也版本|也日期|也附件|也資料)/u.test(text)) score -= 35;
    if (/工作必要性|職務依據[:：]/u.test(text)) score -= 15;
    if (/相關原因|相關程序/u.test(text)) score -= 12;
    if (/。請[^。]+。請/u.test(text)) score -= 8;
    if (/，[，。]|。[,，]/u.test(text)) score -= 15;

    // 自然版若完全沒有「關於／上述／說明如下」等公文套語，給小幅獎勵。
    if (style === 'natural' && !/(?:上述|說明如下|茲|爰|依既定)/u.test(text)) score += 6;
    if (style === 'concise' && sentences.length <= 3) score += 5;
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

  function bestOf(candidates, style) {
    const scored = [...new Set(candidates.filter(Boolean))]
      .map(text => ({ text, score: scoreCandidate(text, style) }))
      .sort((a, b) => b.score - a.score || a.text.length - b.text.length);
    return scored[0] || { text: '', score: -9999 };
  }

  function rewriteStructuredMessage(substance, options = {}) {
    const style = options.rewriteStyle || 'natural';
    const corePresent = [substance.topic, substance.fact, substance.action, substance.deadline, substance.reason]
      .some(v => normalize(v));
    if (!corePresent) {
      return {
        text: '', copyable: false,
        notice: '原始訊息只用於風險檢核，不會被拿來補寫或組成建議版本。請至少填寫工作主題、客觀事實或希望對方完成的行動。',
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
      const candidates = [plannerCandidate(substance, options, targetStyle), ...layouts.map(layout => buildCandidate(substance, options, targetStyle, layout))];
      const best = bestOf(candidates, targetStyle);
      variants[targetStyle] = best.text;
      quality[targetStyle] = best.score;
    }

    const selected = variants[style] || variants.natural || '';
    const styleLabel = style === 'formal' ? '正式書面' : style === 'concise' ? '精簡直接' : '自然工作訊息';
    return {
      text: selected,
      copyable: Boolean(selected),
      notice: options.includeBasis
        ? `已使用「${styleLabel}」潤稿；只讀取實質工作內容，職務依據依你的設定納入文字，原始訊息不會進入輸出。`
        : `已使用「${styleLabel}」潤稿；只讀取實質工作內容。職務依據預設只供合理性檢核，不會自動寫進訊息，原始訊息也不會進入輸出。`,
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
    buildCandidate,
    scoreCandidate,
    naturalize,
    formalize,
    normalize,
    plannerCandidate,
    coverageReport
  };
});
