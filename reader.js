import {chapters,novelMeta,introduction,afterword} from './data/chapters.js';
import {restore,newState,reconcileSource} from './core.js';
import {createPresentation} from './presentation.js';
import {Ambience} from './audio.js';
import {TextVoice} from './text-voice.js';
import {NeuralBackdrop,PcTypewriter} from './pc-effects.js';
import {InlineVideo} from './media.js';
const $=s=>document.querySelector(s),testParams=new URLSearchParams(location.search),testMode=testParams.has('test'),testId=(testParams.get('test')||'1').replace(/[^a-z0-9_-]/gi,'').slice(0,40);
const key='retrace.novel.thirty_first_cat.v1'+(testMode?'.test'+(testId==='1'?'':'.'+testId):'');
let state;try{state=restore(localStorage.getItem(key));}catch{state=newState();}
let manuscript=null,mode='title',items=[],cursor=0,full='',shown=0,pageStart=0,pageEnd=0;
let speakerTimer,switching=false,lastSpeaker=null;
let timer,autoTimer,holdTimer,holdUntil=0,auto=false,skipping=false,preview=false,session=null,log=[];
let dialogueDone=null,dialogueIndex=0,dialogueLines=null,dialogueTitle='';
const audio=new Ambience();const textVoice=new TextVoice();
const pcTyping=new PcTypewriter($('#pc-ui'),{onComplete:()=>{queueMicrotask(()=>{if(mode==='reading'&&shown===full.length&&!pcTyping.typing){audio.setTyping(false);mark();schedule();}});}});
const neural=new NeuralBackdrop($('#message-neural'));
const explainerPlayer=new InlineVideo($('#pc-explainer'),{onError:()=>notice('動画を再生できませんでした。画面タップで再試行できます。')});
const reduced=()=>state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
const unlockAudio=()=>{textVoice.unlock();return audio.unlock().catch(e=>notice('音声の開始に失敗: '+e.message));};
function notice(text){$('#notice').textContent=text;$('#notice').classList.add('visible');setTimeout(()=>$('#notice').classList.remove('visible'),4000);}
function result(){return {novelId:novelMeta.id,completed:state.completed,returnScene:novelMeta.returnScene,testMode,state:structuredClone(state)};}
function send(type){if(parent!==window&&session)parent.postMessage({type,session,result:result()},location.origin);}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{notice('保存領域が使用できません。この画面内では読み進められます。');}if(session)send('RETRACE_NOVEL_STATE');}
function stop(){textVoice.stop();audio.stopStartup();clearTimeout(speakerTimer);switching=false;$('#reading').classList.remove('speaker-switching');audio.setTyping(false);clearInterval(timer);timer=null;clearTimeout(autoTimer);clearTimeout(holdTimer);pcTyping.pause();neural.setPaused(true);explainerPlayer.pause();}
function applySettings(){document.documentElement.style.setProperty('--size',state.settings.size+'px');audio.setVolume(state.settings.volume);audio.setSfxVolume(state.settings.sfxVolume);audio.setMuted(state.settings.muted);textVoice.setVolume(state.settings.muted?0:state.settings.sfxVolume);$('#sound').textContent=state.settings.muted?'音 OFF':'音 ON';$('#sound').setAttribute('aria-pressed',String(!state.settings.muted));}
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='RETRACE_NOVEL_INIT'||typeof e.data.session!=='string')return;session=e.data.session;if(e.data.state){state=restore(JSON.stringify(e.data.state));checkSource();applySettings();}send('RETRACE_NOVEL_READY');});
window.retraceDispose=()=>{stop();pcTyping.cancel();neural.dispose();explainerPlayer.dispose();audio.dispose();auto=false;skipping=false;};

