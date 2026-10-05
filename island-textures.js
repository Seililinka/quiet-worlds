// Approved water and quiet gestures from the ideal-2026-10-05 sound engine.
// Kept byte-for-byte to preserve the loved rain and ocean textures.
class WaterTexture {
 constructor(sr){
  this.sr=sr;this.dt=1/sr;this.t=0;this.seed=0x612ac79;this.out=[0,0];this.gain=[0,0,0];this.target=[0,0,0];this.slew=1-Math.exp(-this.dt/1.7);
  this.low=[0,0];this.body=[0,0];this.spray=[0,0];this.k=[90,390,1450].map(f=>1-Math.exp(-Math.PI*2*f/sr));
  this.grains=Array.from({length:24},()=>({env:0}));this.slot=0;this.nextDrop=0;this.nextBubble=.3;this.emitted=0;
  this.waveStart=-2;this.waveLength=10.8;this.wavePower=.9;this.tide=0;this.surge=.7;this.surgeTarget=.7;this.nextSurge=0;this.rainAmount=0;this.inside=0;this.leafRain=new LeafRainTexture(sr);
 }
 random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 prepare(p){
  const mode=p.waterMode;this.rainAmount=mode===0?p.rain:mode===1?.55+p.rain*.4:0;
  const recordedRain=p.realm===0||p.realm===2;
  this.leafRain.prepare(recordedRain?this.rainAmount:0);this.target[0]=recordedRain?0:this.rainAmount;this.target[1]=mode===2?1:0;this.target[2]=mode===3?1:0;this.inside=p.inside;
 }
 grain(kind){
  const v=this.grains[this.slot++%this.grains.length],r=this.random(),pan=(this.random()-.5)*1.5;
  v.kind=kind;v.env=1;v.attack=0;v.on=1-Math.exp(-this.dt/(kind?.007:.0025+r*.004));
  v.decay=Math.exp(-this.dt/(kind?.045+r*.10:.018+r*.046));v.k=1-Math.exp(-Math.PI*2*(kind?380+r*500:650+r*2100)/this.sr);
  v.low=0;v.base=0;v.phase=0;v.step=Math.PI*2*(kind?220+r*420:900+r*1400)/this.sr;
  v.glide=Math.exp(-this.dt*(kind?2.3:5));v.amp=kind?.014+r*.014:.019+r*.027;
  v.l=Math.sqrt((1-pan)*.5);v.r=Math.sqrt((1+pan)*.5);this.emitted++;
 }
 splash(){if(this.target[1]>.1||this.target[2]>.1)this.grain(1);}
 next(volume){
  this.t+=this.dt;for(let j=0;j<3;j++)this.gain[j]+=(this.target[j]-this.gain[j])*this.slew;
  const rain=this.gain[0],fall=this.gain[1],sea=this.gain[2];
  if(this.t-this.waveStart>this.waveLength){this.waveStart=this.t;this.waveLength=8+this.random()*5;this.wavePower=.72+this.random()*.28;}
  const phase=(this.t-this.waveStart)/this.waveLength;
  // A rounded swell, foamy retreat, then a real pause before the following wave.
  const swell=phase<.72?Math.sin(Math.PI*phase/.72)**2:0;
  const foam=phase>.24&&phase<.94?Math.sin(Math.PI*(phase-.24)/.70)**2:0;
  this.tide=(swell*.8+foam*.2)*this.wavePower;
  if(this.t>this.nextSurge){this.surgeTarget=.46+this.random()*.54;this.nextSurge=this.t+1.4+this.random()*3.5;}
  this.surge+=(this.surgeTarget-this.surge)*this.dt*.65;
  if(rain>.002&&this.t>=this.nextDrop){this.grain(0);const rate=28+rain*135;this.nextDrop=this.t-Math.log(Math.max(.001,this.random()))/rate;}
  if((fall+sea*foam)>.01&&this.t>=this.nextBubble){this.grain(1);this.nextBubble=this.t+.09+this.random()*.24;}
  const common=this.random()*2-1,roof=1-this.inside*.45;
  for(let c=0;c<2;c++){
   const n=common*.66+(this.random()*2-1)*.34;
   this.low[c]+=this.k[0]*(n-this.low[c]);this.body[c]+=this.k[1]*(n-this.body[c]);this.spray[c]+=this.k[2]*(n-this.spray[c]);
   const low=this.low[c],body=this.body[c]-low,spray=this.spray[c]-this.body[c];
   const cascade=(low*.29+body*.070+spray*.009)*this.surge;
   const shore=(low*.38*swell+body*.14*(swell*.65+foam*.35)+spray*.035*foam*foam)*this.wavePower;
   const farRain=(body*.014+spray*.006*roof)*rain*roof;
   this.out[c]=cascade*fall+shore*sea+farRain;
  }
  for(const v of this.grains){
   if(v.env<.0003)continue;v.env*=v.decay;v.attack+=(1-v.attack)*v.on;
   const n=this.random()*2-1;v.low+=v.k*(n-v.low);v.base+=this.k[0]*(n-v.base);v.phase+=v.step;v.step*=v.glide;
   const tonal=v.kind?Math.sin(v.phase)*.14:0;
   const wet=v.kind?fall+sea*foam*.55:rain*roof;
   const value=(v.low-v.base*.7+tonal)*v.env*v.attack*v.amp*wet;
   this.out[0]+=value*v.l;this.out[1]+=value*v.r;
  }
  const leaf=this.leafRain.next();this.out[0]=(this.out[0]+leaf[0])*volume;this.out[1]=(this.out[1]+leaf[1])*volume;return this.out;
 }
}

