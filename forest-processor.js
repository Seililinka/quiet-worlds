/* Water uses short, irregular impacts and changing bodies of flow, not a white-noise loop. */
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

/* Burning wood: quiet combustion, irregular fractures and little clusters of embers.
   The impacts are filtered noise, with no pitched oscillator or periodic fire loop. */
class FireTexture {
 constructor(sr){
  this.sr=sr;this.dt=1/sr;this.t=0;this.seed=0x435ba91;this.out=[0,0];this.level=0;this.target=0;this.slew=1-Math.exp(-this.dt/.65);
  this.low=0;this.body=0;this.air=0;this.k=[45,470,2200].map(f=>1-Math.exp(-Math.PI*2*f/sr));
  this.breath=.45;this.breathTarget=.45;this.nextBreath=0;this.nextTick=.17;this.nextCluster=1.2;this.nextPop=3.7;
  this.clusterLeft=0;this.clusterAt=0;this.clusterPan=0;this.clusterPower=1;this.emitted=0;this.pops=0;
  this.grains=Array.from({length:32},()=>({env:0}));
 }
 random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 prepare(p){this.target=p.realm===1?p.fire:0;}
 grain(kind,pan=(this.random()-.5)*.65,power=1){
  const v=this.grains.find(g=>g.env<.0002);if(!v)return;
  const r=this.random();v.kind=kind;v.env=1;v.attack=0;v.low=0;v.base=0;v.body=0;
  v.on=1-Math.exp(-this.dt/(kind===1?.0018+r*.0014:.0009+r*.0018));
  v.decay=Math.exp(-this.dt/(kind===1?.024+r*.034:kind===2?.010+r*.018:.004+r*.009));
  v.k=1-Math.exp(-Math.PI*2*(kind===1?1400+r*1500:2200+r*2100)/this.sr);
  v.bodyK=1-Math.exp(-Math.PI*2*(240+r*380)/this.sr);
  v.amp=(kind===1?.045+r*.023:kind===2?.022+r*.017:.013+r*.020)*Math.min(1.15,power);
  const position=Math.max(-.7,Math.min(.7,pan));v.l=Math.sqrt((1-position)*.5);v.r=Math.sqrt((1+position)*.5);
  this.emitted++;if(kind===1)this.pops++;
 }
 stoke(power=1,pan=0){
  if(this.target<.01)return;
  this.clusterLeft=3+Math.floor(this.random()*4);this.clusterAt=this.t+.08;this.clusterPan=pan*.55;this.clusterPower=Math.min(1,power);
 }
 next(){
  this.t+=this.dt;this.level+=(this.target-this.level)*this.slew;
  if(this.level<.000001){this.out[0]=this.out[1]=0;return this.out;}
  if(this.t>=this.nextBreath){this.breathTarget=.25+this.random()*.6;this.nextBreath=this.t+.8+this.random()*2.6;}
  this.breath+=(this.breathTarget-this.breath)*this.dt*.9;
  if(this.t>=this.nextTick){this.grain(0);this.nextTick=this.t-Math.log(Math.max(.001,this.random()))/(2+this.level*3);}
  if(this.t>=this.nextCluster&&this.clusterLeft===0){this.stoke(.65+this.random()*.3,(this.random()-.5)*.8);this.nextCluster=this.t+1.1+this.random()*4.3;}
  if(this.clusterLeft&&this.t>=this.clusterAt){this.grain(2,this.clusterPan+(this.random()-.5)*.16,this.clusterPower);this.clusterLeft--;this.clusterAt=this.t+.018+this.random()*.085;}
  if(this.t>=this.nextPop){this.grain(1);this.nextPop=this.t+4+this.random()*8;}
  const n=this.random()*2-1;this.low+=this.k[0]*(n-this.low);this.body+=this.k[1]*(n-this.body);this.air+=this.k[2]*(n-this.air);
  const combustion=((this.body-this.low)*.012+(this.air-this.body)*.0015)*this.breath;
  this.out[0]=combustion*.72;this.out[1]=combustion*.70;
  for(const v of this.grains){
   if(v.env<.0002)continue;
   v.env*=v.decay;v.attack+=(1-v.attack)*v.on;
   const noise=this.random()*2-1;v.low+=v.k*(noise-v.low);v.base+=this.k[0]*(noise-v.base);v.body+=v.bodyK*(noise-v.body);
   const fracture=v.kind===1?(v.low-v.body)*.65+(v.body-v.base)*.7:(v.low-v.body)*.88+(v.body-v.base)*.12;
   const sample=fracture*v.env*v.attack*v.amp;this.out[0]+=sample*v.l;this.out[1]+=sample*v.r;
  }
  this.out[0]*=this.level;this.out[1]*=this.level;return this.out;
 }
}

