'use strict';

const INTRO_SESSION_KEY = 'rmg:intro-acknowledged';
let clipboardImageDetected = false;

const LEGAL_REFERENCES = [
  {
    title: '一般勞工職場霸凌',
    body: '職場霸凌須審酌職務或權勢關係、業務必要合理範圍、持續性或重大情節，以及身心健康危害。雇主另有預防、申訴、調查、保護與禁止報復義務。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0060001',
    link: '職業安全衛生法第22條之1至第22條之3'
  },
  {
    title: '職場霸凌程序準則',
    body: '包含防治措施、申訴管道、受理、調查、迴避、申復、保密、紀錄保存與不同事業規模的處理要求。',
    href: 'https://laws.mol.gov.tw/FLAW/FLAWDAT01.aspx?id=FL106701',
    link: '職場霸凌防治措施準則'
  },
  {
    title: '職場不法侵害',
    body: '對服務對象、顧客或其他第三方造成的言語、心理或身體不法侵害，仍須依職安法一般規範及設施規則採取預防與處理措施。',
    href: 'https://www.osha.gov.tw/48110/48713/48735/135152/',
    link: '執行職務遭受不法侵害預防指引（第五版）'
  },
  {
    title: '公務人員職場霸凌',
    body: '公務機關另有防護委員會、申訴、調查、保密、立即保護與機關監督制度，須依公務人員身分處理。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=A0030050',
    link: '公務人員執行職務安全及衛生防護辦法'
  },
  {
    title: '工作場所性騷擾',
    body: '性要求、性意味、性別歧視、性別貶抑、帶有性意味的文字、圖片、貼圖或反覆追求，可能觸及工作場所性騷擾制度。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=N0030014',
    link: '性別平等工作法'
  },
  {
    title: '一般性騷擾',
    body: '在不適用職場或校園特別法時，違反意願且與性或性別有關、損害人格尊嚴或造成畏怖、敵意、冒犯情境的行為，可能依一般制度處理。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=D0050074',
    link: '性騷擾防治法'
  },
  {
    title: '跟蹤騷擾',
    body: '需具反覆或持續、違反意願、與性或性別有關、特定行為態樣，以及使人心生畏怖並足以影響日常生活或社會活動等要件。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0080211',
    link: '跟蹤騷擾防制法'
  },
  {
    title: '校園霸凌與校園性別事件',
    body: '校園事件須依行為人與被行為人身分、是否對學生、是否涉及性或性別等因素，分流適用霸凌或性別平等教育程序。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=H0020081',
    link: '校園霸凌防制準則'
  },
  {
    title: '個人資料與健康資料',
    body: '姓名、聯絡方式、身分證字號、地址、病歷、醫療與健康資訊等均應遵守特定目的、必要範圍、資料最小化與安全維護原則。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=I0050021',
    link: '個人資料保護法'
  },
  {
    title: '人格權與民事責任',
    body: '侮辱、散布隱私、侵害名譽、信用、隱私或其他人格法益，可能衍生停止侵害、損害賠償或回復名譽等民事責任。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=B0000001',
    link: '民法第18條、第184條、第195條'
  },
  {
    title: '刑事風險',
    body: '依具體內容與情境，威脅、強制、公然侮辱、誹謗、妨害秘密或其他行為，可能涉及刑法；單靠關鍵字不能判定犯罪成立。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=C0000001',
    link: '中華民國刑法'
  },
  {
    title: '歧視與差別待遇',
    body: '以種族、階級、語言、思想、宗教、性別、性傾向、年齡、身心障礙等作為羞辱或不利處理依據，可能另涉就業歧視與平等保障。',
    href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0090001',
    link: '就業服務法第5條及相關平等法制'
  }
];

