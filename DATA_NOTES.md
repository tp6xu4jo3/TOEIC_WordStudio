# 題庫整理與內容校對備註

## 來源與保留原則

- 來源：Google Drive檔案「多益單字大全題庫」，工作表「題庫」，2026-09-16最後修改版本（製作本版時取得）。
- 共487筆：DAY1為246筆、DAY2為241筆；原表「不熟★」146筆。
- 直接保留原表的英文、中文意思、詞性、類型、難度、DAY、「不熟」標記與語法備註。沒有改動雲端Sheet，也沒有把答題次數、答錯次數或最近出題日期載入網站。
- 原表出現同一個字在不同詞性下分列，例如`associate`（動詞／名詞／形容詞）、`position`（名詞／動詞），字典會保留各詞性；**同拼法、同詞性的重複詞條**在畫面上合併解釋與原始列號，底層資料仍保留所有列。
- 對無法確定的解釋不擅自修改，也不自動憑字首拼寫合併詞族。例如`appliance`不會只因拼字類似就被納入`apply`字族。
- 題庫若沒有字族母字本身（例如只含`job offer`、`job fair`），畫面會清楚標示母字是**分類標題**，不冒充原始題庫詞條。

## 字族、詞義與文法檢查

- `qualify`→`qualified`、`qualification`、`qualifier`，及`be qualified for`、`qualification for`為字形或搭配關聯；`qualifier`在比賽語境可指資格賽或晉級者，並不等於「有資格的」。詞條各自顯示原Sheet意思。
- `in association with`表示與某機構／人合作；其介系詞`in`及`with`各可作為一個固定搭配挖空題。
- `comply with`、`in accordance with`、`make a point of + V-ing`均有外部權威字典來源支援。
- 部分介系詞片語若可有別的結構（例如`apply to`與`apply for`、`eligible to`與`eligible for`）的練習會加入適當的受詞／情境，避免只挖單一介系詞導致第二個合理答案。對`concern about/over`這種原本就接受兩種介系詞的固定搭配，不強迫產生單一答案題。
- 同義題是**指定語境可用**的多選，不代表所有情境下完全同義。

參考查證資料（只用於確認特定用法，非複製其定義）：

- Cambridge — `in association with`: https://dictionary.cambridge.org/dictionary/learner-english/association
- Cambridge — `qualifier`: https://dictionary.cambridge.org/dictionary/english/qualifier
- Cambridge — `comply with`: https://dictionary.cambridge.org/dictionary/english/comply
- Cambridge — `in accordance with`: https://dictionary.cambridge.org/dictionary/english/accordance
- Cambridge — `make a point of doing`: https://dictionary.cambridge.org/dictionary/english/make-a-point-of

## 出題限制

- 搭配／文法題為經人工選定的規則，僅當題庫詞條和目前DAY／難度／類型條件吻合才出題。
- 介系詞、句型的干擾選項由人工編輯，程式再檢查答案是否唯一標記、選項是否重複；**程式無法自動證明所有英文自然語境只有一個合理答案**，後續新增題目仍應人工審核。
- 完全沒有自動加減出題次數、答錯次數、題庫同步、語音或持久作答紀錄。
- 2026-11-04起允許使用者在字典手動修改「不熟」；只將差異儲存在該瀏覽器本機`localStorage`，不寫回Google Sheets、不跨裝置同步，也不保存作答歷史。

## 2026-11-04：Day3、Day4外部資料完整性查核（未匯入）

本網站Day1／Day2的487筆，包含核心詞彙與基礎、800、900分級、字形變化、例示搭配、介系詞與片語。新Day若加入必須可驗證同教材版本、各級別均完整，而不只是某位使用者整理的核心卡片。

已辨識的參考來源如下：

- 官方出版社的[Hackers TOEIC Vocabulary書目](https://www.hackerseducation.com/publications/detail?BookID=40&LevelID=53&TestID=22)確認本書有7,600詞與片語及分級內容，但未提供可逐項校驗的Day3/Day4完整列表。
- [Studocu：Day3辦公室工作(1)摘錄](https://www.studocu.vn/vn/document/long-an-university-of-economics-and-industry/tieng-anh-chuyen-nganh/hackers-toeic-vocabulary-office-work-insights-and-preparation/138832712)及[後段分級詞彙摘錄](https://www.studocu.vn/vn/document/hutech-university-of-technology/teaching-for-young-learner/day-30-vocabulary-for-toeic-office-work-preparation/165165600)有可辨識部分頁面，但未取得與現有題庫欄位逐列核對、清楚授權重製的完整資料集。
- [Quizlet：Day3（110張）](https://quizlet.com/vn/861241946/hacker-toeic-vocab-day-3-flash-cards/)與[另一套Day3（88張）](https://quizlet.com/vn/1151303946/hacker-toeic-vocabulary-day-3-flash-cards/)張數不同；無從確認哪個完整包含所有分級與搭配。
- [Quizlet：Day4（195張）](https://quizlet.com/vn/1195264991/hacker-toeic-vocab-day-4-flash-cards/)與[另一套Day4（81張）](https://quizlet.com/vn/765628933/hacker-toeic-vocabulary-day-4-da-sua-flash-cards/)內容範圍不同，也無法當作完整權威清單。
- [越南版授權資訊](https://www.studocu.vn/vn/document/truong-dai-hoc-fpt/toeic/hackers-toeic-vocab-doc-thu-5d2934da66264395-bc1ccbdd-88f72bc8/69031996)有明確保留重製權利；公開可讀不能直接等同可以把整份編纂的清單重製到公開Repository。

結論：**未驗證到可安全完整匯入的Day3、Day4資料，這兩天皆未添加**。保留Google Drive來源Day1、Day2全部487筆，沒有拿其他網站的片段補齊、推測中文、編造難度或將外部詞表冒充原題庫。若未來有獲授權、完整的使用者教材或本人的Day3/Day4 Sheet，再依來源匯入並校對。


## 2026-11-04：後續Day3、Day4加入策略

在取得`accustomed`、第40個`concentrate`、800最後`throw one's effort into`及900最後`telecommute`四點後，已找到Lingoland的Day3四個分級頁面，以及Day4四個分級頁面。本次依使用者要求以這些**外部頁面詞彙**建立新增Day3、Day4；原本「未匯入」段落是過去版本的歷程，不是現在狀態。來源與處理方式請參閱`data/source_audit.json`。

外部頁面對應的分級、詞義可能與個人教材不一致，故外部字條均含來源連結、不混入原Sheet第1、2天、也不聲稱逐字符合其紙本教材。Lingoland本身提供例句，但英文例句是第三方網站文字，本專案不大量複製；本站自編例句另存`data/examples.js`，其餘有例句的條目保留可查閱來源連結。
