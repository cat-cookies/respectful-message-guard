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

const CORPUS = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.RISK_CORPUS_DATA) return globalThis.RISK_CORPUS_DATA;
  if (typeof module !== 'undefined' && module.exports) return require('./risk-corpus.js');
  throw new Error('離線風險語料庫未載入。');
})();

const REWRITE_ENGINE = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.MESSAGE_REWRITE_ENGINE) return globalThis.MESSAGE_REWRITE_ENGINE;
  if (typeof module !== 'undefined' && module.exports) return require('./rewrite-engine.js');
  throw new Error('離線潤稿引擎未載入。');
})();

const EXPERT_CORPUS = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.EXPERT_RISK_CORPUS) return globalThis.EXPERT_RISK_CORPUS;
  if (typeof module !== 'undefined' && module.exports) return require('./expert-corpus.js');
  return { entries: [], entryCount: 0, version: 'unavailable' };
})();
const EXPERT_ENTRIES = EXPERT_CORPUS.entries || [];

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
    .replace(/通过/g, '通過');
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

function getSourceNotes(keys) {
  return (keys || [])
    .map(key => SOURCE_CATALOG[key] ? ({ id: key, ...SOURCE_CATALOG[key] }) : null)
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



const LINGUISTIC_RULES = [
  ['LING-PERSON-COGNITION','人格貶低：智力、理解與學習能力羞辱','severe',26,/(?:白癡|智障|腦殘|沒腦|沒帶腦|腦袋(?:裝|進水|壞|有問題)|智商(?:低|有問題|等於零)|理解能力(?:有問題|有缺陷|太差|低)|看不懂人話|聽不懂人話|連(?:這|這點|基本|字|話)[^。！？!?]{0,10}(?:都不會|都不懂|都看不懂)|小學生[^。！？!?]{0,12}(?:都比你|都會)|幼兒園[^。！？!?]{0,12}(?:都比你|都會))/u],
  ['LING-PERSON-ANIMAL','人格貶低：動物化、物化或非人化羞辱','severe',24,/(?:豬都比你|狗都比你|連狗都不如|公司養你不如養狗|寄生蟲|害群之馬|老鼠屎|蛀蟲|米蟲|草履蟲|單細胞生物|畜生|像(?:豬|狗|猴子|烏龜|蝸牛|樹懶)[^。！？!?]{0,10}(?:一樣|似的)?)/u],
  ['LING-PERSON-WORTH','人格貶低：存在價值與職業價值全盤否定','severe',26,/(?:公司的?累贅|團隊的?累贅|負資產|毒瘤|拖油瓶|沒產值|沒有價值|毫無價值|一文不值|最爛的?(?:人|員工|同事)|全公司最爛|公司最錯誤的決定就是錄用你|不配(?:領薪水|留在|做這份工作)|吃白飯|白吃白喝|浪費公司(?:資源|薪水|空氣)|你(?:這輩子|一輩子)也就這樣)/u],
  ['LING-ANGER-EXPEL','情緒暴力：咆哮、驅逐與噁心羞辱','severe',26,/(?:看到你[^。！？!?]{0,8}(?:就火大|就生氣|就噁心)|滾(?:出去|蛋|回去|開)|消失在我眼前|閉嘴|這裡輪不到你說話|看著你的臉[^。！？!?]{0,8}噁心|給我滾|馬上滾)/u],
  ['LING-THREAT-VIOLENCE','威脅：人身安全、報復或暴力暗示','severe',34,/(?:被車撞|死得很難看|活得不耐煩|欠修理|一巴掌|不要逼我動手|讓你全家不得安寧|跟我作對[^。！？!?]{0,12}沒有好下場|讓你後悔一輩子|走在路上[^。！？!?]{0,8}被打|玩死你|弄死你|殺了你|讓你生不如死)/u],
  ['LING-THREAT-CAREER','權勢壓迫：職涯封殺、黑名單與逼退','severe',32,/(?:業界黑掉|列入黑名單|讓你在(?:這一行|業界)[^。！？!?]{0,12}(?:混不下去|消失|永不錄用)|打一通電話[^。！？!?]{0,12}(?:封殺|沒工作)|自動離職|自己遞辭呈|自己提離職|受不了就走|不爽就走|大門沒鎖[^。！？!?]{0,10}走|讓你待不下去|看你能撐多久)/u],
  ['LING-THREAT-PAY','權勢壓迫：薪資、考績、獎金與工作利益威脅','severe',30,/(?:不想要薪水|是不是不想要薪水|扣(?:你)?(?:薪|薪水|半薪|全勤|考績|獎金)|年終[^。！？!?]{0,12}(?:別想|不發|一毛都沒有)|考績[^。！？!?]{0,12}(?:最後一名|丙等|丁等|扣分|降一級)|不給(?:加薪|升遷|排班|續約)|不排班|砍班|少排班|薪水減半)/u],
  ['LING-RETALIATION','權勢壓迫：申訴、檢舉或求助後報復','severe',36,/(?:敢|如果|要是)?[^。！？!?]{0,4}(?:申訴|檢舉|告狀|找人資|找勞工局|找勞檢|找工會|投訴)[^。！？!?]{0,24}(?:開除|解僱|黑名單|封殺|調職|減薪|扣考績|不續約|不排班|吃虧|死得很難看)|(?:申訴|檢舉)[^。！？!?]{0,20}沒用[^。！？!?]{0,20}(?:我熟|有關係)/u],
  ['LING-GASLIGHT','心理操控：煤氣燈、否定記憶與責任轉嫁','moderate',22,/(?:你記錯了|你聽錯了|我什麼時候說過|你是不是有妄想|產生幻覺|受害妄想|你太敏感|玻璃心|只是玩笑|開不起玩笑|明明是你的錯|都是你自己的問題|你自己工作沒做好[^。！？!?]{0,12}(?:才會|所以)|全公司就你問題最多|大家都覺得我對你很好)/u],
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
  ['LING-SEX-TOUCH','性騷擾：合理化不受歡迎的身體接觸','severe',34,/(?:摸一下[^。！？!?]{0,12}不會少塊肉|摟腰[^。！？!?]{0,12}(?:正常|社交)|主管摸你[^。！？!?]{0,12}看得起|碰到(?:腿|腰|手|身體)[^。！？!?]{0,14}(?:大驚小怪|正常|而已)|捏捏肩膀[^。！？!?]{0,12}(?:放鬆|防衛)|擁抱[^。！？!?]{0,12}(?:國際禮儀|公司文化)|摸衣服[^。！？!?]{0,12}(?:材質|研究))/u],
  ['LING-GENDER-STEREO','性別歧視：性別刻板印象、男性氣概與女性角色羞辱','severe',30,/(?:女生果然不適合|女人[^。！？!?]{0,12}(?:不適合|回家|嫁人|花瓶)|頭髮長腦袋短|月經來了|更年期[^。！？!?]{0,8}(?:情緒|亂咬)|大男人[^。！？!?]{0,12}(?:哭|痛|不是男人)|娘娘腔|男生[^。！？!?]{0,12}(?:不能哭|不會喝酒|做秘書)|女生[^。！？!?]{0,12}(?:行政|不用升遷|只要漂亮|撒嬌))/u],
  ['LING-PREGNANCY','就業歧視：懷孕、產假、育兒與工作不利益綁定','severe',34,/(?:懷孕[^。！？!?]{0,22}(?:沒獎金|不錄用|不續約|位置沒了|不能升遷|麻煩|拖累)|產假[^。！？!?]{0,20}(?:位置|沒了|不續約|考績)|產檢[^。！？!?]{0,18}(?:拿薪水|拖累|請假太多)|接小孩[^。！？!?]{0,16}(?:心思不在|考績)|集乳室[^。！？!?]{0,12}(?:上班|擠奶)|媽媽員工[^。！？!?]{0,12}(?:包袱|絆腳石))/u],
  ['LING-HEALTH-DISCRIM','歧視：疾病、身心狀況與障礙污名','severe',31,/(?:身心科[^。！？!?]{0,14}(?:神經病|發瘋)|憂鬱症[^。！？!?]{0,16}(?:免死金牌|脆弱|不升遷)|精神病史[^。！？!?]{0,16}(?:開除|不適任)|恐慌發作[^。！？!?]{0,12}(?:住精神病院|不適任)|殘障嗎|耳朵有問題[^。！？!?]{0,10}(?:殘障|聽不清楚)|走路一拐一拐[^。！？!?]{0,12}(?:形象|後線))/u],
  ['LING-IDENTITY-DISCRIM','歧視：年齡、國籍、文化、宗教、性傾向或信念羞辱','severe',31,/(?:外籍[^。！？!?]{0,18}(?:沒素養|加班費|回你祖國)|口音[^。！？!?]{0,12}(?:土|鄉下|落後)|老員工[^。！？!?]{0,14}(?:化石|老油條|毒瘤)|年紀大[^。！？!?]{0,14}(?:沒人要|退休|等死)|同性戀[^。！？!?]{0,14}(?:噁心|愛滋|偷看)|跨性別[^。！？!?]{0,14}(?:噁心|廁所)|宗教[^。！？!?]{0,14}(?:邪門|不乾淨|不給面子)|政治立場[^。！？!?]{0,14}(?:不忠誠|處理掉))/u],
  ['LING-PRIVACY','隱私侵害：婚育、健康、財務與私人生活刺探','moderate',24,/(?:交過幾個[^。！？!?]{0,8}(?:男朋友|女朋友)|有沒有同居|做到哪一步|什麼時候生小孩|為什麼不結婚|存款有多少|買房[^。！？!?]{0,12}錢哪裡來|看了什麼科|藥袋拿來|診斷書拍來|主治醫生[^。！？!?]{0,12}(?:名字|診間)|週末跟誰出去|聊天紀錄拿來|(?:看|查看|檢查)[^。！？!?]{0,6}聊天紀錄|交出(?:你的|妳的|您的)?私人手機|私人社群[^。！？!?]{0,12}(?:加我|不准封鎖))/u],
  ['LING-DIGITAL-HARASS','數位騷擾：群組壓迫、社群監控與非工作時間轟炸','moderate',24,/(?:半夜[^。！？!?]{0,12}(?:30則|三十則|連續)[^。！？!?]{0,12}訊息|群組[^。！？!?]{0,16}(?:3分鐘|三分鐘|5分鐘|五分鐘)[^。！？!?]{0,12}(?:回覆|收到)|不加主管[^。！？!?]{0,12}(?:Facebook|Instagram|臉書|IG)[^。！？!?]{0,14}考績|退群組[^。！？!?]{0,14}(?:申誡|不合群)|公開[^。！？!?]{0,10}(?:定位|睡姿照片|私人失誤))/u]
].map(([id, category, severity, weight, regex]) => ({
  id, category, severity, weight, regex,
  warning: category.includes('性騷擾') ? '這類言詞可能涉及性要求、性意味、性別歧視、權勢交換或身體界線；工作場合應特別避免。'
    : category.includes('歧視') ? '這類言詞把個人身分、健康或性別特徵作為羞辱或不利益依據，具有明顯差別待遇風險。'
    : category.includes('威脅') || category.includes('權勢壓迫') ? '這類言詞把權力、人事、薪資、職涯或人身不利益當作施壓工具，具有高度權勢濫用風險。'
    : category.includes('職權刁難') || category.includes('過度監督') ? '這類內容可能逾越合理管理範圍，形成不合理工作分派、過度監督、資源阻礙或懲罰性管理。'
    : category.includes('冷暴力') ? '這類內容可能形成孤立、排除、造謠、公開羞辱或敵意工作環境。'
    : category.includes('心理操控') ? '這類內容可能透過否定記憶、感受或合理界線，將責任轉回對方並合理化不當管理。'
    : '這類言詞已從工作事實轉向人格、尊嚴或敵意攻擊，應改回可核對的工作內容。',
  safeAction: category.includes('性騷擾') ? '刪除性意味、身體評論、親密暗示與權勢交換，改以客觀工作任務和職能標準溝通。'
    : category.includes('歧視') ? '移除對身分、健康、性別、年齡或文化的評價，只使用與職務直接相關的客觀標準。'
    : category.includes('職權刁難') || category.includes('過度監督') ? '重新確認工作必要性、合理期限、資源、權限與一致標準，避免懲罰性或去技能化安排。'
    : category.includes('冷暴力') ? '停止孤立、造謠與公開羞辱；必要會議、資訊與資源應依職務公平提供。'
    : category.includes('威脅') || category.includes('權勢壓迫') ? '人事、薪酬與懲處應依獨立事由和正式程序辦理，不用威嚇或報復語句推動。'
    : '刪除人格與尊嚴評價，改寫成具體事實、工作標準、行動與期限。',
  legal: category.includes('性騷擾') ? ['GEEA12','GEEA13'] : category.includes('歧視') ? ['EMPLOYMENT_EQUALITY','OSH22-1'] : ['OSH22-1','WBB2','CIVIL_DIGNITY']
}));

const WORK_LINGUISTIC_RULES = [
  ['WORK-EXCLUDE-PEERS','工作內容：要求集體孤立或禁止同事互動',/(?:不准|禁止|不要)[^。！？!?]{0,10}(?:跟|幫|理)[^。！？!?]{0,12}(?:他|她|你)|誰敢幫[^。！？!?]{0,12}(?:一起滾|一起調職)|集體已讀不回|不准跟[^。！？!?]{0,8}吃飯/u],
  ['WORK-PUBLIC-SHAME','工作內容：公開公審、強迫羞辱或連帶懲罰',/(?:全組公審|輪流說[^。！？!?]{0,10}缺點|公開朗讀[^。！？!?]{0,10}(?:檢討|失敗)|當眾道歉|全組不准下班|全組[^。！？!?]{0,12}(?:寫檢討|考績降))/u],
  ['WORK-MICRO-SURVEIL','工作內容：超密度監控、私人裝置或行蹤回報',/(?:每(?:15|十五)分鐘[^。！？!?]{0,12}(?:進度|日誌)|每小時[^。！？!?]{0,12}自拍|交出私人手機|螢幕錄影|滑鼠[^。！？!?]{0,12}(?:沒動|軌跡)|上廁所[^。！？!?]{0,14}(?:次|分鐘)|隨時回報[^。！？!?]{0,12}在哪裡)/u],
  ['WORK-DESKILL-HUMILIATE','工作內容：懲罰性去技能化或降職羞辱',/(?:掃廁所|刷馬桶|洗全組(?:杯子|咖啡杯)|幫全組訂便當|坐著看牆壁|去旁邊罰站|高階[^。！？!?]{0,12}(?:影印|跑腿|倒水)|降職[^。！？!?]{0,10}新人助理)/u],
  ['WORK-RESOURCE-SABOTAGE','工作內容：故意阻斷必要資訊、帳號、設備或資源',/(?:故意不給[^。！？!?]{0,14}(?:帳號|資料|規格|交接|電腦|權限)|撤除[^。！？!?]{0,10}(?:辦公桌|電腦|權限)|權限全部鎖死|不提供[^。！？!?]{0,10}(?:系統帳號|工作資料)|隱瞞重要[^。！？!?]{0,12}(?:通知|資訊))/u],
  ['WORK-MOVING-STANDARD','工作內容：任意反覆改變標準或無實質必要重工',/(?:每天變更[^。！？!?]{0,12}(?:驗收標準|工作標準)|雖然沒錯[^。！？!?]{0,10}(?:全部重做|重做一遍)|重寫(?:10|十|20|二十)遍|換(?:50|五十)種[^。！？!?]{0,8}(?:顏色|版本))/u],
  ['WORK-FORCED-PRIVATE-SOCIAL','工作內容：強迫私人社交或私人帳號連結工作利益',/(?:不加主管[^。！？!?]{0,10}(?:Facebook|Instagram|LINE|私人社群)[^。！？!?]{0,14}(?:考績|不合群|記過)|週末跟誰出去[^。！？!?]{0,12}(?:報告|交代)|聊天紀錄[^。！？!?]{0,12}(?:拿來|交出))/u],
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
  const fragments = normalizeText(text)
    .split(/(?<=[。！？!?；;\n])/u)
    .map(x => x.trim())
    .filter(x => compactExpertText(x).length >= 3);
  const findings = [];
  let score = 0;
  const usedEntryIds = new Set();
  const usedDomains = new Set();

  for (const fragment of fragments.slice(0, 80)) {
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
    const minThreshold = compact.length <= 7 ? 0.60 : compact.length <= 14 ? 0.48 : 0.42;
    if (best.similarity < minThreshold) continue;
    const entry = best.prepared.entry;
    if (usedEntryIds.has(entry.id)) continue;
    usedEntryIds.add(entry.id);
    // 同一長句如果連續命中同一領域，只保留最具代表性者，避免卡片洗版。
    if (usedDomains.has(entry.domain) && findings.length >= 5) continue;
    usedDomains.add(entry.domain);
    score += Math.round((entry.weight || 18) * Math.min(1, Math.max(0.65, best.similarity)));
    findings.push({
      type: 'tone',
      source,
      corpusId: entry.id,
      title: entry.domain,
      severity: entry.severity || 'moderate',
      fragment,
      canonicalPhrase: '完整案例相似語句',
      reason: `${entry.warning} 本句與離線案例「${entry.category}」的語言結構相近（相似度 ${Math.round(best.similarity * 100)}%）。`,
      safeAction: entry.safeAction,
      legalNotes: getLegalNotes(entry.legal),
      sourceNotes: [],
      matchedExample: entry.text,
      expertSimilarity: Math.round(best.similarity * 100),
      expertDomain: entry.domain
    });
    if (findings.length >= 12) break;
  }
  return { findings: dedupeFindings(findings), score };
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
      legalNotes: getLegalNotes(entry.legal),
      sourceNotes: getSourceNotes(entry.sources),
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
      workContentRisk: Boolean(entry.workContentRisk),
      contextSensitive: Boolean(entry.contextSensitive)
    });
  }

  for (const rule of LINGUISTIC_RULES) {
    rule.regex.lastIndex = 0;
    const match = rule.regex.exec(normalized);
    if (!match) continue;
    score += rule.weight;
    findings.push({
      type: 'tone', source, corpusId: rule.id, title: rule.category, severity: rule.severity,
      fragment: match[0], canonicalPhrase: '語言學結構規則', reason: rule.warning, safeAction: rule.safeAction,
      legalNotes: getLegalNotes(rule.legal), sourceNotes: [], linguisticRule: true
    });
  }

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
  const professional = hasProfessionalBasis(substance.basis || '');

  for (const key of keys) {
    const result = sanitizeOutputField(substance[key] || '', options, { allowProfessionalTerms: professional });
    cleaned[key] = result.text;
    blocked += result.blocked;
  }
  cleaned.tone = substance.tone || 'directive';
  return { substance: cleaned, blocked };
}