const LEGAL_NOTES = {
  bullying: '職場霸凌是否成立，須依職業安全衛生法第22條之1及相關準則，綜合職務或權勢關係、業務必要性、持續性或重大情節與身心危害判斷。',
  publicService: '若當事人具公務人員身分，應另依公務人員保障法及公務人員執行職務安全及衛生防護辦法分流處理。',
  sexual: '涉及性要求、性意味或性別歧視的文字、圖片、貼圖或言行，依場域可能適用性別平等工作法、性騷擾防治法或性別平等教育法。',
  stalking: '跟蹤騷擾法制通常要求反覆或持續、違反意願、與性或性別有關，並使人心生畏怖且足以影響日常生活或社會活動。',
  privacy: '個人資料保護法要求蒐集、處理與利用具特定目的、必要性與適法基礎；健康、醫療等資料須特別審慎。',
  dignity: '侮辱、威脅、散布隱私或貶抑人格，除組織內部責任外，依情節亦可能涉及民事人格權或刑事責任。',
  campus: '校園事件須依雙方身分與行為類型，分流適用校園霸凌防制準則或性別平等教育法。',
  client: '對案家、服務對象或家屬的不當言詞，除服務品質與契約風險外，也可能反向形成勞工與第三方職場不法侵害事件。'
};

