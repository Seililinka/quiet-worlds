export const ACTIVITIES = [
 {id:'beach',name:'Тёплый пляж',icon:'☀',x:.47,y:.66,hour:14,action:'греется на песке',sound:'sand',music:.34,ocean:.65,description:'Тёплый песок, медленные волны и свободный день. Можно никуда не спешить.'},
 {id:'dinner',name:'Ужин у океана',icon:'✧',x:.389,y:.617,hour:18.3,action:'ужинает у океана',sound:'cup',music:.40,ocean:.48,description:'Повар накрывает стол на берегу. Тихая посуда, мягкий прибой и закат над лагуной.'},
 {id:'dive',name:'Дайвинг у рифа',icon:'◉',x:.46,y:.875,hour:11,action:'плывёт над рифом',sound:'bubble',water:true,music:.23,ocean:.25,description:'Неспешное погружение: рыбки, черепахи и редкие пузырьки. Мягкая музыка оставляет место тишине.'},
 {id:'suite',name:'Подводный номер',icon:'◇',x:.866,y:.821,hour:20,action:'наблюдает за рыбами',sound:'linen',indoor:true,music:.27,ocean:.22,description:'Уютная постель под прозрачным куполом. За стеклом проплывают рыбки, внутри — чай и покой.'},
 {id:'sail',name:'Лодка на закате',icon:'△',x:.87,y:.40,hour:18,action:'отдыхает на лодке',sound:'paddle',water:true,music:.32,ocean:.55,description:'Маленький парусник качается на волнах. Вдалеке появляются дельфины, а небо медленно теплеет.'},
 {id:'kayak',name:'Каяк в лагуне',icon:'≈',x:.88,y:.52,hour:9,action:'скользит по лагуне',sound:'paddle',water:true,music:.28,ocean:.40,description:'Прозрачная вода и лёгкие касания весла. Спокойная прогулка между островом и рифом.'},
 {id:'spa',name:'Спа среди пальм',icon:'❋',x:.246,y:.268,hour:10,action:'отдыхает в спа',sound:'linen',indoor:true,music:.37,ocean:.30,description:'Открытый павильон, свежий чай и мягкие ткани. Пальмы едва покачиваются на ветру.'},
 {id:'hammock',name:'Гамак и книга',icon:'⌁',x:.185,y:.453,hour:16,action:'читает в гамаке',sound:'book',music:.25,ocean:.46,description:'Тень пальм и книга, которую можно отложить. Тёплый воздух, океан и тихая жизнь рядом.'}
];
const extra = [{id:'kitchen',x:.491,y:.448,indoor:true},{id:'villa',x:.706,y:.139,indoor:true},{id:'villa2',x:.834,y:.128,indoor:true},{id:'hub',x:.337,y:.475},{id:'palms',x:.366,y:.337},{id:'pier',x:.587,y:.332},{id:'jetty',x:.746,y:.262},{id:'fork',x:.808,y:.182},{id:'divehut',x:.696,y:.597},{id:'tunnel',x:.815,y:.732}];
export const PLACES=Object.fromEntries([...ACTIVITIES,...extra].map(p=>[p.id,p]));
const graph={beach:['hub','dinner','divehut'],dinner:['hub','beach'],hammock:['hub'],spa:['palms'],hub:['palms','hammock','dinner','beach','kitchen'],palms:['hub','spa','pier'],kitchen:['hub','pier','divehut'],pier:['palms','kitchen','jetty'],jetty:['pier','fork','sail','kayak'],fork:['jetty','villa','villa2'],villa:['fork'],villa2:['fork'],divehut:['beach','kitchen','dive','tunnel'],dive:['divehut'],tunnel:['divehut','suite'],suite:['tunnel'],sail:['jetty'],kayak:['jetty']};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function route(from,to){const q=[[from]],seen=new Set([from]);while(q.length){const p=q.shift(),last=p.at(-1);if(last===to)return p.slice(1);for(const n of graph[last]||[])if(!seen.has(n)){seen.add(n);q.push([...p,n]);}}return [];}
const PEOPLE=[['Лея','Гостья','#e7b397','hammock'],['Майя','Гостья','#c6bbdc','beach'],['Лев','Гость','#9ec9ca','villa'],['Мира','Гостья','#edd298','spa'],['Аня','Гостья','#deb3c4','suite'],['Саша','Гость','#a7c9ad','kayak'],['Амин','Повар','#eed5ae','kitchen'],['Нура','Хозяйка острова','#c6d4a3','villa2'],['Рай','Гид по лагуне','#a2c7dd','divehut'],['Сана','Мастер спа','#d5c5de','spa']];
export class MaldivesWorld{
 constructor(saved={}){
  this.seed=0x745231a;this.elapsed=0;this.time=Number.isFinite(saved.time)?clamp(saved.time,0,1439):14*60;this.holdTime=saved.holdTime!==false;this.paused=false;this.speed=[.5,1,2,4].includes(saved.speed)?saved.speed:1;
  this.temperature=Number.isFinite(saved.temperature)?clamp(saved.temperature,23,34):28;this.wind=Number.isFinite(saved.wind)?clamp(saved.wind):.12;this.rain=Number.isFinite(saved.rain)?clamp(saved.rain):0;this.weather=['clear','rain','cloud','auto'].includes(saved.weather)?saved.weather:'clear';this.weatherAt=90;this.candles=Number.isFinite(saved.candles)?clamp(saved.candles):.65;
  this.focus=ACTIVITIES.some(a=>a.id===saved.focus)?saved.focus:'beach';this.tour=saved.tour===true;this.nextTour=120;this.events=[];this.eventId=0;this.outbox=[];this.lastLog=-10;this.requestUntil=0;this.lastService=-20;
  this.agents=PEOPLE.map(([name,role,color,place],id)=>({id,name,role,color,kind:'human',place,x:PLACES[place].x,y:PLACES[place].y,path:[],target:place,action:'осваивается на острове',wait:3+id*2.6,energy:.72+id*.018,hunger:.1+id*.025,comfort:.8,phase:id*1.7,memory:'Впереди целый день отпуска.',signal:0,soundAt:3+id*4}));
  for(let i=0;i<8;i++)this.agents.push({id:this.agents.length,name:i<5?['Коралловая рыбка','Рыбка Солнечная','Рыбка Лазурь','Рыбка Полоска','Рыбка Жемчужинка'][i]:i===5?'Черепаха Луна':i===6?'Черепаха Коралл':'Дельфин Бриз',role:i<5?'Обитатель рифа':i<7?'Морская черепаха':'Дельфин',color:['#f4cc83','#e4a479','#aedcd7'][i%3],kind:i<5?'fish':i<7?'turtle':'dolphin',phase:i*1.4,action:i<7?'плывёт над кораллами':'гуляет в открытой лагуне',x:.8,y:.6,energy:1,hunger:0,comfort:1,memory:'Живёт в лагуне и спокойно наблюдает за гостями.',signal:0});
  this.selectedId=Number.isInteger(saved.selectedId)&&this.agents[saved.selectedId]?saved.selectedId:0;
  this.log('Остров просыпается. Сегодня можно никуда не спешить.');this.tickAnimals();
 }
 rnd(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 get selected(){return this.agents[this.selectedId];}
 get activity(){return ACTIVITIES.find(a=>a.id===this.focus);}
 get daylight(){return clamp((Math.sin((this.time/60-6)*Math.PI/12)+.08)/1.08);}
 get night(){return 1-this.daylight;}
 get period(){const h=this.time/60;return h>=6&&h<11?'Утро':h>=11&&h<17?'День':h>=17&&h<21?'Вечер':'Ночь';}
 get awake(){return this.agents.filter(a=>a.kind==='human'&&a.action!=='спит в бунгало').length;}
 get badWeather(){return this.rain>.55||this.wind>.72;}
 setTime(hour){this.time=clamp(hour,0,23.99)*60;}
 setWeather(weather){this.weather=weather;if(weather!=='auto')this.rain=weather==='rain'?.62:0;}
 log(text,agent=null){this.events.unshift({id:++this.eventId,time:this.time,text,agent});this.events.length=Math.min(6,this.events.length);}
 drain(){return this.outbox.splice(0);}
 snapshot(){return Object.fromEntries(['time','holdTime','speed','temperature','wind','rain','weather','candles','focus','tour','selectedId'].map(k=>[k,this[k]]));}
 go(a,to){if(!PLACES[to]||a.kind!=='human')return;a.target=to;a.path=route(a.place,to).map(n=>({...PLACES[n]}));a.action=a.path.length?'идёт по острову':this.actionFor(a,to);a.wait=24+this.rnd()*28;}
 actionFor(a,place){if(place==='villa'||place==='villa2')return this.night>.8?'спит в бунгало':'отдыхает в бунгало';if(place==='kitchen')return a.role==='Повар'?'готовит свежий чай':'пьёт чай';if(place==='divehut')return 'готовит маску для плавания';return PLACES[place]?.action||'смотрит на океан';}
 choose(a){
  if(this.elapsed<this.requestUntil&&a.id<6){this.go(a,this.focus);return;}
  if(this.badWeather){this.go(a,a.id===6?'kitchen':a.id===9?'spa':a.id%2?'villa':'suite');return;}
  if(a.hunger>.6){this.go(a,this.period==='Вечер'?'dinner':'kitchen');return;}
  if(a.energy<.28||this.period==='Ночь'){this.go(a,a.id%2?'villa':'villa2');return;}
  if(a.id===6){this.go(a,this.period==='Вечер'?'dinner':'kitchen');return;}
  if(a.id===7){this.go(a,['villa','kitchen','dinner'][Math.floor(this.rnd()*3)]);return;}
  if(a.id===8){this.go(a,['dive','kayak','sail','divehut'][Math.floor(this.rnd()*4)]);return;}
  if(a.id===9){this.go(a,'spa');return;}
  const spots=this.temperature>31?['spa','hammock','suite','dive']:this.period==='Вечер'?['dinner','sail','beach','hammock']:ACTIVITIES.map(x=>x.id);
  this.go(a,spots[Math.floor(this.rnd()*spots.length)]);
 }
 chooseActivity(id){if(!ACTIVITIES.some(a=>a.id===id))return;this.focus=id;this.requestUntil=this.elapsed+100;this.nextTour=this.elapsed+120;for(const a of this.agents.filter(a=>a.kind==='human'&&a.id<4))this.go(a,id);if(id==='dinner')this.go(this.agents[6],'dinner');if(['dive','sail','kayak'].includes(id))this.go(this.agents[8],id);this.log('Гости выбирают: '+this.activity.name.toLowerCase()+'.');}
 service(){if(this.paused||this.elapsed-this.lastService<12)return false;this.lastService=this.elapsed;const p=this.activity;for(const a of this.agents.filter(a=>a.kind==='human'&&a.id<6)){a.hunger=Math.max(0,a.hunger-.25);a.comfort=clamp(a.comfort+.15);a.memory='Нура принесла свежий чай и фрукты.';}this.outbox.push({type:'event',kind:'tea',pan:0,gain:.65});this.go(this.agents[7],p.water?'divehut':this.focus);this.log(p.water?'На берегу готовят чай и фрукты к возвращению гостей.':'Нура несёт гостям тёплый чай и свежие фрукты.',7);return true;}
 invite(){if(this.paused)return false;this.requestUntil=this.elapsed+100;for(const a of this.agents.filter(a=>a.kind==='human'&&a.id<6))this.go(a,this.focus);this.log('Друзья собираются вместе: '+this.activity.name.toLowerCase()+'.',0);return true;}
 tickAnimals(){for(const a of this.agents){const t=this.elapsed*.018+a.phase;if(a.kind==='fish'){const reef=a.id%2===0;a.x=reef?.35+.20*Math.sin(t):.86+.08*Math.sin(t*.9);a.y=reef?.88+.045*Math.cos(t*.8):.76+.16*Math.cos(t*.7);}else if(a.kind==='turtle'){a.x=.28+.16*Math.sin(t*.45);a.y=.91+.035*Math.cos(t*.55);}else if(a.kind==='dolphin'){a.x=.87+.08*Math.sin(t*.7);a.y=.37+.10*Math.cos(t*.45);}}}
 tick(dt){
  if(this.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.25)*this.speed;this.elapsed+=dt;if(!this.holdTime)this.time=(this.time+dt*1.3)%1440;
  if(this.weather==='auto'&&this.elapsed>this.weatherAt){this.rain=this.rnd()<.35?.35+this.rnd()*.3:0;this.weatherAt=this.elapsed+100+this.rnd()*140;this.log(this.rain?'Над островом проходит тёплый дождь.':'Облака расходятся, лагуна светлеет.');}
  if(this.tour&&this.elapsed>=this.nextTour){const index=ACTIVITIES.findIndex(a=>a.id===this.focus);const a=ACTIVITIES[(index+1)%ACTIVITIES.length];this.chooseActivity(a.id);this.setTime(a.hour);}
  for(const a of this.agents){a.signal=Math.max(0,a.signal-dt*.35);if(a.kind!=='human')continue;a.hunger=clamp(a.hunger+dt*.00065);a.energy=clamp(a.energy-dt*.0003);
   if(a.path.length){const next=a.path[0],dx=next.x-a.x,dy=next.y-a.y,d=Math.hypot(dx,dy),step=dt*.018;if(d<=step){a.x=next.x;a.y=next.y;a.place=next.id;a.path.shift();if(!a.path.length){a.action=this.actionFor(a,a.target);a.memory='Выбрал '+(PLACES[a.target].name?.toLowerCase()||'тихий уголок')+'.';a.wait=30+this.rnd()*35;}}else{a.x+=dx/d*step;a.y+=dy/d*step;}}
   else{a.wait-=dt;if(['villa','villa2','hammock','suite','spa'].includes(a.place))a.energy=clamp(a.energy+dt*.003);if(['dinner','kitchen'].includes(a.place))a.hunger=clamp(a.hunger-dt*.012);a.comfort=clamp(a.comfort+dt*.001);if(a.wait<=0)this.choose(a);
    if(this.elapsed>a.soundAt){a.soundAt=this.elapsed+16+this.rnd()*27;a.signal=1;const kind=PLACES[a.place]?.sound||(a.place==='kitchen'?'tea':null);if(kind)this.outbox.push({type:'event',kind,pan:(a.x-.5)*1.1,gain:a.place===this.focus?.7:.15});if(this.elapsed-this.lastLog>14&&this.rnd()<.4){this.lastLog=this.elapsed;this.log(a.name+' '+a.action+'.',a.id);}}
   }
  }
  this.tickAnimals();
 }
}
