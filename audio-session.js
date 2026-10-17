// Keep Web Audio effects in the same playback category as the game's videos.
// Safari may otherwise silence effects while HTML media remains audible.
export function enableGameAudioPlayback(navigatorObject=globalThis.navigator){
  try{const session=navigatorObject?.audioSession;if(session&&session.type!=='playback')session.type='playback';}catch{}
}

// Explicit recovery only: do not churn the iOS session category on every tap.
export async function recoverGameAudioPlayback(navigatorObject=globalThis.navigator,schedule=fn=>setTimeout(fn,0)){
 try{const session=navigatorObject?.audioSession;if(!session)return false;session.type='ambient';await new Promise(resolve=>schedule(resolve));session.type='playback';return true;}catch{return false;}
}

// Start inside the input handler; neither a decode nor a category switch precedes resume.
// Safari can leave resume() pending forever. Never let that block the next gesture.
export function resumeGameAudio(context,{timeout=1500,schedule=setTimeout,cancel=clearTimeout}={}){
 if(!context||context.state==='closed')return Promise.resolve(false);
 if(context.state==='running')return Promise.resolve(true);
 try{
  if(context.createBuffer){const source=context.createBufferSource();source.buffer=context.createBuffer(1,1,context.sampleRate||44100);source.connect(context.destination);source.onended=()=>source.disconnect();source.start(0);}
 }catch{}
 return new Promise(resolve=>{
  let done=false,timer;const finish=()=>{if(done)return;done=true;cancel(timer);resolve(context.state==='running');};
  timer=schedule(finish,timeout);
  try{Promise.resolve(context.resume()).then(finish,finish);}catch{finish();}
 });
}
