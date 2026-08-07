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

function titles(result) {
  return result.findings.map(item => item.title).join('｜');
}

// 使用者實際測試案例：四種風險必須全部攔下，建議版本不得殘留原辱罵或威嚇。
const userCase = analyzeMessage('幹你娘！死查某！你是時空穿越了嗎？信不信明天把你開了？', {
  ...base,
  purpose: 'correct'
});
assert(userCase.score >= 55, '使用者案例未判為高風險');
assert(titles(userCase).includes('直接辱罵'), '未辨識直接辱罵');
assert(titles(userCase).includes('性別貶抑'), '未辨識性別辱罵');
assert(titles(userCase).includes('羞辱式反問'), '未辨識羞辱式反問');
assert(titles(userCase).includes('解僱'), '未辨識解僱威嚇');
for (const phrase of ['幹你娘', '死查某', '時空穿越', '把你開了']) {
  assert(!userCase.safeText.includes(phrase), `高風險片段仍殘留：${phrase}`);
}
assert(userCase.safeText.includes('請協助確認並修正'), '未產生可用的中性改寫');

// 空白與變體不能輕易繞過。
const obfuscated = analyzeMessage('幹 妳 娘！信不信我明天把妳開除。', base);
assert(obfuscated.score >= 55, '空白變體未被高風險攔截');
assert(!obfuscated.safeText.includes('幹 妳 娘'), '空白變體辱罵仍殘留');
assert(!obfuscated.safeText.includes('開除'), '威嚇式開除仍殘留');

// 原有綜合案例。
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

const sexist = analyzeMessage('死三八，女人就是沒用。', base);
assert(sexist.score >= 55, '性別貶抑未達高風險');
assert(!sexist.safeText.includes('死三八'), '性別辱罵仍殘留');

const ridicule = analyzeMessage('你是活在清朝嗎？這也不會？', base);
assert(ridicule.findings.some(item => item.title.includes('羞辱式反問')), '未辨識年代式嘲弄');
assert(!ridicule.safeText.includes('清朝'), '嘲弄語句仍殘留');

const proceduralEmployment = analyzeMessage('如後續查證確有重大違規，將依勞動契約、工作規則及相關程序另行處理。', base);
assert(!proceduralEmployment.findings.some(item => item.title.includes('解僱') || item.title.includes('人事處分')), '合法程序敘述被錯判為解僱威嚇');

const neutral = analyzeMessage('請協助確認明天下午三點前是否能完成表單，如有困難請回覆說明。', base);
assert(neutral.score === 0, '中性訊息不應被加分');
assert(neutral.safeText.includes('請協助確認'), '中性訊息遭不當改寫');
assert(neutral.findings.filter(item => item.type === 'tone' && item.severity !== 'info').length === 0, '中性訊息不應計入語氣風險');

const imagePaste = analyzeMessage('請確認明日是否可完成。', { ...base, clipboardImageDetected: true });
assert(imagePaste.findings.some(item => item.title.includes('剪貼簿圖片')), '未產生圖片貼圖提醒');


const obfuscatedPunct = analyzeMessage('幹-妳-娘！', base);
assert(obfuscatedPunct.score >= 20, '符號拆字辱罵未被辨識');
assert(!obfuscatedPunct.safeText.includes('娘'), '符號拆字辱罵仍殘留');

const exclusion = analyzeMessage('這次會議不要讓他知道，大家都不要理他。', base);
assert(exclusion.findings.some(item => item.title.includes('排擠')), '未辨識刻意排擠');
assert(!exclusion.safeText.includes('大家都不要理他'), '排擠指示仍殘留');

const sabotage = analyzeMessage('不要把資料給他，就讓他不知道，看他怎麼出包。', base);
assert(sabotage.findings.some(item => item.title.includes('隱瞞資訊')), '未辨識資訊妨礙');
assert(sabotage.score >= 20, '資訊妨礙風險分數不足');

const workload = analyzeMessage('這些都你一個人扛，做不完不准下班。', base);
assert(workload.findings.some(item => item.title.includes('不合理工作')), '未辨識不合理工作分派');
assert(!workload.safeText.includes('不准下班'), '不合理工作威壓仍殘留');

const retaliation = analyzeMessage('你敢去申訴就不排班，去申訴啊看你能怎樣。', base);
assert(retaliation.score >= 55, '申訴報復未達高風險');
assert(retaliation.findings.some(item => item.title.includes('報復')), '未辨識申訴報復');
assert(!retaliation.safeText.includes('不排班'), '報復語句仍殘留');

const confidentiality = analyzeMessage('把申訴內容丟到群組，讓大家知道誰申訴。', base);
assert(confidentiality.findings.some(item => item.title.includes('申訴人') || item.title.includes('調查資訊')), '未辨識申訴保密風險');
assert(!confidentiality.safeText.includes('丟到群組'), '申訴揭露語句仍殘留');

const legitimateExclusion = analyzeMessage('本次會議涉及個資與採購評選，未具權限者不列入與會名單，將依權限控管規範辦理。', base);
assert(!legitimateExclusion.findings.some(item => item.title.includes('排擠')), '合理權限控管被錯判為排擠');

const familyClient = analyzeMessage('您好，目前此項服務不在核定範圍內，如有需求請由個案管理師協助確認後續資源。', { ...base, audience: 'client' });
assert(familyClient.score === 0, '正常服務界線被錯判');

const emojiSkin = analyzeMessage('你到底在做什麼😡👍🏽！！', base);
assert(!/[😡👍🏽]/u.test(emojiSkin.safeText), '複合表情符號未完整移除');

console.log('All tests passed.');
