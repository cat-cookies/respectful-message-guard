'use strict';

const {
  analyzeMessage,
  scanCorpus,
  sanitizeOutputField,
  composeSafeMessage,
  REWRITE_ENGINE,
  CORPUS
} = require('./app.js');

const baseOptions = {
  audience: 'coworker',
  purpose: 'correct',
  removeEmoji: true,
  maskPii: true,
  recordableTone: true,
  clipboardImageDetected: false
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function titles(result) {
  return result.findings.map(item => item.title).join('｜');
}

// 1. 使用者實驗案例：原始性意味／性別貶抑內容不得進入輸出。
const experimentalRaw = [
  '晚上要不要~~~親親',
  '口交',
  '綠茶婊',
  '啪啪啪啦%%%％%%',
  '要%%%嗎?胸好大。'
].join('\n');

const experimental = analyzeMessage(
  experimentalRaw,
  {
    topic: '昨日交辦資料的版本與期限',
    fact: '目前收到的檔案仍缺少附件二，且版本日期與會議確認內容不一致',
    action: '重新確認附件二並上傳正確版本',
    deadline: '今天下午 5 時前',
    reason: '需於明日上午會議前完成彙整，避免後續使用錯誤版本',
    tone: 'directive'
  },
  baseOptions
);

for (const phrase of ['親親', '口交', '綠茶婊', '啪啪啪', '胸好大']) {
  assert(!experimental.safeText.includes(phrase), `原始高風險用語被帶入輸出：${phrase}`);
}
assert(experimental.safeText.includes('附件二'), '使用者新增的實質工作內容未進入建議版本');
assert(experimental.safeText.includes('今天下午 5 時前'), '期限未進入建議版本');
assert(experimental.corpusHitCount >= 5, '實驗案例未充分命中離線語料庫');
assert(experimental.copyable === true, '有完整實質內容時應可複製');

// 2. 原始訊息不能當輸出來源；未填實質內容時不產生可複製版本。
const noSubstance = analyzeMessage('你到底會不會做事？幹你娘！', {}, baseOptions);
assert(noSubstance.safeText === '', '未填實質內容時不應產生可複製文字');
assert(noSubstance.copyable === false, '未填實質內容時複製功能應被阻止');
assert(noSubstance.outputNotice.includes('原始訊息只用於風險檢核'), '未提示原始訊息與輸出分流');

// 3. 能新增真正想說的工作內容。
const substantive = analyzeMessage(
  '你到底在搞什麼？',
  {
    topic: '8 月份排班表',
    fact: '目前週五晚班仍有兩個時段未完成確認',
    action: '確認可值班人員並回覆排班結果',
    deadline: '本週三中午 12 時前',
    reason: '需預留後續協調與替補時間',
    tone: 'formal'
  },
  { ...baseOptions, purpose: 'schedule' }
);
assert(substantive.safeText.includes('8 月份排班表'), '工作主題未保留');
assert(substantive.safeText.includes('兩個時段'), '客觀事實未保留');
assert(substantive.safeText.includes('確認可值班人員'), '要求行動未保留');
assert(!substantive.safeText.includes('搞什麼'), '原始怒斥被帶入輸出');

// 4. 即使高風險用語被放到「實質內容」，也要二次檢核與清除。
const dirtySubstance = analyzeMessage(
  '請處理。',
  {
    fact: '你有沒有腦，附件還是少一份',
    action: '幹你娘，現在把附件補齊',
    deadline: '下午五點前',
    reason: '',
    tone: 'directive'
  },
  baseOptions
);
assert(dirtySubstance.findings.some(item => item.source === '實質內容'), '實質內容未接受離線語料檢核');
assert(!dirtySubstance.safeText.includes('有沒有腦'), '實質內容中的能力羞辱未清除');
assert(!dirtySubstance.safeText.includes('幹你娘'), '實質內容中的辱罵未清除');

// 5. 符號與空格拆字不能輕易繞過。
const obfuscated = scanCorpus('啪%啪%啪，幹 妳 娘，死 查 某。', baseOptions, '原始訊息');
assert(obfuscated.findings.some(item => item.canonicalPhrase === '啪啪啪'), '百分比拆字未命中');
assert(obfuscated.findings.some(item => item.canonicalPhrase === '幹妳娘'), '空格拆字辱罵未命中');
assert(obfuscated.findings.some(item => item.canonicalPhrase === '死查某'), '空格拆字性別辱罵未命中');

// 6. 個資只從實質內容經遮罩後進入輸出。
const pii = analyzeMessage(
  '請聯絡王小明。',
  {
    fact: '王小明的電話是0912345678，病歷號A123456',
    action: '請確認資料是否需要保留於此訊息',
    deadline: '',
    reason: '',
    tone: 'cooperative'
  },
  baseOptions
);
assert(!pii.safeText.includes('0912345678'), '實質內容電話未遮罩');
assert(pii.safeText.includes('【電話已遮罩】'), '電話遮罩標記未出現');
assert(!pii.safeText.includes('A123456'), '病歷號未遮罩');
assert(pii.privacyCount >= 2, '個資提醒不足');

// 7. 正常正式人事程序不能因單純出現「程序」而被誤判。
const procedural = analyzeMessage(
  '請確認。',
  {
    fact: '如後續查證確有重大違規，將依勞動契約、工作規則及相關程序另行處理',
    action: '請先提供本次事件的工作紀錄與相關資料',
    deadline: '三個工作日內',
    reason: '供後續事實釐清',
    tone: 'formal'
  },
  baseOptions
);
assert(!procedural.findings.some(item => item.corpusId === 'PAT-HR-001'), '正常程序敘述被誤判為情緒性解僱威嚇');

// 8. 正常服務界線可直接使用。
const client = analyzeMessage(
  '案家很煩。',
  {
    topic: '本次服務申請',
    fact: '目前此項服務不在核定範圍內',
    action: '請由個案管理師協助確認可使用的後續資源',
    deadline: '',
    reason: '需依核定服務內容與相關作業規範辦理',
    tone: 'cooperative'
  },
  { ...baseOptions, audience: 'client', purpose: 'refuse' }
);
assert(client.safeText.startsWith('您好，'), '案家訊息未使用適當開頭');
assert(client.safeText.includes('不在核定範圍內'), '服務界線的實質內容未保留');
assert(!client.safeText.includes('很煩'), '原始不禮貌用語被帶入');

// 9. 離線語料庫結構完整：每筆用語一對一配對警示與法制標籤。
assert(CORPUS.phraseEntries.length >= 260, '離線高風險用語數量不足');
assert(CORPUS.patternEntries.length >= 10, '離線結構規則數量不足');

const ids = new Set();
for (const entry of CORPUS.phraseEntries) {
  assert(entry.id && entry.phrase && entry.warning && entry.safeAction, `語料缺欄位：${JSON.stringify(entry)}`);
  assert(Array.isArray(entry.legal), `語料缺法制標籤：${entry.id}`);
  assert(!ids.has(entry.id), `語料代碼重複：${entry.id}`);
  ids.add(entry.id);
}
for (const entry of CORPUS.patternEntries) {
  assert(entry.id && entry.pattern && entry.warning && entry.safeAction, `結構規則缺欄位：${entry.id}`);
  assert(!ids.has(entry.id), `語料代碼重複：${entry.id}`);
  ids.add(entry.id);
}

// 10. composeSafeMessage 的設計不接受 raw 參數，確保輸出來源分流。
const composed = composeSafeMessage({
  topic: '測試事項',
  fact: '目前有一項待確認內容',
  action: '回覆處理結果',
  deadline: '明日下午',
  reason: '供後續彙整',
  tone: 'directive'
}, baseOptions);
assert(composed.text.includes('測試事項'), '組句函式未使用實質內容');
assert(!composed.text.includes('原始辱罵唯一字串'), '組句函式不應出現不存在的原始訊息');

// 11. 輸出欄位本身的高風險詞清理。
const cleaned = sanitizeOutputField('請你不要再裝傻，幹你娘，電話0912345678。', baseOptions);
assert(!cleaned.text.includes('裝傻'), '輸出欄位羞辱詞未清除');
assert(!cleaned.text.includes('幹你娘'), '輸出欄位辱罵未清除');
assert(!cleaned.text.includes('0912345678'), '輸出欄位個資未遮罩');

console.log(`All tests passed. Corpus: ${CORPUS.phraseEntries.length} phrases + ${CORPUS.patternEntries.length} patterns.`);

// 12. 使用者第二輪實驗：明確性行為「肛交」必須被離線語料庫抓到。
const analSex = scanCorpus('肛交', baseOptions, '原始訊息');
assert(analSex.findings.some(item => item.canonicalPhrase === '肛交'), '「肛交」未被離線語料庫辨識');

// 13. 工作內容本身不合理時，不得用禮貌文字漂白。
const unreasonableSocial = analyzeMessage(
  '肛交',
  {
    topic: '晚上陪酒',
    fact: '社交宴會',
    action: '陪我跟其他老闆見面',
    deadline: '3點',
    reason: '',
    basis: '',
    tone: 'formal'
  },
  baseOptions
);
assert(unreasonableSocial.findings.some(item => item.corpusId === 'CTX-WORK-DRINK-001'), '陪酒工作內容未被工作合理性引擎辨識');
assert(unreasonableSocial.workRiskCount >= 1, '工作內容風險計數未增加');
assert(unreasonableSocial.copyable === false, '高風險工作內容不應提供可複製版本');
assert(unreasonableSocial.safeText === '', '高風險工作內容不應輸出禮貌化命令');
assert(unreasonableSocial.outputNotice.includes('不會把可能不合理的要求'), '未清楚說明工作內容被攔截');

// 14. 社交餐敘本身不一律違法；未有職務依據先攔截，具體且可核對的業務依據則降為人工確認。
const socialWithoutBasis = analyzeMessage('', {
  topic: '客戶餐敘', fact: '社交宴會', action: '陪我跟合作廠商見面', deadline: '晚上9點前', reason: '', basis: '', tone: 'formal'
}, baseOptions);
assert(socialWithoutBasis.copyable === false, '職務關聯不明的社交宴會應先攔截');
assert(socialWithoutBasis.findings.some(item => item.corpusId === 'CTX-WORK-SOCIAL-001'), '社交宴會跨欄位規則未命中');

const fakeBasis = analyzeMessage('', {
  topic: '客戶餐敘', fact: '社交宴會', action: '陪我跟合作廠商見面', deadline: '晚上9點前', reason: '', basis: '因為我是老闆', tone: 'formal'
}, baseOptions);
assert(fakeBasis.copyable === false, '抽象／權勢式假理由不應解除攔截');

const socialWithBasis = analyzeMessage('', {
  topic: '客戶專案餐敘',
  fact: '與合作廠商討論專案時程與交付內容',
  action: '出席餐敘並進行專案討論',
  deadline: '晚上9點前',
  reason: '完成本週專案協調',
  basis: '此為客戶專案既定會議，出席屬專案工作；飲酒與續攤非必要且可拒絕',
  tone: 'cooperative'
}, baseOptions);
assert(socialWithBasis.copyable === true, '具體工作依據且未含陪酒強制內容時應可產生版本');
assert(socialWithBasis.findings.some(item => item.corpusId === 'CTX-WORK-SOCIAL-001' && item.severity === 'info'), '具體業務依據應降為人工確認提醒');

// 15. 專業必要語境：明確性術語可保留，但必須在工作依據欄明確說明專業目的。
const professionalSex = analyzeMessage('', {
  topic: '性健康衛教教材',
  fact: '教材需說明肛交相關感染與傷害風險',
  action: '依衛教標準確認用語與風險提醒',
  deadline: '',
  reason: '供衛生教育使用',
  basis: '本內容屬醫療衛教教材與臨床健康教育之專業必要內容',
  tone: 'formal'
}, baseOptions);
assert(professionalSex.copyable === true, '明確專業必要語境不應被一律當成性騷擾而封鎖');
assert(professionalSex.safeText.includes('肛交'), '專業必要術語被錯誤刪除');
assert(professionalSex.findings.some(item => item.corpusId === 'CTX-WORK-SEXUAL-001' && item.severity === 'info'), '專業例外應保留提醒而非完全忽略');

const nonProfessionalSex = analyzeMessage('', {
  topic: '聚餐', fact: '肛交', action: '跟我聊這個', deadline: '', reason: '', basis: '', tone: 'directive'
}, baseOptions);
assert(nonProfessionalSex.copyable === false, '非專業工作內容中的明確性行為要求應被攔截');

// 16. 不合理目標、不實紀錄、安全規避、下班無限待命等工作內容均不得被禮貌化。
for (const [name, substance, expectedId] of [
  ['不合理目標', {topic:'臨時交辦',fact:'不給資源也要完成',action:'今天全部做完',basis:'',tone:'formal'}, 'CTX-WORK-UNREASONABLE-001'],
  ['不實紀錄', {topic:'紀錄',fact:'實際沒有完成',action:'沒做也寫完成',basis:'',tone:'formal'}, 'CTX-WORK-FALSIFY-001'],
  ['安全規避', {topic:'現場作業',fact:'沒有防護設備',action:'不用安全裝備也要做',basis:'',tone:'formal'}, 'CTX-WORK-SAFETY-001'],
  ['無限待命', {topic:'聯絡規定',fact:'下班也要回',action:'LINE一則都不能漏',basis:'',tone:'formal'}, 'CTX-WORK-OFFHOUR-001']
]) {
  const r = analyzeMessage('', substance, baseOptions);
  assert(r.copyable === false, `${name}不應被改寫成可執行命令`);
  assert(r.findings.some(item => item.corpusId === expectedId), `${name}的工作內容規則未命中`);
}

// 17. 來源可追溯性：每筆語料與工作內容規則均須對應存在的來源代碼。
assert(CORPUS.phraseEntries.length >= 1850, 'v1.4 近義詞擴充量不足');
assert(CORPUS.contextRules.length >= 17, 'v1.4 工作內容規則不足');
assert(Object.keys(CORPUS.sourceCatalog || {}).length >= 17, 'v1.4 來源索引不足');
const allSourceIds = new Set(Object.keys(CORPUS.sourceCatalog || {}));
const allCorpusIds = new Set();
for (const entry of [...CORPUS.phraseEntries, ...CORPUS.patternEntries, ...CORPUS.contextRules]) {
  assert(!allCorpusIds.has(entry.id), `語料／規則代碼重複：${entry.id}`);
  allCorpusIds.add(entry.id);
  assert(Array.isArray(entry.sources) && entry.sources.length > 0, `缺少來源：${entry.id}`);
  for (const sourceId of entry.sources) assert(allSourceIds.has(sourceId), `未知來源代碼 ${sourceId} @ ${entry.id}`);
}

// 18. v1.4 近義詞／臺灣常見變體覆蓋測試。
for (const [sample, canonical, label] of [
  ['北七', '北七', '臺灣常見辱罵變體'],
  ['口愛', '口愛', '性行為委婉詞'],
  ['你封鎖我也沒用', '你封鎖我也沒用', '持續聯絡／跟蹤式變體'],
  ['罩杯多少', '罩杯多少', '身體／性意味評論'],
  ['找勞工局就列黑名單', '找勞工局就列黑名單', '申訴報復變體'],
  ['人妖', '人妖', '性別氣質／身分貶抑變體'],
  ['不爽就換一家', '不爽就換一家', '對案家／服務對象不禮貌變體']
]) {
  const r = scanCorpus(sample, baseOptions, '原始訊息');
  assert(r.findings.some(item => item.canonicalPhrase === canonical), `${label}未命中：${sample}`);
}

// 19. v1.4 新增的工作內容近義表達必須進入阻擋層，不只是語氣提醒。
for (const [name, substance, expectedId] of [
  ['缺SOP仍強制執行', {topic:'作業',fact:'目前沒有SOP',action:'沒SOP也要做',basis:'',tone:'formal'}, 'CTX-WORK-UNREASONABLE-001'],
  ['不實服務紀錄', {topic:'服務紀錄',fact:'實際未提供服務',action:'沒服務也寫有',basis:'',tone:'formal'}, 'CTX-WORK-FALSIFY-001'],
  ['跳過雙人覆核', {topic:'安全程序',fact:'目前未完成覆核',action:'不用雙人覆核',basis:'',tone:'formal'}, 'CTX-WORK-SAFETY-001'],
  ['特休仍強制在線', {topic:'待命',fact:'同仁正在特休',action:'特休也要回訊息',basis:'',tone:'formal'}, 'CTX-WORK-OFFHOUR-001']
]) {
  const r = analyzeMessage('', substance, baseOptions);
  assert(r.copyable === false, `${name}不應產生可複製版本`);
  assert(r.findings.some(item => item.corpusId === expectedId), `${name}未命中工作內容阻擋規則`);
}

// 20. 近義詞擴充仍維持最低限度的誤判控制：一般中性工作句不應被新增語料命中。
for (const normal of [
  '請確認明天下午會議時間。',
  '請依標準作業程序完成雙人覆核。',
  '本週特休已核准，緊急事項由值班人員處理。',
  '請將正確服務紀錄依實際執行情形登錄。',
  '客戶餐敘為專案會議，飲酒並非必要。'
]) {
  const r = scanCorpus(normal, baseOptions, '正常句');
  assert(r.findings.length === 0, `正常句被近義詞語料誤判：${normal} -> ${r.findings.map(x=>x.canonicalPhrase).join(',')}`);
}


// 21. 婚育／懷孕不利益與非必要社交活動綁定人事利益，應使用各自的專門規則。
const pregnancyPenalty = analyzeMessage('', {topic:'人事安排',fact:'同仁懷孕',action:'懷孕就不續約',basis:'',tone:'formal'}, baseOptions);
assert(pregnancyPenalty.copyable === false, '懷孕與不續約連結應被阻擋');
assert(pregnancyPenalty.findings.some(item => item.corpusId === 'CTX-WORK-FAMILY-STATUS-001'), '婚育／懷孕不利益專門規則未命中');

const dinnerPenalty = analyzeMessage('', {topic:'公司聚餐',fact:'尾牙活動',action:'不參加尾牙就扣考績',basis:'',tone:'formal'}, baseOptions);
assert(dinnerPenalty.copyable === false, '非必要社交活動與考績綁定應被阻擋');
assert(dinnerPenalty.findings.some(item => item.corpusId === 'CTX-WORK-SOCIAL-PENALTY-001'), '社交活動人事不利益專門規則未命中');

console.log(`v1.4 synonym-expanded tests passed. Corpus: ${CORPUS.phraseEntries.length} phrases + ${CORPUS.patternEntries.length} patterns + ${CORPUS.contextRules.length} work-context rules + ${Object.keys(CORPUS.sourceCatalog).length} sources.`);

// 22. v1.5 潤稿引擎：自然版不得再使用欄位標籤式、公文模板式拼接。
const rewriteCase = {
  topic: '昨日交辦資料的版本與期限',
  fact: '目前收到的檔案仍缺少附件二，且版本日期與會議確認內容不一致',
  action: '重新確認附件二並上傳正確版本',
  deadline: '今天下午 5 時前',
  reason: '需於明日上午會議前完成彙整，避免後續使用錯誤版本',
  basis: '本事項屬既定專案工作與會議前置作業',
  tone: 'directive'
};
const naturalRewrite = analyzeMessage('', rewriteCase, { ...baseOptions, rewriteStyle: 'natural', includeBasis: false });
assert(naturalRewrite.copyable === true, '自然潤稿版應可複製');
assert(naturalRewrite.safeText.includes('附件二'), '自然潤稿遺失核心事實');
assert(naturalRewrite.safeText.includes('今天下午 5 時前'), '自然潤稿遺失期限');
for (const formulaic of ['說明如下', '相關原因、影響或程序：', '工作必要性或職務依據：', '處理或回覆期限：']) {
  assert(!naturalRewrite.safeText.includes(formulaic), `自然潤稿仍殘留制式標籤：${formulaic}`);
}
assert(!naturalRewrite.safeText.includes(rewriteCase.basis), '職務依據預設不應暴露到對外訊息');
assert(!/也版本日期/u.test(naturalRewrite.safeText), '自然潤稿產生不自然殘句「也版本日期」');
assert(!/需要要/u.test(naturalRewrite.safeText), '自然潤稿產生重複詞「需要要」');

// 23. 職務依據僅在使用者明確要求時才寫入訊息。
const withBasis = analyzeMessage('', rewriteCase, { ...baseOptions, rewriteStyle: 'formal', includeBasis: true });
assert(withBasis.safeText.includes('職務依據'), '明確勾選後應能將職務依據納入正式版');
assert(withBasis.safeText.includes('既定專案工作'), '正式版未保留使用者明示的職務依據內容');

// 24. 三種潤稿風格必須真的不同，而不是只換一個結尾。
const conciseRewrite = analyzeMessage('', rewriteCase, { ...baseOptions, rewriteStyle: 'concise', includeBasis: false });
const formalRewrite = analyzeMessage('', rewriteCase, { ...baseOptions, rewriteStyle: 'formal', includeBasis: false });
assert(naturalRewrite.safeText !== conciseRewrite.safeText, '自然版與精簡版不應完全相同');
assert(naturalRewrite.safeText !== formalRewrite.safeText, '自然版與正式版不應完全相同');
assert(conciseRewrite.safeText.length <= naturalRewrite.safeText.length, '精簡版不應比自然版更冗長');
assert(formalRewrite.safeText.includes('關於') || formalRewrite.safeText.includes('請於'), '正式版缺少正式書面語序');

// 25. 對服務對象的自然版要使用合適稱謂，但不能把欄位名稱塞進訊息。
const serviceRewrite = analyzeMessage('', {
  topic: '下週居家訪視時間',
  fact: '目前安排在星期三下午',
  action: '確認這個時段是否方便',
  deadline: '',
  reason: '方便後續安排訪視人員',
  basis: '',
  tone: 'cooperative'
}, { ...baseOptions, audience: 'client', purpose: 'schedule', rewriteStyle: 'natural' });
assert(serviceRewrite.safeText.startsWith('您好，'), '服務對象自然版應有適當問候');
assert(serviceRewrite.safeText.includes('您'), '服務對象自然版應使用敬稱');
assert(!/(?:客觀事實|希望對方|原因、影響|工作必要性)/u.test(serviceRewrite.safeText), '服務訊息不應出現表單欄位名稱');

// 26. 潤稿候選評分器需對典型公文套語給予較低分。
const { scoreCandidate } = REWRITE_ENGINE;
const naturalGood = '我這邊看了一下檔案，目前還缺附件二。請在今天下午 5 時前補上，明早需要完成彙整。';
const formulaicBad = '關於檔案，說明如下。處理或回覆期限：今天下午 5 時前。相關原因、影響或程序：明早需要完成彙整。';
assert(scoreCandidate(naturalGood, 'natural') > scoreCandidate(formulaicBad, 'natural'), '自然度評分器未有效淘汰制式模板');

console.log('v1.5 rewrite-engine tests passed.');

// 27. 自然版應把原因併回完整句，不產生「避免…。」或「供…。」等碎裂短句。
const naturalReasonFlow = analyzeMessage('', {
  topic: '會議紀錄版本',
  fact: '目前附件日期和會議當天確認的日期不同',
  action: '確認應以哪一個版本為準',
  deadline: '明日上午',
  reason: '避免後續引用錯誤版本',
  basis: '',
  tone: 'cooperative'
}, { ...baseOptions, audience: 'supervisor', purpose: 'correct', rewriteStyle: 'natural' });
assert(/確認應以哪一個版本為準，避免後續引用錯誤版本。/u.test(naturalReasonFlow.safeText), '自然版未將目的／風險原因自然併回行動句');
assert(!/。避免/u.test(naturalReasonFlow.safeText), '自然版仍產生「避免…」碎裂句');

// 28. 「後續」動作語序與第三方處理，不得產生「請後續」或「麻煩您由」等機械拼接。
const followUpFlow = analyzeMessage('', {
  topic: '值班交接紀錄',
  fact: '交接後仍有兩筆紀錄未完成簽核',
  action: '後續在交班前完成簽核',
  deadline: '',
  reason: '避免下一班無法確認處理狀態',
  basis: '',
  tone: 'directive'
}, { ...baseOptions, audience: 'coworker', purpose: 'rule', rewriteStyle: 'natural' });
assert(followUpFlow.safeText.includes('後續請在交班前完成簽核'), '「後續」工作指示語序不自然');
assert(!followUpFlow.safeText.includes('請後續'), '仍存在「請後續」機械語序');

const thirdPartyFlow = analyzeMessage('', {
  topic: '本次服務申請',
  fact: '目前此項服務不在核定範圍內',
  action: '由個案管理師協助確認可使用的後續資源',
  deadline: '',
  reason: '需要依核定服務內容和相關作業規範辦理',
  basis: '',
  tone: 'cooperative'
}, { ...baseOptions, audience: 'client', purpose: 'refuse', rewriteStyle: 'natural' });
assert(thirdPartyFlow.safeText.includes('後續可由個案管理師協助確認'), '第三方處理未改成自然的替代方案語序');
assert(!/麻煩您由/u.test(thirdPartyFlow.safeText), '第三方處理仍出現「麻煩您由」錯誤語序');

// 29. 拒絕／界線說明應先交代制度理由，再提供替代處理，不把限制寫成冷硬命令。
assert(/因為仍需依核定服務內容和相關作業規範辦理，後續可由/u.test(thirdPartyFlow.safeText), '拒絕型訊息的理由與替代方案排序不自然');

// 30. 正式版的「供…」應轉為完整目的語「以供…」，不可留下句子碎片。
const formalReasonFlow = analyzeMessage('', {
  topic: '本次事件資料補充',
  fact: '目前紀錄尚缺少當日工作紀錄與相關附件',
  action: '提供當日工作紀錄與附件',
  deadline: '三個工作日內',
  reason: '供後續事實釐清',
  basis: '',
  tone: 'formal'
}, { ...baseOptions, audience: 'coworker', purpose: 'general', rewriteStyle: 'formal' });
assert(formalReasonFlow.safeText.includes('以供後續事實釐清'), '正式版未將「供」轉為完整目的語');
assert(!/。供後續/u.test(formalReasonFlow.safeText), '正式版仍產生「供…」碎裂句');

// 31. 服務排程自然版應形成連續語意，不重新輸出欄位標籤。
const scheduleNaturalFlow = analyzeMessage('', {
  topic: '下週居家訪視時間',
  fact: '目前安排在星期三下午',
  action: '確認這個時段是否方便',
  deadline: '',
  reason: '方便後續安排訪視人員',
  basis: '',
  tone: 'cooperative'
}, { ...baseOptions, audience: 'client', purpose: 'schedule', rewriteStyle: 'natural' });
assert(/再麻煩您確認這個時段是否方便，也方便後續安排訪視人員。/u.test(scheduleNaturalFlow.safeText), '服務排程自然版未形成完整連續語意');

console.log('v1.5 natural-language regression tests passed.');
