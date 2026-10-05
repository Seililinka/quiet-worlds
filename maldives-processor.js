import {WaterTexture,LeafRainTexture,WindTexture,GestureVoice,CupVoice} from './island-textures.js?v=15';
const TAU=Math.PI*2,SCENES=new Set(['beach','dinner','dive','suite','sail','kayak','spa','hammock']);
// The original full forest rain and the castle's ocean engine are independent layers.
class MaldivesProcessor extends AudioWorkletProcessor{
 constructor(){
  super();this.sr=sampleRate;this.t=0;this.seed=0x698bbe;this.scene='beach';this.voices=[];this.params={volume:.5,music:.34,world:.85,ocean:.65,rain:0,rainVolume:.65,wind:.12,leaves:.28,inside:0,night:0,details:.4,softness:.96,temperature:.8};this.now={...this.params,volume:0};this.keys=Object.keys(this.params);this.transport=0;this.transportTarget=0;this.oceanEngine=new WaterTexture(this.sr);this.rainEngine=new LeafRainTexture(this.sr);this.windEngine=new WindTexture(this.sr);this.nextPhrase=1.5;this.phrase=0;this.lastEvent=-10;this.nextHeartbeat=1;this.sleepAt=0;this.sleepDuration=0;this.finished=false;this.tone=[0,0];this.dc=[0,0];this.reverb=[.211,.293].map(s=>({buffer:new Float32Array(Math.round(this.sr*s)),at:0,low:0}));
  this.port.onmessage=({data:d})=>{
   if(d.type==='params')for(const k of this.keys)if(Number.isFinite(d[k]))this.params[k]=Math.max(0,Math.min(1,d[k]));
   if(d.type==='scene'&&SCENES.has(d.scene))this.scene=d.scene;
   if(d.type==='leafRainLoop')this.rainEngine.load(d.channels);
   if(d.type==='event')this.event(d);
   if(d.type==='transport'){this.transportTarget=d.playing?1:0;if(d.playing)this.finished=false;}
   if(d.type==='sleep'){this.finished=false;this.sleepDuration=Number.isFinite(d.seconds)?Math.max(0,d.seconds):0;this.sleepAt=this.sleepDuration?this.t+this.sleepDuration:0;}
   if(d.type==='silence'){this.voices=[];for(const r of this.reverb){r.buffer.fill(0);r.low=0;}}
  };
 }
 rnd(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 note(midi,delay,amp,kind='guitar',duration=7,pan=0){if(this.voices.length<24)this.voices.push({start:this.t+delay,kind,duration,frequency:440*2**((midi-69)/12),phase:0,amp,pan});}
 music(){
  // D-major pentatonic, open nylon-string voicings and rounded wooden notes.
  // No minor drones, detuned beating, sharp transients or rising dramatic phrases.
  const phrases=[[62,66,69,66,62],[66,69,71,69,66,62],[69,66,64,62],[62,64,66,64,62]];
  const melody=phrases[this.phrase++%phrases.length],under=['suite','dive'].includes(this.scene),beat=under?3.7:3.0,kind=['spa','suite'].includes(this.scene)?'felt':'guitar';
  this.note(50,0,.020,kind,9,-.18);this.note(57,.45,.013,kind,8,.16);
  for(let i=0;i<melody.length;i++)this.note(melody[i],2+i*beat,.022-i*.0014,kind,8,Math.sin(i)*.18);
  if(!under)this.note(66,5.4,.007,'wood',5,.2);
  this.nextPhrase=this.t+melody.length*beat+12+this.rnd()*5;
 }
 event(e){
  if(!this.transportTarget||this.t-this.lastEvent<3.5||this.voices.length>20)return;const gain=Math.max(0,Math.min(1,Number(e.gain)||0));if(!gain)return;this.lastEvent=this.t;
  const kind=e.kind,pan=Math.max(-.65,Math.min(.65,e.pan||0));let texture=null,duration=1.8,amp=.008*gain;
  if(kind==='cup'){texture=new CupVoice(this.sr,this.seed);duration=.8;amp=.006*gain;}
  else if(['tea','book','linen','sand'].includes(kind)){texture=new GestureVoice(this.sr,this.seed,kind==='tea'?'pour':kind==='book'?'book':kind==='sand'?'cloth':'cloth',kind==='tea'?2.4:1.5);duration=kind==='tea'?2.4:1.5;amp=.011*gain;}
  else if(kind==='bubble'||kind==='paddle'){duration=kind==='bubble'?.9:1.2;amp=.008*gain;}
  else return;
  this.voices.push({kind,texture,duration,start:this.t,phase:0,frequency:kind==='bubble'?320:210,amp,pan});
 }
 process(inputs,outputs){
  const out=outputs[0];if(!out?.length)return true;
  if(this.t>=this.nextPhrase)this.music();
  if(this.sleepAt&&this.t>=this.sleepAt){this.sleepAt=0;this.finished=true;this.transportTarget=0;this.port.postMessage({type:'sleepDone'});}
  if(this.t>=this.nextHeartbeat){this.nextHeartbeat=this.t+1;this.port.postMessage({type:'heartbeat',time:this.t,remaining:this.sleepAt?Math.max(0,this.sleepAt-this.t):0});}
  const p=this.now,dt=1/this.sr,smooth=1-Math.exp(-dt/1.8),transportK=1-Math.exp(-dt/(this.transportTarget?.9:.045));
  this.oceanEngine.prepare({realm:1,waterMode:3,rain:0,inside:0});this.rainEngine.prepare(p.rain);this.windEngine.prepare({wind:p.wind,leaves:p.leaves,inside:p.inside,realm:1});
  const toneK=1-Math.exp(-TAU*(1800+(1-p.softness)*2100)*dt);
  const sleep=this.finished?0:this.sleepAt?Math.min(1,Math.max(0,(this.sleepAt-this.t)/Math.min(30,this.sleepDuration))):1;
  for(let i=0;i<out[0].length;i++){
   this.t+=dt;for(const k of this.keys)p[k]+=(this.params[k]-p[k])*smooth;this.transport+=(this.transportTarget-this.transport)*transportK;
   const sea=this.oceanEngine.next(p.ocean),rain=this.rainEngine.next(),wind=this.windEngine.next();let ml=0,mr=0,dl=0,dr=0;
   for(let j=this.voices.length-1;j>=0;j--){const v=this.voices[j],age=this.t-v.start;if(age<0)continue;if(age>=v.duration){this.voices.splice(j,1);continue;}const u=age/v.duration;let value=0;const music=['guitar','felt','wood'].includes(v.kind);
    if(music){v.phase=(v.phase+TAU*v.frequency*dt)%TAU;const x=v.phase,attack=1-Math.exp(-age*(v.kind==='felt'?5:15));const harmonics=v.kind==='guitar'?Math.sin(x)+.23*Math.sin(2*x)*Math.exp(-age*1.4)+.065*Math.sin(3*x)*Math.exp(-age*2.3):Math.sin(x)+.065*Math.sin(2*x)*Math.exp(-age*2);value=harmonics*attack*Math.exp(-age*(v.kind==='wood'?1.2:.48))*(1-u)**2*v.amp;}
    else if(v.texture)value=v.texture.next(u)*v.amp;
    else{v.phase+=TAU*v.frequency*(1+Math.exp(-age*8)*.6)*dt;value=Math.sin(v.phase)*Math.sin(Math.PI*u)**2*Math.exp(-age*5)*v.amp;}
    const l=Math.sqrt((1-v.pan)*.5),r=Math.sqrt((1+v.pan)*.5);if(music){ml+=value*l;mr+=value*r;}else{dl+=value*l;dr+=value*r;}
   }
   const dry=[ml,mr];for(let c=0;c<2;c++){const r=this.reverb[c],wet=r.buffer[r.at];r.low+=(wet-r.low)*.08;r.buffer[r.at]=(dry[c]+dry[1-c])*.14+r.low*.24;r.at=(r.at+1)%r.buffer.length;
    const world=sea[c]+rain[c]*p.rainVolume+wind[c]+(c===0?dl:dr)*p.details;
    const value=world*p.world+(dry[c]+wet*.22)*p.music;this.tone[c]+=toneK*(value-this.tone[c]);this.dc[c]+=.00018*(this.tone[c]-this.dc[c]);out[c][i]=Math.tanh((this.tone[c]-this.dc[c])*2.4)*p.volume*this.transport*sleep;
   }
  }
  return true;
 }
}
registerProcessor('maldives-sound',MaldivesProcessor);
