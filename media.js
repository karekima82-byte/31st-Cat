export class InlineVideo{
 constructor(element,{onError=()=>{}}={}){this.element=element;this.onError=onError;this.active=false;this.suspended=true;this.disposed=false;this.errors=new Set();element.muted=true;element.defaultMuted=true;element.playsInline=true;element.setAttribute('muted','');element.setAttribute('playsinline','');element.setAttribute('webkit-playsinline','');}
 set(active){this.active=!!active;this.element.hidden=!this.active;if(this.active)this.resume();else this.pause();}
 resume(){this.suspended=false;if(!this.active||this.disposed)return;const video=this.element;video.muted=true;
  if(!video.paused)return;let played;try{played=video.play();}catch(e){played=Promise.reject(e);}
  Promise.resolve(played).then(()=>{if(!this.active||this.suspended||this.disposed)video.pause();}).catch(e=>{if(e.name==='AbortError'||!this.active||this.suspended||this.disposed)return;const name=e.name||e.message;if(!this.errors.has(name)){this.errors.add(name);this.onError(name);}});
 }
 pause(){this.suspended=true;this.element.pause();}
 dispose(){this.disposed=true;this.active=false;this.pause();this.element.hidden=true;}
}
