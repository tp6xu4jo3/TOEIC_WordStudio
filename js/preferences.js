/* 只儲存使用者手動變更的「不熟」標記；不追蹤作答紀錄。 */
(function(global){
'use strict';
const KEY='wordstudio:unfamiliar:v1';
const normalize=value=>String(value??'').normalize('NFKC').trim().toLocaleLowerCase('en');
const wordKey=word=>normalize(word.en)+'\u241f'+normalize(word.pos);
function create(words,storage){
 const index=new Map(),original=new Map(),overrides={};
 for(const word of words){const id=wordKey(word);if(!index.has(id))index.set(id,[]);index.get(id).push(word);original.set(id,Boolean(original.get(id)||word.unfamiliar));}
 let available=true;
 try{
  const parsed=JSON.parse(storage?.getItem(KEY)||'{}');
  if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))for(const [id,value] of Object.entries(parsed)){
   if(index.has(id)&&typeof value==='boolean')overrides[id]=value;
  }
 }catch(error){available=false;}
 for(const [id,value] of Object.entries(overrides))for(const word of index.get(id))word.unfamiliar=value;
 function isMarked(word){return (index.get(wordKey(word))||[]).some(entry=>entry.unfamiliar);}
 function setMarked(word,value){
  const id=wordKey(word),entries=index.get(id);if(!entries)return false;
  const marked=Boolean(value);for(const entry of entries)entry.unfamiliar=marked;
  if(marked===original.get(id))delete overrides[id];else overrides[id]=marked;
  try{if(storage){storage.setItem(KEY,JSON.stringify(overrides));available=true;}else available=false;}catch(error){available=false;}
  return available;
 }
 return {key:wordKey,isMarked,setMarked,get storageAvailable(){return available;},storageKey:KEY};
}
global.WordStudioPreferences={create,wordKey,STORAGE_KEY:KEY};
})(typeof window!=='undefined'?window:globalThis);