const RISK_RULES = [
  {
    id: 'severe-insult',
    category: '侮辱或人格貶抑',
    severity: 'severe',
    weight: 24,
    regex: /(白痴|智障|腦殘|廢物|垃圾|有病|神經病|沒救|去死|閉嘴|滾蛋|滾開|欠罵|不要臉|噁心|低能)/giu,
    reason: '將工作問題轉化為對人格、能力或身心狀態的貶抑，容易造成敵意或冒犯性環境，也會讓正式紀錄失焦。',
    legal: ['bullying', 'dignity'],
    replace: ''
  },
  {
    id: 'threat',
    category: '威脅或不當施壓',
    severity: 'severe',
    weight: 24,
    regex: /(你給我小心|我不會放過你|讓你混不下去|弄死你|打死你|知道你住哪|等你下班|走著瞧|讓你後悔|你試試看|有你好看)/giu,
    reason: '使用安全、人身、工作存續或報復暗示迫使對方服從，可能超出管理必要範圍，並產生恐懼與證據風險。',
    legal: ['bullying', 'stalking', 'dignity'],
    replace: ''
  },
  {
    id: 'dismissal-threat',
    category: '以解僱或排班作為即時威嚇',
    severity: 'severe',
    weight: 20,
    regex: /(不想做就離職|不爽就離職|不用來了|明天不用來|給我滾出公司|不配合就不排班|再不回(?:我)?就(?:不用|不再)(?:服務|排班|來|合作)(?:你|您)?(?:了)?)/giu,
    reason: '將人事處分當成情緒性威嚇，未區分事實、程序、權限與申辯機會，可能形成權勢壓迫或不利處分爭議。',
    legal: ['bullying', 'dignity'],
    replace: '如涉及工作或服務安排調整，將依既定程序另行通知，並提供必要說明。'
  },
  {
    id: 'sexual',
    category: '性或性別相關不當言詞',
    severity: 'severe',
    weight: 26,
    regex: /(身材真好|胸部|屁股|陪睡|上床|約炮|親一個|寶貝|老婆大人|老公大人|美女陪我|帥哥陪我|性能力|月經來喔|娘娘腔|男人婆|死gay|同性戀噁心)/giu,
    reason: '與工作或服務無關的性、身體或性別評論，可能造成敵意、冒犯或權勢性騷擾風險；貼圖或表情符號亦可能構成言行的一部分。',
    legal: ['sexual', 'dignity'],
    replace: ''
  },
  {
    id: 'persistent-contact',
    category: '持續聯絡或追蹤暗示',
    severity: 'severe',
    weight: 18,
    regex: /(我會一直傳到你回|每天找你|一直打給你|不回就一直傳|我會去你家|我知道你在哪|跟到你回覆|堵你|守在你家|守在公司)/giu,
    reason: '反覆通訊、到住居所或工作場所守候、掌握行蹤等內容，可能讓對方心生畏怖；應立即停止非必要接觸並改走正式管道。',
    legal: ['stalking', 'privacy', 'dignity'],
    replace: '後續請僅透過正式聯絡管道處理相關事項。'
  },
  {
    id: 'sarcasm',
    category: '嘲諷或反話',
    severity: 'moderate',
    weight: 10,
    regex: /(呵呵|笑死|真厲害|好棒棒|真有你的|了不起喔|天才喔|可憐哪|是不是很會|不愧是你)/giu,
    reason: '嘲諷無法清楚表達工作期待，容易被理解為羞辱或公開貶抑，也不利後續調查還原事實。',
    legal: ['bullying', 'dignity'],
    replace: ''
  },
  {
    id: 'competence-attack',
    category: '針對能力的羞辱式質問',
    severity: 'moderate',
    weight: 14,
    regex: /(你到底會不會|你到底懂不懂|講幾次才懂|講幾次才會|這也不會|連這都不懂|有沒有帶腦|腦袋裝什麼|到底有沒有在聽)/giu,
    reason: '應指出具體錯誤、標準與修正方式，而不是用反問否定對方整體能力。',
    legal: ['bullying', 'dignity'],
    replace: '請確認是否已掌握相關操作與要求'
  },
  {
    id: 'absolute-blame',
    category: '絕對化責備',
    severity: 'moderate',
    weight: 8,
    regex: /(你每次都|你永遠都|你從來都不|又是你|都是你害的|只有你會這樣|每次出事都有你)/giu,
    reason: '「永遠、每次、都是」通常欠缺可核對的事件範圍，容易把問題人格化。宜改成具體日期、事項與可觀察結果。',
    legal: ['bullying', 'dignity'],
    replace: '目前觀察到此事項曾重複發生，'
  },
  {
    id: 'command-contempt',
    replaceWholeSentence: true,
    category: '命令式貶抑語氣',
    severity: 'moderate',
    weight: 10,
    regex: /((?:大家)?自己看著辦|少廢話|不要找藉口|照做就對了|我說了算|沒有資格問|輪不到你說話|叫你做就做|不要囉嗦)/giu,
    reason: '管理指示仍應說明工作目的、範圍、期限及可反映困難的管道；封閉溝通可能被理解為權勢壓迫。',
    legal: ['bullying', 'dignity'],
    replace: '請依既定規範辦理；如有困難，請提出具體原因，以便協調。'
  },
  {
    id: 'public-shaming',
    category: '公開羞辱或揭露隱私',
    severity: 'severe',
    weight: 20,
    regex: /(我要讓大家知道|丟到群組讓大家看|公布你的|公開你的|把你資料貼出來|讓全公司看笑話|告訴所有人你的事)/giu,
    reason: '將個人錯誤、申訴、健康、家庭或身分資訊公開，可能逾越業務必要範圍，並侵害隱私、名譽與個資權益。',
    legal: ['bullying', 'privacy', 'dignity'],
    replace: '此事項將僅於必要範圍內，透過適當管道處理。'
  },
  {
    id: 'discrimination',
    category: '歧視或身分貶抑',
    severity: 'severe',
    weight: 22,
    regex: /(外勞就是|原住民就是|老人都|年輕人都|女人就是|男人就是|殘障|跛子|瞎子|聾子|死胖子|肥婆|老女人|老頭子|低端人口)/giu,
    reason: '以性別、年齡、族群、國籍、身心狀態或其他身分作為羞辱與差別待遇依據，可能涉及平等、就業歧視與人格權風險。',
    legal: ['bullying', 'sexual', 'dignity'],
    replace: ''
  },
  {
    id: 'client-rudeness',
    replaceWholeSentence: true,
    category: '對案家或服務對象的不禮貌表述',
    severity: 'moderate',
    weight: 10,
    audience: ['client', 'public'],
    regex: /(你們家(?:真的)?(?:很)?(?:麻煩|難搞)|不要再煩|這不是我的事|愛怎樣就怎樣|自己負責|講不聽|難搞|奧客|別再打來|不想服務你)/giu,
    reason: '服務界線可以明確，但不宜以情緒性標籤或拒絕溝通表達；宜說明可提供的範圍、不能提供的原因與後續管道。',
    legal: ['client', 'dignity'],
    replace: '目前在服務溝通上仍有需要釐清之處。請依既定服務範圍處理；如需調整或協助，請透過正式管道提出。'
  },
  {
    id: 'pressure-deadline',
    replaceWholeSentence: true,
    category: '缺乏程序的緊迫施壓',
    severity: 'moderate',
    weight: 8,
    regex: /(馬上給我|立刻給我|現在就給我|五分鐘內給我|不管你用什麼方法|今天做不完別下班)/giu,
    reason: '如確有急迫性，應交代原因、工作優先順序、可用資源與合理期限，而非以情緒性命令要求無條件完成。',
    legal: ['bullying'],
    replace: '此事項具有時效性，請優先處理；如期限確有困難，請立即說明，以便調整安排。'
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
const EMOJI_REGEX = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
const EXCESSIVE_PUNCTUATION = /([!?！？])\1{1,}/gu;

const TEMPLATE_BY_PURPOSE = {
  remind: '請協助確認目前辦理進度，並於可行時間內回覆；如有困難，請說明原因，以便協調後續安排。',
  correct: '目前發現執行內容與既定要求可能不一致，請協助確認並修正；如對標準或操作方式有疑問，請提出討論。',
  rule: '為確保作業一致與保障雙方權益，後續請依既定規範辦理；如有特殊情形，請先提出說明。',
  refuse: '此項要求目前不在可提供或可核准的範圍內，原因如下：＿＿＿＿。如需其他可行方案，請透過正式管道提出。',
  schedule: '關於後續排班、分工或服務安排，將依既定程序與實際需求辦理；如有困難，請於期限前提出，以便協調。',
  general: '請協助確認相關事項；如有不同理解或執行困難，請具體說明，以便共同處理。'
};

const OPENING_BY_AUDIENCE = {
  coworker: '',
  supervisor: '',
  client: '您好，',
  student: '您好，',
  public: '您好，'
};

function $(id) {
  return document.getElementById(id);
}

function initialize() {
  renderLegalReferences();
  bindEvents();
  updateCharCount();

  const skipIntro = sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
  if (skipIntro) {
    enterApplication(false);
  }
}

function bindEvents() {
  $('enterAppButton').addEventListener('click', () => enterApplication(true));
  $('showIntroButton').addEventListener('click', showIntro);
  $('showPrivacyButton').addEventListener('click', () => $('privacyDialog').showModal());
  $('closePrivacyButton').addEventListener('click', () => $('privacyDialog').close());
  $('privacyDialog').addEventListener('click', (event) => {
    if (event.target === $('privacyDialog')) $('privacyDialog').close();
  });
  $('sourceText').addEventListener('input', updateCharCount);
  $('sourceText').addEventListener('paste', handlePasteInspection);
  $('loadExampleButton').addEventListener('click', loadExample);
  $('analyzeButton').addEventListener('click', handleAnalyze);
  $('clearButton').addEventListener('click', clearAll);
  $('copyButton').addEventListener('click', () => copyText($('safeText').value, '已複製建議版本。'));
  $('copyWithNotesButton').addEventListener('click', copyWithNotes);
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

function loadExample() {
  $('audienceSelect').value = 'client';
  $('purposeSelect').value = 'remind';
  $('sourceText').value = '你們家真的很難搞，講幾次才懂？再不回我就不用服務你了！😡 [貼圖] 王小明的電話是0912345678，病歷號A123456，大家自己看著辦。';
  updateCharCount();
  $('sourceText').focus();
}

function clearAll() {
  $('sourceText').value = '';
  $('safeText').value = '';
  $('resultContent').hidden = true;
  $('emptyState').hidden = false;
  $('riskBadge').className = 'risk-badge neutral';
  $('riskBadge').textContent = '尚未檢核';
  $('findingList').innerHTML = '';
  $('copyStatus').textContent = '';
  $('inputError').hidden = true;
  clipboardImageDetected = false;
  $('pasteNotice').hidden = true;
  updateCharCount();
  $('sourceText').focus();
}

function handlePasteInspection(event) {
  const items = [...(event.clipboardData?.items || [])];
  if (items.some(item => item.type.startsWith('image/'))) {
    clipboardImageDetected = true;
    $('pasteNotice').hidden = false;
  }
}

function handleAnalyze() {
  const raw = $('sourceText').value.trim();
  if (!raw) {
    $('inputError').textContent = '請先貼上準備傳送的訊息。';
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
    recordableTone: $('recordableToneOption').checked,
    clipboardImageDetected
  };

  const result = analyzeMessage(raw, options);
  renderResult(result);
}

function analyzeMessage(raw, options) {
  let safeText = raw.normalize('NFC');
  const findings = [];
  const uniqueFindingKeys = new Set();
  let removedCount = 0;
  let score = 0;

  const addFinding = (finding) => {
    const key = `${finding.type}|${finding.fragment}|${finding.title}`;
    if (uniqueFindingKeys.has(key)) return;
    uniqueFindingKeys.add(key);
    findings.push(finding);
  };

  if (options.clipboardImageDetected) {
    score += 10;
    removedCount += 1;
    addFinding({
      type: 'tone',
      title: '剪貼簿圖片或貼圖',
      severity: 'info',
      fragment: '圖片內容未讀取',
      reason: '貼圖或圖片可能包含嘲諷、性意味、威脅、個資或可識別人物。本網站基於資料最小化不讀取影像，建議改用明確、可留存的文字。',
      legalNotes: [LEGAL_NOTES.bullying, LEGAL_NOTES.sexual, LEGAL_NOTES.privacy]
    });
  }

  if (options.removeEmoji) {
    const stickerMatches = [...safeText.matchAll(STICKER_REGEX)];
    if (stickerMatches.length) {
      removedCount += stickerMatches.length;
      addFinding({
        type: 'tone',
        title: '貼圖標記',
        severity: 'info',
        fragment: stickerMatches.map(match => match[0]).join('、'),
        reason: '貼圖的語意高度依賴圖像與上下文，正式紀錄難以還原，也可能含嘲諷、性意味或壓迫訊息。',
        legalNotes: [LEGAL_NOTES.bullying, LEGAL_NOTES.sexual]
      });
      safeText = safeText.replace(STICKER_REGEX, '');
    }

    const emojiMatches = safeText.match(EMOJI_REGEX) || [];
    if (emojiMatches.length) {
      removedCount += emojiMatches.length;
      addFinding({
        type: 'tone',
        title: '表情符號',
        severity: 'info',
        fragment: [...new Set(emojiMatches)].join(' '),
        reason: '表情符號可能放大嘲諷、憤怒、性意味或輕蔑感，且不利正式紀錄與後續查證。',
        legalNotes: [LEGAL_NOTES.bullying, LEGAL_NOTES.sexual]
      });
      safeText = safeText.replace(EMOJI_REGEX, '');
    }

    const excessive = safeText.match(EXCESSIVE_PUNCTUATION) || [];
    if (excessive.length) {
      removedCount += excessive.length;
      addFinding({
        type: 'tone',
        title: '過度標點',
        severity: 'info',
        fragment: [...new Set(excessive)].join('、'),
        reason: '連續驚嘆號或問號容易被理解為怒斥、嘲諷或施壓，宜改為單一標點。',
        legalNotes: [LEGAL_NOTES.bullying]
      });
      safeText = safeText.replace(EXCESSIVE_PUNCTUATION, '$1');
    }
  }

  const privacySource = safeText;

  for (const rule of RISK_RULES) {
    if (rule.audience && !rule.audience.includes(options.audience)) continue;
    const matches = [...safeText.matchAll(rule.regex)];
    if (!matches.length) continue;

    score += rule.weight * Math.min(matches.length, 2);
    for (const match of matches.slice(0, 3)) {
      addFinding({
        type: 'tone',
        title: rule.category,
        severity: rule.severity,
        fragment: match[0],
        reason: rule.reason,
        legalNotes: rule.legal.map(key => LEGAL_NOTES[key]).filter(Boolean)
      });
    }

    const before = safeText;
    if (rule.severity === 'severe' || rule.replaceWholeSentence) {
      safeText = replaceSentencesContaining(safeText, rule.regex, rule.replace);
    } else {
      safeText = safeText.replace(rule.regex, rule.replace);
    }
    if (safeText !== before) removedCount += matches.length;
  }

  const privacyFindings = [];
  for (const rule of PII_RULES) {
    const matches = [...privacySource.matchAll(rule.regex)];
    if (!matches.length) continue;

    privacyFindings.push({
      type: 'privacy',
      title: rule.title,
      severity: 'severe',
      fragment: matches.slice(0, 3).map(match => match[0]).join('、'),
      reason: rule.reason,
      legalNotes: [LEGAL_NOTES.privacy]
    });
    score += 12;

    if (options.maskPii) {
      safeText = safeText.replace(rule.regex, rule.replacement);
      removedCount += matches.length;
    }
  }

  const healthMatches = [...privacySource.matchAll(HEALTH_TERMS)].map(match => match[0]);
  if (healthMatches.length) {
    privacyFindings.push({
      type: 'privacy',
      title: '健康或醫療資訊',
      severity: 'info',
      fragment: [...new Set(healthMatches)].slice(0, 8).join('、'),
      reason: '健康與醫療資訊通常具有高度敏感性。即使是傳給本人，也應確認群組成員、轉傳風險與是否真的需要寫入。',
      legalNotes: [LEGAL_NOTES.privacy]
    });
    score += 5;
  }

  privacyFindings.forEach(addFinding);

  safeText = cleanText(safeText);

  const severeToneFindings = findings.filter(item => item.type === 'tone' && item.severity === 'severe').length;
  const meaningfulLength = safeText.replace(/[\s，。；：、！？,.;:!?]/g, '').length;

  if (meaningfulLength < 8 || severeToneFindings >= 2) {
    safeText = buildFallbackMessage(options, severeToneFindings >= 2 ? '' : safeText);
  } else if (options.recordableTone) {
    safeText = makeRecordable(safeText, options);
  }

  if (!safeText) safeText = buildFallbackMessage(options, '');

  score = Math.min(100, score);
  const level = score >= 55 ? 'high' : score >= 20 ? 'medium' : 'low';
  const label = level === 'high' ? '高風險：建議重寫後再傳送' : level === 'medium' ? '中度風險：建議確認脈絡' : '較低風險：仍請人工確認';

  if (!findings.length) {
    findings.push({
      type: 'tone',
      title: '未發現明顯關鍵字風險',
      severity: 'info',
      fragment: '無',
      reason: '規則引擎未發現明顯辱罵、威脅、性或性別言詞、貼圖標記或明顯個資格式；仍可能存在上下文、權勢關係、頻率或隱含語意風險。',
      legalNotes: [LEGAL_NOTES.bullying]
    });
  }

  return {
    safeText,
    findings,
    score,
    level,
    label,
    privacyCount: privacyFindings.length,
    removedCount
  };
}

function replaceSentencesContaining(text, regex, replacement) {
  const flags = regex.flags.replace('g', '');
  const tester = new RegExp(regex.source, flags);
  const segments = text.split(/(?<=[。！？!?；;\n])/u);
  return segments.map(segment => {
    tester.lastIndex = 0;
    if (!tester.test(segment)) return segment;
    if (!replacement) return '';
    const trimmed = replacement.trim();
    return /[。！？!?]$/.test(trimmed) ? trimmed : `${trimmed}。`;
  }).join('');
}

function cleanText(text) {
  return text
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
    .replace(/真的很(?=目前|請|如|此)/g, '')
    .replace(/^[，。；：、！？,.;:!?\s]+|[，；：、,;:\s]+$/g, '')
    .trim();
}

function makeRecordable(text, options) {
  let output = text;
  output = output
    .replace(/為什麼/gu, '請說明')
    .replace(/到底/gu, '')
    .replace(/你們/gu, options.audience === 'client' ? '您與家屬' : '各位')
    .replace(/你/gu, options.audience === 'client' || options.audience === 'student' || options.audience === 'public' || options.audience === 'supervisor' ? '您' : '你')
    .replace(/我不管/gu, '為利事項處理')
    .replace(/給我/gu, '請')
    .replace(/馬上|立刻/gu, '請優先')
    .replace(/不要再/gu, '請停止')
    .replace(/不能/gu, '目前無法')
    .replace(/不准/gu, '請勿')
    .replace(/隨便/gu, '請依規範')
    .replace(/愛怎樣就怎樣/gu, '請依正式程序處理');

  output = cleanText(output);
  if (!/[。！？]$/.test(output)) output += '。';

  const opening = OPENING_BY_AUDIENCE[options.audience] || '';
  if (opening && !output.startsWith('您好')) output = opening + output;

  if (!/(請|建議|麻煩|協助|依|確認|說明|回覆|處理)/.test(output)) {
    output += `\n\n${TEMPLATE_BY_PURPOSE[options.purpose]}`;
  }

  return output;
}

function buildFallbackMessage(options, residualText) {
  const opening = OPENING_BY_AUDIENCE[options.audience] || '';
  const residual = cleanText(residualText);
  const base = TEMPLATE_BY_PURPOSE[options.purpose] || TEMPLATE_BY_PURPOSE.general;
  if (residual.length >= 8) {
    const punctuated = /[。！？]$/.test(residual) ? residual : `${residual}。`;
    return `${opening}${punctuated}\n\n${base}`;
  }
  return `${opening}${base}`;
}

function renderResult(result) {
  $('emptyState').hidden = true;
  $('resultContent').hidden = false;
  $('safeText').value = result.safeText;
  $('riskBadge').className = `risk-badge ${result.level}`;
  $('riskBadge').textContent = `${result.label}（${result.score}）`;
  $('findingCount').textContent = result.findings.filter(item => item.type === 'tone').length;
  $('privacyCount').textContent = result.privacyCount;
  $('removedCount').textContent = result.removedCount;
  $('copyStatus').textContent = '';

  const fragment = document.createDocumentFragment();
  for (const finding of result.findings) {
    const card = document.createElement('article');
    card.className = `finding-card ${finding.severity === 'severe' ? 'severe' : finding.severity === 'info' ? 'info' : ''}`;

    const top = document.createElement('div');
    top.className = 'finding-top';
    const title = document.createElement('div');
    title.className = 'finding-title';
    title.textContent = finding.title;
    const severity = document.createElement('span');
    severity.className = 'severity-label';
    severity.textContent = finding.severity === 'severe' ? '較高風險' : finding.severity === 'info' ? '提醒' : '中度風險';
    top.append(title, severity);

    const quote = document.createElement('div');
    quote.className = 'finding-fragment';
    quote.textContent = finding.fragment;

    const reason = document.createElement('p');
    reason.textContent = finding.reason;

    card.append(top, quote, reason);

    for (const noteText of finding.legalNotes) {
      const note = document.createElement('p');
      note.className = 'legal-note';
      note.textContent = `法制提醒：${noteText}`;
      card.appendChild(note);
    }

    fragment.appendChild(card);
  }
  $('findingList').replaceChildren(fragment);
  $('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copyText(text, successMessage) {
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

function copyWithNotes() {
  const notes = [...$('findingList').querySelectorAll('.finding-card')].map((card, index) => {
    const title = card.querySelector('.finding-title')?.textContent || '提醒';
    const fragment = card.querySelector('.finding-fragment')?.textContent || '';
    const paragraphs = [...card.querySelectorAll('p')].map(p => p.textContent).join('\n');
    return `${index + 1}. ${title}\n原片段：${fragment}\n${paragraphs}`;
  }).join('\n\n');

  const combined = `【建議版本】\n${$('safeText').value}\n\n【修改備註】\n${notes}\n\n【使用界線】\n以上為傳送前風險提示，不是違法、職場霸凌、性騷擾或跟蹤騷擾成立與否的法律認定。`;
  copyText(combined, '已複製建議版本與備註。');
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

document.addEventListener('DOMContentLoaded', initialize);

// Exported for lightweight local tests; ignored by browsers.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeMessage, cleanText, makeRecordable, buildFallbackMessage };
}
