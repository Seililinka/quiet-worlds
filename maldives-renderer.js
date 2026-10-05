import {ACTIVITIES} from './maldives-world.js?v=15';
import {drawLitScene,drawSelectedName} from './scene-effects.js?v=8';
export class MaldivesRenderer{
 constructor(canvas,world){this.canvas=canvas;this.world=world;this.ctx=canvas.getContext('2d');this.image=new Image();this.image.src=new URL('./assets/maldives-v15.webp',import.meta.url);this.ready=this.image.decode();this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.dpr=Math.min(window.devicePixelRatio||1,1.75);this.showPaths=false;this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;this.size=Math.min(r.width,r.height);this.ox=(r.width-this.size)/2;this.oy=(r.height-this.size)/2;this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
 point(x,y){return{x:this.ox+x*this.size,y:this.oy+y*this.size};}
 hit(x,y){const r=this.canvas.getBoundingClientRect(),px=x-r.left,py=y-r.top;let hit=null,distance=22;for(const a of this.world.agents){const p=this.point(a.x,a.y),d=Math.hypot(p.x-px,p.y-5-py);if(d<distance){hit={agent:a.id};distance=d;}}if(hit)return hit;for(const a of ACTIVITIES){const p=this.point(a.x,a.y);if(Math.hypot(p.x-px,p.y-py)<this.size*.075)return{activity:a.id};}return{};}
 render(){
  if(!this.size||!this.image.complete||!this.image.naturalWidth)return;const c=this.ctx,w=this.world,s=this.size,t=this.reduced?0:w.elapsed;c.clearRect(0,0,this.width,this.height);c.fillStyle='#b8e3df';c.fillRect(0,0,this.width,this.height);
  drawLitScene(this,w,[{x:.24,y:.25,s:.10,power:w.candles},{x:.39,y:.60,s:.11,power:w.candles},{x:.49,y:.42,s:.09,power:w.candles},{x:.68,y:.56,s:.10,power:w.candles},{x:.70,y:.14,s:.095,power:w.candles},{x:.84,y:.12,s:.09,power:w.candles},{x:.87,y:.82,s:.12,power:w.candles}],.02);
  if(w.period==='Вечер'){c.fillStyle='rgba(243,175,120,.08)';c.fillRect(0,0,this.width,this.height);}
  if(w.weather==='cloud'){c.fillStyle='rgba(132,161,173,.10)';c.fillRect(0,0,this.width,this.height);}
  // Only lagoon patches shimmer; the dollhouse rooms remain still and readable.
  c.save();c.strokeStyle='rgba(222,255,251,'+(.10+w.daylight*.12)+')';c.lineWidth=.7;
  for(let i=0;i<32;i++){const x=i%2?.80+(i%6)*.03:.12+(i%9)*.063,y=i%2?.33+(i%8)*.054:.85+(i%5)*.029,p=this.point(x,y);c.globalAlpha=.4+.4*Math.sin(t*.4+i)**2;c.beginPath();c.ellipse(p.x,p.y,s*(.004+.003*Math.sin(t*.2+i)**2),1.3,0,0,Math.PI);c.stroke();}c.restore();
  const focus=w.activity,p=this.point(focus.x,focus.y);c.save();c.strokeStyle='rgba(255,233,170,.9)';c.lineWidth=1.4;c.setLineDash([3,5]);c.beginPath();c.ellipse(p.x,p.y,s*.052,s*.028,0,0,Math.PI*2);c.stroke();c.restore();
  if(this.showPaths){c.save();c.setLineDash([2,5]);for(const a of w.agents){if(!a.path?.length)continue;c.strokeStyle=a.id===w.selectedId?'#fff1b8b0':'#fff5de60';c.beginPath();let p=this.point(a.x,a.y);c.moveTo(p.x,p.y);for(const next of a.path){p=this.point(next.x,next.y);c.lineTo(p.x,p.y);}c.stroke();}c.restore();}
  this.boat('sail',.87+.025*Math.sin(t*.018),.40+.018*Math.cos(t*.02));this.boat('kayak',.88+.025*Math.sin(t*.025),.52+.025*Math.cos(t*.025));
  for(const a of [...w.agents].sort((a,b)=>a.y-b.y))this.agent(a);
  if(w.focus==='dive'){c.save();c.strokeStyle='rgba(225,255,255,.5)';for(let i=0;i<6;i++){const p=this.point(.46+Math.sin(i)*.008,.875-((t*.01+i*.014)%.065));c.beginPath();c.arc(p.x,p.y,1+(i%3)*.45,0,Math.PI*2);c.stroke();}c.restore();}
  if(w.rain>.01){c.save();c.fillStyle='rgba(47,79,104,'+(w.rain*.10)+')';c.fillRect(0,0,this.width,this.height);c.strokeStyle='rgba(220,247,249,'+(.14+w.rain*.26)+')';c.lineWidth=.75;for(let i=0;i<Math.floor(35+w.rain*110);i++){const x=(i*139+t*(8+w.wind*22))%(this.width+40)-20,y=(i*97+t*(105+i%21))%this.height;c.beginPath();c.moveTo(x,y);c.lineTo(x+1+w.wind*4,y+5+s*.004);c.stroke();}c.restore();}
  if(w.selected){const a=w.selected,p=this.point(a.x,a.y);p.y-=8;drawSelectedName(c,a.name,p,this.width,this.height);}
 }
 boat(kind,x,y){const c=this.ctx,p=this.point(x,y),s=this.size/1000,t=this.reduced?0:this.world.elapsed;c.save();c.translate(p.x,p.y+Math.sin(t*.5)*s);c.rotate(kind==='kayak'?.5:-.12);c.scale(s,s);c.fillStyle=kind==='kayak'?'#dfb768':'#f0ead6';c.strokeStyle='#486970';c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,kind==='kayak'?6:14,kind==='kayak'?19:8,kind==='kayak'?0:.1,0,Math.PI*2);c.fill();c.stroke();if(kind==='sail'){c.strokeStyle='#b68f66';c.beginPath();c.moveTo(0,2);c.lineTo(0,-35);c.stroke();c.fillStyle='#fcf6e5';c.beginPath();c.moveTo(1,-34);c.lineTo(20,-4);c.lineTo(1,-5);c.closePath();c.fill();}else{c.strokeStyle='#725744';c.lineWidth=2;c.beginPath();c.moveTo(-13,-8);c.lineTo(13,8);c.stroke();}c.restore();}
 agent(a){const c=this.ctx,w=this.world,p=this.point(a.x,a.y),selected=w.selectedId===a.id,s=Math.max(3.7,Math.min(6.5,this.size*.009));c.save();c.translate(p.x,p.y);c.globalAlpha=selected?1:.9;
  if(a.kind==='human'){
   if(['sail','kayak'].includes(a.place)&&!a.path.length){const t=this.reduced?0:w.elapsed,dx=.025*Math.sin(t*(a.place==='sail'?.018:.025)),dy=(a.place==='sail'?.018:.025)*Math.cos(t*(a.place==='sail'?.02:.025));c.translate(dx*this.size,dy*this.size);}
   c.fillStyle='rgba(18,65,63,.22)';c.beginPath();c.ellipse(0,2,s*.85,s*.35,0,0,Math.PI*2);c.fill();c.fillStyle=a.color;c.strokeStyle=selected?'#fff4c9':'#5f6e65';c.lineWidth=selected?1.8:.7;c.beginPath();c.arc(0,-s,s,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#eacf9b';c.beginPath();c.ellipse(0,-s*1.8,s*.8,s*.28,-.12,0,Math.PI*2);c.fill();
  }else{
   const t=this.reduced?a.phase:w.elapsed*.04+a.phase;c.rotate(Math.cos(t)>.0?0:Math.PI);c.fillStyle=a.kind==='turtle'?'#91b8a4':a.kind==='dolphin'?'#92b7bf':a.color;c.strokeStyle=selected?'#fff1c0':'#2f777f99';c.lineWidth=selected?1.6:.5;
   if(a.kind==='turtle'){c.beginPath();c.ellipse(0,0,s*1.3,s*.92,0,0,Math.PI*2);c.fill();c.stroke();for(const [x,y]of [[-s,-s],[s,-s],[-s,s],[s,s]]){c.beginPath();c.ellipse(x,y,s*.6,s*.25,x*y>0?.6:-.6,0,0,Math.PI*2);c.fill();}c.beginPath();c.arc(s*1.55,0,s*.4,0,Math.PI*2);c.fill();}
   else{c.beginPath();c.ellipse(0,0,s*(a.kind==='dolphin'?2:1),s*.42,0,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(-s,0);c.lineTo(-s*1.7,-s*.7);c.lineTo(-s*1.7,s*.7);c.closePath();c.fill();}
  }
  if(a.signal>.1||selected){c.strokeStyle='rgba(255,239,181,'+(selected?.8:a.signal*.6)+')';c.lineWidth=1;c.beginPath();c.arc(0,a.kind==='human'?-s:0,s+4+(1-(a.signal||1))*6,0,Math.PI*2);c.stroke();}c.restore();
 }
}