class DetailNoise {
 constructor(sr,seed){this.sr=sr;this.dt=1/sr;this.seed=seed||0x495eb29;}
 random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 pole(hz){return 1-Math.exp(-Math.PI*2*hz/this.sr);}
}

// Play the complete, unedited rain recording at its original speed and stereo.
// Only the loop seam overlaps, with a one-second equal-power crossfade.
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

// Quiet air moving through foliage: slowly changing pressure, with very little hiss.
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

// Breath-driven, slightly irregular vocal fry. Sub-bass pulses are removed twice.
class PurrVoice extends DetailNoise {
 constructor(sr,seed){super(sr,seed);this.phase=0;this.rate=25+this.random()*4;this.age=0;this.breathAge=0;this.breathLength=1.6+this.random()*.7;this.inhale=false;this.low=0;this.high=0;this.dc=0;this.breathNoise=0;this.highK=this.pole(720);this.lowK=this.pole(95);this.dcK=this.pole(70);this.airK=this.pole(420);this.pressure=.8;this.target=.8;}
 next(){
  this.age+=this.dt;this.breathAge+=this.dt;
  if(this.breathAge>=this.breathLength){this.breathAge=0;this.inhale=!this.inhale;this.breathLength=1.5+this.random()*.9;}
  this.phase+=this.rate*this.dt;
  if(this.phase>=1){this.phase-=1;this.rate=(this.inhale?27:24)*( .92+this.random()*.16);this.target=.75+this.random()*.25;}
  this.pressure+=(this.target-this.pressure)*this.dt*80;
  const n=this.random()*2-1,fold=(Math.exp(-this.phase*12)-Math.exp(-this.phase*100))*this.pressure;
  const excitation=fold*(.88+n*.12)+n*.055;
  this.low+=this.lowK*(excitation-this.low);this.high+=this.highK*(excitation-this.high);
  const throat=this.high-this.low;this.dc+=this.dcK*(throat-this.dc);this.breathNoise+=this.airK*(n-this.breathNoise);
  const breathing=.72+.28*Math.sin(Math.PI*this.breathAge/this.breathLength)**2;
  return ((throat-this.dc)*.85+this.breathNoise*.065)*breathing;
 }
}

// Short, damped contacts replace the old seconds-long noise gestures entirely.
// Each action is a small sequence of wood, leather, drops or soft tuned notes.
// There is no noise generator in this voice, and contacts have finite tails.
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

// Short, inharmonic ceramic modes with a subdued contact against the saucer/table.
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

