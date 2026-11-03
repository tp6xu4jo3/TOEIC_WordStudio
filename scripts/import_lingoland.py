#!/usr/bin/env python3
"""Import factual vocabulary entries (not copied example sentences) from public Lingoland Day 3/4.

Usage: python scripts/import_lingoland.py [--check-only]

English example prose on external pages is NOT republished. Instead links to examples are
preserved. Words/short glosses are normalized as lexical facts; Day 1/2 is not modified.
Requires: beautifulsoup4. Fails closed if categories, expected ordering or counts mismatch.
"""
import argparse
import collections
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://lingolandedu.com/zh-tw/vocabulary/toeic-vocabularies/hacker-toeic-vocabulary'
PAGES = {
    3: 'day-03-office-mastery',
    4: 'day-04-business-secrets',
}
SECTIONS = (
    ('basic-1', '核心'),
    ('basic-2', '基礎'),
    ('800-point-level', '800'),
    ('900-point-level', '900'),
)
POS_CN = {
    'noun': '名詞', 'verb': '動詞', 'adjective': '形容詞',
    'adverb': '副詞', 'pronoun': '代名詞', 'determiner': '限定詞',
    'preposition': '介系詞', 'conjunction': '連接詞',
    'interjection': '感嘆詞', 'phrase': '搭配', 'idiom': '慣用語',
    'phrasal verb': '動詞片語', 'abbreviation': '縮寫',
    'exclamation': '感嘆詞', 'modal verb': '助動詞',
}
IPA = re.compile(r'^/[\wˈˌːˑ\.\-\səɪæɛɑɔʊɒʌθðŋʃʒɡɜɚɝɹəɾt̬ʔˌ\u0300-\u036f\u00e6\u0250-\u02ff\u1d00-\u1d7f]+/$', re.UNICODE)
POS_RE = re.compile(r'^\(([^)]+)\)\s*(.+)$')
ASCII = re.compile(r'[A-Za-z]')


def fetch(url):
    request = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; PersonalVocabularyExporter/1.0; educational use)',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    })
    with urllib.request.urlopen(request, timeout=35) as res:
        data = res.read(4 * 1024 * 1024)
    if len(data) < 3000:
        raise ValueError(f'Unexpectedly short document: {url} ({len(data)} bytes)')
    return data


def looks_ipa(text):
    text = text.strip()
    return text.startswith('/') and text.endswith('/') and 2 < len(text) < 160 and bool(ASCII.search(text) or any(ch in text for ch in 'æŋəɚˈˌθʃʊɪ'))


def page_entries(data, url):
    soup = BeautifulSoup(data, 'html.parser')
    main = soup.find('main') or soup
    raw = [s.strip() for s in main.get_text('\n', strip=True).splitlines() if s.strip()]
    # The source page has a word / IPA / (POS) Chinese / 範例: English ... rhythm.
    # Keep only a contiguous run beginning after the first '立即學習'.
    try:
        first = raw.index('立即學習') + 1
        raw = raw[first:]
    except ValueError:
        pass
    for marker in ('在 Lingoland 學習此詞彙集', 'Learn this vocabulary set on Lingoland'):
        try:
            end = raw.index(marker)
            if end > 20:
                raw = raw[:end]
        except ValueError:
            pass
    starts = [i for i,t in enumerate(raw) if looks_ipa(t) and i > 0]
    entries = []
    for j, ipos in enumerate(starts):
        word = raw[ipos - 1].strip()
        # Support phrases like A / B, but reject navigation and punctuation snippets.
        if not ASCII.search(word) or not (1 <= len(word) <= 95) or word.startswith('/'):
            continue
        end = starts[j+1] - 1 if j+1 < len(starts) else len(raw)
        segment = raw[ipos+1:end]
        # Parse first explicit POS and any short Chinese lexical gloss; never copy example prose.
        posparts, glosses = [], []
        example = False
        for i,line in enumerate(segment):
            if line in ('範例:', '示例:', 'Example:'):
                example = i + 1 < len(segment) and bool(ASCII.search(segment[i+1]))
                break
            match = POS_RE.match(line)
            if match:
                for p in match.group(1).lower().split(';'):
                    p = p.strip()
                    posparts.append(POS_CN.get(p, p))
                meanings = match.group(2).strip().strip(';')
                if meanings:glosses.append(meanings)
        if not posparts:  # Rows with no lexical POS/gloss need review, not silent guessing.
            continue
        zh = '；'.join(dict.fromkeys(s.strip() for g in glosses for s in re.split(r'[,，；;]',g) if s.strip()))
        if not zh:
            continue
        pos = '／'.join(dict.fromkeys(posparts))
        is_multiword = bool(re.search(r'\s',word))
        kind = ('搭配／句型' if pos in ('搭配','慣用語') and re.search(r"\bone['’]s\b|\bto do\b|\bA\b.*\bB\b",word) else '片語') if is_multiword else '單字'
        entries.append({'en':word,'zh':zh,'pos':pos,'type':kind,'hasSourceExample':example,'sourceUrl':url})
    return entries, raw


