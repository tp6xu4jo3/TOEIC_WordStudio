# WORDSTUDIO｜多益字族字典與無限刷題

純靜態繁體中文學習網站，可直接使用GitHub Pages發布，不需要帳號、資料庫或打包工具。

## 內容

- Day1～Day4共824筆單字、片語及搭配，依DAY、難度、類型分類。
- 母字及子字的樹狀字典，包含詞性變化、介系詞與固定搭配。
- 每個詞條都能查看自編英文例句，部分詞條另附繁體中文翻譯。
- 四種刷題：英文選中文、中文選英文、同義複選、片語／介系詞／文法填空。
- ☆／★手動標記「不熟」，即時套用到字典與題目篩選。
- 不熟狀態保存在當前瀏覽器`localStorage`，不跨裝置同步，也不保留答題紀錄。
- 沒有朗讀功能，無需任何第三方API。

## 目錄

```text
index.html
assets/style.css
data/words.js
data/examples.js
data/examples_extra.js
data/families.js
data/grammar.js
data/synonyms.js
js/app.js
js/engine.js
js/preferences.js
tests/quiz.test.cjs
tests/browser_smoke.py
```

## 使用

在本地打開`index.html`或部署至GitHub Pages，所有詞條與例句均隨網站一併載入，不需要後端服務。

GitHub Pages設定：進入儲存庫的Settings → Pages，選擇Deploy from a branch、main與/(root)。

## 測試

```bash
node --test tests/quiz.test.cjs
```

`tests/browser_smoke.py`可在安裝Playwright與Chromium的開發環境額外檢查桌面與手機版介面。

## 編輯例句

- `data/examples_extra.tsv`：每行`英文詞條<TAB>英文例句`，可使用`python scripts/build_examples.py`重新產生英文例句資料。
- `data/examples.js`：直接維護有中英對照的例句。
- 兩者重複時，中英對照版本優先。新增或修改例句後請重新執行測試。

此網站為非官方練習工具。