/* Three autonomous scores. No recordings; audio clocks do not depend on animation. */
const SCORES=[
 // Stable major centres keep even long reverb tails consonant between voicings.
 {name:'forest',chords:[[50,57,66,69],[50,57,62,66],[50,62,66,69],[50,57,66,74]],hold:62,pad:.0026,echo:.48},
 {name:'castle',chords:[[53,60,65,69],[53,60,69,72],[53,60,65,72],[53,60,69,77]],hold:58,pad:0,echo:.35},
 {name:'city',chords:[[48,55,64,67],[48,55,64,72],[48,55,67,76],[48,60,64,67]],hold:56,pad:0,echo:.28}
];
const FABRICS=new Set(['quill','brush','cloth','knead','hay']);
const CITY_DETAILS=new Set(['chat','coffee','bake','watering','tram','footstep','paw','door']);
const MUSIC=new Set(['air','harp','piano','rhodes','bass']);
const MOVING=new Set(['page','brush','leaf','cloth','book','bake']);
class ForestProcessor extends AudioWorkletProcessor {
 constructor(){
  super();this.sr=sampleRate;this.t=0;this.seed=0x298cec2;this.voices=[];
  this.params={night:0,rain:0,wind:.18,temperature:.65,activity:.4,tension:0,bees:0,volume:.5,music:.72,world:.65,water:.4,waterMode:0,leaves:.5,calls:.24,detail:.3,softness:.9,intimacy:.85,realm:0,fire:0,paper:.7,fabric:.7,pets:.65,inside:0,people:.4,cafe:.75,street:.35,tram:.35};
  this.now={...this.params,volume:0};this.keys=Object.keys(this.params).filter(k=>k!=='realm'&&k!=='waterMode');
  this.configured=false;this.waterEngine=new WaterTexture(this.sr);this.fireEngine=new FireTexture(this.sr);this.windEngine=new WindTexture(this.sr);this.tone=[0,0];this.dc=[0,0];
  this.profile=0;this.resetScore();this.textureAt=1;this.lastVoice=-10;this.lastNote=-10;this.lastKind={};
  this.reverb=[.163,.211,.293,.337].map(seconds=>({m:new Float32Array(Math.round(seconds*this.sr)),w:new Float32Array(Math.round(seconds*this.sr)),pos:0,ml:0,wl:0}));
  this.nextHeartbeat=1;this.sleepAt=0;this.sleepDuration=0;this.transport=0;this.transportTarget=0;
  this.port.onmessage=({data:d})=>{
   if(d.type==='leafRainLoop')this.waterEngine.leafRain.load(d.channels);
   if(d.type==='params'){
    for(const k of this.keys)if(Number.isFinite(d[k]))this.params[k]=Math.max(0,Math.min(1,d[k]));
    if(Number.isFinite(d.waterMode))this.params.waterMode=this.now.waterMode=Math.round(Math.max(0,Math.min(4,d.waterMode)));
    if(Number.isFinite(d.realm)){const realm=Math.round(Math.max(0,Math.min(2,d.realm)));this.params.realm=this.now.realm=realm;if(realm!==this.profile){this.profile=realm;this.resetScore();}}
    if(!this.configured){this.now={...this.params,volume:0};this.configured=true;}
   }
   if(d.type==='event')this.event(d);
   if(d.type==='transport'){this.transportTarget=d.playing?1:0;if(d.playing)this.sleepFinished=false;}
   if(d.type==='sleep'){this.sleepFinished=false;this.sleepDuration=Number.isFinite(d.seconds)?Math.max(0,d.seconds):0;this.sleepAt=this.sleepDuration?this.t+this.sleepDuration:0;}
   if(d.type==='silence'){this.voices=[];for(const r of this.reverb){r.m.fill(0);r.w.fill(0);r.ml=0;r.wl=0;}}
  };
 }
 rnd(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 resetScore(){this.score=SCORES[this.profile];this.chords=this.score.chords;this.chord=0;this.nextChord=this.t+this.score.hold;this.transition=0;this.padA=this.pad(0);this.padB=null;this.phraseAt=this.t+1.5;this.phrase=0;this.voices=this.voices.filter(v=>!MUSIC.has(v.kind));}
 pad(chord){return this.chords[chord].map((note,i)=>({f:440*2**((note-69)/12),p:i*.8,q:i*.8+.1}));}
 push(v){
  if(this.voices.length>=28)return;
  const voice={start:this.t,duration:1,frequency:440,phase:0,pan:0,amp:.01,kind:'air',noise:0,...v};
  const Texture=v.kind==='purr'?PurrVoice:['ceramic','cup'].includes(v.kind)?CupVoice:['page','book','pour'].includes(v.kind)||FABRICS.has(v.kind)||CITY_DETAILS.has(v.kind)?GestureVoice:null;
  if(Texture)voice.texture=new Texture(this.sr,Math.floor(this.rnd()*4294967296),v.kind,voice.duration);this.voices.push(voice);
 }
 note(note,pan=0,delay=0,amp=.018,kind='air',duration=5.5){this.push({kind,start:this.t+delay,duration,frequency:440*2**((note-69)/12),pan,amp});}
 musicPhrase(){
  const p=this.now,c=this.chords[this.chord],pan=(this.rnd()-.5)*.55,night=1-p.night*.23;
  if(this.profile===0){
   // Unmetered breath tones and long spaces for the forest.
   const start=Math.floor(this.rnd()*3),count=p.detail>.55?3:2;
   for(let j=0;j<count;j++)this.note(c[1+(start+j)%3],pan+j*.12,j*(2.9+this.rnd()*1.7),(.022-j*.003)*night,'air',7+this.rnd()*2);
   this.phraseAt=this.t+19+this.rnd()*13+(1-p.detail)*8+p.night*5;
  }else if(this.profile===1){
   // F-major harp lullabies. Each little arc settles home; no sustained bass drone.
   const melodies=[[65,69,72,69,65],[69,72,77,72,69,65],[72,69,67,65],[65,72,69,65]],melody=melodies[this.phrase%melodies.length],beat=1.55+p.night*.18;
   this.note(c[0],-.16,0,.014*night,'harp',8);this.note(c[1],-.08,.55,.012*night,'harp',7.5);
   melody.forEach((note,j)=>this.note(note,pan*.6+j*.025,beat*(1.5+j*1.7),(.024-j*.001)*night,'harp',7.5));
   this.phraseAt=this.t+beat*(melody.length*1.7+4)+3+this.rnd()*3+(1-p.detail)*3;
  }else{
   // C-major felt piano, a quiet open left hand and descending pentatonic answers.
   const melodies=[[64,67,64,62,60],[67,69,67,64,60],[64,62,60],[60,64,67,64,60]],melody=melodies[this.phrase%melodies.length],beat=3.1+p.night*.35;
   this.note(c[0],-.18,0,.016*night,'piano',7);this.note(c[1],-.09,.45,.012*night,'piano',6.5);
   this.note(c[2],.12,.95,.009*night,'rhodes',6);
   melody.forEach((note,j)=>this.note(note,pan*.55+j*.018,2+j*beat,(.025-j*.0014)*night,'piano',6.5));
   this.phraseAt=this.t+2+(melody.length-1)*beat+9+this.rnd()*3+(1-p.detail)*3;
  }
  this.phrase++;
 }
 event(e){
  const p=this.now;if(p.volume<.001||this.transportTarget===0)return;
  if(this.profile===1){this.castleEvent(e);return;}if(this.profile===2){this.cityEvent(e);return;}
  const pan=Math.max(-.75,Math.min(.75,e.pan||0)),v=Number.isFinite(e.variation)?Math.max(0,Math.min(1,e.variation)):this.rnd(),gap=1.3+(1-p.detail)*2.8;
  if(this.t-this.lastVoice>gap&&this.t-(this.lastKind[e.kind]??-100)>8){
   this.lastKind[e.kind]=this.t;const common={pan,amp:.012};
   if(e.kind==='bird'){this.lastVoice=this.t;for(let i=0;i<2;i++)this.push({...common,kind:'bird',start:this.t+i*.34,duration:.24,frequency:1350+v*440+i*130,amp:.014});}
   else if(e.kind==='owl'){this.lastVoice=this.t;this.push({...common,kind:'owl',duration:.85,frequency:260+v*40,amp:.023});}
   else if(e.kind==='wood'){this.lastVoice=this.t;for(let i=0;i<3;i++)this.push({...common,kind:'wood',start:this.t+i*.19,duration:.17,frequency:390+v*90,amp:.019});}
   else if(e.kind==='water'){this.lastVoice=this.t;this.waterEngine.splash();}
   else if(['crow','alarm','rustle','dig','step'].includes(e.kind)){this.lastVoice=this.t;this.push({...common,kind:'rustle',duration:.6+v*.5,amp:.016});}
  }
  if(['greeting','glow','water'].includes(e.kind)&&this.t-this.lastNote>19+(1-p.detail)*8){this.lastNote=this.t;this.note(this.chords[this.chord][2]+12,pan,.2,.011,'air',4);}
 }
 eventGain(e,gap,kindGap){
  const gain=Number.isFinite(e.gain)?Math.max(0,Math.min(1,e.gain)):1;
  if(gain<.3&&this.rnd()>.25)return 0;
  if(this.t-this.lastVoice<gap||this.t-(this.lastKind[e.kind]??-100)<kindGap)return 0;
  this.lastVoice=this.t;this.lastKind[e.kind]=this.t;return gain*(.75+this.now.intimacy*.4);
 }
 castleEvent(e){
  const p=this.now,amp=this.eventGain(e,.8+(1-p.detail)*1.1,3);if(!amp)return;
  const pan=Math.max(-.8,Math.min(.8,e.pan||0)),v=this.rnd();
  if(['page','quill','brush','cloth','knead','hay','leaf'].includes(e.kind))this.push({kind:e.kind,duration:e.kind==='leaf'?3.2+v*.4:1.5,pan,amp:(e.kind==='page'?.023:e.kind==='brush'?.028:.024)*amp,frequency:600+v*600});
  else if(e.kind==='purr')this.push({kind:'purr',duration:6.5+v,pan,amp:.055*amp});
  else if(e.kind==='ceramic')for(let j=0;j<2;j++)this.push({kind:'ceramic',start:this.t+j*(.10+v*.06),duration:.75,amp:(j?.0045:.016)*amp,pan});
  else if(e.kind==='pour')this.push({kind:'pour',duration:2.4,frequency:700,amp:.028*amp,pan});
  else if(['step','paw','hoof'].includes(e.kind))for(let j=0;j<2;j++)this.push({kind:'softstep',start:this.t+j*.52,duration:.32,frequency:e.kind==='hoof'?120:85,amp:.014*amp,pan});
  else if(e.kind==='fire')this.fireEngine.stoke(amp,pan);
 }
 cityEvent(e){
  const p=this.now,amp=this.eventGain(e,e.kind==='tram'?0:1.2+(1-p.detail)*1.2,e.kind==='chat'?14:4.5);if(!amp)return;
  const pan=Math.max(-.8,Math.min(.8,e.pan||0)),v=this.rnd();
  const kinds={coffee:[2.4,.028,580],cup:[.75,.016,1200],bake:[1.4,.022,200],book:[1.5,.021,800],chat:[2.5,.012,0],footstep:[1.6,.020,0],door:[.95,.021,0],tram:[2.4,.011,0],watering:[2.4,.025,600],paw:[1.6,.015,0],purr:[6.5+v,.048,27]};
  const def=kinds[e.kind];if(def)this.push({kind:e.kind,duration:def[0],amp:def[1]*amp,frequency:def[2],pan,variation:v});
 }
 schedule(){
  const p=this.now;
  if(this.t>=this.nextChord&&!this.padB){this.chord=(this.chord+1)%this.chords.length;this.padB=this.pad(this.chord);this.transition=this.t;this.nextChord=this.t+this.score.hold+(this.profile===2?0:this.rnd()*5);}
  if(this.padB&&this.t-this.transition>=12){this.padA=this.padB;this.padB=null;}
  if(this.t>=this.phraseAt)this.musicPhrase();
  if(this.t>=this.textureAt){
   if(this.profile===0&&p.leaves*p.wind>.045)this.push({kind:'leaf',duration:3+this.rnd()*2,pan:(this.rnd()-.5)*.7,amp:.014*p.leaves*p.wind});
   this.textureAt=this.t+2+this.rnd()*4;
  }
  if(this.sleepAt&&this.t>=this.sleepAt){this.sleepAt=0;this.sleepFinished=true;this.transportTarget=0;this.port.postMessage({type:'sleepDone'});}
  if(this.t>=this.nextHeartbeat){this.nextHeartbeat=this.t+1;this.port.postMessage({type:'heartbeat',time:this.t,remaining:this.sleepAt?Math.max(0,this.sleepAt-this.t):0});}
 }
 process(inputs,outputs){
  const out=outputs[0];if(!out?.length)return true;this.schedule();this.waterEngine.prepare(this.now);this.fireEngine.prepare(this.now);this.windEngine.prepare(this.now);
  const left=out[0],right=out[1]||out[0],dt=1/this.sr,tau=Math.PI*2,smooth=1-Math.exp(-dt/1.8);
  const toneK=1-Math.exp(-tau*(4600+this.now.temperature*1200-this.now.softness*3000)*dt),cross=this.padB?Math.min(1,(this.t-this.transition)/12):0;
  const gb=cross*cross*(3-2*cross),ga=1-gb,sleepGain=this.sleepFinished?0:this.sleepAt?Math.min(1,Math.max(0,(this.sleepAt-this.t)/Math.min(30,this.sleepDuration))):1;
  const breath=[0,1,2,3].map(j=>.76+.24*Math.sin(this.t*(.08+j*.013)+j)),transportK=1-Math.exp(-dt/(this.transportTarget?.9:.045));
  for(let i=0;i<left.length;i++){
   this.t+=dt;for(const k of this.keys)this.now[k]+=(this.params[k]-this.now[k])*smooth;
   this.transport+=(this.transportTarget-this.transport)*transportK;const p=this.now;let wl=0,wr=0,ml=0,mr=0;
   const wind=this.windEngine.next();wl+=wind[0];wr+=wind[1];
   const water=this.waterEngine.next(p.water);wl+=water[0];wr+=water[1];
   const fire=this.fireEngine.next();wl+=fire[0];wr+=fire[1];
   if(this.score.pad)for(let j=0;j<4;j++){
    let value=0;for(let bank=0;bank<(this.padB?2:1);bank++){
     const v=(bank?this.padB:this.padA)[j];v.p=(v.p+tau*v.f*dt)%tau;v.q=(v.q+tau*v.f*1.00035*dt)%tau;
     const wave=Math.sin(v.p)+.12*Math.sin(v.q);
     value+=wave*breath[j]*(bank?gb:ga)*this.score.pad;
    }
    ml+=value*(j%2?.65:1)*(1-p.night*.13);mr+=value*(j%2?1:.65)*(1-p.night*.13);
   }
   for(let j=this.voices.length-1;j>=0;j--){
    const v=this.voices[j],age=this.t-v.start;if(age<0)continue;if(age>=v.duration){this.voices.splice(j,1);continue;}const u=age/v.duration;let value=0;const isMusic=MUSIC.has(v.kind);
    if(isMusic){
     v.phase=(v.phase+tau*v.frequency*(v.kind==='air'?1+Math.sin(age*3.5)*.0015:1)*dt)%tau;const x=v.phase;
     if(v.kind==='air'){v.noise+=.06*((this.rnd()*2-1)-v.noise);value=(Math.sin(x)+.06*Math.sin(2*x)+v.noise*.025)*Math.sin(Math.PI*u)**2*v.amp;}
     if(v.kind==='harp')value=(Math.sin(x)+.14*Math.sin(x*2)*Math.exp(-age*1.1)+.035*Math.sin(x*3)*Math.exp(-age*2))*(1-Math.exp(-age*13))*Math.exp(-age*.68)*(1-u)**2*v.amp;
     if(v.kind==='piano'){v.noise+=.07*((this.rnd()*2-1)-v.noise);value=(Math.sin(x)+.16*Math.sin(x*2)*Math.exp(-age*1.1)+.042*Math.sin(x*3)*Math.exp(-age*1.8)+.012*Math.sin(x*4)*Math.exp(-age*3)+v.noise*.035*Math.exp(-age*28))*(1-Math.exp(-age*12))*Math.exp(-age*.52)*(1-u)**2*v.amp;}
     if(v.kind==='rhodes')value=(Math.sin(x)+.08*Math.sin(x*2)*Math.exp(-age*1.5))*(1-Math.exp(-age*6))*Math.exp(-age*.65)*(1-u)**2*v.amp;
     if(v.kind==='bass')value=(Math.sin(x)+.17*Math.sin(2*x)*Math.exp(-age*2))*(1-Math.exp(-age*17))*Math.exp(-age*1.4)*(1-u)*v.amp;
    }else if(v.kind==='page'||v.kind==='book'||v.kind==='pour'){
     value=v.texture.next(u)*v.amp*(v.kind==='book'?p.cafe:p.paper);
    }else if(FABRICS.has(v.kind)){
     value=v.texture.next(u)*v.amp*(v.kind==='quill'?p.paper:p.fabric);
    }else if(CITY_DETAILS.has(v.kind)){
     const mix=v.kind==='chat'?p.people:v.kind==='tram'?p.tram:['coffee','bake'].includes(v.kind)?p.cafe:p.street;
     value=v.texture.next(u)*v.amp*mix;
    }else if(v.kind==='leaf'){
     v.noise+=.055*((this.rnd()*2-1)-v.noise);
     value=v.noise*Math.sin(Math.PI*u)**2*(.72+.28*Math.sin(age*3.1))*v.amp*p.leaves;
    }else if(v.kind==='purr'){
     value=v.texture.next()*Math.sin(Math.PI*u)**2*v.amp*p.pets;
    }else if(v.kind==='ceramic'||v.kind==='cup'){
     value=v.texture.next()*(1-u)**2*v.amp*(v.kind==='cup'?p.cafe:p.paper);
    }else if(v.kind==='softstep'){
     v.phase+=tau*v.frequency*dt;v.noise+=.04*((this.rnd()*2-1)-v.noise);value=(v.noise+Math.sin(v.phase)*.14)*Math.sin(Math.PI*u)**2*Math.exp(-age*7)*v.amp*p.fabric;
    }else if(v.kind==='bird'||v.kind==='owl'){v.phase+=tau*v.frequency*(1+(v.kind==='bird'?.12:-.045)*Math.sin(u*Math.PI))*dt;value=Math.sin(v.phase)*Math.sin(Math.PI*u)**2*v.amp*p.calls;}
    else if(v.kind==='wood'){v.phase+=tau*v.frequency*dt;value=Math.sin(v.phase)*(1-Math.exp(-age*90))*Math.exp(-age*35)*(1-u)*v.amp*p.calls;}
    else{v.noise+=.045*((this.rnd()*2-1)-v.noise);value=v.noise*Math.sin(Math.PI*u)**2*v.amp*p.calls;}
    const movingPan=Math.max(-.9,Math.min(.9,v.kind==='tram'?(u*.7-.35):v.pan+(MOVING.has(v.kind)?(u-.5)*.06*p.intimacy:0)));
    const a=Math.sqrt((1-movingPan)*.5),b=Math.sqrt((1+movingPan)*.5);if(isMusic){ml+=value*a;mr+=value*b;}else{wl+=value*a;wr+=value*b;}
   }
   let mwL=0,mwR=0,wwL=0,wwR=0;
   const worldSend=this.profile===1?.17-p.intimacy*.13:.09-p.intimacy*.065,worldEcho=this.profile===1?.38:.24;
   for(let j=0;j<4;j++){const r=this.reverb[j],m=r.m[r.pos],w=r.w[r.pos];r.ml+=(m-r.ml)*.09;r.wl+=(w-r.wl)*.12;r.m[r.pos]=(ml+mr)*.22+r.ml*this.score.echo;r.w[r.pos]=(wl+wr)*worldSend+r.wl*worldEcho;r.pos=(r.pos+1)%r.m.length;if(j%2){mwR+=m*.25;wwR+=w*.18;}else{mwL+=m*.25;wwL+=w*.18;}}
   // Independent wet paths preserve mutes. Soft tone, DC removal, bounded gain.
   for(let c=0;c<2;c++){const value=c===0?(wl+wwL)*p.world+(ml+mwL)*p.music:(wr+wwR)*p.world+(mr+mwR)*p.music;this.tone[c]+=toneK*(value-this.tone[c]);this.dc[c]+=.00018*(this.tone[c]-this.dc[c]);const output=Math.tanh((this.tone[c]-this.dc[c])*(this.profile===2?3.3:2.4))*p.volume*this.transport*sleepGain;if(c===0)left[i]=output;else right[i]=output;}
  }
  return true;
 }
}
registerProcessor('forest-sound',ForestProcessor);
