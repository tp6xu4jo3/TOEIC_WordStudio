(function(){'use strict';
const WORDS=window.WORDSTUDIO_WORDS,EXAMPLES=Object.assign({},window.WORDSTUDIO_EXTRA_EXAMPLES||{},window.WORDSTUDIO_EXAMPLES||{}),FAMILIES=window.WORDSTUDIO_FAMILIES,
 GRAMMAR=window.WORDSTUDIO_GRAMMAR,SYNONYMS=window.WORDSTUDIO_SYNONYMS,E=window.WordEngine,Prefs=window.WordStudioPreferences;
let browserStorage=null;try{browserStorage=window.localStorage;}catch(error){/* File URLs or restricted browsers may block storage. */}
const preferences=Prefs.create(WORDS,browserStorage);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=E.makeFamilies(WORDS,FAMILIES),byId=new Map(WORDS.map(w=>[w.id,w]));
const familyByEntry=new Map();for(const f of groups)for(const e of f.entries)familyByEntry.set(e.id,f);
const state={page:'dictionary',mode:'en-zh',d:{day:'all',level:'all',type:'all',unfamiliar:false},q:{day:'all',level:'all',type:'all',unfamiliar:false},search:'',limit:18,openFamilies:new Set(),question:null,chosen:new Set(),answered:false,serial:0,recent:[]};
const dayValues=[...new Set(WORDS.map(w=>w.day))].sort((a,b)=>a-b);
const cleanType=t=>t==='搭配／句型'?'搭配／句型':t;
const mergeMeanings=values=>[...new Set(values.flatMap(v=>String(v).split(/[；;]/).map(t=>t.trim()).filter(Boolean)))].join('；');
const relevant=(w,search)=>!search||[w.en,w.zh,w.pos,w.note].some(s=>E.norm(s).includes(search));
function selectedGroups(){const search=E.norm(state.search);return groups.map(g=>({g,shown:g.entries.filter(e=>E.match(e,state.d)&&(!search||relevant(e,search)||E.norm(g.head).includes(search)))})).filter(x=>x.shown.length);}
function entryTags(e){return `DAY ${e.day} · ${esc(e.level)} · ${esc(e.pos)}${EXAMPLES[E.norm(e.en)]?' · 例句 ↗':''}${e.unfamiliar?' · ★':''}`;}
function compactEntries(entries){const results=[],seen=new Map();for(const e of entries){const key=Prefs.wordKey(e);let item=seen.get(key);if(item){item.rows.push(e.id);item.meanings.push(e.zh);item.unfamiliar ||= e.unfamiliar;}else{item={...e,rows:[e.id],meanings:[e.zh]};seen.set(key,item);results.push(item);}}return results.map(x=>({...x,zh:mergeMeanings(x.meanings)}));}
function leaf(e,relation,matched){const marked=Boolean(e.unfamiliar);return `<div class="branch-leaf ${relation} ${matched?'is-match':''} ${marked?'is-unfamiliar':''}"><button type="button" class="leaf-open" data-entry="${e.id}" aria-label="查看${esc(e.en)}詞條"><span class="leaf-word">${esc(e.en)}</span><span class="leaf-zh">${esc(e.zh)}</span><span class="leaf-badges">${entryTags(e)}${e.rows.length>1?' · '+e.rows.length+'筆原始列':''}</span></button><button type="button" class="unfamiliar-star ${marked?'active':''}" data-toggle-entry="${e.id}" aria-pressed="${marked}" aria-label="${marked?'取消':'標記'}${esc(e.en)}不熟" title="${marked?'取消不熟標記':'加入不熟清單'}">${marked?'★':'☆'}</button></div>`;}
function branch(entries,key,heading,matching){if(!entries.length)return '';const display=compactEntries(entries);return `<div class="branch-heading">${heading} / ${entries.length.toString().padStart(2,'0')}</div><div class="branch-list">${display.map(e=>leaf(e,key,e.rows.some(id=>matching.has(id)))).join('')}</div>`;}
function familyHTML({g,shown},i){const isOpen=state.openFamilies.has(g.id)||(!!state.search&&shown.some(e=>E.norm(e.en)!==E.norm(g.head)));
 const root=g.entries.filter(e=>e.relation==='root');
 const meaning=root.length?mergeMeanings(root.map(x=>x.zh)):(g.virtual?'詞族主題 · 母字未單列於Sheet':'詞族');
 const matches=new Set(shown.map(e=>e.id));const counts=g.entries.length;
 const branches={forms:g.entries.filter(e=>e.relation==='forms'),preps:g.entries.filter(e=>e.relation==='preps'),uses:g.entries.filter(e=>e.relation==='uses')};
 const virtual=g.virtual;
 return `<article class="family-card ${isOpen?'expanded':''}"><button type="button" class="family-head" data-family="${esc(g.id)}" aria-expanded="${isOpen}" aria-controls="family-panel-${i}"><span class="family-index">${String(i+1).padStart(2,'0')}</span><span class="family-title"><span class="family-name">${esc(g.head)}</span><div class="family-desc">${esc(meaning)}</div></span><span class="family-meta"><b>${counts}</b> ENTRIES</span><span class="family-plus" aria-hidden="true">${isOpen?'−':'+'}</span></button><div class="family-body" id="family-panel-${i}" ${isOpen?'':'hidden'}>${virtual?'<div class="root-note">* 此母字為分類標題，並非額外新增的題庫單字。</div>':root.length?`<div class="branch-heading">ROOT / 原形與同字不同詞性</div><div class="branch-list">${compactEntries(root).map(e=>leaf(e,'forms',e.rows.some(id=>matches.has(id)))).join('')}</div>`:''}${branch(branches.forms,'forms','WORD FORMS / 衍生字',matches)}${branch(branches.preps,'preps','PREPOSITION / 介系詞與固定框架',matches)}${branch(branches.uses,'uses','COLLOCATIONS / 搭配與片語',matches)}</div></article>`;
}
function renderDictionary(){const set=selectedGroups();$('#allCount').textContent=WORDS.length;$('#familyCount').textContent=groups.length;$('#dictResultCount').textContent=`${set.length} 個字族 · ${set.reduce((n,x)=>n+x.shown.length,0)} 筆符合 · ★ ${WORDS.filter(w=>w.unfamiliar).length} 不熟`;
 $('#familyGrid').innerHTML=set.length?set.slice(0,state.limit).map(familyHTML).join(''):`<div class="empty"><b>No matches found.</b>目前的條件沒有符合的詞條。試著調整DAY、類型或搜尋字詞。</div>`;
 $('#loadMore').hidden=set.length<=state.limit;if(set.length>state.limit)$('#loadMore').innerHTML=`SHOW MORE FAMILIES <span>↓</span> (${state.limit}/${set.length})`;
}
function openDetail(id){
 const w=byId.get(id);if(!w)return;
 const example=EXAMPLES[E.norm(w.en)];
 const exampleBlock=example?`<section class="detail-example"><div class="example-eyebrow">EXAMPLE / 例句</div><p lang="en">${esc(example[0])}</p>${example[1]?`<span>${esc(example[1])}</span>`:''}</section>`:'';
 const family=familyByEntry.get(id),duplicates=WORDS.filter(x=>E.norm(x.en)===E.norm(w.en)&&x.pos===w.pos);
 const combinedZh=mergeMeanings(duplicates.map(x=>x.zh));
 const related=family?family.entries.filter(x=>x.id!==id).slice(0,32):[];
 const marked=preferences.isMarked(w);
 const dayList=[...new Set(duplicates.map(x=>'DAY '+x.day))].join('、');
 $('#detailBody').innerHTML=`<div class="dialog-top"><span>DICTIONARY RECORD / ${String(w.id).padStart(3,'0')}</span><button type="button" class="close-dialog" data-action="close" aria-label="關閉詞條">×</button></div><h2 class="detail-title" id="detailTitle">${esc(w.en)}</h2><div class="detail-meaning">${esc(combinedZh)}</div><div class="detail-familiarity"><div><b>FAMILIARITY / 不熟標記</b><p>可手動設定，僅儲存在目前瀏覽器；不影響Google Sheets。</p></div><button type="button" class="detail-star ${marked?'active':''}" data-toggle-entry="${w.id}" aria-pressed="${marked}">${marked?'★ 已標記不熟':'☆ 標記為不熟'}</button></div><div class="detail-info"><div><b>PART OF SPEECH / 詞性</b><span>${esc(w.pos)}</span></div><div><b>ENTRY TYPE / 類型</b><span>${esc(w.type)}</span></div><div><b>DAY / 範圍</b><span>${esc(dayList)}</span></div><div><b>UNFAMILIAR / 目前狀態</b><span>${marked?'★ 不熟':'未標記'}</span></div></div>${exampleBlock}${w.note?`<div class="detail-note"><strong>題庫補充與文法</strong><div>${esc(w.note)}</div></div>`:''}${related.length?`<div class="detail-related"><b>FAMILY CONNECTIONS / 同字族延伸</b><div class="related-list">${related.map(x=>`<button type="button" data-entry="${x.id}">${esc(x.en)}</button>`).join('')}</div></div>`:''}<div class="detail-bottom"><button type="button" data-action="close">完成 ↗</button></div>`;
 const dialog=$('#detailDialog');if(!dialog.open)dialog.showModal();
}
function toggleUnfamiliar(id){const word=byId.get(id);if(!word)return;
 const key=Prefs.wordKey(word),next=!preferences.isMarked(word);
 const stored=preferences.setMarked(word,next);
 for(const family of groups)for(const entry of family.entries)if(Prefs.wordKey(entry)===key)entry.unfamiliar=next;
 const dialog=$('#detailDialog'),inDialog=dialog.open;
 renderDictionary();if(state.q.unfamiliar)newQuestion();
 if(inDialog){openDetail(id);dialog.querySelector('[data-toggle-entry]')?.focus();}
 if(!stored)showStorageWarning();}
function showStorageWarning(){const node=$('#storageNote');if(node)node.textContent='目前瀏覽器阻擋本機儲存；標記在重新整理後可能無法保留。';}
function filters(which){return {day:$('#'+which+'Day').value,level:$('#'+which+'Level').value,type:$('#'+which+'Type').value,unfamiliar:$('#'+which+'Unfamiliar').checked};}
function resetFilter(which){['Day','Level','Type'].forEach(x=>$('#'+which+x).value='all');$('#'+which+'Unfamiliar').checked=false;if(which==='d'){$('#dictSearch').value='';state.search='';state.d=filters(which);state.limit=18;renderDictionary();}else{state.q=filters(which);state.recent=[];newQuestion();}}
function navigate(page){if(!['dictionary','practice'].includes(page))page='dictionary';state.page=page;$('#dictionaryPage').classList.toggle('is-hidden',page!=='dictionary');$('#practicePage').classList.toggle('is-hidden',page!=='practice');$$('[data-nav]').forEach(n=>{const yes=n.dataset.nav===page;n.classList.toggle('active',yes);yes?n.setAttribute('aria-current','page'):n.removeAttribute('aria-current');});if(location.hash!==`#${page}`)history.replaceState(null,'',`#${page}`);if(page==='dictionary')renderDictionary();window.scrollTo({top:0,behavior:'instant'});}
const letters=['A','B','C','D','E','F'];
function makeQuestion(){if(state.mode==='syn')return E.buildSynQ(WORDS,SYNONYMS,state.q,state.recent);if(state.mode==='grammar')return E.buildGrammarQ(WORDS,GRAMMAR,state.q,state.recent);return E.buildWordQ(WORDS,state.q,state.mode,state.recent);}
function newQuestion(){state.question=makeQuestion();state.chosen=new Set();state.answered=false;state.serial++;if(state.question){const key=state.question.sourceKey;state.recent.push(key);if(state.recent.length>32)state.recent.shift();}renderQuiz();}
function qOptions(q){return q.options.map((o,i)=>{const selected=state.chosen.has(i),correct=state.answered&&o.correct,wrong=state.answered&&selected&&!o.correct;
 return `<button class="choice ${selected?'selected':''} ${correct?'correct':''} ${wrong?'wrong':''}" data-choice="${i}" aria-pressed="${selected}" ${state.answered?'disabled':''}><span class="choice-key">${correct?'✓':wrong?'×':letters[i]}</span><span class="choice-text">${esc(o.text)}</span></button>`;}).join('');}
function feedback(q){const right=q.correctIndices.length===state.chosen.size&&q.correctIndices.every(i=>state.chosen.has(i));const ans=q.correctIndices.map(i=>letters[i]+'. '+q.options[i].text).join('、');
 let source='',explanation='';
 if(q.mode==='grammar'){source=`<strong>${esc(q.source)}</strong>　${esc(q.answer?.zh||'')}`;explanation=q.detail;}
 else if(q.mode==='syn'){source=q.correctIndices.map(i=>`<strong>${esc(q.options[i].text)}</strong>：${esc(q.options[i].entry?.zh||'')}`).join('<span>　／　</span>');explanation=q.detail;}
 else{source=`<strong>${esc(q.answer.en)}</strong>　${esc(q.answer.zh)}`;explanation=q.detail;}
 return `<div class="feedback"><div class="feedback-result ${right?'':'bad'}"><h3>${right?'✓ 答對了':'↗ 再記住這個搭配'}</h3>${right?'':`<p>正確答案：${esc(ans)}</p>`}<p>${source}</p>${explanation?`<p>${esc(explanation)}</p>`:''}</div><div class="feedback-footer"><button class="next" data-action="next">下一題 <span aria-hidden="true">→</span></button><span class="helper">Enter 繼續</span></div></div>`;
}
function renderQuiz(){const q=state.question;const count=E.availableCount(WORDS,GRAMMAR,SYNONYMS,state.q,state.mode);$('#qPoolCount').textContent=`目前範圍：${count} ${q?.mode==='syn'?'組同義題':q?.mode==='grammar'?'道搭配題':'筆詞條'}`;
 if(!q){$('#quizPanel').innerHTML=`<div class="quiz-empty"><h3>這個範圍暫無題目。</h3><p>同義題至少需要兩個同組詞彙；搭配題則需要符合篩選的固定片語。<br>放寬範圍後就能繼續練習。</p><button class="primary" data-action="reset-q">清除篩選</button></div>`;return;}
 const multi=q.mode==='syn';const prompt=q.mode==='grammar'?esc(q.prompt).replace('___','<mark>＿＿＿</mark>'):esc(q.prompt);
 const typeLabel={ 'en-zh':'EN → ZH · 單選','zh-en':'ZH → EN · 單選','syn':'SYNONYMS · 複選','grammar':'COLLOCATIONS · 單選'}[q.mode];
 const meta=multi?'選出全部適用詞彙，再按確認':q.mode==='grammar'?`${esc(q.kind)} · DAY ${q.answer?.day||'—'} · 選出空格所需內容`:`${esc(q.answer.pos)} · ${esc(cleanType(q.answer.type))} · DAY ${q.answer.day}`;
 const label=q.mode==='grammar'?'依中文意思填入正確的介系詞或形式：'+q.clue:q.clue;
 $('#quizPanel').innerHTML=`<div class="quiz-top"><strong>QUESTION / ${String(state.serial).padStart(3,'0')}</strong><span>${esc(typeLabel)}</span></div><div class="question-label">${esc(label)}</div><h3 class="question-prompt ${multi?'multi':q.mode==='grammar'?'grammar':q.mode==='zh-en'?'chinese':''}">${prompt}</h3><div class="question-meta">${meta}</div><div class="choices" role="group" aria-label="選項">${qOptions(q)}</div>${multi&&!state.answered?`<div class="submit-line"><button class="primary" data-action="submit" ${state.chosen.size?'':'disabled'}>確認答案 (${state.chosen.size}) ↗</button><span class="helper">可選取多個答案</span></div>`:''}${state.answered?feedback(q):''}`;
}
function choose(i){const q=state.question;if(!q||state.answered||!q.options[i])return;if(q.mode==='syn'){state.chosen.has(i)?state.chosen.delete(i):state.chosen.add(i);}else{state.chosen=new Set([i]);state.answered=true;}renderQuiz();}
function submit(){if(state.question?.mode!=='syn'||!state.chosen.size||state.answered)return;state.answered=true;renderQuiz();}
function init(){for(const d of dayValues)for(const key of ['dDay','qDay']){const option=document.createElement('option');option.value=String(d);option.textContent='DAY '+d;$('#'+key).append(option);}renderDictionary();newQuestion();navigate(location.hash==='#practice'?'practice':'dictionary');
 document.addEventListener('click',event=>{const nav=event.target.closest('[data-nav]');if(nav){event.preventDefault();navigate(nav.dataset.nav);return;}
 const family=event.target.closest('[data-family]');if(family){const id=family.dataset.family;state.openFamilies.has(id)?state.openFamilies.delete(id):state.openFamilies.add(id);renderDictionary();return;}
 const toggle=event.target.closest('[data-toggle-entry]');if(toggle){toggleUnfamiliar(Number(toggle.dataset.toggleEntry));return;}
 const entry=event.target.closest('[data-entry]');if(entry){openDetail(Number(entry.dataset.entry));return;}
 const mode=event.target.closest('[data-mode]');if(mode){state.mode=mode.dataset.mode;$$('[data-mode]').forEach(b=>{const yes=b===mode;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});state.recent=[];newQuestion();return;}
 const choice=event.target.closest('[data-choice]');if(choice){choose(Number(choice.dataset.choice));return;}
 const action=event.target.closest('[data-action]');if(!action)return;switch(action.dataset.action){case 'close':$('#detailDialog').close();break;case 'reset-d':resetFilter('d');break;case 'reset-q':resetFilter('q');break;case 'load-more':state.limit+=18;renderDictionary();break;case 'next':newQuestion();break;case 'submit':submit();break;}});
 for(const id of ['dDay','dLevel','dType','dUnfamiliar'])$('#'+id).addEventListener('change',()=>{state.d=filters('d');state.limit=18;renderDictionary();});
 for(const id of ['qDay','qLevel','qType','qUnfamiliar'])$('#'+id).addEventListener('change',()=>{state.q=filters('q');state.recent=[];newQuestion();});
 $('#dictSearch').addEventListener('input',e=>{state.search=e.target.value;state.limit=18;renderDictionary();});
 window.addEventListener('hashchange',()=>navigate(location.hash==='#practice'?'practice':'dictionary'));
 document.addEventListener('keydown',e=>{if($('#detailDialog').open||e.ctrlKey||e.altKey||e.metaKey)return;const tag=e.target?.tagName?.toLowerCase();if(e.key==='/'&&state.page==='dictionary'&&tag!=='input'){e.preventDefault();$('#dictSearch').focus();return;}if(['input','textarea','select'].includes(tag)||state.page!=='practice')return;
 if(e.key==='Enter'){if(state.answered){e.preventDefault();newQuestion();}else if(state.question?.mode==='syn'){e.preventDefault();submit();}}else if(/^[1-6]$/.test(e.key)){const n=Number(e.key)-1;if(state.question?.options[n]){e.preventDefault();choose(n);}}});
}
init();
})();
