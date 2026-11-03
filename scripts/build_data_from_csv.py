#!/usr/bin/env python3
"""零額外依賴：把 Google Sheets「題庫」匯出的 CSV 更新到 data/words.js。
用法：python scripts/build_data_from_csv.py path/to/題庫.csv
僅會修改專案 data/words.js，不會上傳任何個人資料。
"""
import csv,json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:
 sys.exit('用法：python scripts/build_data_from_csv.py path/to/題庫.csv')
source=Path(sys.argv[1]);items=[]
with source.open('r',encoding='utf-8-sig',newline='') as f:
 reader=csv.DictReader(f)
 expected={'DAY','單字／片語','不熟','類型','詞性','中文意思','難度','出題重點與文法'}
 missing=expected-set(reader.fieldnames or [])
 if missing:sys.exit('缺少欄位：'+', '.join(sorted(missing)))
 for index,row in enumerate(reader,start=2):
  en=(row.get('單字／片語') or '').strip();zh=(row.get('中文意思') or '').strip()
  if not en and not zh:continue
  if not en or not zh:
   print(f'略過第{index}列：缺少英文或中文',file=sys.stderr);continue
  items.append({'id':len(items)+1,'row':index,'day':int(row['DAY']),
   'en':en,'zh':zh,'type':(row.get('類型') or '').strip(),
   'pos':(row.get('詞性') or '').strip(),'level':(row.get('難度') or '').strip(),
   'unfamiliar':(row.get('不熟') or '').strip()=='★',
   'note':(row.get('出題重點與文法') or '').strip()})
if not items:sys.exit('沒有有效詞條，未更新')
payload=json.dumps(items,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
(root/'data'/'words.js').write_text('/* 由題庫CSV自動產生，請勿直接編輯。 */\nwindow.WORDSTUDIO_WORDS = '+payload+';\n',encoding='utf-8')
print(f'已更新 {len(items)} 筆詞條：data/words.js；記得執行 node --test tests/quiz.test.cjs')
