const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{},Math,console};
for(const file of ['data/words.js','data/examples_extra.js','data/examples.js','data/families.js','data/grammar.js','data/synonyms.js','js/preferences.js','js/engine.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const {WORDSTUDIO_WORDS:words,WORDSTUDIO_FAMILIES:familyDefs,WORDSTUDIO_GRAMMAR:grammar,WORDSTUDIO_SYNONYMS:synonyms,WordEngine:E}=ctx.window;
test('詞條與分類符合題庫；保留重複詞性與DAY',()=>{
 assert.equal(words.length,824);assert.equal(words.filter(w=>w.day===1).length,246);assert.equal(words.filter(w=>w.day===2).length,241);
 const day3=words.filter(w=>w.day===3),day4=words.filter(w=>w.day===4);
 if(day3.length||day4.length){assert.ok(day3.length>=80);assert.ok(day4.length>=80);
 const core3=day3.filter(w=>w.level==='核心');assert.equal(core3[0].en,'accustomed');assert.equal(core3[39].en,'concentrate');
 assert.equal(day3.filter(w=>w.level==='800').at(-1).en,"throw one's effort into");
 assert.equal(day3.filter(w=>w.level==='900').at(-1).en,'telecommute');}
 assert.equal(words.filter(w=>w.en==='associate').length,3);
});
test('母字分組無遺漏、無重覆、子項都在詞庫內；qualify 類別正確',()=>{
 const groups=E.makeFamilies(words,familyDefs),seen=groups.flatMap(x=>x.entries.map(w=>w.id));
 assert.equal(seen.length,words.length);assert.equal(new Set(seen).size,words.length);
 const found=groups.find(x=>x.head==='qualify');assert.ok(found);
 for(const term of ['qualified','qualification','qualifier','be qualified for','qualification for'])assert.ok(found.entries.some(x=>x.en===term),term);
 assert.ok(found.entries.some(x=>x.en==='be qualified for'&&x.relation==='preps'));
 assert.ok(!groups.find(x=>x.head==='apply').entries.some(x=>x.en==='appliance'));
 for(const spec of familyDefs)for(const child of [...spec.forms,...spec.preps,...spec.uses])assert.ok(words.some(w=>w.en===child),'群組出現題庫外項目：'+child);
});
test('母字與子字強制相連且母字永遠最前；字族按首次出現位置排序',()=>{
 const families=E.makeFamilies(words,familyDefs),runs=E.bookRuns(words,families,{},'');
 const seen=runs.flatMap(r=>r.shown.map(w=>w.id));
 assert.equal(seen.length,words.length);
 assert.equal(new Set(seen).size,words.length);
 assert.equal(runs.length,families.length,'每個字族只能顯示一次');
 assert.ok(runs.every((r,i)=>i===0||r.anchor>runs[i-1].anchor),'字族順序須依最早出現位置');
 assert.equal(runs[0].shown[0].en,'resume');
 for(const r of runs){
  const rootCount=r.shown.filter(x=>x.relation==='root').length;
  assert.ok(r.shown.slice(0,rootCount).every(x=>x.relation==='root'),r.g.head);
  assert.ok(r.shown.slice(rootCount).every(x=>x.relation!=='root'),r.g.head);
  assert.equal(r.anchor,Math.min(...r.g.entries.map(x=>words.findIndex(w=>w.id===x.id))));
 }
 const qualify=runs.find(r=>r.g.head==='qualify');assert.ok(qualify);
 assert.equal(qualify.shown[0].en,'qualify');
 for(const term of ['qualified','qualification','qualifier','be qualified for','qualification for'])
  assert.ok(qualify.shown.some(x=>x.en===term));
 const searched=E.bookRuns(words,families,{},'qualification');
 const group=searched.find(r=>r.g.head==='qualify');
 assert.ok(group);assert.equal(group.shown[0].en,'qualify');
 assert.ok(group.shown.some(x=>x.en==='qualified'));
 for(const day of [1,2,3,4]){
  const filtered=E.bookRuns(words,families,{day:String(day)},'');
  assert.ok(filtered.length>0);
  assert.ok(filtered.flatMap(r=>r.shown).every(w=>w.day===day));
  assert.equal(filtered.flatMap(r=>r.shown).length,words.filter(w=>w.day===day).length);
  assert.ok(filtered.every((r,i)=>i===0||r.anchor>filtered[i-1].anchor));
 }
 const unfamiliar=E.bookRuns(words,families,{unfamiliar:true},'');
 assert.ok(unfamiliar.flatMap(r=>r.shown).every(x=>x.unfamiliar));
});
test('搭配題都是單一空格、正確答案存在、選項無重複、考點屬於詞庫',()=>{
 assert.ok(grammar.length>=40);
 const names=new Set(words.map(w=>w.en));
 for(const item of grammar){
  assert.ok(names.has(item.source),'詞條不存在：'+item.source);
  assert.equal((item.frame.match(/___/g)||[]).length,1,item.frame);
  assert.equal(item.choices.length,4,item.frame);
  assert.equal(new Set(item.choices).size,4,item.frame);
  assert.ok(item.choices.includes(item.answer),item.frame);
 }
});
test('同義題組所有答案和干擾項都在詞庫內、內容互不重覆',()=>{
 const names=new Set(words.map(w=>w.en));
 for(const g of synonyms){const terms=[...g.answers,...g.foils];assert.equal(new Set(terms).size,terms.length);assert.ok(g.answers.length>=2);for(const name of terms)assert.ok(names.has(name),name);}
});
test('總共4000道隨機題選項唯一、正確答案數正確',()=>{
 const modes=['en-zh','zh-en','grammar','syn'],filter={day:'all',level:'all',type:'all',unfamiliar:false};
 for(const mode of modes)for(let j=0;j<1000;j++){
  const q=mode==='grammar'?E.buildGrammarQ(words,grammar,filter):mode==='syn'?E.buildSynQ(words,synonyms,filter):E.buildWordQ(words,filter,mode);
  assert.ok(q,mode);assert.equal(new Set(q.options.map(x=>x.text)).size,q.options.length);
  assert.equal(q.options.filter(x=>x.correct).length,q.correctIndices.length);assert.equal(q.correctIndices.length,mode==='syn'?q.correctIndices.length:1);
  if(mode==='syn')assert.ok(q.correctIndices.length>=2);
  assert.equal(q.options.length,mode==='syn'?6:4);
 }
});
test('筛選後未符合的文法與字詞不出題',()=>{
 for(const d of [...new Set(words.map(w=>w.day))]){const filt={day:String(d),level:'all',type:'all',unfamiliar:false};for(let j=0;j<200;j++){
  for(const mode of ['en-zh','zh-en','grammar']){
   const q=mode==='grammar'?E.buildGrammarQ(words,grammar,filt):E.buildWordQ(words,filt,mode);
   if(q)assert.equal(q.answer.day,d);
  }
 }}
});

test('可手動標記不熟、取消標記、重新載入保留，只儲存與原表不同的設定',()=>{
 const original=words.map(w=>({...w})), data=new Map();
 const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 const Pref=ctx.window.WordStudioPreferences, model=Pref.create(original,storage);
 const word=original.find(w=>w.en==='qualify'); assert.ok(word);
 const before=model.isMarked(word),desired=!before;
 assert.equal(model.setMarked(word,desired),true);
 assert.equal(model.isMarked(word),desired);
 assert.equal(JSON.parse(data.get(model.storageKey))[Pref.wordKey(word)],desired);
 const cloned=words.map(w=>({...w})),reloaded=Pref.create(cloned,storage);
 assert.equal(reloaded.isMarked(cloned.find(w=>w.en==='qualify')),desired);
 assert.equal(E.pool(cloned,{unfamiliar:true}).some(w=>w.en==='qualify'),desired);
 assert.equal(reloaded.setMarked(cloned.find(w=>w.en==='qualify'),before),true);
 assert.equal(Object.hasOwn(JSON.parse(data.get(model.storageKey)),Pref.wordKey(word)),false);
});
test('相同詞條與詞性下的多筆重複資料會一起更新不熟狀態',()=>{
 const duplicate=words.map(w=>({...w})), Pref=ctx.window.WordStudioPreferences;
 const by=new Map();for(const w of duplicate){const key=Pref.wordKey(w);by.set(key,(by.get(key)||[]).concat(w));}
 const found=[...by.values()].find(x=>x.length>1);assert.ok(found,'題庫含同英文與詞性的重複列');
 const model=Pref.create(duplicate,null);model.setMarked(found[0],true);
 assert.ok(found.every(x=>x.unfamiliar===true));model.setMarked(found[0],false);
 assert.ok(found.every(x=>x.unfamiliar===false));
});

test('中英對照例句與新增英文例句均可讀取',()=>{
 const paired=ctx.window.WORDSTUDIO_EXAMPLES;
 assert.ok(Object.keys(paired).length>=80);
 for(const [term,text] of Object.entries(paired)){
  assert.equal(text.length,2,term);
  assert.ok(text[0].length>20,term);
  assert.ok(text[1].length>=5,term);
 }
 const added=ctx.window.WORDSTUDIO_EXTRA_EXAMPLES;
 assert.ok(Object.keys(added).length>=700);
 for(const [term,text] of Object.entries(added)){
  assert.equal(text.length,1,term);
  assert.ok(text[0].length>=22,term);
 }
});

test('DAY 1–4全部詞條均有本網站原創例句，原本中英對照仍保留',()=>{
 const all={...ctx.window.WORDSTUDIO_EXTRA_EXAMPLES,...ctx.window.WORDSTUDIO_EXAMPLES};
 for(const w of words){
   const value=all[w.en.toLowerCase()];
   assert.ok(value?.[0]&&value[0].length>=22,`No original example for ${w.day}: ${w.en}`);
 }
 assert.ok(Object.keys(all).length>=750);
});

 test('字典不包含站外例句連結或出處資訊',()=>{
  const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  for(const value of [page,app,...words.map(w=>JSON.stringify(w))]){
   assert.ok(!/https?:\/\/|例句網址|站外例句/i.test(value));
  }
  assert.ok(page.includes('data/examples_extra.js'));
  for(const w of words)assert.ok(!Object.keys(w).some(k=>/url|external|origin|provenance|link/i.test(k)));
});
