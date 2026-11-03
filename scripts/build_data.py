"""將最新版多益題庫 xlsx 轉成免網路可載入的瀏覽器資料檔。
用法：python scripts/build_data.py /path/to/多益單字大全題庫.xlsx
需要 artifact_tool；只讀題庫工作表，不會修改來源檔。
"""
from pathlib import Path
from collections import Counter
import json, sys
from artifact_tool import Blob, SpreadsheetFile
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'source.xlsx'
wb=SpreadsheetFile.import_xlsx(Blob.load(str(source)))
sheet=wb.worksheets.get_item('題庫')
# 僅讀目前題庫用到的固定欄位，不讀其他工作表或使用紀錄。
allrows=sheet.get_range('A1:L2000').values
header=allrows[0]
required=['DAY','單字／片語','不熟','類型','詞性','中文意思','難度','出題重點與文法']
assert header[:8] == required, f'題庫欄位已改變：{header[:8]}'
items=[]
for rowno, r in enumerate(allrows[1:],start=2):
    if not any(x not in (None,'') for x in r[:8]): continue
    if not str(r[1] or '').strip() or not str(r[5] or '').strip():
        print(f'略過缺少英文／中文的第{rowno}列',file=sys.stderr);continue
    items.append({'id':len(items)+1,'row':rowno,'day':int(r[0]),'en':str(r[1]).strip(),
      'zh':str(r[5]).strip(),'type':str(r[3] or '').strip(), 'pos':str(r[4] or '').strip(),
      'level':str(r[6] or '').strip(),'unfamiliar':str(r[2] or '').strip()=='★',
      'note':str(r[7] or '').strip()})
assert items, '沒有可用詞條'
# 保留多詞性與重複列，避免破壞原題庫意義。
payload=json.dumps(items,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
(ROOT/'data'/'words.js').write_text('/* 由 scripts/build_data.py 自題庫產生；請勿直接編輯。 */\nwindow.WORDSTUDIO_WORDS = '+payload+';\n',encoding='utf-8')
print(f'輸出 {len(items)} 筆，分布：{dict(Counter(x["day"] for x in items))}')