function cats(count){const root=$('#wallpaper');if(root.dataset.count===String(count))return;root.dataset.count=String(count);root.replaceChildren();root.hidden=!count;root.setAttribute('aria-label',`猫${count}匹の壁紙`);if(!count)return;const picture=document.createElement('img');picture.className='wallpaper-image';picture.src=count===31?'assets/cats_31.jpg':'assets/cats_30.jpg';picture.alt=`猫${count}匹の壁紙`;picture.draggable=false;root.append(picture);}
function scene(beat){
 const c=chapters[beat.ci],cue=beat.ci===3?{...beat.cue,background:'minato_room_night'}:beat.cue;
 $('#chapter-label').textContent=beat.speaker||'';$('#progress').textContent=preview?'演出確認':`${cursor+1} / ${items.length}`;$('#scene-label').textContent=preview?'SCENE '+String(beat.ci+1).padStart(2,'0'):'';
 const catCount=cue.cats||(beat.aiSpeech&&[1,2,3,4,6].includes(beat.ci)?30:0);cats(catCount);
 const vote=cue.pcMode==='vote',certified=vote&&cue.pcText.includes('49.85');
 $('#global-vote').hidden=!vote;$('#global-vote').classList.toggle('gv-certified',certified);
 $('#gv-status').textContent=certified?'最終集計結果 — 確定':'世界同時集計 / 検証中';$('#gv-a').textContent=certified?'49.85%':'—';$('#gv-b').textContent=certified?'50.15%':'—';$('#gv-delta').textContent=certified?'差 0.30 ポイント':'AWAITING FINAL COUNT';
 const voteOptions=items.filter(b=>b.ci===5).map(b=>b.raw).filter(t=>t?.startsWith('**OPTION ')&&t.includes(' — '));
 document.querySelectorAll('.gv-option small').forEach((el,i)=>{if(voteOptions[i])el.textContent=voteOptions[i].replace(/^\*\*OPTION [AB] — |\*\*$/g,'');});
 $('#pc').hidden=beat.ci!==3||vote;$('#pc').dataset.mode=cue.pcMode;
 const art=$('#key-art');art.hidden=!beat.desktop;$('#scene').classList.toggle('key-art-scene',!!beat.desktop);if(beat.desktop){const asset=`assets/laptop_cats_${beat.desktop}.png`;if(art.getAttribute('src')!==asset)art.src=asset;art.alt=beat.desktop===31?'画面の隅に白い猫が加わったノートパソコン':'三十匹の猫が並ぶノートパソコン';}
 const explainVisible=beat.ci===3&&cue.pcMode!=='none'&&!reduced();
 explainerPlayer.set(explainVisible);$('#pc').classList.toggle('has-explainer',explainVisible);
 $('#reading').classList.toggle('ordo-speaking',!!beat.aiSpeech);$('#scene').dataset.effect=reduced()?'':cue.effect||'';
 const speaking=cue.pcMode==='terminal'&&!!cue.pcText;
 neural.set(!!beat.aiSpeech,{reduced:reduced()});neural.setPaused(false);
 pcTyping.set(beat.aiSpeech?'':cue.pcText,`${preview?'p':'n'}:${beat.ci}:${beat.bi}`,{instant:!speaking||reduced()||skipping||state.settings.speed===0,speed:Math.max(28,state.settings.speed*1.15)});
 const bg=$('#background');$('#reader').style.backgroundImage=`linear-gradient(#07101740,#07101760),url("assets/${cue.background}.png")`;if(bg.dataset.asset!==cue.background){bg.dataset.asset=cue.background;bg.hidden=true;bg.onload=()=>{bg.hidden=false;};bg.onerror=()=>{bg.hidden=true;};bg.src=`assets/${cue.background}.png`;}
 $('#app').classList.toggle('inspect',beat.ci===7&&cue.manual);audio.play(cue.audioCue);
 const next=items[cursor+1]?.cue.background;if(next&&next!==cue.background){const image=new Image();image.src=`assets/${next}.png`;}
}
function enter(){mode='reading';$('#title').hidden=true;$('#reader').hidden=false;$('#preview-label').hidden=!preview;}
function build(){items=createPresentation(manuscript.sections);}
function run(resume=false){if(!manuscript)return;unlockAudio();preview=false;audio.resetStartup();lastSpeaker=null;build();log=[];cursor=resume?Math.max(0,items.findIndex(x=>x.ci===state.chapterIndex&&x.bi===state.beatIndex)):0;enter();show(resume?state.pageOffset||0:0);}
function isRead(){const b=items[cursor];return b&&state.readBeats.includes(`${b.ci}:${b.bi}`);}
function mark(){if(preview||pcTyping.typing||shown<full.length||pageEnd<items[cursor].text.length)return;const b=items[cursor],id=`${b.ci}:${b.bi}`;if(!state.readBeats.includes(id))state.readBeats.push(id);save();}
function updateHint(){const hold=Math.max(0,holdUntil-performance.now());$('#hint').textContent=hold>0?'静かな間を置いています':items[cursor]?.cue.manual?'画面を見てから、タップして進む':'タップして進む';}
function schedule(){clearTimeout(autoTimer);if($('#modal').open||preview||switching||pcTyping.typing||items[cursor]?.cue.manual)return;const hold=Math.max(0,holdUntil-performance.now()),length=Math.max(full.length,items[cursor]?.cue.pcText.length||0);if(skipping&&isRead())autoTimer=setTimeout(next,Math.max(120,hold));else if(auto)autoTimer=setTimeout(next,Math.max(state.settings.autoMs+length*35,hold));}
function reveal(){textVoice.stop();audio.setTyping(false);clearInterval(timer);timer=null;shown=full.length;$('#text').textContent=full;pcTyping.finish();mark();schedule();}
function fitPage(text,start){const el=$('#text');let low=1,high=text.length-start;while(low<high){const mid=Math.ceil((low+high)/2);el.textContent=text.slice(start,start+mid);if(el.scrollHeight<=el.clientHeight+1)low=mid;else high=mid-1;}let end=start+low;if(end<text.length&&/[\uD800-\uDBFF]/.test(text[end-1]))end--;el.textContent='';return Math.max(start+1,end);}
function show(offset=0,{retainHold=false}={}){stop();if(skipping&&!isRead()){skipping=false;buttons();}const b=items[cursor];audio.setVoice(b.aiSpeech?'ordo':'narration');textVoice.gender=b.speaker==='紗季'?'female':'male';scene(b);if(b.startup&&!preview&&!offset&&!retainHold)audio.playStartup(`${b.ci}:${b.bi}`);pageStart=Math.max(0,Math.min(b.text.length-1,Number(offset)||0));pageEnd=fitPage(b.text,pageStart);full=b.text.slice(pageStart,pageEnd);shown=0;$('#text').textContent='';
 if(!retainHold)holdUntil=performance.now()+(preview||reduced()?0:b.cue.holdMs);updateHint();holdTimer=setTimeout(updateHint,Math.max(0,holdUntil-performance.now()));
 if(!preview){state.chapterIndex=b.ci;state.beatIndex=b.bi;state.pageOffset=pageStart;save();}const id=`${preview?'p':'n'}:${cursor}`;if(!log.some(x=>x.id===id))log.push({id,text:b.logText||b.cue.pcText||b.text});
 const speaker=!!b.aiSpeech,changed=lastSpeaker!==null&&lastSpeaker!==speaker;lastSpeaker=speaker;
 const beginText=()=>{switching=false;$('#reading').classList.remove('speaker-switching');if(reduced()||state.settings.speed===0||skipping&&isRead()){reveal();return;}audio.setTyping(!b.speaker||b.aiSpeech);timer=setInterval(()=>{shown++;if(/[\uD800-\uDBFF]/.test(full[shown-1])&&shown<full.length)shown++;$('#text').textContent=full.slice(0,shown);if(b.speaker&&!b.aiSpeech&&/[\p{L}\p{N}]/u.test(full[shown-1]||''))textVoice.tick();if(shown>=full.length){clearInterval(timer);timer=null;audio.setTyping(false);mark();schedule();}},state.settings.speed);};
 if(changed&&!reduced()&&!retainHold&&!skipping){switching=true;$('#reading').classList.add('speaker-switching');speakerTimer=setTimeout(beginText,220);}else beginText();
}
function next(){if($('#modal').open||mode!=='reading'||switching)return;unlockAudio();if(shown<full.length||pcTyping.typing){reveal();return;}if(performance.now()<holdUntil&&!reduced()){holdUntil=0;clearTimeout(holdTimer);updateHint();}if(pageEnd<items[cursor].text.length){show(pageEnd,{retainHold:true});return;}if(cursor<items.length-1){cursor++;show();return;}if(preview){home();return;}
 state.completed=items.every(b=>state.readBeats.includes(`${b.ci}:${b.bi}`));save();if(state.completed)send('RETRACE_NOVEL_COMPLETE');auto=false;skipping=false;buttons();audio.play('silence');dialogue(afterword,'読了後 — 美咲と拓海',()=>home());}
