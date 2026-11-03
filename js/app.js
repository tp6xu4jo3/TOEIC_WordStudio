(function(){'use strict';
const WORDS=window.WORDSTUDIO_WORDS,EXAMPLES=Object.assign({},window.WORDSTUDIO_EXTRA_EXAMPLES||{},window.WORDSTUDIO_EXAMPLES||{}),FAMILIES=window.WORDSTUDIO_FAMILIES,
 GRAMMAR=window.WORDSTUDIO_GRAMMAR,SYNONYMS=window.WORDSTUDIO_SYNONYMS,E=window.WordEngine,Prefs=window.WordStudioPreferences;
let browserStorage=null;try{browserStorage=window.localStorage;}catch(error){/* File URLs or restricted browsers may block storage. */}
const preferences=Prefs.create(WORDS,browserStorage);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=E.makeFamilies(WORDS,FAMILIES),byId=new Map(WORDS.map(w=>[w.id,w]));
const state={page:'dictionary',mode:'en-zh',d:{day:'all',level:'all',type:'all',unfamiliar:false},q:{day:'all',level:'all',type:'all',unfamiliar:false},search:'',limit:18,question:null,chosen:new Set(),answered:false,serial:0,recent:[]};
const dayValues=[...new Set(WORDS.map(w=>w.day))].sort((a,b)=>a-b);
const cleanType=t=>t==='搭配／句型'?'搭配／句型':t;
const mergeMeanings=values=>[...new Set(values.flatMap(v=>String(v).split(/[；;]/).map(t=>t.trim()).filter(Boolean)))].join('；');
const relevant=(w,search)=>!search||[w.en,w.zh,w.pos,w.note].some(s=>E.norm(s).includes(search));
function selectedGroups(){return E.bookRuns(WORDS,groups,state.d,state.search);}
const relationLabels={root:'母字／同字',forms:'衍生字',preps:'介系詞／句型',uses:'搭配／片語'};
function treeEntry(e,relation,child){
 const marked=Boolean(e.unfamiliar),example=EXAMPLES[E.norm(e.en)];
 const text=example?`<div class="tree-example"><p lang="en">${esc(example[0])}</p>${example[1]?`<p class="tree-example-zh">${esc(example[1])}</p>`:''}</div>`:'';
 return `<div data-entry-id="${e.id}" data-book-no="${e.bookNo}" class="tree-entry ${child?'depth-1':'depth-0'} relation-${relation} ${marked?'is-unfamiliar':''}" role="listitem"><div class="tree-entry-content"><div class="tree-entry-top"><div class="tree-wordline"><span class="tree-word" lang="en">${esc(e.en)}</span><span class="tree-pos">${esc(e.pos)}</span><span class="tree-relation">${relationLabels[relation]}</span></div><button type="button" class="unfamiliar-star ${marked?'active':''}" data-toggle-entry="${e.id}" aria-pressed="${marked}" aria-label="${marked?'取消':'標記'}${esc(e.en)}不熟" title="${marked?'取消不熟標記':'加入不熟清單'}">${marked?'★':'☆'}</button></div><p class="tree-meaning">${esc(e.zh)}</p>${text}${e.note?`<p class="tree-note">${esc(e.note)}</p>`:''}<div class="tree-meta">DAY ${e.day} · NO. ${String(e.bookNo).padStart(3,'0')} <span aria-hidden="true">/</span> ${e.levels.map(esc).join(' · ')} <span aria-hidden="true">/</span> ${esc(e.type)}${e.rows.length>1?' · 合併'+e.rows.length+'筆':''}</div></div></div>`;
}
function familyHTML({g,shown,day,dayStart},i){
 const entries=shown,grouped=entries.length>1;
 const dayHeader=dayStart?`<div class="day-divider" role="heading" aria-level="3"><span>DAY ${String(day).padStart(2,'0')}</span><small>WORD FAMILIES</small></div>`:'';
 return `${dayHeader}<section class="family-card ${grouped?'has-branches':'single-entry'}" aria-label="${esc(g.head)}字族"><header class="family-caption"><span class="family-caption-id">${String(i+1).padStart(2,'0')} / DAY ${day}</span><span class="family-caption-name">${esc(g.head)}</span><span class="family-caption-count">${entries.length} ${entries.length===1?'ENTRY':'ENTRIES'}</span></header><div class="family-tree" role="list">${entries.map(e=>treeEntry(e,e.relation,e.relation!=='root')).join('')}</div></section>`;
}
function renderDictionary(){const set=selectedGroups();$('#allCount').textContent=WORDS.length;$('#familyCount').textContent=groups.length;$('#dictResultCount').textContent=`字族相連 · 母字優先 · ${set.reduce((n,x)=>n+x.shown.length,0)} 筆符合 · ★ ${WORDS.filter(w=>w.unfamiliar).length} 不熟`;
 $('#familyGrid').innerHTML=set.length?set.slice(0,state.limit).map(familyHTML).join(''):`<div class="empty"><b>No matches found.</b>目前的條件沒有符合的詞條。試著調整DAY、類型或搜尋字詞。</div>`;
 $('#loadMore').hidden=set.length<=state.limit;if(set.length>state.limit)$('#loadMore').innerHTML=`向下捲動，自動載入更多字族 <span>↓</span> (${state.limit}/${set.length})`;
}
function toggleUnfamiliar(id){const word=byId.get(id);if(!word)return;
 const key=Prefs.wordKey(word),next=!preferences.isMarked(word);
 const stored=preferences.setMarked(word,next);
 for(const family of groups)for(const entry of family.entries)if(Prefs.wordKey(entry)===key)entry.unfamiliar=next;
 renderDictionary();if(state.q.unfamiliar)newQuestion();
 document.querySelector(`[data-toggle-entry="${id}"]`)?.focus({preventScroll:true});
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
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(items=>{
   if(state.page!=='dictionary'||!items.some(item=>item.isIntersecting))return;
   const total=selectedGroups().length;
   if(state.limit<total){state.limit=Math.min(total,state.limit+18);renderDictionary();}
  },{rootMargin:'400px 0px'});
  observer.observe($('#loadMore'));
 }
 document.addEventListener('click',event=>{const nav=event.target.closest('[data-nav]');if(nav){event.preventDefault();navigate(nav.dataset.nav);return;}
 const toggle=event.target.closest('[data-toggle-entry]');if(toggle){toggleUnfamiliar(Number(toggle.dataset.toggleEntry));return;}
 const mode=event.target.closest('[data-mode]');if(mode){state.mode=mode.dataset.mode;$$('[data-mode]').forEach(b=>{const yes=b===mode;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});state.recent=[];newQuestion();return;}
 const choice=event.target.closest('[data-choice]');if(choice){choose(Number(choice.dataset.choice));return;}
 const action=event.target.closest('[data-action]');if(!action)return;switch(action.dataset.action){case 'reset-d':resetFilter('d');break;case 'reset-q':resetFilter('q');break;case 'load-more':state.limit+=18;renderDictionary();break;case 'next':newQuestion();break;case 'submit':submit();break;}});
 for(const id of ['dDay','dLevel','dType','dUnfamiliar'])$('#'+id).addEventListener('change',()=>{state.d=filters('d');state.limit=18;renderDictionary();});
 for(const id of ['qDay','qLevel','qType','qUnfamiliar'])$('#'+id).addEventListener('change',()=>{state.q=filters('q');state.recent=[];newQuestion();});
 $('#dictSearch').addEventListener('input',e=>{state.search=e.target.value;state.limit=18;renderDictionary();});
 window.addEventListener('hashchange',()=>navigate(location.hash==='#practice'?'practice':'dictionary'));
 document.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey)return;const tag=e.target?.tagName?.toLowerCase();if(e.key==='/'&&state.page==='dictionary'&&tag!=='input'){e.preventDefault();$('#dictSearch').focus();return;}if(['input','textarea','select'].includes(tag)||state.page!=='practice')return;
 if(e.key==='Enter'){if(state.answered){e.preventDefault();newQuestion();}else if(state.question?.mode==='syn'){e.preventDefault();submit();}}else if(/^[1-6]$/.test(e.key)){const n=Number(e.key)-1;if(state.question?.options[n]){e.preventDefault();choose(n);}}});
}
init();
})();
