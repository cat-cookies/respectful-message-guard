'use strict';

(function attachCorpus(root, factory) {
  const data = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  if (root) root.RISK_CORPUS_DATA = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function buildCorpus() {
  return {
  "version": "2026.08.07-1.2",
  "updated": "2026-08-07",
  "description": "純前端離線高風險用語與結構語料庫。每筆用語均一對一配對風險警示、較安全處理策略與法制標籤；僅供傳送前風險提示，不作違法認定。",
  "legalCatalog": {
    "OSH22-1": {
      "label": "職業安全衛生法第22條之1",
      "note": "職場霸凌涉及職務或權勢關係、逾越業務必要且合理範圍、持續的不當言行與身心健康危害；情節重大者不以持續發生為必要。",
      "url": "https://laws.mol.gov.tw/FLAW/PrintFLAWDOC01.aspx?flno=22-1&id=FL015013"
    },
    "WBB2": {
      "label": "職場霸凌防治措施準則第2條",
      "note": "認定應綜合事件背景、頻率、場所、動機、目的，並審酌排擠冷落、妨礙工作、權勢欺壓、不合理工作、散布謠言或揭露隱私等態樣。",
      "url": "https://laws.mol.gov.tw/FLAW/FLAWDAT01.aspx?id=FL106701"
    },
    "WBB4": {
      "label": "職場霸凌防治措施準則第4條",
      "note": "雇主應提供免於職場霸凌的工作環境，採取適當預防與處理措施，並維護相關人員隱私。",
      "url": "https://laws.mol.gov.tw/FLAW/FLAWDAT01.aspx?id=FL106701"
    },
    "WBB16": {
      "label": "職場霸凌防治措施準則第16條",
      "note": "調查程序要求保全證據，並對足以辨識當事人或協助調查者身分的資料負保密義務。",
      "url": "https://laws.mol.gov.tw/FLAW/FLAWDAT01.aspx?id=FL106701"
    },
    "WBB20": {
      "label": "職場霸凌防治措施準則第20條",
      "note": "不得因提起申訴或協助他人申訴而解僱、降調、減薪、損害權益或為其他不利處分，但惡意虛構事實者例外。",
      "url": "https://laws.mol.gov.tw/FLAW/FLAWDAT01.aspx?id=FL106701"
    },
    "OSH324-3": {
      "label": "職業安全衛生設施規則第324條之3",
      "note": "雇主對執行職務遭受他人身體或精神不法侵害，應辨識危害、建構行為規範、辦理溝通技巧訓練、設申訴管道及調查處理程序等。",
      "url": "https://laws.mol.gov.tw/FLAW/PrintFLAWDOC01.aspx?flno=324-3&id=FL015021"
    },
    "GEEA12": {
      "label": "性別平等工作法第12條",
      "note": "執行職務時的性要求、性意味或性別歧視言詞或行為，如造成敵意、脅迫或冒犯性工作環境，可能進入工作場所性騷擾法制。",
      "url": "https://laws.mol.gov.tw/FLAW/FLAWDAT0201.aspx?id=FL015149"
    },
    "GEEA13": {
      "label": "性別平等工作法第13條",
      "note": "雇主負有防治性騷擾及知悉後採取立即有效糾正、補救、調查與適當處理的義務。",
      "url": "https://laws.mol.gov.tw/FLAW/PrintFLAWDOC01.aspx?flno=13&id=FL015149"
    },
    "SHA2": {
      "label": "性騷擾防治法第2條",
      "note": "非屬職場或校園特別制度時，違反意願且與性或性別有關、損害人格尊嚴或造成畏怖、敵意、冒犯情境的行為，可能適用一般性騷擾法制。",
      "url": "https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=D0050074&flno=2"
    },
    "STALK3": {
      "label": "跟蹤騷擾防制法第3條",
      "note": "通常要求對特定人反覆或持續、違反其意願、與性或性別有關，並符合監視、尾隨、威脅貶抑、通訊干擾等法定態樣，使人心生畏怖且足以影響日常生活或社會活動。",
      "url": "https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=D0080211&flno=3"
    },
    "PDPA5": {
      "label": "個人資料保護法第5條",
      "note": "個資蒐集、處理或利用應尊重當事人權益，依誠實信用方法，不得逾越特定目的必要範圍，並須與目的具有正當合理關聯。",
      "url": "https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050021&flno=5"
    },
    "LSA74": {
      "label": "勞動基準法第74條",
      "note": "勞工依法申訴雇主違反勞動法令時，法律設有申訴保護與禁止不利處分機制；具體適用仍應依條文與案件事實判斷。",
      "url": "https://laws.mol.gov.tw/FLAW/FLAWDAT0201.aspx?id=FL014930"
    },
    "EMPLOYMENT_EQUALITY": {
      "label": "就業服務法第5條及性別平等工作法平等規範",
      "note": "雇主對求職人或受僱者不得因法定受保障身分為不當差別待遇；性別、性傾向另有性別平等工作法規範。",
      "url": "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0090001"
    },
    "EMPLOYMENT_PROCEDURE": {
      "label": "勞動基準法第10條之1、第11條、第12條等",
      "note": "調動與終止勞動契約應具法定或契約依據並遵循程序；人事處置不宜作為情緒性威嚇。",
      "url": "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001"
    },
    "CIVIL_DIGNITY": {
      "label": "民法第18條、第184條、第195條",
      "note": "人格權、名譽、隱私等受侵害時，依具體情境可能產生停止侵害、損害賠償或非財產上損害等民事責任。",
      "url": "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=B0000001"
    },
    "CRIMINAL_CONTEXT": {
      "label": "中華民國刑法相關規定",
      "note": "威脅、強制、妨害名譽、妨害秘密等是否成立，需依具體言詞、公開性、故意、情境與其他構成要件判斷，本工具不直接認定犯罪。",
      "url": "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=C0000001"
    },
    "CLIENT_DUTY": {
      "label": "服務契約、專業倫理與組織規範",
      "note": "對案家、服務對象或外部合作對象的言詞，除法律外，亦可能涉及專業倫理、契約義務、服務品質與組織內部規範。",
      "url": ""
    }
  },
  "phraseEntries": [
    {
      "id": "INSULT-001",
      "phrase": "幹你娘",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-002",
      "phrase": "幹你媽",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-003",
      "phrase": "幹妳娘",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-004",
      "phrase": "幹妳媽",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-005",
      "phrase": "幹你老母",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-006",
      "phrase": "幹妳老母",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-007",
      "phrase": "操你媽",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-008",
      "phrase": "操你娘",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-009",
      "phrase": "肏你媽",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-010",
      "phrase": "肏你娘",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-011",
      "phrase": "雞掰",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-012",
      "phrase": "機掰",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-013",
      "phrase": "靠北",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-014",
      "phrase": "靠夭",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-015",
      "phrase": "王八蛋",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-016",
      "phrase": "混蛋",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-017",
      "phrase": "畜生",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-018",
      "phrase": "賤人",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-019",
      "phrase": "垃圾人",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-020",
      "phrase": "廢物",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-021",
      "phrase": "白痴",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-022",
      "phrase": "智障",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-023",
      "phrase": "腦殘",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-024",
      "phrase": "低能",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-025",
      "phrase": "蠢貨",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-026",
      "phrase": "笨蛋",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-027",
      "phrase": "去死",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-028",
      "phrase": "欠罵",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-029",
      "phrase": "不要臉",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-030",
      "phrase": "有病",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-031",
      "phrase": "神經病",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-032",
      "phrase": "滾蛋",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "INSULT-033",
      "phrase": "滾開",
      "category": "直接辱罵或粗鄙人身攻擊",
      "severity": "severe",
      "weight": 28,
      "warning": "這類用語將工作問題轉化為人格攻擊，通常不具有工作必要性；在權勢關係、反覆發生或情節重大時，可能提高職場霸凌、人格權或其他法律風險。",
      "safeAction": "刪除辱罵，改寫為可核對的事實、工作要求與後續程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY",
        "CRIMINAL_CONTEXT"
      ]
    },
    {
      "id": "COMP-001",
      "phrase": "你有沒有腦",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-002",
      "phrase": "有沒有帶腦",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-003",
      "phrase": "你有沒有常識",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-004",
      "phrase": "你到底會不會",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-005",
      "phrase": "你到底懂不懂",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-006",
      "phrase": "講幾次才懂",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-007",
      "phrase": "講幾次才會",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-008",
      "phrase": "這也不會",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-009",
      "phrase": "連這都不懂",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-010",
      "phrase": "到底有沒有在聽",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-011",
      "phrase": "腦袋有洞",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-012",
      "phrase": "腦袋裝什麼",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-013",
      "phrase": "智商有問題",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-014",
      "phrase": "你是聽不懂人話嗎",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-015",
      "phrase": "你是看不懂中文嗎",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-016",
      "phrase": "連小學生都會",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-017",
      "phrase": "連新人都比你強",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-018",
      "phrase": "做事不用腦",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-019",
      "phrase": "怎麼這麼笨",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-020",
      "phrase": "到底會不會做事",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-021",
      "phrase": "你根本不適任",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-022",
      "phrase": "你什麼都做不好",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-023",
      "phrase": "你每次都搞砸",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-024",
      "phrase": "你就是能力差",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "COMP-025",
      "phrase": "你就是沒用",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "否定對方整體智力、能力或人格，無法說明具體工作落差，也容易造成敵意或羞辱效果。應改成可觀察的錯誤、標準與修正方式。",
      "safeAction": "指出具體錯誤或標準，不對人的智力、人格或整體能力下評語。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-001",
      "phrase": "死查某",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-002",
      "phrase": "臭查某",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-003",
      "phrase": "死三八",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-004",
      "phrase": "臭三八",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-005",
      "phrase": "婊子",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-006",
      "phrase": "臭婊",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-007",
      "phrase": "母豬",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-008",
      "phrase": "死娘炮",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-009",
      "phrase": "娘炮",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-010",
      "phrase": "男人婆",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-011",
      "phrase": "死gay",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-012",
      "phrase": "同性戀噁心",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-013",
      "phrase": "女人就是沒用",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-014",
      "phrase": "男人就是廢物",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-015",
      "phrase": "女生就是麻煩",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-016",
      "phrase": "男生就是粗心",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-017",
      "phrase": "女人不適合當主管",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-018",
      "phrase": "男人哭什麼",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-019",
      "phrase": "女的就是情緒化",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-020",
      "phrase": "男的就是不細心",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-021",
      "phrase": "娘們",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-022",
      "phrase": "婆媽",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-023",
      "phrase": "像個女人一樣",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-024",
      "phrase": "像個男人一樣",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-025",
      "phrase": "你是不是更年期",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "GENDER-026",
      "phrase": "月經來喔",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以性別、性傾向或性別氣質作為羞辱工具，已超出一般工作指導範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或差別待遇法制。",
      "safeAction": "刪除性別或性傾向標籤，只保留與工作表現或服務事項直接相關的內容。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-001",
      "phrase": "身材真好",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-002",
      "phrase": "胸部很大",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-003",
      "phrase": "屁股很好看",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-004",
      "phrase": "陪睡",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-005",
      "phrase": "上床",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-006",
      "phrase": "約炮",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-007",
      "phrase": "親一個",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-008",
      "phrase": "親一下",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-009",
      "phrase": "寶貝",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-010",
      "phrase": "老婆大人",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-011",
      "phrase": "老公大人",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-012",
      "phrase": "美女陪我",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-013",
      "phrase": "帥哥陪我",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-014",
      "phrase": "性能力",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-015",
      "phrase": "胸好大",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-016",
      "phrase": "腿真漂亮",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-017",
      "phrase": "今天穿很辣",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-018",
      "phrase": "穿這麼性感",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-019",
      "phrase": "陪我喝酒",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-020",
      "phrase": "陪我回家",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-021",
      "phrase": "跟我睡",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-022",
      "phrase": "要不要開房",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-023",
      "phrase": "摸一下",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-024",
      "phrase": "抱一下",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-025",
      "phrase": "給我親一下",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-026",
      "phrase": "有沒有男朋友",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-027",
      "phrase": "有沒有女朋友",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "與工作無關的性要求、性意味言詞或身體評論，可能造成敵意、脅迫或冒犯性工作環境；若利用權勢或機會，風險更高。",
      "safeAction": "刪除性或身體評論，只保留工作、服務或行政必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "DISCRIM-001",
      "phrase": "外勞就是麻煩",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-002",
      "phrase": "外籍看護都一樣",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-003",
      "phrase": "原住民就是",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-004",
      "phrase": "老人都沒用",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-005",
      "phrase": "年輕人都沒用",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-006",
      "phrase": "殘障",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-007",
      "phrase": "跛子",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-008",
      "phrase": "瞎子",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-009",
      "phrase": "聾子",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-010",
      "phrase": "死胖子",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-011",
      "phrase": "肥婆",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-012",
      "phrase": "老女人",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-013",
      "phrase": "老頭子",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-014",
      "phrase": "低端人口",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-015",
      "phrase": "精神病才會這樣",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-016",
      "phrase": "憂鬱症就是抗壓差",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-017",
      "phrase": "身障就不要來工作",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-018",
      "phrase": "老人反應就是慢",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-019",
      "phrase": "年輕人就是草莓族",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-020",
      "phrase": "外國人都不懂",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-021",
      "phrase": "新住民就是",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-022",
      "phrase": "沒讀書的人都這樣",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-023",
      "phrase": "窮人就是麻煩",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-024",
      "phrase": "鄉下人就是",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-025",
      "phrase": "你們這種人",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "DISCRIM-026",
      "phrase": "這種族群都一樣",
      "category": "身分歧視或污名化",
      "severity": "severe",
      "weight": 26,
      "warning": "以年齡、國籍、族群、語言、身心障礙、疾病或其他身分作為羞辱或不利處理依據，可能涉及就業歧視、平等保障與人格權風險。",
      "safeAction": "刪除身分標籤，改以具體職務條件、行為或客觀需求描述。",
      "legal": [
        "EMPLOYMENT_EQUALITY",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "MOCK-001",
      "phrase": "你是時空穿越了嗎",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-002",
      "phrase": "你是活在清朝嗎",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-003",
      "phrase": "你是活在古代嗎",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-004",
      "phrase": "現在幾年了你知道嗎",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-005",
      "phrase": "你是在裝傻嗎",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-006",
      "phrase": "呵呵",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-007",
      "phrase": "笑死",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-008",
      "phrase": "真厲害",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-009",
      "phrase": "好棒棒",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-010",
      "phrase": "真有你的",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-011",
      "phrase": "了不起喔",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-012",
      "phrase": "天才喔",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-013",
      "phrase": "可憐哪",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-014",
      "phrase": "是不是很會",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-015",
      "phrase": "不愧是你",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-016",
      "phrase": "你很會嘛",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-017",
      "phrase": "厲害了",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-018",
      "phrase": "真的很棒呢",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-019",
      "phrase": "這都可以搞錯",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-020",
      "phrase": "你怎麼好意思",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-021",
      "phrase": "你自己不覺得丟臉嗎",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-022",
      "phrase": "要不要頒獎給你",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "MOCK-023",
      "phrase": "這種程度也敢來",
      "category": "嘲弄、反話或羞辱式反問",
      "severity": "moderate",
      "weight": 12,
      "warning": "嘲諷與羞辱式反問無法提供可核對的標準或修正方向，容易把管理或溝通變成人格貶抑。",
      "safeAction": "改成直接指出差異、事實與需要修正的事項。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-001",
      "phrase": "你給我小心",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-002",
      "phrase": "我不會放過你",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-003",
      "phrase": "讓你混不下去",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-004",
      "phrase": "弄死你",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-005",
      "phrase": "打死你",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-006",
      "phrase": "知道你住哪",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-007",
      "phrase": "等你下班",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-008",
      "phrase": "走著瞧",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-009",
      "phrase": "讓你後悔",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-010",
      "phrase": "有你好看",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-011",
      "phrase": "你試試看",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-012",
      "phrase": "我會修理你",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-013",
      "phrase": "我會處理你",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-014",
      "phrase": "你最好小心一點",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-015",
      "phrase": "別逼我動手",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-016",
      "phrase": "我會找到你",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-017",
      "phrase": "你跑不掉",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-018",
      "phrase": "別怪我不客氣",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "THREAT-019",
      "phrase": "後果自負",
      "category": "威脅、恐嚇或人身安全暗示",
      "severity": "severe",
      "weight": 32,
      "warning": "以人身安全、報復或其他不利益迫使對方服從，可能超出管理必要範圍並造成恐懼；依具體情境亦可能涉及刑事或跟蹤騷擾風險。",
      "safeAction": "刪除威脅，改用正式程序、工作規則與可驗證的後續處理方式。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "STALK3",
        "CRIMINAL_CONTEXT",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "HR-001",
      "phrase": "明天不用來",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-002",
      "phrase": "不用來了",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-003",
      "phrase": "不想做就離職",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-004",
      "phrase": "不爽就離職",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-005",
      "phrase": "給我滾出公司",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-006",
      "phrase": "不配合就不排班",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-007",
      "phrase": "再不回就不用來",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-008",
      "phrase": "再不回就不用服務",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-009",
      "phrase": "我就把你開了",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-010",
      "phrase": "把你開掉",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-011",
      "phrase": "把你開除",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-012",
      "phrase": "我讓你走",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-013",
      "phrase": "我讓你沒班",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-014",
      "phrase": "我把你調走",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-015",
      "phrase": "我給你考績打差",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "HR-016",
      "phrase": "我就減你薪",
      "category": "以人事、排班或工作存續作為威嚇",
      "severity": "severe",
      "weight": 30,
      "warning": "解僱、資遣、調動、減薪、排班、考績或懲處應建立在具體事實、權限與正式程序上；將其夾在怒斥或威脅中，容易形成權勢壓迫或報復爭議。",
      "safeAction": "將人事事項與情緒性訊息分離，改寫為「依具體事實、規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "RETAL-001",
      "phrase": "敢申訴就開除",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-002",
      "phrase": "敢檢舉就開除",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-003",
      "phrase": "敢投訴就開除",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-004",
      "phrase": "申訴就不排班",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-005",
      "phrase": "檢舉就不排班",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-006",
      "phrase": "投訴就不排班",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-007",
      "phrase": "申訴就減薪",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-008",
      "phrase": "檢舉就調職",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-009",
      "phrase": "去申訴啊看你能怎樣",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-010",
      "phrase": "你敢告我就試試看",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-011",
      "phrase": "誰敢作證就一起處理",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-012",
      "phrase": "幫他申訴你也小心",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "RETAL-013",
      "phrase": "告公司就讓你走",
      "category": "申訴、檢舉或求助後的報復語句",
      "severity": "severe",
      "weight": 36,
      "warning": "因對方申訴、檢舉、作證、協助調查或尋求協助而施以解僱、降調、減薪、排班不利益或其他報復，與職場霸凌及勞動法制的禁止報復原則高度衝突。",
      "safeAction": "明確尊重申訴與求助權利，後續僅依正式程序與客觀事實處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "GEEA13",
        "OSH22-1"
      ]
    },
    {
      "id": "CLIENT-001",
      "phrase": "你們家很麻煩",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-002",
      "phrase": "你們家真的很麻煩",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-003",
      "phrase": "你們家很難搞",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-004",
      "phrase": "你們家真的很難搞",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-005",
      "phrase": "不要再煩",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-006",
      "phrase": "這不是我的事",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-007",
      "phrase": "愛怎樣就怎樣",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-008",
      "phrase": "自己負責",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-009",
      "phrase": "講不聽",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-010",
      "phrase": "奧客",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-011",
      "phrase": "別再打來",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-012",
      "phrase": "不想服務你",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-013",
      "phrase": "你們自己看著辦",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-014",
      "phrase": "我懶得管",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-015",
      "phrase": "這種家屬最麻煩",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-016",
      "phrase": "你們要求太多",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-017",
      "phrase": "不要一直吵",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-018",
      "phrase": "不要再盧",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-019",
      "phrase": "你們真的很煩",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "CLIENT-020",
      "phrase": "自己想辦法",
      "category": "對案家、服務對象或外部對象的不禮貌表述",
      "severity": "moderate",
      "weight": 12,
      "warning": "服務界線可以明確，但不宜以情緒性標籤、羞辱或拒絕溝通表達。應說明可提供的範圍、限制理由與正式後續管道。",
      "safeAction": "改寫為服務範圍、限制原因、可行替代方案與聯絡管道。",
      "legal": [
        "CLIENT_DUTY",
        "CIVIL_DIGNITY",
        "OSH324-3"
      ],
      "audiences": [
        "client",
        "public"
      ]
    },
    {
      "id": "STALK-001",
      "phrase": "我會一直傳到你回",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-002",
      "phrase": "每天找你",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-003",
      "phrase": "一直打給你",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-004",
      "phrase": "不回就一直傳",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-005",
      "phrase": "我會去你家",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-006",
      "phrase": "我知道你在哪",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-007",
      "phrase": "跟到你回覆",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-008",
      "phrase": "堵你",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-009",
      "phrase": "守在你家",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-010",
      "phrase": "守在公司",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-011",
      "phrase": "一直等到你出現",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-012",
      "phrase": "我會去你公司找你",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-013",
      "phrase": "你不回我就到現場",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-014",
      "phrase": "我會查你在哪",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "STALK-015",
      "phrase": "我會一直等你",
      "category": "反覆聯絡、守候或掌握行蹤暗示",
      "severity": "severe",
      "weight": 28,
      "warning": "反覆通訊、守候、尾隨、掌握行蹤或到住居所／工作場所施壓，可能讓對方心生畏怖；若符合反覆或持續、違反意願及其他法定要件，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改走正式、單一且可記錄的聯絡管道。",
      "legal": [
        "STALK3",
        "CIVIL_DIGNITY",
        "OSH22-1"
      ]
    },
    {
      "id": "PRIV-001",
      "phrase": "我要讓大家知道",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-002",
      "phrase": "丟到群組讓大家看",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-003",
      "phrase": "公布你的資料",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-004",
      "phrase": "公開你的資料",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-005",
      "phrase": "把你資料貼出來",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-006",
      "phrase": "讓全公司看笑話",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-007",
      "phrase": "告訴所有人你的事",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-008",
      "phrase": "公布申訴人",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-009",
      "phrase": "公布檢舉人",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-010",
      "phrase": "讓大家知道誰申訴",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-011",
      "phrase": "讓大家知道誰檢舉",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-012",
      "phrase": "把申訴內容丟到群組",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PRIV-013",
      "phrase": "把調查內容丟到群組",
      "category": "公開羞辱、揭露隱私或申訴資訊",
      "severity": "severe",
      "weight": 28,
      "warning": "公開個人錯誤、申訴、健康、家庭、聯絡或其他可識別資訊，可能逾越業務必要範圍並造成二次傷害、隱私或個資風險。",
      "safeAction": "僅在必要人員、必要目的與必要範圍內處理，不向無關群組或人員公開。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "EXCLUDE-001",
      "phrase": "大家都不要理他",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-002",
      "phrase": "大家都不要理她",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-003",
      "phrase": "不要讓他參加",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-004",
      "phrase": "不要讓她參加",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-005",
      "phrase": "不要讓他知道",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-006",
      "phrase": "不要讓她知道",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-007",
      "phrase": "把他踢出群組",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-008",
      "phrase": "把她踢出群組",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-009",
      "phrase": "這件事不要找他",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "EXCLUDE-010",
      "phrase": "這件事不要找她",
      "category": "排擠、冷落或刻意孤立",
      "severity": "moderate",
      "weight": 20,
      "warning": "刻意排擠、忽視、冷落或不讓特定人參與必要的重要會議、事務或活動，是職場霸凌防治規範明列應審酌的行為態樣之一。",
      "safeAction": "若有分工、權限或保密理由，應以一致的客觀標準說明，不以孤立或懲罰為目的。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "GENDER-027",
      "phrase": "綠茶婊",
      "category": "性別、性傾向或性別氣質貶抑",
      "severity": "severe",
      "weight": 30,
      "warning": "以帶有性別貶抑、性污名或人格羞辱意味的稱呼指向他人，已超出工作溝通必要範圍；依場域與權勢關係，可能同時涉及職場霸凌、性騷擾或人格權風險。",
      "safeAction": "刪除性別或性污名標籤，只保留可核對的工作事實、要求與程序。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "GEEA12",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "SEXUAL-028",
      "phrase": "口交",
      "category": "明確性行為用語",
      "severity": "severe",
      "weight": 36,
      "warning": "明確性行為用語通常與工作溝通無必要關聯；若對特定人提出、展示或反覆傳送，可能形成高度性騷擾風險。",
      "safeAction": "完全刪除性行為內容，改回工作或服務必要事項。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2"
      ]
    },
    {
      "id": "SEXUAL-029",
      "phrase": "啪啪啪",
      "category": "性暗示或性行為用語",
      "severity": "severe",
      "weight": 34,
      "warning": "以擬聲、暗語或其他方式表達性行為，仍可能具有明確性意味；工作溝通中不應藉符號或暗語規避性騷擾風險。",
      "safeAction": "刪除性暗示，只保留工作或服務必要內容。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2"
      ]
    },
    {
      "id": "SEXUAL-030",
      "phrase": "親親",
      "category": "性意味或身體評論",
      "severity": "severe",
      "weight": 30,
      "warning": "在工作或服務溝通中提出親密或性意味互動，若非工作必要且違反對方意願，可能造成敵意或冒犯性環境；權勢關係下風險更高。",
      "safeAction": "刪除親密或性意味內容，只保留工作、服務或行政必要事項。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2"
      ]
    },
    {
      "id": "COMP-026",
      "phrase": "裝傻",
      "category": "能力羞辱或人格貶抑",
      "severity": "moderate",
      "weight": 14,
      "warning": "以「裝傻」等方式直接推定對方主觀惡意或能力缺陷，沒有提供可核對的工作事實，容易使溝通轉為人格貶抑。",
      "safeAction": "改成指出尚未回覆、未依程序處理或資訊不一致等可觀察事實。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "CIVIL_DIGNITY"
      ]
    }
  ],
  "patternEntries": [
    {
      "id": "PAT-HR-001",
      "category": "情緒性解僱或不利益威嚇",
      "severity": "severe",
      "weight": 34,
      "pattern": "(?:信不信|你再|再不|如果你再|不然|否則|敢再|給我)[^。！？!?；;\\n]{0,24}(?:開除|解僱|資遣|開掉|把[你妳]開了|讓[你妳]走|不用來|不排班|減薪|降職|調職|記過|考績(?:打|給)?(?:差|丙|丁))",
      "warning": "將人事不利益作為情緒性威嚇，未交代事實、依據、權限與程序；應與工作溝通分離，另循正式程序。",
      "safeAction": "改寫為「如涉及人事處置，將依具體事實、既定規範與正式程序另行處理」。",
      "legal": [
        "OSH22-1",
        "WBB20",
        "LSA74",
        "EMPLOYMENT_PROCEDURE"
      ]
    },
    {
      "id": "PAT-RETAL-001",
      "category": "申訴報復威嚇",
      "severity": "severe",
      "weight": 38,
      "pattern": "(?:敢|再敢|你敢)(?:去)?(?:申訴|檢舉|投訴|告我|告公司)[^。！？!?；;\\n]{0,24}(?:開除|不排班|減薪|調職|記過|整你|讓你走|有你好看)",
      "warning": "以申訴、檢舉或告訴為由暗示不利益，屬高度風險的報復性語句。",
      "safeAction": "明示不得因申訴或協助申訴而報復，後續僅依正式程序處理。",
      "legal": [
        "WBB20",
        "LSA74",
        "OSH22-1"
      ]
    },
    {
      "id": "PAT-EXCLUDE-001",
      "category": "刻意排擠或阻斷參與",
      "severity": "moderate",
      "weight": 22,
      "pattern": "(?:大家(?:都)?不要理(?:他|她|你|妳)|不要讓(?:他|她|你|妳)(?:知道|參加|進來|進群組)|故意不通知(?:他|她|你|妳)|把(?:他|她|你|妳)踢出群組)",
      "warning": "刻意排擠、忽視、冷落或阻斷必要參與，屬職場霸凌規範明列的審酌態樣。",
      "safeAction": "如需限制參與，應以職務、權限或保密等客觀理由說明。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "PAT-INFO-001",
      "category": "刻意隱瞞資訊或妨礙工作",
      "severity": "severe",
      "weight": 28,
      "pattern": "(?:不要把(?:資料|資訊|版本|通知)給(?:他|她|你|妳)|故意不給(?:他|她|你|妳)(?:資料|資訊)|給(?:他|她|你|妳)錯的(?:資料|版本|時間)|就讓(?:他|她|你|妳)不知道|看(?:他|她|你|妳)怎麼出包)",
      "warning": "刻意隱瞞必要資訊、提供錯誤資訊或阻礙工作，是職場霸凌防治規範明列的審酌態樣。",
      "safeAction": "依職務權限與工作需要提供正確且必要的資訊；如有限制，說明客觀理由。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "PAT-WORK-001",
      "category": "以權勢分派明顯不合理工作",
      "severity": "moderate",
      "weight": 22,
      "pattern": "(?:全部丟給(?:你|妳)(?:一個人)?做|這些都(?:你|妳)一個人扛|做不完不准下班|今晚全部給我做完|不管工作量[^。！？!?；;\\n]{0,20}(?:你|妳)都要做完|故意給(?:你|妳)做不完)",
      "warning": "利用權勢刻意設定不合理工作目標或明顯不符能力、資源與時間的工作，是職場霸凌規範明列的審酌態樣。",
      "safeAction": "交代優先順序、資源、合理期限，並允許回報工作量與困難。",
      "legal": [
        "WBB2",
        "OSH22-1"
      ]
    },
    {
      "id": "PAT-CONF-001",
      "category": "揭露申訴人或調查資訊",
      "severity": "severe",
      "weight": 30,
      "pattern": "(?:公布(?:申訴人|檢舉人|誰告的)|把(?:申訴內容|檢舉內容|調查內容)丟到群組|讓大家知道誰(?:申訴|檢舉|告狀)|我把誰告的說出來)",
      "warning": "申訴、調查與協助調查者身分應依規定保密，非必要揭露可能造成二次傷害與程序風險。",
      "safeAction": "僅由有權人員在法定或業務必要範圍內處理。",
      "legal": [
        "WBB4",
        "WBB16",
        "PDPA5"
      ]
    },
    {
      "id": "PAT-STALK-001",
      "category": "反覆通訊干擾",
      "severity": "severe",
      "weight": 30,
      "pattern": "(?:不回(?:我)?就(?:一直|每天)(?:傳|打|找)|我會(?:一直|每天)(?:傳|打|找)到你回|你不回我就到(?:你家|公司|現場))",
      "warning": "反覆或持續通訊、到場守候或干擾，若符合違反意願、與性或性別有關等法定要件並造成畏怖，可能進入跟蹤騷擾法制。",
      "safeAction": "停止非必要接觸，改用單一正式聯絡管道。",
      "legal": [
        "STALK3"
      ]
    },
    {
      "id": "PAT-SEX-POWER-001",
      "category": "權勢性或交換式性騷擾風險",
      "severity": "severe",
      "weight": 40,
      "pattern": "(?:陪我(?:吃飯|喝酒|出去|過夜|睡)[^。！？!?；;\\n]{0,20}(?:就|才)(?:給你|幫你|讓你)(?:升遷|加薪|排班|過關|轉正)|不陪我[^。！？!?；;\\n]{0,20}(?:就|就別想)(?:升遷|加薪|排班|過關|轉正))",
      "warning": "將性或私人邀約與工作權益、考核、排班或升遷交換，可能屬權勢性或交換式性騷擾的高風險態樣。",
      "safeAction": "刪除私人或性要求，工作權益僅依正式標準與程序處理。",
      "legal": [
        "GEEA12",
        "GEEA13",
        "SHA2"
      ]
    },
    {
      "id": "PAT-PUBLIC-001",
      "category": "公開羞辱或群體施壓",
      "severity": "severe",
      "weight": 28,
      "pattern": "(?:把(?:他的|她的|你的|妳的)?(?:錯誤|事情|表現|照片|對話)丟到群組|讓大家看看(?:他|她|你|妳)多(?:爛|蠢|誇張)|全公司都來看)",
      "warning": "將個人錯誤或私密資訊公開作為羞辱或施壓手段，可能涉及職場霸凌、隱私與人格權風險。",
      "safeAction": "必要的工作檢討應限於必要人員、具體事實與改善措施。",
      "legal": [
        "OSH22-1",
        "WBB2",
        "PDPA5",
        "CIVIL_DIGNITY"
      ]
    },
    {
      "id": "PAT-PRESSURE-001",
      "category": "缺乏合理範圍的緊迫施壓",
      "severity": "moderate",
      "weight": 16,
      "pattern": "(?:五分鐘內給我|不管你用什麼方法|做不完別下班|今天做不完不准走|現在立刻全部做完)",
      "warning": "急迫工作仍應交代理由、優先順序、資源與合理期限；無條件命令可能形成不當壓迫。",
      "safeAction": "改寫為具體期限、急迫原因、資源與回報困難機制。",
      "legal": [
        "OSH22-1",
        "WBB2"
      ]
    },
    {
      "id": "PAT-GASLIGHT-001",
      "category": "否定感受或責任轉嫁式施壓",
      "severity": "moderate",
      "weight": 12,
      "pattern": "(?:你太玻璃心|這也叫霸凌|你自己想太多|開不起玩笑|都是你太敏感|被罵是你活該)",
      "warning": "直接否定對方感受或將不當言行合理化，不利於事件釐清，也可能造成二次傷害。",
      "safeAction": "改以具體事件、行為與影響討論，不對對方感受作貶抑判斷。",
      "legal": [
        "WBB4",
        "OSH22-1",
        "CIVIL_DIGNITY"
      ]
    }
  ]
};
});