function home(){stop();neural.set(false);explainerPlayer.set(false);audio.play('silence');auto=false;skipping=false;buttons();mode='title';$('#reader').hidden=true;$('#title').hidden=false;$('#app').classList.remove('inspect');$('#resume').disabled=!manuscript;$('#status').textContent=state.completed?'読了済み · もう一度読むことができます':'全八節 · 完成稿取り込み済み';}
function renderDialogue(){const body=$('#modal-body');body.replaceChildren();const h=document.createElement('h2');h.textContent=dialogueTitle;const who=document.createElement('p'),line=document.createElement('p');who.className='dialogue-name';who.textContent=dialogueLines[dialogueIndex][0];line.textContent=dialogueLines[dialogueIndex][1];body.append(h,who,line);$('#close').textContent=dialogueIndex===dialogueLines.length-1?'小説を読む': '次へ';if(dialogueTitle.startsWith('読了'))$('#close').textContent=dialogueIndex===dialogueLines.length-1?'本棚へ戻る':'次へ';}
function dialogue(lines,title,done){stop();dialogueDone=done;dialogueLines=lines;dialogueIndex=0;dialogueTitle=title;renderDialogue();$('#modal').showModal();}
function previewStart(){unlockAudio();preview=true;items=chapters.map((c,ci)=>({ci,bi:0,text:ci===7?'翌朝。壁紙は、画面を開いた時点から31匹です。白猫は画面の端に静かにいます。\n\n※小説本文ではなく、演出確認用の説明です。':`${c.number}　${c.title}\n\n${c.cats?`猫${c.cats}匹の壁紙。`:'背景・画面レイヤーの配置確認。'}\n\n※小説は本棚の「読む」から開始できます。`,cue:{background:c.background,pcMode:c.cats?'wallpaper':'none',cats:c.cats,pcText:'',audioCue:ci===7?'morning':'room',holdMs:0,manual:false}}));cursor=0;log=[];enter();show();}
function modal(title){stop();dialogueDone=null;const h=document.createElement('h2');h.textContent=title;$('#modal-body').replaceChildren(h);$('#close').textContent='閉じる';$('#modal').showModal();}
function close(){if(dialogueDone){if(dialogueIndex<dialogueLines.length-1){dialogueIndex++;renderDialogue();return;}const done=dialogueDone;dialogueDone=null;$('#modal').close();$('#close').textContent='閉じる';done();return;}$('#modal').close();if(mode==='reading')show(pageStart,{retainHold:true});}
function buttons(){$('#auto').classList.toggle('active',auto);$('#auto').setAttribute('aria-pressed',auto);$('#skip').classList.toggle('active',skipping);$('#skip').setAttribute('aria-pressed',skipping);}
$('#begin').onclick=()=>{unlockAudio();dialogue(introduction,'放課後 — 美咲の推薦',()=>run());};$('#resume').onclick=()=>run(true);$('#preview').onclick=previewStart;$('#text').onclick=next;
$('#scene').onclick=e=>{if(e.target.closest('button'))return;next();};
$('#reading').addEventListener('click',e=>{if(e.target.closest('button'))return;next();});
$('#return').onclick=()=>{stop();audio.play('silence');save();if(session)send('RETRACE_NOVEL_RETURN');else home();};
$('#sound').onclick=()=>{state.settings.muted=!state.settings.muted;unlockAudio();applySettings();save();};
$('#auto').onclick=()=>{auto=!auto;skipping=false;buttons();if(shown===full.length)schedule();};$('#skip').onclick=()=>{skipping=!skipping;auto=false;if(skipping&&!isRead()){skipping=false;notice('未読の本文はスキップしません。');}buttons();if(shown===full.length)schedule();};
$('#close').onclick=close;$('#modal').addEventListener('cancel',e=>{e.preventDefault();if(dialogueDone){dialogueDone=null;$('#modal').close();home();}else close();});
$('#log').onclick=()=>{modal('バックログ');for(const entry of log){const p=document.createElement('p');p.className='log-entry';p.textContent=entry.text;$('#modal-body').append(p);}};
$('#toc').onclick=()=>{modal('目次');chapters.forEach((c,i)=>{const b=document.createElement('button');b.textContent=`${c.number}　${c.title}`;const pos=items.findIndex(x=>x.ci===i);b.disabled=!preview&&!state.readBeats.includes(`${i}:0`);b.onclick=()=>{cursor=pos;$('#modal').close();show();};$('#modal-body').append(b);});};
$('#settings').onclick=()=>{unlockAudio();modal('読書設定');for(const [label,k,min,max,step]of [['文字サイズ','size',14,26,1],['文字送り（0で即時）','speed',0,100,5],['AUTOの待ち時間','autoMs',1000,8000,500],['BGM音量','volume',0,1,.05],['効果音音量','sfxVolume',0,1,.05]]){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='range';input.setAttribute('aria-label',label);Object.assign(input,{min,max,step,value:state.settings[k]});input.oninput=()=>{state.settings[k]=+input.value;applySettings();save();if(k==='volume'||k==='sfxVolume'){unlockAudio();if(audio.errors.length)notice(audio.errors.at(-1));}};l.append(input);$('#modal-body').append(l);}const l=document.createElement('label');l.textContent='演出を軽減';const check=document.createElement('input');check.type='checkbox';check.checked=state.settings.reduced;check.onchange=()=>{state.settings.reduced=check.checked;save();};l.append(check);$('#modal-body').append(l);for(const [name,gender] of [['男声を試聴','male'],['女声を試聴','female']]){const button=document.createElement('button');button.textContent=name;button.onclick=async()=>{unlockAudio();textVoice.gender=gender;const ok=await textVoice.preview();$('#sound-preview-status').textContent=ok?(gender==='male'?'男声':'女声')+'を試聴しました。':'効果音音量と音ONの設定を確認してください。';};$('#modal-body').append(button);}const status=document.createElement('p');status.id='sound-preview-status';status.setAttribute('role','status');$('#modal-body').append(status);const p=document.createElement('p');p.textContent='音量は個別に保存します。効果音は文字送り音とPC起動音に適用します。';$('#modal-body').append(p);};
document.addEventListener('keydown',e=>{if(e.target.closest('input,button,dialog'))return;if(e.key===' '||e.key==='ArrowRight'){e.preventDefault();next();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();audio.suspend();}else if(mode==='reading'&&!$('#modal').open){unlockAudio();neural.setPaused(false);explainerPlayer.resume();pcTyping.resume();if(shown<full.length)reveal();else schedule();}});
window.addEventListener('pagehide',()=>{stop();audio.stop();save();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(mode==='reading'&&!$('#modal').open)show(pageStart,{retainHold:true});},120);});
function checkSource(){if(manuscript)state=reconcileSource(state,manuscript);}
applySettings();try{const response=await fetch('data/manuscript.json');if(response.ok){const data=await response.json();if(data.sections?.length===8&&data.sections.every(s=>Array.isArray(s.beats)&&s.beats.length)){createPresentation(data.sections);manuscript=data;checkSource();}}}catch{notice('本文データを読み込めませんでした。');}
$('#status').textContent=manuscript?(state.completed?'読了済み · 再読できます':'全八節 · 完成稿取り込み済み'):'完成稿の本文を待っています。演出のみ確認できます。';$('#begin').disabled=!manuscript;$('#resume').disabled=!manuscript;if(testMode)$('.note').textContent='操作テスト · 本番の読書記録と分離';
