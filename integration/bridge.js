// 本編には未登録。明示的な呼び出しでのみ独立ビューアーを開く。
export function openThirtyFirstCat({src,initialState,onSave=()=>{},signal}={}){
 if(!src)throw Error('独立ビューアーのURLが必要です');const url=new URL(src,location.href);if(url.origin!==location.origin)throw Error('本編と同じオリジンに配置してください');
 return new Promise(resolve=>{
  const session=crypto.randomUUID(),panel=document.createElement('dialog'),frame=document.createElement('iframe'),back=document.createElement('button');
  let last=initialState,done=false,testMode=false;
  panel.style.cssText='padding:0;border:0;width:min(100vw,540px);height:100dvh;max-height:100dvh;background:#10191f';
  frame.style.cssText='width:100%;height:calc(100% - 48px);border:0';frame.title='三十一匹目の猫';frame.src=url.href;
  back.textContent='本編へ戻る';back.style.cssText='height:48px;width:100%';
  const finish=()=>{if(done)return;done=true;window.removeEventListener('message',receive);signal?.removeEventListener('abort',finish);try{frame.contentWindow.retraceDispose?.();}catch{}panel.close();panel.remove();resolve({novelId:'thirty_first_cat',state:last,completed:last?.completed===true,testMode});};
  const receive=e=>{
   if(e.source!==frame.contentWindow||e.origin!==url.origin||e.data?.session!==session||e.data?.result?.novelId!=='thirty_first_cat')return;
   if(!['RETRACE_NOVEL_READY','RETRACE_NOVEL_STATE','RETRACE_NOVEL_COMPLETE','RETRACE_NOVEL_RETURN'].includes(e.data.type))return;
   last=e.data.result.state;testMode=e.data.result.testMode===true;
   if(e.data.type!=='RETRACE_NOVEL_READY')onSave(last);
   if(e.data.type==='RETRACE_NOVEL_RETURN')finish();
  };
  frame.onload=()=>frame.contentWindow.postMessage({type:'RETRACE_NOVEL_INIT',session,state:initialState},url.origin);
  window.addEventListener('message',receive);back.onclick=finish;panel.addEventListener('cancel',e=>{e.preventDefault();finish();});
  panel.append(frame,back);document.body.append(panel);panel.showModal();signal?.addEventListener('abort',finish,{once:true});if(signal?.aborted)finish();
 });
}