class DetailNoise {
 constructor(sr,seed){this.sr=sr;this.dt=1/sr;this.seed=seed||0x495eb29;}
 random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 pole(hz){return 1-Math.exp(-Math.PI*2*hz/this.sr);}
}

class LeafRainTexture extends DetailNoise {
 constructor(sr){
  super(sr);this.level=0;this.target=0;this.out=[0,0];this.slew=this.pole(.15);
  this.samples=null;this.position=0;this.crossfade=Math.round(sr);this.fade=0;this.fadeSlew=this.pole(2);
 }
 load(channels){
  // Content validation happens on the main thread, avoiding an audio-thread stall.
  if(!Array.isArray(channels)||channels.length!==2||channels.some(c=>!(c instanceof Float32Array)||c.length<this.sr*10||c.length>this.sr*30)||channels[0].length!==channels[1].length)return false;
  this.samples=channels;this.position=0;this.fade=0;return true;
 }
 prepare(level){this.target=level;}
 next(){
  this.level+=(this.target-this.level)*this.slew;this.out[0]=this.out[1]=0;
  // Wait quietly for the approved source; never substitute synthesized ticks.
  if(!this.samples||this.level<.000001)return this.out;
  this.fade+=(1-this.fade)*this.fadeSlew;
  const length=this.samples[0].length,join=length-this.crossfade;
  if(this.position>=length)this.position=this.crossfade;
  const at=this.position++,overlap=at>=join;
  const angle=overlap?(at-join)/this.crossfade*Math.PI*.5:0;
  const endGain=overlap?Math.cos(angle):1,startGain=overlap?Math.sin(angle):0;
  for(let c=0;c<2;c++)this.out[c]=(this.samples[c][at]*endGain+(overlap?this.samples[c][at-join]*startGain:0))*this.level*this.fade;
  return this.out;
 }
}

class WindTexture extends DetailNoise {
 constructor(sr){super(sr,0x471dced);this.t=0;this.nextGust=0;this.gust=.12;this.target=.12;this.volume=0;this.out=[0,0];this.floor=[0,0];this.body=[0,0];this.soft=[0,0];this.air=[0,0];this.floorK=this.pole(55);this.airK=this.pole(1100);this.k=this.pole(260);}
 prepare(p){this.volume=p.wind*p.leaves*(.3+p.wind*.7)*(1-p.inside*.72)*(p.realm===0?1:.55);this.k=this.pole(170+p.wind*190+this.gust*90);}
 next(){
  this.t+=this.dt;
  if(this.t>=this.nextGust){this.target=.04+this.random()**1.5*.78;this.nextGust=this.t+4+this.random()*8;}
  this.gust+=(this.target-this.gust)*this.dt*.45;
  const common=this.random()*2-1;
  for(let c=0;c<2;c++){
   const n=common*.82+(this.random()*2-1)*.18;this.floor[c]+=this.floorK*(n-this.floor[c]);this.body[c]+=this.k*(n-this.body[c]);this.soft[c]+=this.k*(this.body[c]-this.soft[c]);this.air[c]+=this.airK*(n-this.air[c]);
   this.out[c]=((this.soft[c]-this.floor[c])*.042+(this.air[c]-this.body[c])*.0018)*(.12+this.gust)*this.volume;
  }
  return this.out;
 }
}

