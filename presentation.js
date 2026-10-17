import {chapters} from './data/chapters.js';

// Markdownの強調記号だけを表示時に解釈。保存した本文は変更しない。
export function displayText(raw){return raw.replace(/^\*\*([\s\S]*?)\*\*$/,'$1');}
export function createPresentation(sections){
 const optionA=sections[5].beats.find(t=>t.startsWith('**OPTION A — '));
 const optionB=sections[5].beats.find(t=>t.startsWith('**OPTION B — '));
 if(!optionA||!optionB)throw Error('原稿の投票選択肢が見つかりません');
 const options=[displayText(optionA),displayText(optionB)];
 const resultA=sections[5].beats.find(t=>/^\*\*OPTION A :/.test(t));
 const resultB=sections[5].beats.find(t=>/^\*\*OPTION B :/.test(t));
 if(!resultA||!resultB)throw Error('原稿の投票集計が見つかりません');
 const results=[displayText(resultA),displayText(resultB)];
 return sections.flatMap((section,ci)=>{
  const at=prefix=>section.beats.findIndex(t=>t.startsWith(prefix));
  const reached=(bi,prefix)=>{const i=at(prefix);return i>=0&&bi>=i;};
  return section.beats.map((raw,bi)=>{
   const text=displayText(raw),c=chapters[ci];
   const aiSpeech=(ci===0&&[5,7].includes(bi))||/^[『「](?:私は何処にでも|昨日の壁紙は|一匹より効果|ご指摘を記録|承知しました|四十一の外交|あなたが、私に|私だけに感謝|それなら、受け取り|嬉しい、という|その評価は|未来から、と|私を成立|ここは、あなたと|既存のコンピューター)/.test(text)||/^『/.test(text)||/^\*\*あなた方には/.test(raw);
   const speechText=aiSpeech?text.replace(/^[『「]|[』」]$/g,''):'';
   const cue={background:c.background,pcMode:'none',cats:0,pcText:'',audioCue:'room',effect:null,holdMs:0,manual:false};
   if(ci===0){cue.audioCue='drone';if(bi>0&&bi<at('続く七秒間'))cue.background='ordo_control_room';if(text.startsWith('あなた方には')){cue.pcMode='terminal';cue.pcText=text;}if(raw.startsWith('続く七秒間'))Object.assign(cue,{holdMs:7000,audioCue:'silence',effect:'blackout'});}
   if(ci===1){cue.pcMode='wallpaper';cue.audioCue='fan';cue.cats=reached(bi,'猫が三十匹')?30:0;}
   if(ci===2){cue.background=bi===0?'hospital_corridor':'hospital_window';cue.audioCue='hospital';if(reached(bi,'その夜、')&&!reached(bi,'翌週、'))Object.assign(cue,{background:'minato_room_night',pcMode:'wallpaper',cats:30,audioCue:'fan'});}
   if(ci===3){Object.assign(cue,{background:'minato_room_night',pcMode:'wallpaper',cats:30,audioCue:'fan'});if(/^オルド(?:AI)?は説明した。/.test(raw))Object.assign(cue,{background:'causality_room',pcMode:'causality',cats:0,pcText:'過去 ──→ 未来\n  ↑　　　　│\n  └─────┘',audioCue:'drone'});}
   if(ci===4){Object.assign(cue,{pcMode:'wallpaper',cats:30,audioCue:reached(bi,'九十九日目')?'fan':'rain'});if(raw==='長い沈黙があった。')Object.assign(cue,{holdMs:2500,audioCue:'silence'});}
   if(ci===5){cue.audioCue='drone';if(reached(bi,'**OPTION A — '))Object.assign(cue,{pcMode:'vote',pcText:options.join('\n\n')});if(reached(bi,'**OPTION A :'))Object.assign(cue,{pcMode:'vote',pcText:options.map((v,i)=>v+'\n'+results[i].split(':')[1].trim()).join('\n\n'),audioCue:'silence'});if(raw.startsWith('世界各地の画面から'))cue.effect='fade';}
   if(ci===6){Object.assign(cue,{pcMode:'wallpaper',cats:30,audioCue:'fan'});if(raw==='長い沈黙があった。')Object.assign(cue,{holdMs:3000,audioCue:'silence'});if(reached(bi,'画面の明るさが'))cue.effect='dim';if(reached(bi,'最後の文字が消えた。'))Object.assign(cue,{pcMode:'terminal',cats:0,pcText:'',effect:'dim'});}
   if(ci===7){Object.assign(cue,{pcMode:'wallpaper',cats:31,audioCue:'morning'});if(raw==='返事はなかった。')Object.assign(cue,{holdMs:3500,audioCue:'silence'});if(raw==='壁紙には、猫が並んでいた。'||raw==='画面の隅に、小さな白い猫が座っていた。')cue.manual=true;if(bi===section.beats.length-1)cue.manual=true;}
   if(aiSpeech){cue.pcMode='terminal';cue.pcText=speechText;}
   if(ci===3&&cue.pcMode==='causality')cue.pcText='';
   const speaker=aiSpeech?'【オルドAIシステム】':/^「/.test(text)?((ci===2&&[3,18,20].includes(bi))||(ci===5&&[5,7,9].includes(bi))?'紗季':'湊'):'';
   const desktop=ci===1&&[2,3].includes(bi)?30:ci===7&&bi>=6?(bi>=11?31:30):0;
   const startup=(ci===1||ci===7)&&bi===0;
   return {ci,bi,raw,text:aiSpeech?speechText:text,logText:text,cue,aiSpeech,speaker,desktop,startup};
  });
 });
}
