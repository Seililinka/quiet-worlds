// Weather coordinates follow the square artwork, including on narrow screens.
const TAU=Math.PI*2;
const fract=x=>x-Math.floor(x);
const PUDDLES=[
 [.493,.585,.037,.010],[.567,.639,.036,.011],[.654,.518,.029,.009],
 [.389,.441,.024,.007],[.518,.334,.024,.007],[.562,.286,.021,.006],
 [.180,.598,.028,.008],[.333,.672,.027,.008],[.648,.753,.026,.008],
 [.868,.662,.023,.007],[.689,.761,.027,.008],[.431,.718,.020,.006]
];
const REFLECTIONS=[[.389,.502],[.614,.559],[.530,.719],[.607,.659],[.755,.718]];
const INDOORS=[
 [[.735,.315],[.808,.348],[.803,.414],[.733,.389]],
 [[.035,.412],[.184,.500],[.181,.554],[.035,.477]],
 [[.239,.509],[.328,.560],[.321,.592],[.228,.539]]
];

export function drawCityWetGround(r,w){
 const rain=Math.max(0,Math.min(1,w.rain));if(rain<.01)return;
 const c=r.ctx,s=r.size,day=w.daylight,t=r.reduced?0:w.elapsed;
 c.save();
 // A cool overcast light makes a weather change visible even with reduced motion.
 const cloud=c.createLinearGradient(0,r.oy,0,r.oy+s);
 cloud.addColorStop(0,`rgba(41,64,87,${rain*.22})`);
 cloud.addColorStop(1,`rgba(81,114,132,${rain*.08})`);
 c.fillStyle=cloud;c.fillRect(r.ox,r.oy,s,s);
 for(let i=0;i<PUDDLES.length;i++){
  const [x,y,rx,ry]=PUDDLES[i],p=r.point(x,y);
  c.save();c.translate(p.x,p.y);c.scale(s*rx,s*ry);
  const wet=c.createRadialGradient(0,0,.05,0,0,1);
  wet.addColorStop(0,`rgba(111,167,190,${rain*(.28+day*.16)})`);
  wet.addColorStop(.65,`rgba(58,99,121,${rain*.30})`);
  wet.addColorStop(1,'rgba(58,99,121,0)');
  c.fillStyle=wet;c.beginPath();c.arc(0,0,1,0,TAU);c.fill();c.restore();
  // Small elliptical rings spread gently across the paving, never in the rooms.
  const phase=r.reduced?.46:fract(t*.58+i*.381);
  c.strokeStyle=`rgba(199,225,235,${rain*(1-phase)*(.32+day*.16)})`;
  c.lineWidth=Math.max(.55,s*.001);
  c.beginPath();c.ellipse(p.x,p.y,s*rx*(.12+phase*.60),s*ry*(.12+phase*.60),0,0,TAU);c.stroke();
 }
 c.lineCap='round';
 for(let i=0;i<REFLECTIONS.length;i++){
  const [x,y]=REFLECTIONS[i],p=r.point(x,y);
  for(let j=0;j<7;j++){
   const shimmer=r.reduced?1:.88+.12*Math.sin(t*.8+i+j*.7);
   const half=s*(.004+(7-j)*.0009)*shimmer;
   c.strokeStyle=`rgba(255,207,125,${rain*w.lights*(.12+(1-day)*.34)*(1-j/8)})`;
   c.lineWidth=Math.max(.8,s*.002);c.beginPath();c.moveTo(p.x-half,p.y+j*s*.004);c.lineTo(p.x+half,p.y+j*s*.004);c.stroke();
  }
 }
 c.restore();
}

export function drawCityRain(r,w){
 const rain=Math.max(0,Math.min(1,w.rain));if(rain<.01)return;
 const c=r.ctx,s=r.size,t=r.reduced?9:w.elapsed;
 c.save();c.beginPath();c.rect(r.ox,r.oy,s,s);
 // Keep the open dollhouse interiors dry; roofs and the whole street get rain.
 for(const polygon of INDOORS){const first=r.point(...polygon[0]);c.moveTo(first.x,first.y);for(const xy of polygon.slice(1)){const p=r.point(...xy);c.lineTo(p.x,p.y);}c.closePath();}
 c.clip('evenodd');c.lineCap='round';
 const count=Math.round(35+rain*210),visibility=Math.min(1,rain*3);
 for(let i=0;i<count;i++){
  const depth=.6+fract(i*.618)*.4;
  const x=fract(i*.754877+t*(.014+w.wind*.048)*depth)*1.12-.06;
  const y=fract(i*.569840+t*(.19+depth*.13))*1.12-.06,p=r.point(x,y);
  c.strokeStyle=`rgba(213,233,244,${visibility*(.19+depth*.22)})`;
  c.lineWidth=Math.max(.65,s*.00125*depth);
  c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+s*(.002+w.wind*.016)*depth,p.y+s*(.012+depth*.009));c.stroke();
 }
 c.restore();
}

// Only the exposed sea receives animated glints; the wooded left bank stays still.
const SEA_GLINTS=[
 [.73,.021,.045],[.86,.037,.032],[.985,.365,.009],[.983,.447,.010],
 [.978,.695,.012],[.958,.783,.024],[.932,.842,.029],[.91,.907,.041],
 [.855,.965,.029],[.726,.982,.043],[.487,.984,.041],[.30,.982,.031],
 [.959,.96,.021],[.802,.903,.020],[.206,.029,.019]
];
export function drawCoastalWater(r,w){
 if(r.reduced)return;
 const c=r.ctx,s=r.size,t=w.elapsed;
 c.save();c.lineCap='round';
 for(let i=0;i<SEA_GLINTS.length;i++){
  const [x,y,width]=SEA_GLINTS[i],swell=Math.sin(t*(.38+w.wind*.15)+i*1.73),p=r.point(x,y+swell*.002);
  c.strokeStyle=`rgba(170,224,240,${(.04+.09*w.daylight)*(.65+.35*Math.sin(t*.49+i))})`;
  c.lineWidth=Math.max(.6,s*.0012);c.beginPath();c.moveTo(p.x-width*s*.5,p.y);
  c.quadraticCurveTo(p.x,p.y-s*(.002+swell*.001),p.x+width*s*.5,p.y);c.stroke();
 }
 c.restore();
}
