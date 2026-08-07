'use strict';

global.document = { addEventListener() {} };
const { analyzeMessage } = require('./app.js');

const base = {
  audience: 'coworker',
  purpose: 'remind',
  removeEmoji: true,
  maskPii: true,
  recordableTone: true,
  clipboardImageDetected: false
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const highRisk = analyzeMessage(
  '你們家真的很難搞，講幾次才懂？再不回我就不用服務你了！😡 [貼圖] 王小明的電話是0912345678，病歷號A123456，大家自己看著辦。',
  { ...base, audience: 'client' }
);
assert(!highRisk.safeText.includes('0912345678'), '電話未遮罩');
assert(!highRisk.safeText.includes('😡'), '表情符號未移除');
assert(highRisk.privacyCount >= 3, '個資提醒不足');
assert(highRisk.score >= 55, '高風險訊息未達高風險門檻');

const threat = analyzeMessage('你給我小心，我知道你住哪裡，不回我就每天打給你。', base);
assert(!threat.safeText.includes('住哪裡'), '威脅內容仍留在建議版本');
assert(threat.findings.some(item => item.title.includes('威脅')), '未辨識威脅');

const sexual = analyzeMessage('寶貝身材真好😍，下班陪我。', base);
assert(!sexual.safeText.includes('身材真好'), '性意味內容仍留在建議版本');
assert(sexual.findings.some(item => item.title.includes('性或性別')), '未辨識性或性別風險');

const neutral = analyzeMessage('請協助確認明天下午三點前是否能完成表單，如有困難請回覆說明。', base);
assert(neutral.score === 0, '中性訊息不應被加分');
assert(neutral.safeText.includes('請協助確認'), '中性訊息遭不當改寫');

const imagePaste = analyzeMessage('請確認明日是否可完成。', { ...base, clipboardImageDetected: true });
assert(imagePaste.findings.some(item => item.title.includes('剪貼簿圖片')), '未產生圖片貼圖提醒');

console.log('All tests passed.');
