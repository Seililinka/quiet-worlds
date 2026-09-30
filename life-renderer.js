import {ForestRenderer} from './renderer.js';
import {SPECIES} from './ecosystem.js?v=3';
import {drawSelectedName} from './scene-effects.js?v=8';
export class LifeRenderer extends ForestRenderer {
 constructor(canvas,world){super(canvas,world);this.showConnections=true;}
 render(){const c=this.ctx,f=this.forest,w=this.width,h=this.height;if(!w||!this.image.complete||!this.image.naturalWidth)return;c.clearRect(0,0,w,h);c.fillStyle='#edf0e4';c.fillRect(0,0,w,h);c.drawImage(this.image,this.ox,this.oy,this.size,this.size);this.lastNight+=(f.night-this.lastNight)*.035;const n=this.lastNight;c.fillStyle=`rgba(11,30,26,${.18+n*.57+f.rain*.07})`;c.fillRect(0,0,w,h);this.drawWater();this.drawAtmosphere();this.drawClimate();
  if(this.showConnections){for(const r of f.resources){const p=this.position(r.x,r.y);c.save();c.strokeStyle=r.kind==='water'?'#9bd9d799':'#d5e79788';c.lineWidth=1;c.setLineDash([2,4]);c.beginPath();c.ellipse(p.x,p.y,13,6,0,0,Math.PI*2);c.stroke();c.restore();}}
  if(this.showConnections)for(const edge of f.connections){const a=f.agents[edge.from],b=f.agents[edge.to];if(!a||!b)continue;const p=this.position(a.x,a.y),q=this.position(b.x,b.y),alpha=Math.max(0,1-(f.elapsed-edge.born)/3.5);c.save();c.strokeStyle=`rgba(${edge.type==='friend'?'215,178,231':'211,230,151'},${alpha*.8})`;c.lineWidth=1.3;c.setLineDash(edge.type==='friend'?[]:[3,3]);c.beginPath();c.moveTo(p.x,p.y-10);c.quadraticCurveTo((p.x+q.x)/2,(p.y+q.y)/2-28,q.x,q.y-10);c.stroke();c.restore();}
  const selected=f.selected;
  if(selected.target&&this.showConnections){const p=this.position(selected.x,selected.y),q=this.position(selected.target.x,selected.target.y);c.save();c.strokeStyle='#f5f1b5ae';c.lineWidth=1.2;c.setLineDash([4,5]);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(q.x,q.y,4,0,Math.PI*2);c.stroke();c.restore();}
  for(const a of [...f.agents].sort((a,b)=>a.y-b.y))this.drawAgent(a,a.id===f.selectedId);
  for(const ripple of f.ripples){const age=f.elapsed-ripple.born,p=this.position(ripple.x,ripple.y);c.strokeStyle=`rgba(233,239,178,${Math.max(0,1-age/3)*.7})`;c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,8+age*30,4+age*15,0,0,Math.PI*2);c.stroke();}
  if(selected){const p=this.position(selected.x,selected.y),scale=Math.max(.75,this.size/600);p.y-=([2,7].includes(selected.species)?8:12)*scale;drawSelectedName(c,selected.name,p,w,h);}
 }
 drawClimate(){const c=this.ctx,f=this.forest,w=this.width,h=this.height;if(f.temperature<10){c.fillStyle='rgba(161,195,215,'+Math.min(.13,(10-f.temperature)*.009)+')';c.fillRect(0,0,w,h);}else if(f.temperature>24){c.fillStyle='rgba(236,180,105,'+Math.min(.08,(f.temperature-24)*.007)+')';c.fillRect(0,0,w,h);}if(this.reduced||f.wind<.12)return;c.save();c.strokeStyle='rgba(227,237,196,'+(f.wind*.24)+')';c.lineWidth=1;for(let i=0;i<10;i++){const x=((i*.113+f.elapsed*(.008+f.wind*.045))%1)*w,y=h*(.32+(i*.071)% .42);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+9+f.wind*14,y-3,x+18+f.wind*25,y);c.stroke();}c.restore();}
 drawAgent(a,selected){const c=this.ctx,f=this.forest,s=SPECIES[a.species],p=this.position(a.x,a.y),scale=Math.max(.75,this.size/600),sleep=a.action==='sleep',isBug=[2,7].includes(a.species);if(sleep&&!selected&&isBug)return;const bob=this.reduced?0:Math.sin(f.elapsed*(a.species===2?5:2)+a.phase)*(isBug?2:1);const rise=(isBug?8:12)*scale;const y=p.y-rise+bob;const r=(isBug?3:5)*scale;
  if(a.species===7&&!sleep){const brightness=.3+.7*(.5+.5*Math.sin(f.elapsed*1.9+a.phase))**3,g=c.createRadialGradient(p.x,y,0,p.x,y,12);g.addColorStop(0,`rgba(222,242,156,${brightness*.7})`);g.addColorStop(1,'rgba(222,242,156,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,y,12,0,Math.PI*2);c.fill();}
  c.save();c.globalAlpha=sleep?.35:a.action==='shelter'?.55:1;c.strokeStyle=s.color+'aa';c.lineWidth=.85;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,y);c.stroke();c.fillStyle='#19392bdd';c.beginPath();c.ellipse(p.x,p.y,4*scale,2*scale,0,0,Math.PI*2);c.fill();
  if(selected||a.signal>.1){c.strokeStyle=selected?'#fff8c7':s.color;c.lineWidth=selected?1.8:1;c.globalAlpha=selected?1:a.signal;c.beginPath();c.arc(p.x,y,r+4+(selected?0:(1-a.signal)*10),0,Math.PI*2);c.stroke();c.globalAlpha=sleep?.5:1;}
  c.fillStyle='#17382e';c.strokeStyle=s.color;c.lineWidth=1.6;c.beginPath();
  if([0,4].includes(a.species)){c.moveTo(p.x,y-r-1);c.lineTo(p.x+r+1,y+r);c.lineTo(p.x-r-1,y+r);c.closePath();}
  else if([1,6].includes(a.species)){c.moveTo(p.x,y-r-1);c.lineTo(p.x+r+1,y);c.lineTo(p.x,y+r+1);c.lineTo(p.x-r-1,y);c.closePath();}
  else if(a.species===5)c.rect(p.x-r,y-r,r*2,r*2);
  else c.arc(p.x,y,r,0,Math.PI*2);
  c.fill();c.stroke();if(a.signal>.1||isBug){c.fillStyle=s.color;c.beginPath();c.arc(p.x,y,isBug?1.7:2.2,0,Math.PI*2);c.fill();}c.restore();
 }
}
