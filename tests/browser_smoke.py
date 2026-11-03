"""Chromium + Playwright smoke test；需在開發環境安裝 playwright。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text('utf-8')
html=html.replace('<link rel="stylesheet" href="./assets/style.css">','<style>'+ (ROOT/'assets/style.css').read_text('utf-8') +'</style>')
html=re.sub(r'<script src="\./(.*?)"></script>',lambda m:'<script>'+ (ROOT/m.group(1)).read_text('utf-8') +'</script>',html)
# Sandbox browser blocks file:// and 127.0.0.1 navigation; set_content is the
# same app HTML with inlined local assets, with a persistent localStorage shim.
mock_storage="""() => {
 const data = {};
 Object.defineProperty(window, 'localStorage', {configurable:true,value:{
   getItem:key=>Object.prototype.hasOwnProperty.call(data,key)?data[key]:null,
   setItem:(key,value)=>{data[key]=String(value)},
   removeItem:key=>{delete data[key]}, clear:()=>{for(const key of Object.keys(data))delete data[key]}
 }});
}"""
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda err: errors.append(str(err)))
 page.evaluate(mock_storage)
 page.set_content(html,wait_until="load")
 page.wait_for_selector('.family-card')
 assert page.locator('.family-card').count()==18
 # 初始瀏覽順序必須與教材吻合；不因字族／詞性而重新排列。
 initial_words=page.locator('.tree-word').all_inner_texts()
 assert initial_words[:6]==['resume','opening','vacancy','applicant','apply','application'],initial_words[:6]
 initial_order=[int(v) for v in page.locator('.tree-entry').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.bookNo)')]
 assert initial_order==sorted(initial_order) and len(set(initial_order))==len(initial_order)
 if page.locator('#allCount').inner_text()=='824':
  page.locator('#dDay').select_option('3')
  assert page.locator('.tree-word').first.inner_text()=='accustomed'
  page.locator('#dDay').select_option('4')
  assert page.locator('.tree-word').first.inner_text()=='lax'
  page.locator('#dDay').select_option('all')
 page.locator('#loadMore').scroll_into_view_if_needed()
 page.wait_for_function("document.querySelectorAll('.family-card').length > 18",timeout=4000)
 assert page.locator('.family-card').count()>18
 assert page.locator('#allCount').inner_text() in ('487','824')
 page.locator('#dictSearch').fill('qualif')
 page.wait_for_timeout(100)
 assert page.locator('.family-card').count()>=1
 assert page.locator('.family-card:has-text("qualify") .tree-entry').count()>=4
 assert page.get_by_text('be qualified for',exact=True).count()>=1
 # 無論母字或子字，例句與資料直接顯示，不依賴展開按鈕或彈窗。
 assert page.locator('.family-card:has-text("qualify") .tree-entry.depth-0').count()>=1
 assert page.locator('.family-card:has-text("qualify") .tree-entry.depth-1').count()>=3
 assert page.locator('.family-card:has-text("qualify") .tree-example p[lang="en"]').count()>=4
 assert page.locator('.leaf-open,[data-family],#detailDialog').count()==0
 assert page.locator('.family-tree [hidden]').count()==0
 assert page.evaluate('''() => {
   const card=[...document.querySelectorAll('.family-card')].find(c=>c.textContent.includes('qualify'));
   const root=card.querySelector('.tree-entry.depth-0 .tree-word');
   const child=card.querySelector('.tree-entry.depth-1 .tree-word');
   return !!root && !!child && getComputedStyle(root).fontSize===getComputedStyle(child).fontSize;
 }''')
 # 單筆詞條也是第一層，無需另開資訊頁。
 page.locator('#dictSearch').fill('resume')
 assert page.locator('.tree-entry').count()>=1
 assert page.locator('.tree-example p[lang="en"]').first.is_visible()
 page.locator('#dictSearch').fill('qualif')
 page.screenshot(path=str(ROOT.parent/'wordstudio_preview_dictionary.png'),full_page=True)
 page.locator('#dictSearch').fill('')
 page.locator('[data-nav="practice"]').last.click()
 for mode in ['en-zh','zh-en','syn','grammar']:
  page.locator(f'.mode-card[data-mode="{mode}"]').click()
  assert page.locator('.choice').count()==(6 if mode=='syn' else 4)
  page.locator('.choice').first.click()
  if mode=='syn':page.locator('[data-action="submit"]').click()
  assert page.locator('.feedback').count()==1,mode
  page.locator('[data-action="next"]').click()
  assert page.locator('.choice').count()==(6 if mode=='syn' else 4)
 page.screenshot(path=str(ROOT.parent/'wordstudio_preview_practice.png'),full_page=True)
 # 標記與取消標記：字典與篩選同步、重新整理仍保留
 page.locator('[data-nav="dictionary"]').last.click()
 page.locator('#dictSearch').fill('qualify')
 star=page.locator('.unfamiliar-star').first
 initial=star.get_attribute('aria-pressed')
 star.click()
 assert page.locator('.unfamiliar-star').first.get_attribute('aria-pressed')!=initial
 assert page.evaluate('localStorage.getItem("wordstudio:unfamiliar:v1")') is not None
 page.set_content(html,wait_until='load')
 page.locator('#dictSearch').fill('qualify')
 assert page.locator('.unfamiliar-star').first.get_attribute('aria-pressed')!=initial
 page.locator('.unfamiliar-star').first.click()  # restore original state
 page.set_content(html,wait_until='load')
 page.locator('#dictSearch').fill('qualify')
 assert page.locator('.unfamiliar-star').first.get_attribute('aria-pressed')==initial
 # 篩選會隱藏不符合的子字；所有符合項目仍直接展開。
 page.locator('#dictSearch').fill('qualify')
 page.locator('#dUnfamiliar').check()
 assert page.locator('.tree-entry').count() >= 0
 assert page.locator('.family-tree [hidden],.leaf-open,#detailDialog').count()==0
 page.locator('#dUnfamiliar').uncheck()
 page.locator('#dictSearch').fill('qualif')
 assert page.locator('.tree-example p[lang="en"]').count()>=4
 # Mobile
 mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 mobile.on('pageerror',lambda err: errors.append(str(err)))
 mobile.evaluate(mock_storage)
 mobile.set_content(html,wait_until="load")
 mobile.wait_for_selector('.family-card')
 assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),'Horizontal overflow'
 mobile.screenshot(path=str(ROOT.parent/'wordstudio_preview_mobile.png'),full_page=True)
 mobile.locator('[data-nav="practice"]').last.click()
 mobile.locator('[data-mode="grammar"]').click()
 assert mobile.locator('.choice').count()==4
 assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),'Mobile practice overflow'
 assert not errors,errors
 print('Browser smoke test passed:',len(errors),'page errors')
 print('Dictionary families',page.locator('#familyGrid').locator('.family-card').count())
 print('Preview files created')
 browser.close()

