export function catPositions(count){if(count!==30&&count!==31)throw Error('猫は30匹または31匹');return Array.from({length:count},(_,i)=>({id:i+1,white:i===30,x:i===30?93:9+(i%6)*15,y:i===30?89:12+Math.floor(i/6)*17}));}
export function newState(){return {version:1,unlocked:true,completed:false,chapterIndex:0,beatIndex:0,pageOffset:0,readBeats:[],settings:{size:18,speed:35,autoMs:2400,volume:.3,sfxVolume:.7,muted:false,reduced:false}};}
export function restore(raw){
 const base=newState();try{const s=JSON.parse(raw);if(s?.version!==1)return base;
 const bounded=(k,min,max)=>{const n=s.settings?.[k];return typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):base.settings[k];};
 return {...base,completed:s.completed===true,sourceHash:typeof s.sourceHash==='string'?s.sourceHash:null,
 chapterIndex:Number.isInteger(s.chapterIndex)?Math.max(0,Math.min(7,s.chapterIndex)):0,
 beatIndex:Number.isInteger(s.beatIndex)?Math.max(0,s.beatIndex):0,
 pageOffset:Number.isInteger(s.pageOffset)?Math.max(0,s.pageOffset):0,
 readBeats:Array.isArray(s.readBeats)?s.readBeats.filter(x=>/^\d+:\d+$/.test(x)):[],
 settings:{size:bounded('size',14,26),speed:bounded('speed',0,100),autoMs:bounded('autoMs',1000,8000),volume:bounded('volume',0,1),sfxVolume:bounded('sfxVolume',0,1),muted:s.settings?.muted===true,reduced:s.settings?.reduced===true}};
 }catch{return base;}
}
export function parseManuscript(source){
 const lines=source.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split('\n'),sections=[];let current;
 for(const line of lines){const match=line.match(/^#{1,3}\s*(?:第\s*)?([一二三四五六七八1-8])(?:節|章)?[\s　.．、:：]+(.+?)\s*$/);if(match){current={heading:line,beats:[]};sections.push(current);continue;}if(current)current.beats.push(line);}
 if(sections.length!==8)throw Error('8節の見出し（例：## 一 終末の一日）が必要です。本文を変更せず見出し形式を確認してください。');
 return sections.map(s=>({...s,beats:s.beats.join('\n').trim().split(/\n[ \t]*\n/).filter(Boolean)}));
}
export function reconcileSource(state,manuscript){
 if(state.sourceHash&&state.sourceHash!==manuscript.sourceHash&&!manuscript.compatibleSourceHashes?.includes(state.sourceHash))state={...newState(),settings:state.settings};
 return {...state,sourceHash:manuscript.sourceHash};
}