def main():
    arg = argparse.ArgumentParser()
    arg.add_argument('--check-only',action='store_true')
    opts = arg.parse_args()
    pages = {}
    for day, slug in PAGES.items():
        for section, level in SECTIONS:
            url=f'{BASE}/{slug}/{section}'
            found, raw = page_entries(fetch(url),url)
            if len(found)<18 or len(found)>250:
                raise ValueError(f'Day{day} {section}: implausible page size {len(found)}; start={raw[:28]!r}')
            if len({e['en'].casefold() for e in found}) < len(found)*.9:
                raise ValueError(f'Day{day} {section}: too many repeated entries; possible parsing issue')
            pages[(day,level)]=found
            print(f'Day{day:02d} {section:18s}: {len(found):3d} entries; first={found[0]["en"]!r}; last={found[-1]["en"]!r}; example links={sum(e["hasSourceExample"] for e in found)}',flush=True)
    if pages[(3,'核心')][0]['en'].casefold()!='accustomed':
        raise ValueError('Day3 leading word fingerprint mismatch')
    if len(pages[(3,'核心')])<40 or pages[(3,'核心')][39]['en'].casefold()!='concentrate':
        raise ValueError('Day3 40th word fingerprint mismatch')
    if pages[(3,'800')][-1]['en'].casefold()!="throw one's effort into":
        raise ValueError('Day3 800 final word fingerprint mismatch')
    if pages[(3,'900')][-1]['en'].casefold()!='telecommute':
        raise ValueError('Day3 900 final word fingerprint mismatch')
    total = sum(map(len,pages.values()))
    print(f'Source verification complete: {total} extracted entries',flush=True)
    if opts.check_only:
        return
    target=ROOT/'data'/'words.js'
    text=target.read_text(encoding='utf-8')
    old = json.loads(text[text.index('['):text.rfind(']')+1])
    original=[e for e in old if e['day'] in (1,2)]
    if len(original)!=487:raise ValueError(f'Expected 487 user-owned Day1/2 words, found {len(original)}')
    words=original[:]
    for (day, level),entries in pages.items():
        for e in entries:
            words.append({'id':len(words)+1,'row':None,'day':day,'en':e['en'],'zh':e['zh'],
                'type':e['type'],'pos':e['pos'],'level':level,'unfamiliar':False,'note':'',
                'source':'Lingoland','sourceUrl':e['sourceUrl'],'hasSourceExample':e['hasSourceExample']})
    # Do not inject external example text: only independently authored sentences appear locally.
    payload=json.dumps(words,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    target.write_text('/* Day1/2: personal Google Sheet; Day3/4: verified Lingoland vocabulary (short glosses; no external example prose). */\nwindow.WORDSTUDIO_WORDS = '+payload+';\n',encoding='utf-8')
    summary={f'Day{day}-{level}':{'entries':len(items),'first':items[0]['en'],'last':items[-1]['en'],'exampleLinks':sum(i['hasSourceExample'] for i in items)} for (day,level),items in pages.items()}
    (ROOT/'data'/'source_audit.json').write_text(json.dumps({'source':BASE,'importedEntries':total,'groups':summary},indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'Wrote {len(words)} total records; Day1/2 unchanged ({len(original)})',flush=True)

if __name__=='__main__':
    main()