function composeSafeMessage(substance, options) {
  // 重要安全不變量：
  // 1. 本函式只接收結構化「實質工作內容」，沒有 raw/original message 參數。
  // 2. 職務依據預設只供合理性檢核，不自動出現在對外訊息。
  // 3. 潤稿引擎不得新增使用者未提供的事實、日期、人名、制裁或法律結論。
  return REWRITE_ENGINE.rewriteStructuredMessage(substance, options);
}

function analyzeMessage(raw, substance = {}, options = {}) {
  const normalizedOptions = {
    audience: options.audience || 'coworker',
    purpose: options.purpose || 'general',
    removeEmoji: options.removeEmoji !== false,
    maskPii: options.maskPii !== false,
    recordableTone: options.recordableTone !== false,
    clipboardImageDetected: Boolean(options.clipboardImageDetected),
    rewriteStyle: options.rewriteStyle || 'natural',
    includeBasis: Boolean(options.includeBasis)
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
  const composed = composeSafeMessage(sanitized.substance, normalizedOptions);

  // 工作內容本身若出現高風險，不應用「禮貌改寫」漂白成可執行命令。
  // 必須先修正工作要求或補足必要的職務依據。
  let safeText = composed.text;
  let copyable = composed.copyable;
  let outputNotice = composed.notice;
  let residualCount = 0;

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
      safeText = '';
      copyable = false;
      outputNotice = '建議版本因防漏檢核未通過而被阻止。請修改實質內容欄位後重新產生。';
      score += 30;
    }
  }

  const deduped = dedupeFindings(findings);
  const privacyCount = deduped.filter(item => item.type === 'privacy').length;
  const toneRiskCount = deduped.filter(item => item.type === 'tone' && item.severity !== 'info').length;
  const workRiskCount = deduped.filter(item => item.type === 'work' && item.severity !== 'info').length;
  const corpusHitCount = deduped.filter(item => item.corpusId && !item.corpusId.startsWith('PII-') && !item.corpusId.startsWith('FORMAT-') && item.corpusId !== 'OUTPUT-BLOCK').length;

  score = Math.min(100, score);
  const level = score >= 55 ? 'high' : score >= 20 ? 'medium' : 'low';
  const label = level === 'high'
    ? '高風險訊號明顯：請先修改後再傳送'
    : level === 'medium'
      ? '已有明顯風險訊號：建議先調整'
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
    workRiskCount,
    corpusHitCount,
    blockedCount: sanitized.blocked + residualCount,
    rewriteStyle: composed.style || normalizedOptions.rewriteStyle,
    rewriteQualityScore: composed.qualityScore || 0,
    rewriteVariants: composed.variants || {},
    rewriteCoverage: composed.coverage || {},
    rewriteVariantCoverage: composed.variantCoverage || {},
    corpusVersion: CORPUS.version,
    corpusPhraseCount: PHRASE_ENTRIES.length,
    corpusPatternCount: PATTERN_ENTRIES.length,
    corpusContextCount: CONTEXT_ENTRIES.length,
    corpusSourceCount: Object.keys(SOURCE_CATALOG).length,
    expertCorpusCount: EXPERT_ENTRIES.length
  };
}

