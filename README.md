# WORDSTUDIO — 多益字族字典與無限刷題

一個可直接發佈到**GitHub Pages**的純靜態網站。保留個人Google Sheets題庫的詞條、詞性、DAY、難度、不熟標記與用法備註；額外整理字族關係與人工校對的搭配／文法題庫。

**不需要帳號、資料庫、API金鑰、框架、打包器或伺服器端程式。**也沒有朗讀、答題歷史、錯題追蹤、帳號或Cookie。**只有使用者手動變更的「不熟」標記**會儲存在本機瀏覽器`localStorage`，以便下次開啟時保留；網站從本地JS載入資料，不會在瀏覽時讀取Google Drive。所有字典和刷題內容都在前端執行。

## 網站功能

- **樹狀字典：**母字 → 衍生字／同字不同詞性 → 介系詞與固定用法 → 片語搭配。可展開子字、查看原Sheet中文意思、詞性、DAY、難度、原表備註。
- **搜尋與篩選：**查英文、中文、字族母字；依DAY、難度、類型、目前「不熟★」標記篩選；標記可在字典中自行調整。
- **英文選中文：**四選一，帶有詞性提示。
- **中文選英文：**四選一，避免明顯相同釋義做干擾項。
- **同義複選：**明確語境中的複選題；答完顯示正確答案與細節。
- **搭配／文法：**人工整理的介系詞、固定搭配、動名詞與不定詞填空題，每題一個空格。
- **手動標記不熟：**在字典每筆詞條旁按☆／★，或在詞條詳情切換狀態；修改後立即影響「只看不熟」及「只練不熟」。相同英文與詞性的重複列一起切換，保留每筆原始詞義。
- **無限練習：**隨機出題、即時回饋、短期去重，不保留作答紀錄。

## GitHub Pages上線（最簡單方案）

1. 在GitHub建立一個新的Repository，例如`wordstudio`。
2. **解壓縮ZIP**，把內部檔案與資料夾（`index.html`、`assets/`、`data/`、`js/`等）上傳到Repository**根目錄**。不要只上傳ZIP檔。
3. 進入Repository的 **Settings → Pages → Build and deployment**。
4. 設定 **Source: Deploy from a branch**、**Branch: main**、**Folder: /(root)**，按下Save。
5. GitHub Pages發佈後，從Settings → Pages的「Visit site」開啟。

GitHub官方說明：<https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>。

**不需要設定Vite、React、npm install或GitHub Secrets。**首頁與靜態檔都使用相對路徑，適合`https://使用者.github.io/儲存庫名稱/`形式的專案頁面。

## 目錄結構

```text
wordstudio-github/
├── index.html                # 介面與語義結構
├── .nojekyll                 # 停用預設Jekyll處理
├── assets/
│   ├── style.css            # 視覺與RWD
│   └── icon.svg
├── data/
│   ├── words.js             # Google Sheets題庫快照（程式生成）
│   ├── families.js          # 經過整理的母字／子字關係
│   ├── grammar.js           # 人工設計的固定搭配／文法題
│   └── synonyms.js          # 同義語境複選題
├── js/
│   ├── engine.js            # 可獨立測試的出題與分類引擎
│   ├── preferences.js       # 只儲存不熟標記的本機偏好
│   └── app.js               # 畫面互動
├── scripts/
│   ├── build_data_from_csv.py  # 更新詞庫（標準Python、零套件）
│   └── build_data.py           # 直接讀XLSX（需artifact_tool）
├── tests/
│   ├── quiz.test.cjs        # Node資料與出題驗證
│   └── browser_smoke.py     # 開發環境的Chromium UI驗證
├── .github/workflows/validate.yml
└── DATA_NOTES.md            # 資料整理與校對說明
```

## 在電腦上開啟

雙擊`index.html`即可在支援一般本地腳本的瀏覽器瀏覽；所有資源均來自同一資料夾，**不需要連網**。也可以在專案根目錄執行`python -m http.server 8000`，再開啟`http://localhost:8000`方便測試。

## 「不熟」標記儲存方式

- 原Sheet的★是初始值。手動切換後只儲存與原表不同的詞條狀態；同一瀏覽器重新整理或下次開啟會保留。
- 儲存在使用者自己的瀏覽器`localStorage`，**不寫回Google Sheets或GitHub，也不會跨瀏覽器、不同網域或不同裝置同步**；無痕模式結束、清除瀏覽資料、換瀏覽器後可能遺失。
- 不會記錄答題次數、錯題、最近出題日或任何成績。

## Day 03、Day 04來源查核

2026-11-04已檢查Studocu、Quizlet等公開資料，發現可辨識的主題詞及部分卡片集合，但**無法核定同本專案DAY 1–2格式、涵蓋核心／基礎／800／900全部詞條的完整清單**，因此依要求不匯入Day3或Day4，題庫維持487筆。查核來源及限制見`DATA_NOTES.md`。

## 題庫新增或修改後的更新方式

1. 開啟Google Sheets「多益單字大全題庫」的「題庫」工作表。
2. 在Google Sheets下載此工作表的**CSV**（逗號分隔值）。
3. 將CSV放在電腦上，從專案根目錄執行：

```bash
python scripts/build_data_from_csv.py "題庫.csv"
node --test tests/quiz.test.cjs
```

4. 確認驗證通過，將更新的`data/words.js`推送到GitHub。

亦可用`python scripts/build_data.py "多益單字大全題庫.xlsx"`直接讀取XLSX（需要`artifact_tool`）。**增加新字不會自動加入既有母字關係或自動生成文法題**；可在`data/families.js`或`data/grammar.js`依據真實詞條手動整理。字典本身仍會完整收錄所有新增詞條；未整理的單字先獨立顯示。題庫若增加新DAY或新難度，可再調整畫面的難度下拉選單。

## 開發者測試

```bash
node --test tests/quiz.test.cjs
```

測試包括全題庫保留、母子字不漏列、所有文法題均有來源且單一空格、同義答案只來自題庫、四種題型隨機產生4,000題選項檢查、DAY篩選。推送程式碼時，GitHub Actions會自動執行Node測試。

## 注意

- 不是ETS官方教材或真題。
- 原始詞條來自個人題庫；公開GitHub Repository及Pages前，請自行確認資料公開與使用權限。
- 字族分類是學習導航，同一母字下的子字**不代表意思相同或能互換**。
- 詞庫目前為2026-09-16的Drive內容快照；靜態網站不會自動同步新的雲端修改。
