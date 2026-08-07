# respectful-message-guard

純前端、零後端、零上傳的「訊息溝通風險檢核器」。適合直接部署到 GitHub Pages。

## 版本 1.2.0 的核心修正

### 1. 原始訊息不再成為輸出來源

原始訊息只做風險掃描，不再拿來「刪幾個詞後原樣貼回」建議版本。

使用者另填：

- 事項或工作主題
- 客觀事實／目前狀況
- 希望對方完成、停止或確認的行動
- 期限或回覆時間
- 原因、影響或正式程序
- 溝通強度

右側可複製版本只由這些實質內容組成。

### 2. 新增真正的離線高風險語料庫

`risk-corpus.js` 直接包在網站內，目前包含：

- 271 筆高風險用語。
- 11 組需要上下文結構才能辨識的規則。

每筆用語均一對一配對：

- 唯一語料代碼
- 用語
- 風險類別
- 嚴重度
- 風險警示
- 較安全處理方式
- 法制標籤

例如性意味用語、性別貶抑、直接辱罵、能力羞辱、威脅、人事威嚇、申訴報復、排擠、資訊阻斷、不合理工作量、公開羞辱、持續聯絡與對案家不禮貌等。

### 3. 三層防漏

1. 原始訊息掃描。
2. 實質工作內容再掃描並清除高風險內容、遮罩必要個資。
3. 建議版本完成後再次掃描；若仍含高風險內容，直接停用複製。

### 4. 可複製按鈕不複製風險原句

頁面下方仍會逐項顯示「為何不宜這樣說」，但複製按鈕只複製較安全版本，不會把原始高風險片段或備註一起放進剪貼簿。

## 純前端與資訊安全

- 無後端。
- 無帳號。
- 無伺服器資料庫。
- 無 API。
- 無雲端模型。
- 無第三方 JavaScript。
- 無分析追蹤。
- 無 Cookie。
- 不使用 fetch、XMLHttpRequest 或 WebSocket。
- CSP 設定 `connect-src 'none'`。
- 原始文字與結果不寫入 localStorage、IndexedDB 或檔案。
- 僅以 sessionStorage 記錄「本分頁是否略過法制說明」，關閉分頁後失效。

## 檔案

- `index.html`：網站頁面。
- `styles.css`：介面樣式。
- `risk-corpus.js`：離線風險語料庫。
- `app.js`：風險掃描、個資檢核、實質內容清理與訊息組句。
- `tests.js`：本機測試。
- `LEGAL-BASIS.md`：法制設計基礎。
- `ARCHITECTURE.md`：Mermaid 架構與安全不變量。
- `CHANGELOG.md`：版本變更紀錄。
- `.nojekyll`：GitHub Pages 靜態部署使用。

## 本機測試

需安裝 Node.js：

```bash
node --check risk-corpus.js
node --check app.js
node tests.js
```

版本 1.2.0 測試包括：

- 使用者實際性意味／性別貶抑案例。
- 原始訊息不得進入輸出。
- 未填實質內容時不得提供可複製版本。
- 實質內容可新增工作主題、事實、行動、期限與原因。
- 高風險用語即使寫入實質內容也會再次攔截。
- 空格、百分比與符號拆字。
- 個資遮罩。
- 正式人事程序反向測試。
- 正常案家服務界線反向測試。
- 語料庫欄位完整性與唯一代碼檢查。

## GitHub Pages 部署

將此資料夾內所有檔案放在 repository 根目錄：

```text
index.html
styles.css
risk-corpus.js
app.js
404.html
tests.js
README.md
LEGAL-BASIS.md
ARCHITECTURE.md
CHANGELOG.md
.nojekyll
```

GitHub：

`Settings → Pages → Deploy from a branch → main → /(root)`

不需要後端網址、Token、環境變數或 GitHub Actions。

## 使用邊界

本工具是傳送前的風險控制工具，不是法律判定器。是否成立職場霸凌、性騷擾、跟蹤騷擾、侵權或犯罪，仍須依完整事實、身分、場域、權勢關係、頻率、影響、證據與法定程序判斷。
