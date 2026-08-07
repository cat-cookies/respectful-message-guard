'use strict';

const {
  analyzeMessage,
  scanCorpus,
  sanitizeOutputField,
  composeSafeMessage,
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
