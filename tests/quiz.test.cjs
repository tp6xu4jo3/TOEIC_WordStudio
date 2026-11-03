const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{},Math,console};
for(const file of ['data/words.js','data/families.js','data/grammar.js','data/synonyms.js','js/preferences.js','js/engine.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const {WORDSTUDIO_WORDS:words,WORDSTUDIO_FAMILIES:familyDefs,WORDSTUDIO_GRAMMAR:grammar,WORDSTUDIO_SYNONYMS:synonyms,WordEngine:E}=ctx.window;
test('詞條與分類符合題庫；保留重複詞性與DAY',()=>{
 assert.equal(words.length,487);assert.equal(words.filter(w=>w.day===1).length,246);assert.equal(words.filter(w=>w.day===2).length,241);
 assert.equal(words.filter(w=>w.en==='associate').length,3);
});
test('母字分組無遺漏、無重覆、子項都有來源；qualify 類別正確',()=>{
 const groups=E.makeFamilies(words,familyDefs),seen=groups.flatMap(x=>x.entries.map(w=>w.id));
 assert.equal(seen.length,487);assert.equal(new Set(seen).size,487);
 const found=groups.find(x=>x.head==='qualify');assert.ok(found);
 for(const term of ['qualified','qualification','qualifier','be qualified for','qualification for'])assert.ok(found.entries.some(x=>x.en===term),term);
 assert.ok(found.entries.some(x=>x.en==='be qualified for'&&x.relation==='preps'));
 assert.ok(!groups.find(x=>x.head==='apply').entries.some(x=>x.en==='appliance'));
 for(const spec of familyDefs)for(const child of [...spec.forms,...spec.preps,...spec.uses])assert.ok(words.some(w=>w.en===child),'群組出現題庫外項目：'+child);
});
test('搭配題都是單一空格、正確答案存在、選項無重複、來源來自詞庫',()=>{
 assert.ok(grammar.length>=40);
 const names=new Set(words.map(w=>w.en));
 for(const item of grammar){
  assert.ok(names.has(item.source),'來源不存在：'+item.source);
  assert.equal((item.frame.match(/___/g)||[]).length,1,item.frame);
  assert.equal(item.choices.length,4,item.frame);
  assert.equal(new Set(item.choices).size,4,item.frame);
  assert.ok(item.choices.includes(item.answer),item.frame);
 }
});
test('同義題組所有答案和干擾項都有來源、內容互不重覆',()=>{
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
 for(const d of [1,2]){const filt={day:String(d),level:'all',type:'all',unfamiliar:false};for(let j=0;j<200;j++){
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
