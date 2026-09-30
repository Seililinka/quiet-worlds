export const SPECIES = [
  {name:'Зяблик',color:'#cc854b',frequency:2500,notes:4,sociability:.72},
  {name:'Синица',color:'#e9c95f',frequency:3400,notes:3,sociability:.8},
  {name:'Малиновка',color:'#e78063',frequency:2850,notes:5,sociability:.6},
  {name:'Дрозд',color:'#918478',frequency:1950,notes:3,sociability:.5},
  {name:'Сова',color:'#d4c5a4',frequency:430,notes:2,sociability:0}
];
export const formatClock=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(Math.floor(m)%60).padStart(2,'0')}`;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export class Forest {
  constructor(saved=null){
    this.seed=(saved?.seed>>>0)||((Date.now()^0x32ab78)>>>0);this.elapsed=0;this.time=Number.isFinite(saved?.time)?saved.time%1440:380;
    this.speed=[.5,1,2,4].includes(saved?.speed)?saved.speed:1;this.weatherMode=['auto','clear','rain','fog'].includes(saved?.weatherMode)?saved.weatherMode:'auto';
    this.weather=['clear','rain','fog'].includes(saved?.weather)?saved.weather:'clear';this.nextWeather=55+this.random()*45;this.weatherAge=0;this.rain=0;this.fog=0;this.wind=.2;this.events=[];this.eventId=0;this.outbox=[];this.pending=[];this.paused=false;this.lastCall=-100;this.ripples=[];
    this.birds=Array.from({length:13},(_,i)=>{const owl=i===12;const p=this.point();return{id:i,species:owl?4:i%4,x:p.x,y:p.y,home:p,target:p,state:'perched',energy:.5+this.random()*.5,hunger:this.random()*.5,callAt:2+i*1.3+this.random()*8,flyAt:5+this.random()*25,flightT:0,singing:0,phase:this.random()*6.28,reply:false}});
    this.fireflies=Array.from({length:24},(_,i)=>({id:i,x:.17+this.random()*.65,y:.42+this.random()*.32,phase:this.random()*6.28,speed:.2+this.random()*.4}));
    if(Array.isArray(saved?.birds))for(const b of this.birds){const prior=saved.birds.find(p=>p?.id===b.id);if(prior&&Number.isFinite(prior.x)&&Number.isFinite(prior.y)){b.x=clamp(prior.x,.15,.88);b.y=clamp(prior.y,.23,.7);b.home={x:b.x,y:b.y};if(Number.isFinite(prior.energy))b.energy=clamp(prior.energy);if(Number.isFinite(prior.hunger))b.hunger=clamp(prior.hunger);}}
    this.updateLight();this.updateStates();this.emit(saved?'Лес снова рядом. Обитатели продолжают свой день.':'У леса начинается новый день.','world');
  }
  random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
  point(){const anchors=[[.19,.38],[.31,.33],[.43,.24],[.63,.30],[.78,.37],[.85,.48],[.25,.53],[.39,.43],[.58,.49],[.67,.58]];const a=anchors[Math.floor(this.random()*anchors.length)];return{x:a[0]+(this.random()-.5)*.035,y:a[1]+(this.random()-.5)*.025};}
  emit(text,type='bird'){const e={id:++this.eventId,text,type,time:this.time};this.events.unshift(e);this.events.length=Math.min(5,this.events.length);return e;}
  updateLight(){const h=this.time/60;this.daylight=clamp((Math.sin((h-6)*Math.PI/12)+.18)*1.3);this.night=1-this.daylight;this.dawn=clamp(1-Math.abs(h-6.5)/2.2);this.dusk=clamp(1-Math.abs(h-18.4)/1.8);this.period=h<5||h>=21?'Ночь':h<9?'Рассвет':h<17?'День':'Закат';}
  updateStates(){for(const b of this.birds){const nocturnal=b.species===4;const sleeping=nocturnal?this.night<.65:this.night>.72;
    if(sleeping){b.state='sleeping';b.singing=0;}
    else if(this.rain>.42&&!nocturnal){if(b.state!=='shelter')b.callAt=this.elapsed+6+this.random()*20;b.state='shelter';b.singing=0;}
    else if(b.state==='sleeping'||b.state==='shelter'){b.state='perched';b.callAt=this.elapsed+1+this.random()*9;b.flyAt=this.elapsed+4+this.random()*15;}
  }}
  setTime(hours){if(!Number.isFinite(hours))return;this.time=((hours%24)+24)%24*60;this.updateLight();this.pending=[];this.updateStates();this.emit(({Рассвет:'Рассвет. Птицы просыпаются.',День:'Солнце поднимается над поляной.',Закат:'Лес встречает вечер.',Ночь:'Ночь. Просыпаются сова и светлячки.'})[this.period],'world');}
  setWeather(mode){if(!['auto','clear','rain','fog'].includes(mode))return;this.weatherMode=mode;if(mode!=='auto')this.changeWeather(mode);else{this.nextWeather=35+this.random()*35;this.weatherAge=0;this.emit('Погода снова меняется сама.','weather');}}
  changeWeather(w){if(this.weather===w)return;this.weather=w;this.weatherAge=0;this.nextWeather=65+this.random()*65;this.emit({clear:'Облака расходятся. Лес становится светлее.',rain:'Начинается дождь. Птицы ищут укрытие.',fog:'Над ручьём поднимается туман.'}[w],'weather');}
  song(b,reply=false){if(['sleeping','shelter','flying'].includes(b.state))return;const s=SPECIES[b.species];b.singing=s.notes*.17+.32;b.state='singing';b.callAt=this.elapsed+(b.species===4?17:10)+this.random()*18;
    this.outbox.push({type:'song',id:b.id,species:b.species,frequency:s.frequency,notes:s.notes,pan:(b.x-.5)*1.7,variation:this.random(),reply});
    this.emit(reply?`${s.name} отвечает соседу.`:b.species===4?'Сова негромко зовёт из чащи.':`${s.name} поёт на ветке.`);
    if(!reply&&b.species!==4){const near=this.birds.filter(n=>n.id!==b.id&&n.species!==4&&n.state==='perched'&&Math.hypot(n.x-b.x,n.y-b.y)<.45);if(near.length&&this.random()<.8){const other=near[Math.floor(this.random()*near.length)];if(!this.pending.some(p=>p.id===other.id))this.pending.push({id:other.id,at:this.elapsed+1.15+this.random()*1.3});}}
  }
  call(x=.5,y=.58){if(this.paused||this.elapsed-this.lastCall<3)return false;this.lastCall=this.elapsed;this.ripples.push({x,y,born:this.elapsed});if(this.night>.72){const owl=this.birds[12];owl.callAt=this.elapsed+.6;this.emit('Шорох на поляне. Сова прислушивается.','world');return true;}
    const awake=this.birds.filter(b=>b.species!==4&&!['sleeping','shelter'].includes(b.state)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
    if(!awake.length){this.emit('Птицы пережидают дождь под ветками.','world');return true;}awake.slice(0,3).forEach((b,i)=>{b.callAt=this.elapsed+.8+i*1.7;});this.emit('Птицы услышали тебя и прислушались.','world');return true;
  }
  tick(dt){if(this.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.25);this.elapsed+=dt;this.time=(this.time+dt*2*this.speed)%1440;const prevNight=this.night;this.updateLight();this.weatherAge+=dt;
    if(this.weatherMode==='auto'&&this.weatherAge>this.nextWeather){const opts=this.weather==='clear'?['rain','fog']:['clear','clear',this.weather==='rain'?'fog':'rain'];this.changeWeather(opts[Math.floor(this.random()*opts.length)]);}
    const ease=1-Math.exp(-dt*.55);this.rain+=((this.weather==='rain'?.78:0)-this.rain)*ease;this.fog+=((this.weather==='fog'?.72:.08)-this.fog)*ease;this.wind+=((.16+this.rain*.42+Math.sin(this.elapsed*.039)*.1)-this.wind)*ease;
    if(prevNight<=.72&&this.night>.72)this.emit('Светлячки загораются. Дневные птицы засыпают.','world');else if(prevNight>=.72&&this.night<.72)this.emit('Первые птицы просыпаются и расправляют крылья.','world');
    this.updateStates();
    for(let i=this.pending.length-1;i>=0;i--)if(this.pending[i].at<=this.elapsed){const p=this.pending.splice(i,1)[0];this.song(this.birds[p.id],true);}
    for(const b of this.birds){b.hunger=clamp(b.hunger+dt*.0009);b.energy=clamp(b.energy+(b.state==='sleeping'?dt*.006:dt*.0005));
      if(b.singing>0){b.singing-=dt;if(b.singing<=0&&b.state==='singing')b.state='perched';}
      if(b.state==='flying'){b.flightT=Math.min(1,b.flightT+dt*.42);const t=b.flightT;const smooth=t*t*(3-2*t);b.x=b.start.x+(b.target.x-b.start.x)*smooth;b.y=b.start.y+(b.target.y-b.start.y)*smooth-Math.sin(t*Math.PI)*.08;if(t===1){b.state=b.hunger>.65?'foraging':'perched';b.energy-=.08;b.flyAt=this.elapsed+12+this.random()*23;}}
      if(b.state==='foraging'){b.hunger=clamp(b.hunger-dt*.06);if(b.hunger<.15)b.state='perched';}
      if(b.state==='perched'&&this.elapsed>=b.flyAt&&b.species!==4){b.state='flying';b.start={x:b.x,y:b.y};b.target=this.point();b.flightT=0;}
      if(['perched','foraging'].includes(b.state)&&this.elapsed>=b.callAt){if(b.energy>.2&&this.random()<(b.species===4?.8:clamp(.22+this.daylight*.23+this.dawn*.5-this.rain*.7-this.fog*.12))){this.song(b);b.energy-=.035;}else b.callAt=this.elapsed+2+this.random()*6;}
    }
    this.ripples=this.ripples.filter(r=>this.elapsed-r.born<2.5);
  }
  drain(){return this.outbox.splice(0);}
  snapshot(){return{seed:this.seed,time:this.time,speed:this.speed,weatherMode:this.weatherMode,weather:this.weather,birds:this.birds.map(b=>({id:b.id,x:b.x,y:b.y,energy:b.energy,hunger:b.hunger}))};}
  get awake(){return this.birds.filter(b=>b.state!=='sleeping').length;}
}
