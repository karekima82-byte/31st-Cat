// User-supplied tracks. Prime both elements in the first user gesture for iOS.
export class Ambience {
 constructor({createAudio=src=>new Audio(src),setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){
  this.volume=.3;this.sfxVolume=.7;this.muted=false;this.cue='silence';this.unlocked=false;this.typing=false;this.errors=[];this.suspended=false;this.disposed=false;this.pending=new Map();
  this.setTimer=setTimer;this.clearTimer=clearTimer;this.repeats=new Map();this.voice='narration';this.narrationDone=false;
  this.bgm=createAudio('./assets/Distant_Digital_Pulse.mp3');
  this.voices=Object.fromEntries(['narration','human','ordo'].map(voice=>[voice,createAudio(`./assets/text-sounds/${voice}.mp3`)]));
  this.startupSounds=[createAudio('./assets/startup-machine.mp3'),createAudio('./assets/startup-chime.mp3')];this.startupActive=new Set();this.startupPlayed=new Set();
  this.media=[this.bgm,...Object.values(this.voices),...this.startupSounds];
  for(const media of this.media){media.loop=media===this.bgm||media===this.voices.human||media===this.voices.ordo;media.preload='auto';if(Object.values(this.voices).includes(media)){media.playbackRate=media===this.voices.ordo?.85:.65;media.preservesPitch=false;media.webkitPreservesPitch=false;if(media===this.voices.narration)media.addEventListener?.('ended',()=>{if(this.typing&&this.voice==='narration')this.narrationDone=true;});}if(this.startupSounds.includes(media))media.addEventListener?.('ended',()=>this.startupActive.delete(media));media.addEventListener?.('error',()=>this.report(media===this.bgm?'BGM':'TYPE',media.error?.message||'load error'));if(typeof document!=='undefined'&&media instanceof HTMLMediaElement){media.hidden=true;media.dataset.audioRole=media===this.bgm?'bgm':(Object.keys(this.voices).find(k=>this.voices[k]===media)||'startup-'+this.startupSounds.indexOf(media));document.body.append(media);}}
  this.sync();
 }
 resetStartup(){this.stopStartup();this.startupPlayed.clear();}
 playStartup(key){if(this.startupPlayed.has(key)||this.disposed)return;this.startupPlayed.add(key);for(const media of this.startupSounds){media.currentTime=0;this.startupActive.add(media);}this.sync();}
 stopStartup(){this.startupActive.clear();for(const media of this.startupSounds)media.pause();this.sync();}
 get typeSound(){return this.voices[this.voice];}
 clearRepeat(media){if(this.repeats.has(media))this.clearTimer(this.repeats.get(media));this.repeats.delete(media);}
 setVoice(voice){if(!this.voices[voice]||voice===this.voice)return;this.voice=voice;this.sync();}
 wanted(media){return !this.disposed&&!this.suspended&&this.unlocked&&!this.muted&&(media===this.bgm?this.volume>0&&this.cue!=='silence':this.sfxVolume>0&&(this.startupSounds.includes(media)?this.startupActive.has(media):this.typing&&media===this.typeSound&&(this.voice!=='narration'||!this.narrationDone)));}
 report(label,message){const text=`${label}: ${message}`;if(!this.errors.includes(text))this.errors.push(text);}
 request(media,{prime=false}={}){
  if(this.pending.has(media))return this.pending.get(media);
  media.muted=prime||!this.wanted(media);
  let played;try{played=media.play();}catch(e){played=Promise.reject(e);}
  const promise=Promise.resolve(played).catch(e=>{if(e.name!=='AbortError')this.report(media===this.bgm?'BGM':'TYPE',e.name||e.message);}).finally(()=>{
   if(this.pending.get(media)!==promise)return;this.pending.delete(media);
   if(this.wanted(media))media.muted=false;else{media.pause();media.muted=false;}
  });
  this.pending.set(media,promise);return promise;
 }
 unlock(){if(this.disposed)return Promise.resolve();this.suspended=false;
  if(!this.unlocked){this.unlocked=true;const pending=this.media.map(media=>this.request(media,{prime:true}));return Promise.all(pending).then(()=>this.sync());}
  this.sync();return Promise.resolve();
 }
 setMuted(v){this.muted=!!v;this.sync();}
 setSfxVolume(v){this.sfxVolume=Math.max(0,Math.min(1,Number(v)||0));this.sync();}
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));this.sync();}
 sync(){
  this.startupSounds.forEach((media,i)=>media.volume=this.sfxVolume*(i===0?.25:.15));this.bgm.volume=this.volume;for(const media of Object.values(this.voices))media.volume=this.sfxVolume*.18;
  for(const media of this.media){
   if(this.wanted(media)){if(media.paused&&!this.repeats.has(media))this.request(media);else if(!this.pending.has(media))media.muted=false;}
   else{this.clearRepeat(media);if(this.pending.has(media)){media.muted=true;}else media.pause();}
  }
 }
 play(cue){this.cue=cue;this.sync();}
 setTyping(active){const started=active&&!this.typing;this.typing=!!active;if(started)this.narrationDone=false;if(started&&this.typeSound.paused){try{this.typeSound.currentTime=0;}catch{}}this.sync();}
 suspend(){this.startupActive.clear();this.suspended=true;for(const media of this.media){this.clearRepeat(media);media.pause();}}
 stop(){this.typing=false;this.cue='silence';this.suspend();}
 dispose(){this.disposed=true;this.stop();for(const media of this.media){media.removeAttribute?.('src');media.load?.();media.remove?.();}}
}
