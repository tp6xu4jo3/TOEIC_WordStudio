#!/usr/bin/env python3
"""Build dictionary example sentences from the UTF-8 TSV."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'data/examples_extra.tsv'
examples={}
for lineno,line in enumerate(source.read_text(encoding='utf-8').splitlines(),1):
    if not line.strip() or line.startswith('#'): continue
    if '\t' not in line:raise ValueError(f'Line {lineno}: expected term TAB example')
    term,english=line.split('\t',1)
    term=term.strip().casefold()
    english=english.strip()
    if not term or len(english)<22:raise ValueError(f'Line {lineno}: invalid example')
    # One sentence per unique spelling.
    examples.setdefault(term,[english])
payload=json.dumps(examples,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e')
(ROOT/'data/examples_extra.js').write_text('/* WORDSTUDIO original English business-context example sentences. */\nwindow.WORDSTUDIO_EXTRA_EXAMPLES = '+payload+';\n',encoding='utf-8')
print(f'Wrote {len(examples)} original English examples')
if __name__=='__main__':
    pass
