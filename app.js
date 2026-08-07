'use strict';

const INTRO_SESSION_KEY = 'rmg:intro-acknowledged';
let clipboardImageDetected = false;

const CORPUS = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.RISK_CORPUS_DATA) return globalThis.RISK_CORPUS_DATA;
  if (typeof module !== 'undefined' && module.exports) return require('./risk-corpus.js');
  throw new Error('離線風險語料庫未載入。');
})();

const LEGAL_CATALOG = CORPUS.legalCatalog || {};
const PHRASE_ENTRIES = CORPUS.phraseEntries || [];
const PATTERN_ENTRIES = (CORPUS.patternEntries || []).map(entry => ({
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
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=A0030050',
    link: '公務人員安全衛生防護與校園相關法制'
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
  return String(text || '')
    .normalize('NFKC')
    .replace(/[\u200B\u200C\u2060\uFEFF]/gu, '');
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

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter(item => {
    const key = `${item.source}|${item.corpusId || item.title}|${item.fragment}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

    score += entry.weight;
    findings.push({
      type: 'tone',
      source,
      corpusId: entry.id,
      title: entry.category,
      severity: entry.severity,
      fragment: match[0] || entry.phrase,
      canonicalPhrase: entry.phrase,
      reason: entry.warning,
      safeAction: entry.safeAction,
      legalNotes: getLegalNotes(entry.legal)
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
      legalNotes: getLegalNotes(entry.legal)
    });
  }

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

function sanitizeOutputField(text, options) {
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
  const keys = ['topic', 'fact', 'action', 'deadline', 'reason'];
  const cleaned = {};
  let blocked = 0;

  for (const key of keys) {
    const result = sanitizeOutputField(substance[key] || '', options);
    cleaned[key] = result.text;
    blocked += result.blocked;
  }
  cleaned.tone = substance.tone || 'directive';
  return { substance: cleaned, blocked };
}

function composeSafeMessage(substance, options) {
  // 重要安全不變量：
  // 本函式只接收「實質內容欄位」，沒有 raw/original message 參數。
  // 因此原始高風險訊息不會被拿來拼接可複製版本。
  const opening = OPENING_BY_AUDIENCE[options.audience] || '';
  const parts = [];

  if (substance.topic) {
    const topic = cleanText(substance.topic).replace(/[。！？]+$/g, '');
    if (topic) parts.push(`關於${topic}，說明如下。`);
  }

  if (substance.fact) {
    parts.push(ensureSentence(substance.fact));
  }

  if (substance.action) {
    parts.push(sentenceWithoutLeadingPlease(substance.action));
  } else if (substance.fact || substance.topic) {
    parts.push(PURPOSE_FALLBACK[options.purpose] || PURPOSE_FALLBACK.general);
  }

  if (substance.deadline) {
    const deadline = cleanText(substance.deadline).replace(/[。！？]+$/g, '');
    if (deadline) parts.push(`處理或回覆期限：${deadline}。`);
  }

  if (substance.reason) {
    parts.push(ensureSentence(`相關原因、影響或程序：${substance.reason}`));
  }

  if (!parts.length) {
    return {
      text: '',
      copyable: false,
      notice: '原始訊息只用於風險檢核，不會自動進入建議版本。請至少填寫「客觀事實／目前狀況」或「希望對方完成的行動」，再產生可直接複製的內容。'
    };
  }

  const closing = TONE_CLOSING[substance.tone] || TONE_CLOSING.directive;
  parts.push(closing);

  let text = parts.filter(Boolean).join('\n');
  if (opening) text = opening + text;

  return {
    text: cleanText(text.replace(/\n\s*\n/g, '\n')),
    copyable: true,
    notice: '建議版本只由「實質內容」欄位組成；原始訊息不會被自動複製或拼接進輸出。'
  };
}

function analyzeMessage(raw, substance = {}, options = {}) {
  const normalizedOptions = {
    audience: options.audience || 'coworker',
    purpose: options.purpose || 'general',
    removeEmoji: options.removeEmoji !== false,
    maskPii: options.maskPii !== false,
    recordableTone: options.recordableTone !== false,
    clipboardImageDetected: Boolean(options.clipboardImageDetected)
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

  const substanceCombined = [substance.topic, substance.fact, substance.action, substance.deadline, substance.reason]
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
  const composed = composeSafeMessage(sanitized.substance, normalizedOptions);

  // 最終防漏：即使使用者把高風險用語放在「實質內容」欄，
  // 可複製版本仍需再掃一次；若仍命中，就不提供可複製輸出。
  let safeText = composed.text;
  let copyable = composed.copyable;
  let outputNotice = composed.notice;
  let residualCount = 0;

  if (safeText) {
    const residualCorpus = scanCorpus(safeText, normalizedOptions, '建議版本防漏');
    const residualPii = normalizedOptions.maskPii ? { findings: [], score: 0 } : scanPii(safeText, '建議版本防漏');
    const severeResidual = residualCorpus.findings.filter(item => item.severity !== 'info');

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
      safeText = '';
      copyable = false;
      outputNotice = '建議版本因防漏檢核未通過而被阻止。請修改實質內容欄位後重新產生。';
      score += 30;
    }
  }

  const deduped = dedupeFindings(findings);
  const privacyCount = deduped.filter(item => item.type === 'privacy').length;
  const toneRiskCount = deduped.filter(item => item.type === 'tone' && item.severity !== 'info').length;
  const corpusHitCount = deduped.filter(item => item.corpusId && !item.corpusId.startsWith('PII-') && !item.corpusId.startsWith('FORMAT-') && item.corpusId !== 'OUTPUT-BLOCK').length;

  score = Math.min(100, score);
  const level = score >= 55 ? 'high' : score >= 20 ? 'medium' : 'low';
  const label = level === 'high'
    ? '高風險：原訊息不宜直接傳送'
    : level === 'medium'
      ? '中度風險：建議確認脈絡與用語'
      : '較低風險：仍需人工確認';

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

  return {
    safeText,
    copyable,
    outputNotice,
    findings: deduped,
    score,
    level,
    label,
    privacyCount,
    toneRiskCount,
    corpusHitCount,
    blockedCount: sanitized.blocked + residualCount,
    corpusVersion: CORPUS.version,
    corpusPhraseCount: PHRASE_ENTRIES.length,
    corpusPatternCount: PATTERN_ENTRIES.length
  };
}

function readSubstanceFromForm() {
  return {
    topic: $('topicText').value,
    fact: $('factText').value,
    action: $('actionText').value,
    deadline: $('deadlineText').value,
    reason: $('reasonText').value,
    tone: $('toneSelect').value
  };
}

function handleAnalyze() {
  const raw = $('sourceText').value.trim();
  const substance = readSubstanceFromForm();

  if (!raw && ![substance.topic, substance.fact, substance.action, substance.deadline, substance.reason].some(value => String(value || '').trim())) {
    $('inputError').textContent = '請先貼上欲檢核的原始訊息，或填寫要傳達的實質工作內容。';
    $('inputError').hidden = false;
    $('sourceText').focus();
    return;
  }

  $('inputError').hidden = true;

  const options = {
    audience: $('audienceSelect').value,
    purpose: $('purposeSelect').value,
    removeEmoji: $('removeEmojiOption').checked,
    maskPii: $('maskPiiOption').checked,
    recordableTone: true,
    clipboardImageDetected
  };

  const result = analyzeMessage(raw, substance, options);
  renderResult(result);
}

function renderResult(result) {
  $('emptyState').hidden = true;
  $('resultContent').hidden = false;
  $('safeText').value = result.safeText;
  $('safeText').placeholder = result.copyable ? '' : '目前沒有可直接複製的版本。請依上方提示補充或修正實質工作內容。';

  $('riskBadge').className = `risk-badge ${result.level}`;
  $('riskBadge').textContent = `${result.label}（${result.score}）`;

  $('corpusHitCount').textContent = result.corpusHitCount;
  $('privacyCount').textContent = result.privacyCount;
  $('blockedCount').textContent = result.blockedCount;

  $('outputSourceNotice').textContent = result.outputNotice;
  $('outputSourceNotice').className = result.copyable ? 'output-source-notice safe' : 'output-source-notice warning';

  $('copyButton').disabled = !result.copyable;
  $('copyStatus').textContent = '';

  const fragment = document.createDocumentFragment();
  for (const finding of result.findings) {
    const card = document.createElement('article');
    card.className = `finding-card ${finding.severity === 'severe' ? 'severe' : finding.severity === 'info' ? 'info' : ''}`;

    const top = document.createElement('div');
    top.className = 'finding-top';

    const titleWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'finding-title';
    title.textContent = finding.title;

    const meta = document.createElement('div');
    meta.className = 'finding-meta';
    meta.textContent = `${finding.source}｜${finding.corpusId}`;

    titleWrap.append(title, meta);

    const severity = document.createElement('span');
    severity.className = 'severity-label';
    severity.textContent = finding.severity === 'severe' ? '較高風險' : finding.severity === 'info' ? '提醒' : '中度風險';
    top.append(titleWrap, severity);

    const quote = document.createElement('div');
    quote.className = 'finding-fragment';
    quote.textContent = finding.fragment;

    const reason = document.createElement('p');
    reason.textContent = finding.reason;

    const safer = document.createElement('p');
    safer.className = 'safe-action';
    safer.textContent = `較安全處理：${finding.safeAction}`;

    card.append(top, quote, reason, safer);

    if (finding.legalNotes && finding.legalNotes.length) {
      const legalBox = document.createElement('div');
      legalBox.className = 'legal-note-list';
      for (const legal of finding.legalNotes.slice(0, 4)) {
        const p = document.createElement('p');
        p.className = 'legal-note';
        p.textContent = `法制提示｜${legal.label}：${legal.note}`;
        legalBox.appendChild(p);
      }
      card.appendChild(legalBox);
    }

    fragment.appendChild(card);
  }

  $('findingList').replaceChildren(fragment);
  $('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initialize() {
  renderLegalReferences();
  bindEvents();
  updateCharCount();
  renderCorpusStats();

  if (sessionStorage.getItem(INTRO_SESSION_KEY) === '1') {
    enterApplication(false);
  }
}

function bindEvents() {
  $('enterAppButton').addEventListener('click', () => enterApplication(true));
  $('showIntroButton').addEventListener('click', showIntro);
  $('showPrivacyButton').addEventListener('click', () => $('privacyDialog').showModal());
  $('closePrivacyButton').addEventListener('click', () => $('privacyDialog').close());
  $('privacyDialog').addEventListener('click', event => {
    if (event.target === $('privacyDialog')) $('privacyDialog').close();
  });

  $('sourceText').addEventListener('input', updateCharCount);
  $('sourceText').addEventListener('paste', handlePasteInspection);
  $('loadExampleButton').addEventListener('click', loadExample);
  $('analyzeButton').addEventListener('click', handleAnalyze);
  $('clearButton').addEventListener('click', clearAll);
  $('copyButton').addEventListener('click', () => copyText($('safeText').value, '已複製建議版本。'));
}

function renderCorpusStats() {
  const text = `${PHRASE_ENTRIES.length} 筆用語＋${PATTERN_ENTRIES.length} 組結構規則`;
  if ($('corpusStats')) $('corpusStats').textContent = text;
  if ($('corpusVersion')) $('corpusVersion').textContent = CORPUS.version;
  if ($('privacyCorpusStats')) $('privacyCorpusStats').textContent = text;
}

function enterApplication(saveSessionPreference) {
  if (saveSessionPreference && $('hideIntroSession').checked) {
    sessionStorage.setItem(INTRO_SESSION_KEY, '1');
  }
  $('introScreen').hidden = true;
  $('appShell').hidden = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
  $('sourceText').focus();
}

function showIntro() {
  $('appShell').hidden = true;
  $('introScreen').hidden = false;
  $('hideIntroSession').checked = sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
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
  $('sourceText').value = '晚上要不要~~~親親\\n口交\\n綠茶婊\\n啪啪啪啦%％%％%%\\n要%%%嗎?胸好大。';
  $('topicText').value = '昨日交辦資料的版本與期限';
  $('factText').value = '目前收到的檔案仍缺少附件二，且版本日期與會議確認內容不一致';
  $('actionText').value = '重新確認附件二並上傳正確版本';
  $('deadlineText').value = '今天下午 5 時前';
  $('reasonText').value = '需於明日上午會議前完成彙整，避免後續使用錯誤版本';
  updateCharCount();
  $('sourceText').focus();
}

function clearAll() {
  for (const id of ['sourceText', 'topicText', 'factText', 'actionText', 'deadlineText', 'reasonText', 'safeText']) {
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
    scanPii,
    sanitizeOutputField,
    sanitizeSubstance,
    composeSafeMessage,
    cleanText,
    normalizeText,
    CORPUS
  };
}
