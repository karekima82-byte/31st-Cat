// Visual reference: https://codepen.io/VoXelo/pen/EaabxLj (VoXelo).
// Original, dependency-free canvas implementation for the small in-game display.
export function typingDelay(character,index,base=42,random=Math.random){
 const r=random();
 if(/[。！？!?]/.test(character))return base*3.5+100;
 if(/[、，,：:]/.test(character))return base*2+55;
 if(character==='\n')return base*3+90;
 return Math.round(base*(.6+r*.95)+(index%17===13?95:0));
}
export class PcTypewriter{
 constructor(element,{onComplete=()=>{},setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),random=Math.random}={}){Object.assign(this,{element,onComplete,setTimer,clearTimer,random});this.key=null;this.characters=[];this.index=0;this.paused=true;this.timer=null;this.generation=0;}
 get typing(){return this.index<this.characters.length;}
 set(text,key,{instant=false,speed=42}={}){
  this.speed=speed;
  if(this.key!==key||this.characters.join('')!==text){this.cancel();this.key=key;this.characters=Array.from(text);this.index=0;this.element.textContent='';}
  if(instant||!text){this.finish();return;}
  this.resume();
 }
 render(){this.element.textContent=this.characters.slice(0,this.index).join('');this.element.dataset.typing=String(this.typing);if(this.element.scrollHeight>this.element.clientHeight)this.element.scrollTop=this.element.scrollHeight;}
 resume(){this.paused=false;this.render();if(this.typing&&this.timer===null)this.queue(this.index===0?170:typingDelay(this.characters[this.index-1],this.index,this.speed,this.random));}
 queue(delay){const generation=this.generation;this.timer=this.setTimer(()=>{if(this.paused||generation!==this.generation)return;this.timer=null;this.index++;this.render();if(this.typing)this.queue(typingDelay(this.characters[this.index-1],this.index,this.speed,this.random));else this.onComplete();},delay);}
 pause(){this.paused=true;this.generation++;if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;}
 cancel(){this.pause();}
 finish(){this.pause();this.index=this.characters.length;this.render();this.onComplete();}
}
export function createNeuralGraph(){
 let seed=31;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const nodes=[{x:0,y:0,z:0,d:0}],edges=[];
 for(let arm=0;arm<9;arm++){
  const az=arm*Math.PI*2/9,el=(random()-.5)*1.7;let previous=0;
  for(let level=1;level<=5;level++){
   const r=level*.24,angle=az+(random()-.5)*.26;
   const node={x:Math.cos(angle)*Math.cos(el)*r,y:Math.sin(el)*r+(random()-.5)*.14,z:Math.sin(angle)*Math.cos(el)*r,d:r};
   const index=nodes.push(node)-1;edges.push([previous,index]);previous=index;
   if(level<2)continue;
   for(let twig=0;twig<2;twig++){let parent=index;for(let step=1;step<=2;step++){const spread=az+(twig?1:-1)*(.5+random()*.7),length=step*.15;const tip={x:node.x+Math.cos(spread)*length,y:node.y+(random()-.5)*.5+step*(twig?.1:-.1),z:node.z+Math.sin(spread)*length,d:r+length};const tipIndex=nodes.push(tip)-1;edges.push([parent,tipIndex]);parent=tipIndex;}}
  }
 }
 for(let i=1;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];if(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.22&&random()<.16)edges.push([i,j]);}
 const stars=Array.from({length:100},()=>({x:random(),y:random(),a:.12+random()*.35}));
 return {nodes,edges,stars};
}
export class NeuralBackdrop{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.graph=createNeuralGraph();this.active=false;this.paused=false;this.reduced=false;this.time=0;this.last=0;this.raf=0;this.frame=this.frame.bind(this);this.observer=new ResizeObserver(()=>{if(this.active)this.draw(this.time);});this.observer.observe(canvas);}
 set(active,{reduced=false}={}){if(this.active===active&&this.reduced===reduced)return;this.active=active;this.reduced=reduced;this.canvas.hidden=!active;this.cancel();if(active){this.draw(this.time);if(!reduced&&!this.paused)this.raf=requestAnimationFrame(this.frame);}}
 setPaused(paused){this.paused=paused;this.cancel();this.last=0;if(!paused&&this.active&&!this.reduced)this.raf=requestAnimationFrame(this.frame);}
 cancel(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;}
 frame(now){this.raf=0;if(!this.active||this.paused||this.reduced)return;if(!this.last||now-this.last>=1000/24){this.time+=this.last?Math.min((now-this.last)/1000,.1):0;this.last=now;this.draw(this.time);}this.raf=requestAnimationFrame(this.frame);}
 draw(t){
  if(!this.ctx)return;const c=this.canvas,ctx=this.ctx,rect=c.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.5);if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#030910';ctx.fillRect(0,0,w,h);for(const s of this.graph.stars){ctx.fillStyle=`rgba(229,206,174,${s.a})`;ctx.fillRect(s.x*w,s.y*h,1,1);}
  const angle=t*.065+.4,cos=Math.cos(angle),sin=Math.sin(angle),scale=Math.min(w,h)*.42;
  const points=this.graph.nodes.map(n=>{const x=n.x*cos-n.z*sin,z=n.x*sin+n.z*cos,p=3.8/(3.8+z);return {x:w*.5+x*scale*p,y:h*.5+(n.y*.95+z*.2)*scale*p,p,d:n.d};});
  ctx.lineWidth=.65;for(const [a,b]of this.graph.edges){const p=points[a],q=points[b];ctx.strokeStyle='rgba(238,103,36,.26)';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();const travel=(t*.26+p.d*.45)%1;ctx.fillStyle='rgba(255,190,66,.72)';ctx.beginPath();ctx.arc(p.x+(q.x-p.x)*travel,p.y+(q.y-p.y)*travel,.8,0,Math.PI*2);ctx.fill();}
  for(const p of points){const pulse=.5+.5*Math.sin(p.d*10-t*2),r=(.65+pulse*.85)*p.p;ctx.fillStyle=`rgba(255,${Math.round(115+pulse*95)},58,${.5+pulse*.35})`;if(pulse>.83){ctx.shadowBlur=6;ctx.shadowColor='#ff9b31';}ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
 }
 dispose(){this.cancel();this.active=false;this.observer.disconnect();}
}
