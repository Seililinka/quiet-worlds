import {recordRadioStart} from './metrics.js?v=9';
export class ForestAudio {
 constructor(onState){this.context=null;this.node=null;this.onState=onState;this.enabled=false;this.radioTracked=false;this.volume=.5;this.music=.72;this.world=.65;this.texture={water:.4,waterMode:0,leaves:.5,calls:.24,detail:.3,softness:.9,intimacy:.85,realm:0,fire:0,paper:.7,fabric:.7,pets:.65,inside:0,people:.4,cafe:.75,street:.35,tram:.35};this.environment={night:0,rain:0,wind:.2,temperature:.65};this.hidden=false;this.paused=false;this.loading=null;this.sleepMinutes=0;this.finished=false;this.transition=0;}
 async enable(){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)throw new Error('Этот браузер не поддерживает звук. Открой мир в Safari или Chrome.');
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
  if(!this.context){this.context=new AudioContext({latencyHint:'playback'});this.context.onstatechange=()=>this.report();}
  // The resume call stays inside the user's tap, including on iOS.
  const resumed=this.context.resume();
  if(!this.node){
   if(!this.context.audioWorklet)throw new Error('Для звука открой эту страницу в Safari или Chrome.');
   if(!this.loading)this.loading=(async()=>{
    await this.context.audioWorklet.addModule(new URL('./forest-processor.js?v=14',import.meta.url));
    this.node=new AudioWorkletNode(this.context,'forest-sound',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});
    this.node.port.onmessage=({data})=>{if(data.type==='heartbeat')this.onHeartbeat?.(data);if(data.type==='sleepDone'){this.finished=true;void this.disable(true).then(()=>this.onSleep?.());}};
    this.node.onprocessorerror=()=>{this.enabled=false;this.radioTracked=false;this.onState?.(false,'Звук остановился. Обнови страницу, чтобы включить его снова.');};
    this.node.connect(this.context.destination);
   })().catch(error=>{this.loading=null;throw error;});
   await this.loading;
  }
  await resumed;this.transition++;this.enabled=true;this.finished=false;this.setEnvironment(this.environment,true);this.node.port.postMessage({type:'transport',playing:true});this.setSleep(this.sleepMinutes);
  if(this.texture.realm===0||this.texture.realm===2)void this.loadLeafRain();
  if(this.paused)await this.context.suspend();this.report();const running=this.context.state==='running';
  if(running&&!this.radioTracked){this.radioTracked=true;recordRadioStart(this.texture.realm);}return running;
 }
 async loadLeafRain(){
  if(this.rainLoaded)return true;
  if(this.rainLoading)return this.rainLoading;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  this.rainLoading=(async()=>{
   const response=await fetch(new URL('./assets/forest-rain-v13.mp3',import.meta.url),{signal:controller.signal});
   if(!response.ok)throw new Error('Rain sample unavailable');
   const buffer=await this.context.decodeAudioData(await response.arrayBuffer());
   // decodeAudioData resamples to the AudioContext rate before worklet transfer.
   if(buffer.duration<10||buffer.duration>30)throw new Error('Invalid rain sample');
   const channels=[new Float32Array(buffer.getChannelData(0)),new Float32Array(buffer.getChannelData(Math.min(1,buffer.numberOfChannels-1)))];
   if(channels.some(c=>c.some(x=>!Number.isFinite(x)||Math.abs(x)>1)))throw new Error('Invalid rain data');
   this.node.port.postMessage({type:'leafRainLoop',channels},channels.map(c=>c.buffer));
   this.rainLoaded=true;return true;
  })().catch(()=>{if(this.enabled)this.onState?.(this.context?.state==='running','Не удалось загрузить дождь. Выключи и снова включи радио, чтобы повторить загрузку.');return false;}).finally(()=>{clearTimeout(timeout);this.rainLoading=null;});
  return this.rainLoading;
 }
 report(){const running=this.context?.state==='running'&&this.enabled;try{if(navigator.mediaSession)navigator.mediaSession.playbackState=running?'playing':'paused';}catch{}this.onState?.(!!running);}
 async disable(finished=false){const token=++this.transition;this.enabled=false;this.radioTracked=false;this.finished=finished;this.node?.port.postMessage({type:'transport',playing:false});this.report();await new Promise(resolve=>setTimeout(resolve,260));if(token!==this.transition)return;this.node?.port.postMessage({type:'silence'});if(this.context?.state==='running')await this.context.suspend();this.report();}
 async setHidden(hidden){this.hidden=hidden;if(!hidden&&this.enabled&&!this.paused&&this.context?.state!=='running'){try{await this.context.resume();}catch{}this.report();}}
 async setPaused(paused){this.paused=paused;if(paused){this.node?.port.postMessage({type:'transport',playing:false});await new Promise(resolve=>setTimeout(resolve,260));if(this.paused&&this.context?.state==='running')await this.context.suspend();}else if(this.enabled){try{await this.context.resume();this.node?.port.postMessage({type:'transport',playing:true});}catch{}}this.report();}
 setVolume(v){this.volume=Math.min(1,Math.max(0,v));this.sync();}
 setMix(music,world){this.music=Math.max(0,Math.min(1,music));this.world=Math.max(0,Math.min(1,world));this.sync();}
 setTexture(values){for(const k of Object.keys(this.texture))if(Number.isFinite(values[k]))this.texture[k]=['realm','waterMode'].includes(k)?Math.round(Math.max(0,Math.min(k==='realm'?2:4,values[k]))):Math.max(0,Math.min(1,values[k]));this.sync();}
 setEnvironment(env,normalized=false){this.environment={night:env.night||0,rain:env.rain||0,wind:env.wind||0,temperature:normalized?env.temperature:Math.max(0,Math.min(1,((env.temperature??21)+5)/40)),activity:env.activity||0,tension:env.tension||0,bees:env.bees||0};this.sync();}
 sync(){this.node?.port.postMessage({type:'params',...this.environment,...this.texture,music:this.music,world:this.world,volume:this.volume});}
 setSleep(minutes){this.sleepMinutes=Number.isFinite(minutes)?Math.max(0,minutes):0;this.node?.port.postMessage({type:'sleep',seconds:this.sleepMinutes*60});}
 song(event){if(this.enabled&&!this.paused&&this.context?.state==='running')this.node?.port.postMessage(event);}
 clear(){/* Climate changes crossfade naturally; preserve reverb and playing notes. */}
}
