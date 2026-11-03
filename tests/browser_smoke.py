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
 assert '487' in page.locator('#allCount').inner_text()
 page.locator('#dictSearch').fill('qualif')
 page.wait_for_timeout(100)
 assert page.locator('.family-card').count()>=1
 assert page.locator('.family-card:has-text("qualify") .branch-leaf').count()>=4
 assert page.get_by_text('be qualified for',exact=True).count()>=1
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
 # Detail and dialog keyboard
 page.locator('[data-nav="dictionary"]').last.click()
 page.locator('#dictSearch').fill('qualify')
 page.locator('.leaf-open').first.click()
 assert page.locator('#detailDialog').evaluate('(d)=>d.open')
 assert page.locator('.detail-title').inner_text().strip()
 page.locator('.close-dialog').click()
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