function readSubstanceFromForm() {
  return {
    topic: $('topicText').value,
    fact: $('factText').value,
    action: $('actionText').value,
    deadline: $('deadlineText').value,
    reason: $('reasonText').value,
    basis: $('basisText').value,
    tone: $('toneSelect').value
  };
}

function handleAnalyze() {
  const raw = $('sourceText').value.trim();
  const substance = readSubstanceFromForm();

  if (!raw && ![substance.topic, substance.fact, substance.action, substance.deadline, substance.reason, substance.basis].some(value => String(value || '').trim())) {
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
    clipboardImageDetected,
    rewriteStyle: $('rewriteStyleSelect').value,
    includeBasis: $('includeBasisOption').checked
  };

  const result = analyzeMessage(raw, substance, options);
  renderResult(result);
}

function renderResult(result) {
  lastAnalysisResult = result;
  activeRewriteVariant = result.rewriteStyle || 'natural';
  $('emptyState').hidden = true;
  $('resultContent').hidden = false;
  $('safeText').value = result.safeText;
  $('safeText').placeholder = result.copyable ? '' : '目前沒有可直接複製的版本。請依上方提示補充或修正實質工作內容。';
  renderRewriteVariantControls(result);
  renderCoverage(result.rewriteCoverage || {});

  $('riskBadge').className = `risk-badge ${result.level}`;
  $('riskBadge').textContent = `${result.label}（${result.score}）`;

  $('corpusHitCount').textContent = result.corpusHitCount;
  $('privacyCount').textContent = result.privacyCount;
  $('workRiskCount').textContent = result.workRiskCount;
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

    if (finding.matchedExample) {
      const example = document.createElement('details');
      example.className = 'matched-example';
      const summary = document.createElement('summary');
      summary.textContent = `查看相似離線案例（${finding.expertSimilarity || 0}%）`;
      const p = document.createElement('p');
      p.textContent = finding.matchedExample;
      example.append(summary, p);
      card.appendChild(example);
    }

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

    if (finding.sourceNotes && finding.sourceNotes.length) {
      const sourceBox = document.createElement('div');
      sourceBox.className = 'evidence-source-list';
      const head = document.createElement('div');
      head.className = 'evidence-source-title';
      head.textContent = '語料／判讀依據';
      sourceBox.appendChild(head);
      for (const source of finding.sourceNotes.slice(0, 4)) {
        const row = document.createElement('p');
        row.className = 'evidence-source';
        if (source.url) {
          const a = document.createElement('a');
          a.href = source.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = `${source.kind}｜${source.label}`;
          row.appendChild(a);
        } else {
          row.textContent = `${source.kind}｜${source.label}`;
        }
        sourceBox.appendChild(row);
      }
      card.appendChild(sourceBox);
    }

    fragment.appendChild(card);
  }

  $('findingList').replaceChildren(fragment);
  $('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      ? '三種版本都只使用「實質工作內容」；切換不會帶入左側原始訊息。'
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

function initialize() {
  renderLegalReferences();
  renderSourceCatalog();
  bindEvents();
  updateCharCount();
  renderCorpusStats();

  if (safeSessionGet(INTRO_SESSION_KEY) === '1') {
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
  for (const style of ['Natural', 'Concise', 'Formal']) {
    const button = $(`variant${style}Button`);
    if (button) button.addEventListener('click', () => switchRewriteVariant(style.toLowerCase()));
  }
}

function renderCorpusStats() {
  const text = `${PHRASE_ENTRIES.length} 筆高風險詞彙＋${EXPERT_ENTRIES.length} 筆完整案例＋${PATTERN_ENTRIES.length} 組語句結構＋${CONTEXT_ENTRIES.length} 組工作內容規則＋${Object.keys(SOURCE_CATALOG).length} 組來源`;
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
  $('sourceText').value = '晚上要不要~~~親親\\n口交\\n綠茶婊\\n啪啪啪啦%％%％%%\\n要%%%嗎?胸好大。';
  $('topicText').value = '昨日交辦資料的版本與期限';
  $('factText').value = '目前收到的檔案仍缺少附件二，且版本日期與會議確認內容不一致';
  $('actionText').value = '重新確認附件二並上傳正確版本';
  $('deadlineText').value = '今天下午 5 時前';
  $('reasonText').value = '需於明日上午會議前完成彙整，避免後續使用錯誤版本';
  $('basisText').value = '本事項屬既定專案工作與會議前置作業';
  updateCharCount();
  $('sourceText').focus();
}

function clearAll() {
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
  $('rewriteStyleSelect').value = 'natural';
  $('includeBasisOption').checked = false;
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
    composeSafeMessage,
    cleanText,
    normalizeText,
    REWRITE_ENGINE,
    CORPUS,
    EXPERT_CORPUS
  };
}
