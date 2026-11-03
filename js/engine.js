/* 可單獨測試的字族整理與出題引擎；不使用瀏覽器儲存空間。 */
(function(global){
'use strict';
const norm=s=>String(s??'').normalize('NFKC').trim().toLocaleLowerCase('en');
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const tokens=s=>String(s??'').replace(/[（）()]/g,'').split(/[；;／/、，,]/).map(x=>x.replace(/[\s…\-・。！!]+/g,'').trim()).filter(x=>x.length>=2);
const overlap=(a,b)=>tokens(a).some(x=>tokens(b).some(y=>x===y||(Math.min(x.length,y.length)>=3&&(x.includes(y)||y.includes(x)))));
const posHead=p=>String(p||'').split(/[／\s]/)[0];
const match=(w,f={})=>(!f.day||f.day==='all'||String(w.day)===String(f.day))&&(!f.level||f.level==='all'||w.level===f.level)&&(!f.type||f.type==='all'||w.type===f.type)&&(!f.unfamiliar||w.unfamiliar);
const pool=(words,filter)=>words.filter(w=>match(w,filter));
function makeFamilies(words,definitions){
 const byEn=new Map();for(const w of words){let k=norm(w.en);if(!byEn.has(k))byEn.set(k,[]);byEn.get(k).push(w);}
 const assigned=new Set(),groups=[];
 const insert=(arr,term,relation)=>{for(const w of byEn.get(norm(term))||[]){if(assigned.has(w.id))continue;assigned.add(w.id);arr.push({...w,relation});}};
 for(const def of definitions){let entries=[];insert(entries,def.head,'root');for(const key of ['forms','preps','uses'])for(const term of def[key]||[])insert(entries,term,key);
  if(entries.length)groups.push({id:norm(def.head),head:def.head,entries,curated:true,virtual:!byEn.has(norm(def.head))});
 }
 for(const [key,items] of byEn){const entries=items.filter(w=>!assigned.has(w.id)).map(w=>({...w,relation:'root'}));if(entries.length){entries.forEach(w=>assigned.add(w.id));groups.push({id:key,head:items[0].en,entries,curated:false,virtual:false});}}
 groups.sort((a,b)=>a.head.localeCompare(b.head,'en'));
 return groups;
}
function chooseFoils(words,correct,mode,count=3){
 const choices=shuffle(words.filter(x=>norm(x.en)!==norm(correct.en)&&!overlap(x.zh,correct.zh)&&x.zh!==correct.zh))
 .map(w=>({w,score:(posHead(w.pos)===posHead(correct.pos)?7:0)+(w.type===correct.type?3:0)+(w.level===correct.level?1:0)+Math.random()*3}))
 .sort((a,b)=>b.score-a.score);
 const picked=[];
 for(const {w} of choices){if(mode==='en-zh'&&picked.some(x=>overlap(x.zh,w.zh)))continue;if(mode==='zh-en'&&picked.some(x=>norm(x.en)===norm(w.en)))continue;picked.push(w);if(picked.length>=count)break;}
 return picked;
}
function buildWordQ(words,filter,mode,recent=[]){
 const candidates=pool(words,filter).filter(w=>w.en&&w.zh);
 if(!candidates.length)return null;
 const fresh=candidates.filter(w=>!recent.includes(norm(w.en)+'::'+w.pos));
 const answer=pick(fresh.length?fresh:candidates);
 const wrong=chooseFoils(words,answer,mode,3);if(wrong.length<3)return null;
 const options=shuffle([answer,...wrong]).map(w=>({text:mode==='en-zh'?w.zh:w.en,entry:w,correct:w.id===answer.id}));
 return {mode,source:answer.en,answer,options,correctIndices:options.flatMap((o,i)=>o.correct?[i]:[]),
  clue:mode==='en-zh'?'哪一項是最符合的中文解釋？':'哪一個英文符合這個中文意思？',
  prompt:mode==='en-zh'?answer.en:answer.zh,sourceKey:norm(answer.en)+'::'+answer.pos,
  detail:answer.note?'原題庫補充：'+answer.note:''};
}
function buildSynQ(words,synonyms,filter,recent=[]){
 const selected=new Set(pool(words,filter).map(w=>norm(w.en)));
 const whole=new Map(words.map(w=>[norm(w.en),w]));
 const eligible=synonyms.map(g=>({...g,valid:g.answers.filter(a=>selected.has(norm(a)))}))
 .filter(g=>g.valid.length>=2&&g.foils.filter(x=>whole.has(norm(x))).length>=6-g.valid.length);
 if(!eligible.length)return null;
 const fresh=eligible.filter(g=>!recent.includes(g.id));const item=pick(fresh.length?fresh:eligible);
 const terms=shuffle([...item.valid,...shuffle(item.foils.filter(x=>whole.has(norm(x))&&!item.valid.includes(x))).slice(0,6-item.valid.length)]);
 const options=terms.map(text=>({text,entry:whole.get(norm(text)),correct:item.valid.includes(text)}));
 return {mode:'syn',source:item.id,sourceKey:item.id,clue:'請選出所有符合下列語境的詞彙',prompt:item.prompt,
  options,correctIndices:options.flatMap((o,i)=>o.correct?[i]:[]),detail:item.note};
}
function buildGrammarQ(words,items,filter,recent=[]){
 const available=new Set(pool(words,filter).map(w=>norm(w.en)));
 const eligible=items.map((p,i)=>({...p,index:i})).filter(p=>available.has(norm(p.source)));
 if(!eligible.length)return null;
 const fresh=eligible.filter(p=>!recent.includes(p.source));const item=pick(fresh.length?fresh:eligible);
 const origin=pool(words,filter).find(w=>norm(w.en)===norm(item.source));
 const options=shuffle(item.choices).map(text=>({text,correct:text===item.answer}));
 return {mode:'grammar',source:item.source,sourceKey:item.source,answer:origin,
  kind:item.kind,clue:origin?.zh||'完成固定搭配',prompt:item.frame,
  options,correctIndices:options.flatMap((o,i)=>o.correct?[i]:[]),
  detail:(item.explain?item.explain+'　':'')+(origin?.note?'原題庫補充：'+origin.note:'')};
}
function availableCount(words,grammar,synonyms,filter,mode){
 if(mode==='grammar')return grammar.filter(q=>pool(words,filter).some(w=>norm(w.en)===norm(q.source))).length;
 if(mode==='syn'){const names=new Set(pool(words,filter).map(w=>norm(w.en)));return synonyms.filter(g=>g.answers.filter(x=>names.has(norm(x))).length>=2).length;}
 return pool(words,filter).length;
}
global.WordEngine={norm,shuffle,overlap,match,pool,makeFamilies,buildWordQ,buildSynQ,buildGrammarQ,availableCount};
})(typeof window!=='undefined'?window:globalThis);