class GestureVoice extends DetailNoise {
 constructor(sr,seed,kind,duration){
  super(sr,seed);this.duration=duration;this.contacts=[];
  const jitter=()=>.96+this.random()*.08;
  if(kind==='page'||kind==='book'){
   this.contact(.07,390*jitter(),.62,'leather');this.contact(.31,670*jitter(),.16,'wood');this.contact(.96,420*jitter(),.37,'leather');
  }else if(kind==='brush'){
   for(const at of [.08,.135,.205,.77,.835,.91])this.contact(at,610*jitter(),.18+this.random()*.13,'wood');
  }else if(kind==='quill'){
   this.contact(.10,690*jitter(),.27,'wood');this.contact(.56,720*jitter(),.16,'wood');this.contact(.93,510*jitter(),.22,'wood');
  }else if(['cloth','knead','hay','bake'].includes(kind)){
   this.contact(.10,kind==='hay'?490:340*jitter(),.55,'leather');this.contact(.73,410*jitter(),.36,'leather');
  }else if(['pour','coffee','watering'].includes(kind)){
   let at=.08;for(let i=0;i<7;i++){this.contact(at,780+this.random()*500,.16+this.random()*.16,'drop');at+=.13+this.random()*.16;}
  }else if(kind==='chat'){
   // Neighbours answer one another with a small C-major wooden-mallet motif.
   const notes=this.random()<.5?[523.251,659.255,523.251]:[659.255,783.991,523.251];
   notes.forEach((frequency,i)=>this.contact(.10+i*.61,frequency,[.40,.27,.32][i],'mallet'));
  }else if(kind==='tram'){
   this.contact(.18,523.251,.32,'bell');this.contact(.69,523.251,.24,'bell');
  }else if(kind==='door'){
   this.contact(.15,480*jitter(),.37,'leather');this.contact(.36,810*jitter(),.11,'wood');
  }else if(kind==='footstep'||kind==='paw'){
   for(let i=0;i<3;i++)this.contact(.09+i*.51+this.random()*.035,(kind==='paw'?560:350)*jitter(),.32+this.random()*.13,'leather');
  }
 }
 contact(at,frequency,gain,material){
  const decay=material==='mallet'?.13:material==='bell'?.18:material==='leather'?.021:material==='drop'?.017:.012;
  this.contacts.push({at,frequency,gain,material,decay,length:decay*7,attack:material==='mallet'||material==='bell'?.018:material==='leather'?.005:.0025});
 }
 next(u){
  const time=u*this.duration;let value=0;
  for(const v of this.contacts){
   const age=time-v.at;if(age<=0||age>=v.length)continue;
   const phase=Math.PI*2*v.frequency*(v.material==='drop'?age+.24*v.decay*(1-Math.exp(-age/v.decay)):age);
   const taper=(1-(age/v.length)**4)**2,envelope=(1-Math.exp(-age/v.attack))**2*Math.exp(-age/v.decay)*taper;
   let wave;
   if(v.material==='mallet'||v.material==='bell')wave=Math.sin(phase)+.10*Math.sin(phase*2)*Math.exp(-age*12)+.018*Math.sin(phase*3)*Math.exp(-age*22);
   else if(v.material==='drop')wave=Math.sin(phase)+.09*Math.sin(phase*2.1)*Math.exp(-age*90);
   else wave=Math.sin(phase)+.24*Math.sin(phase*2.73)*Math.exp(-age*100)+.06*Math.sin(phase*4.11)*Math.exp(-age*180);
   value+=wave*envelope*v.gain;
  }
  return value;
 }
}

class CupVoice extends DetailNoise {
 constructor(sr,seed){super(sr,seed);this.t=0;this.attack=0;this.on=1-Math.exp(-this.dt/.0013);this.contact=0;this.contactK=this.pole(520);const base=1080+this.random()*290;
  this.modes=[1,1.57,2.19,2.91].map((ratio,i)=>({phase:0,step:Math.PI*2*base*ratio/sr,env:1,decay:Math.exp(-this.dt/[.105,.072,.041,.023][i]),gain:[.70,.29,.13,.055][i]}));
 }
 next(){
  this.t+=this.dt;this.attack+=(1-this.attack)*this.on;let ring=0;
  for(const m of this.modes){m.phase+=m.step;if(m.phase>Math.PI*2)m.phase-=Math.PI*2;m.env*=m.decay;ring+=Math.sin(m.phase)*m.env*m.gain;}
  this.contact+=this.contactK*((this.random()*2-1)-this.contact);
  return ring*this.attack+this.contact*.18*Math.exp(-this.t*90);
 }
}
export {WaterTexture, DetailNoise, LeafRainTexture, WindTexture, GestureVoice, CupVoice};
