export const ROOMS=[
 {id:'bedroom',name:'Покои',x:.27,y:.245,indoor:true,icon:'☾'},
 {id:'quarters',name:'Комнаты слуг',x:.49,y:.19,indoor:true,icon:'⌂'},
 {id:'library',name:'Библиотека',x:.72,y:.255,indoor:true,icon:'▤'},
 {id:'hall',name:'Большой зал',x:.46,y:.43,indoor:true,icon:'♔'},
 {id:'kitchen',name:'Кухня',x:.225,y:.485,indoor:true,icon:'◌'},
 {id:'stables',name:'Конюшня',x:.76,y:.49,indoor:true,icon:'♞'},
 {id:'courtyard',name:'Двор',x:.50,y:.76,indoor:false,icon:'◇'},
 {id:'garden',name:'Сад',x:.22,y:.70,indoor:false,icon:'❋'}
];
export const ROLES=[
 {id:'king',name:'Король',group:'Королевская семья',glyph:'♔',color:'#edcc87',names:['Король Эдмунд'],home:'bedroom'},
 {id:'queen',name:'Королева',group:'Королевская семья',glyph:'♕',color:'#efb1b5',names:['Королева Элеонора'],home:'bedroom'},
 {id:'prince',name:'Принц',group:'Королевская семья',glyph:'♔',color:'#b2cbe0',names:['Принц Леон'],home:'bedroom'},
 {id:'princess',name:'Принцесса',group:'Королевская семья',glyph:'♕',color:'#d2b3de',names:['Принцесса Алиса'],home:'bedroom'},
 {id:'butler',name:'Дворецкий',group:'Слуги',glyph:'◇',color:'#c0cecc',names:['Дворецкий Оливер'],home:'quarters'},
 {id:'maid',name:'Горничная',group:'Слуги',glyph:'✧',color:'#dbbbab',names:['Горничная Мари','Горничная Роза'],home:'quarters'},
 {id:'cook',name:'Повар',group:'Слуги',glyph:'◌',color:'#dfcda1',names:['Повар Тео','Пекарь Агата'],home:'quarters'},
 {id:'gardener',name:'Садовник',group:'Слуги',glyph:'❋',color:'#b1c88b',names:['Садовник Финн','Садовница Ива'],home:'quarters'},
 {id:'librarian',name:'Библиотекарь',group:'Слуги',glyph:'▤',color:'#b9bdd5',names:['Библиотекарь Софи'],home:'quarters'},
 {id:'groom',name:'Конюх',group:'Слуги',glyph:'◇',color:'#cdb098',names:['Конюх Артур','Конюх Нора'],home:'quarters'},
 {id:'cat',name:'Кот',group:'Звери',glyph:'●',color:'#e8ba85',names:['Кот Бархат','Кошка Луна','Кот Персик'],home:'hall',animal:true},
 {id:'dog',name:'Собака',group:'Звери',glyph:'◆',color:'#d3be9a',names:['Пёс Бруно','Собака Бэлла'],home:'hall',animal:true},
 {id:'horse',name:'Лошадь',group:'Звери',glyph:'♞',color:'#c8ad94',names:['Конь Каштан','Лошадь Искорка','Пони Облачко'],home:'stables',animal:true}
];
export const TASKS={walk:'идёт по замку',sleep:'спит',rest:'отдыхает',read:'листает книгу',write:'пишет пером',tea:'пьёт чай',eat:'ест',prepare:'готовит чай',serve:'накрывает на стол',cook:'готовит на кухне',clean:'протирает дерево и ткань',garden:'ухаживает за садом',brush:'расчёсывает лошадь',feed:'кормит животных',pet:'гладит кота',purr:'мурлычет',groom:'вылизывает шёрстку',sniff:'исследует запахи',graze:'жуёт сено',warm:'греется у камина',meet:'проводит время с соседом',walkGarden:'гуляет в саду'};
const SOUND={read:'page',write:'quill',tea:'ceramic',eat:'cloth',prepare:'pour',serve:'ceramic',cook:'knead',clean:'brush',garden:'leaf',brush:'brush',feed:'hay',pet:'purr',purr:'purr',groom:'cloth',sniff:'paw',graze:'hay',warm:'fire',meet:'cloth',walkGarden:'leaf'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const nodes={...Object.fromEntries(ROOMS.map(r=>[r.id,r])),north:{id:'north',x:.60,y:.265},west:{id:'west',x:.34,y:.43},east:{id:'east',x:.675,y:.62},gate:{id:'gate',x:.50,y:.585},fountainSide:{id:'fountainSide',x:.405,y:.665}};
const graph={bedroom:['north'],quarters:['north'],library:['north'],north:['bedroom','quarters','library','hall'],hall:['north','west','gate'],west:['hall','kitchen'],kitchen:['west','garden'],stables:['east'],east:['stables','courtyard'],gate:['hall','fountainSide'],fountainSide:['gate','courtyard','east','garden'],courtyard:['fountainSide','east','garden'],garden:['courtyard','kitchen']};
export function route(from,to){const queue=[[from]],seen=new Set([from]);while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===to)return path;for(const n of graph[last]||[])if(!seen.has(n)){seen.add(n);queue.push([...path,n]);}}return[to];}
export class CastleWorld{
 constructor(saved){
  this.seed=(saved?.seed>>>0)||0x79a463de;this.elapsed=0;this.time=Number.isFinite(saved?.time)?clamp(saved.time,0,1439):19*60;this.speed=[.5,1,2,4].includes(saved?.speed)?saved.speed:1;this.holdTime=saved?.holdTime??true;this.paused=false;
  this.weatherMode=['auto','clear','rain','fog','custom'].includes(saved?.weatherMode)?saved.weatherMode:'clear';this.weather=['clear','rain','fog'].includes(saved?.weather)?saved.weather:'clear';this.weatherAge=0;this.rain=0;this.fog=0;this.wind=.12;
  this.climate={temperature:Number.isFinite(saved?.climate?.temperature)?clamp(saved.climate.temperature,-5,35):saved?.climate?.temperature===null?null:18,wind:Number.isFinite(saved?.climate?.wind)?clamp(saved.climate.wind):saved?.climate?.wind===null?null:.12,rain:Number.isFinite(saved?.climate?.rain)?clamp(saved.climate.rain):null};
  this.fireplace=Number.isFinite(saved?.fireplace)?clamp(saved.fireplace):.65;this.candles=Number.isFinite(saved?.candles)?clamp(saved.candles):.72;this.focus=ROOMS.some(r=>r.id===saved?.focus)?saved.focus:'all';this.selectedId=Number.isInteger(saved?.selectedId)?saved.selectedId:0;
  this.events=[];this.eventId=0;this.outbox=[];this.connections=[];this.lastLog=-10;this.teaRequest=0;this.teaPending=false;this.teaPrepared=false;this.teaStock=0;this.inviteUntil=0;this.lastInvite=-100;this.petFood=.8;this.meals=.8;this.cleanliness=Object.fromEntries(ROOMS.map(r=>[r.id,.85]));this.agents=[];
  for(let role=0;role<ROLES.length;role++)for(const name of ROLES[role].names){const r=ROLES[role],room=r.animal?r.home:['king','librarian'].includes(r.id)?'library':r.id==='cook'?'kitchen':r.id==='gardener'?'garden':r.id==='groom'?'stables':'hall',point=nodes[room];const a={id:this.agents.length,role,name,room,x:point.x+(this.random()-.5)*.055,y:point.y+(this.random()-.5)*.045,energy:.65+this.random()*.3,hunger:.2+this.random()*.3,comfort:.8,social:.2+this.random()*.3,action:'rest',reason:'прислушивается к замку',until:this.random()*5,voiceAt:0,signal:0,path:[],plan:null,friends:{},memory:[],lastTea:0,phase:this.random()*6.28,steps:0};this.agents.push(a);}
  if(Array.isArray(saved?.agents))for(const a of this.agents){const p=saved.agents.find(v=>v.id===a.id);if(!p)continue;for(const k of ['energy','hunger','comfort','social'])if(Number.isFinite(p[k]))a[k]=clamp(p[k]);if(ROOMS.some(r=>r.id===p.room)){a.room=p.room;a.x=nodes[p.room].x+(this.random()-.5)*.04;a.y=nodes[p.room].y+(this.random()-.5)*.04;}a.memory=Array.isArray(p.memory)?p.memory.filter(v=>typeof v==='string').slice(0,3):[];a.friends=p.friends&&typeof p.friends==='object'?p.friends:{};}
  this.updateLight();this.log('В замке продолжаются маленькие дела.');
 }
 random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 updateLight(){const h=this.time/60;this.daylight=clamp((Math.sin((h-6)*Math.PI/12)+.28)*1.22);this.night=1-this.daylight;this.period=h<6||h>=22?'Ночь':h<10?'Утро':h<17?'День':'Вечер';this.temperature=this.climate.temperature??(12+this.daylight*10-this.rain*3);}
 setTime(hour){if(!Number.isFinite(hour))return;this.time=clamp(hour,0,23.99)*60;this.updateLight();for(const a of this.agents){a.until=0;this.decide(a);}this.log('В замке '+this.period.toLowerCase()+'.');}
 setWeather(mode){if(!['auto','clear','rain','fog'].includes(mode))return;this.weatherMode=mode;this.climate.rain=null;this.weatherAge=0;if(mode!=='auto')this.weather=mode;}
 setClimate(key,value){if(!['temperature','wind','rain'].includes(key)||!Number.isFinite(value))return;this.climate[key]=clamp(value,key==='temperature'?-5:0,key==='temperature'?35:1);if(key==='rain'){this.weatherMode='custom';this.weather=value>.03?'rain':'clear';}this.updateLight();}
 autoClimate(){this.climate={temperature:null,wind:null,rain:null};this.setWeather('auto');this.updateLight();}
 log(text,a=null){if(a){a.memory.unshift(text);a.memory.length=Math.min(3,a.memory.length);}if(this.elapsed-this.lastLog<1&&a)return;this.lastLog=this.elapsed;this.events.unshift({id:++this.eventId,time:this.time,text,agentId:a?.id??null});this.events.length=Math.min(8,this.events.length);}
 sound(a,kind=SOUND[a.action]){if(!kind)return;a.signal=1;this.outbox.push({type:'event',kind,pan:clamp((a.x-.5)*1.5,-.7,.7),room:a.room,id:a.id,note:a.id%5,variation:this.random(),gain:this.focus==='all'||this.focus===a.room?1:.16});}
 begin(a,kind,reason,duration=12){a.action=kind;a.reason=reason;a.until=this.elapsed+duration;a.path=[];a.plan=null;a.voiceAt=this.elapsed+3+this.random()*5;this.sound(a);if(!['sleep','rest'].includes(kind))this.log(a.name+': '+TASKS[kind]+'.',a);}
 go(a,room,kind,reason,duration=12){if(!nodes[room])return;if(a.room===room&&!a.path.length){this.begin(a,kind,reason,duration);return;}const nearest=Object.values(nodes).reduce((best,n)=>Math.hypot(a.x-n.x,a.y-n.y)<Math.hypot(a.x-best.x,a.y-best.y)?n:best,nodes[a.room]);a.path=route(nearest.id,room).map(id=>({x:nodes[id].x,y:nodes[id].y,node:id}));a.path.push({x:nodes[room].x+(this.random()-.5)*.055,y:nodes[room].y+(this.random()-.5)*.04,node:room});a.plan={room,kind,reason,duration};a.action='walk';a.reason=reason;a.until=Infinity;}
 royal(a){return a.role<4;}
 shouldSleep(a){const r=ROLES[a.role];if(r.id==='cat')return false;if((this.teaPending&&['cook','butler'].includes(r.id))||(this.royal(a)&&(this.teaPending||(this.teaStock>.01&&this.elapsed<this.inviteUntil&&a.lastTea!==this.teaRequest))))return false;return this.time/60>=23||this.time/60<6;}
 badWeather(){return this.rain>.35||this.wind>.7||this.temperature<6||this.temperature>31;}
 decide(a){
  const r=ROLES[a.role],h=this.time/60;
  if(this.shouldSleep(a)){this.go(a,r.home,'sleep','восстанавливает силы в своём уголке',20);return;}
  if(!nodes[a.room].indoor&&this.badWeather()){this.go(a,r.animal?r.home:'hall',this.fireplace>.2?'warm':'rest','прячется от непогоды в тёплом помещении',16);return;}
  if(a.energy<.24){this.go(a,r.home,'rest','устал и хочет немного отдохнуть',18);return;}
  if(a.hunger>.65){this.go(a,r.animal?(r.id==='cat'?'kitchen':'stables'):'hall',r.id==='horse'?'graze':'eat','проголодался и идёт к угощению',12);return;}
  if(this.royal(a)&&this.teaStock>.05&&a.lastTea!==this.teaRequest&&this.elapsed<this.inviteUntil){this.go(a,'hall','tea','получил приглашение к чаю',18);return;}
  if(!r.animal&&this.temperature<10&&a.comfort<.55){this.go(a,this.fireplace>.2?'hall':'bedroom',this.fireplace>.2?'warm':'rest','ищет тепло и уют',18);return;}
  if(r.id==='cook'){this.go(a,'kitchen',this.teaPending&&!this.teaPrepared?'prepare':'cook',this.teaPending&&!this.teaPrepared?'заваривает чай для общей встречи':'готовит свежую еду для замка',14+this.random()*8);return;}
  if(r.id==='butler'){if(this.teaPending&&this.teaPrepared){this.go(a,'hall','serve','несёт чай и расставляет чашки',9);return;}this.go(a,'hall',this.cleanliness.hall<.7?'clean':'write','проверяет порядок и записывает дела',14);return;}
  if(r.id==='maid'){const room=['bedroom','hall','library','quarters'].sort((x,y)=>this.cleanliness[x]-this.cleanliness[y])[0];this.go(a,room,'clean','заметила пыль и расправляет ткани',14+this.random()*8);return;}
  if(r.id==='gardener'){this.go(a,this.badWeather()?'kitchen':'garden',this.badWeather()?'prepare':'garden',this.badWeather()?'пережидает непогоду и готовит травяной чай':'поливает растения и перебирает листья',16);return;}
  if(r.id==='librarian'){this.go(a,'library',this.random()<.7?'read':'write','разбирает книги и делает заметки',18);return;}
  if(r.id==='groom'){const hungry=this.agents.some(b=>ROLES[b.role].animal&&b.hunger>.4);this.go(a,'stables',hungry?'feed':'brush',hungry?'готовит сено и угощение зверям':'спокойно расчёсывает лошадей',16);return;}
  if(r.id==='horse'){this.go(a,'stables',a.hunger>.3?'graze':'rest','отдыхает в сухой конюшне',18);return;}
  if(r.id==='cat'){const room=this.random()<.55?'hall':'library';this.go(a,room,this.random()<.7?'purr':'groom','выбрал мягкое место рядом с людьми',18);return;}
  if(r.id==='dog'){this.go(a,this.badWeather()?'hall':this.random()<.5?'garden':'courtyard','sniff','проверяет знакомые дорожки и запахи',12);return;}
  if(this.random()<.3&&this.agents.some(b=>ROLES[b.role].id==='cat'&&b.room==='hall')){this.go(a,'hall','pet','хочет посидеть рядом с котом',18);return;}
  if(h<10){this.go(a,'hall','tea','начинает утро с тёплого напитка',15);return;}
  if(h>20.5){this.go(a,this.random()<.5?'hall':'bedroom',this.fireplace>.2?'warm':'read','завершает день в тишине',18);return;}
  if(this.random()<.3&&!this.badWeather()){this.go(a,'garden','walkGarden','хочет подышать воздухом и посмотреть на сад',12);return;}
  this.go(a,'library',r.id==='king'&&this.random()<.5?'write':'read','выбрал книгу и тихий уголок',18+this.random()*10);
 }
 finish(a){
  const kind=a.action;
  if(kind==='prepare'&&this.teaPending){this.teaPrepared=true;this.log('Чай готов. Дворецкий несёт его в большой зал.',a);const b=this.agents.find(v=>ROLES[v.role].id==='butler');if(b)this.decide(b);}
  if(kind==='serve'&&this.teaPending&&this.teaPrepared){this.teaStock=1;this.teaPending=false;this.inviteUntil=this.elapsed+120;this.log('Стол накрыт. Семья собирается за чаем.',a);for(const b of this.agents.filter(v=>this.royal(v)))this.go(b,'hall','tea','дворецкий пригласил к свежему чаю',20);}
  if(kind==='cook')this.meals=clamp(this.meals+.3);
  if(kind==='feed'){this.petFood=1;for(const b of this.agents.filter(v=>ROLES[v.role].animal&&v.room==='stables')){b.hunger=Math.max(0,b.hunger-.25);b.comfort=clamp(b.comfort+.1);}}
  if(kind==='brush')for(const b of this.agents.filter(v=>ROLES[v.role].id==='horse')){b.comfort=clamp(b.comfort+.15);this.bond(a,b);}
  if(kind==='tea'){a.lastTea=this.teaRequest;this.teaStock=Math.max(0,this.teaStock-.08);}
  const peer=this.agents.find(b=>b.id!==a.id&&b.room===a.room&&b.action!=='sleep');if(peer)this.bond(a,peer);
 }
 bond(a,b){a.friends[b.id]=Math.min(30,(a.friends[b.id]||0)+1);b.friends[a.id]=Math.min(30,(b.friends[a.id]||0)+1);a.social=Math.max(0,a.social-.25);a.comfort=clamp(a.comfort+.05);this.connections.push({a:a.id,b:b.id,born:this.elapsed});}
 requestTea(){if(this.paused||this.teaPending||this.elapsed-this.lastInvite<20)return false;this.lastInvite=this.elapsed;this.teaRequest++;this.teaPending=true;this.teaPrepared=false;this.teaStock=0;this.inviteUntil=this.elapsed+160;for(const a of this.agents)if(['cook','butler'].includes(ROLES[a.role].id))this.decide(a);this.log('Семья приглашена к чаю. На кухне ставят чайник.');return true;}
 feedPets(){if(this.paused)return false;this.petFood=1;for(const a of this.agents.filter(v=>ROLES[v.role].animal)){this.go(a,'stables',ROLES[a.role].id==='horse'?'graze':'eat','заметил свежее угощение',14);}for(const a of this.agents.filter(v=>ROLES[v.role].id==='groom'))this.go(a,'stables','feed','помогает накормить зверей',12);this.log('В конюшне появилось угощение. Звери идут к нему.');return true;}
 tick(dt){
  if(this.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.25);this.elapsed+=dt;if(!this.holdTime)this.time=(this.time+dt*2*this.speed)%1440;this.updateLight();this.weatherAge+=dt;
  if(this.weatherMode==='auto'&&this.weatherAge>90){this.weather=['clear','rain','fog'][Math.floor(this.random()*3)];this.weatherAge=0;}
  const ease=1-Math.exp(-dt*.4);this.rain+=((this.climate.rain??(this.weather==='rain'?.7:0))-this.rain)*ease;this.wind+=((this.climate.wind??(.12+this.rain*.4+Math.sin(this.elapsed*.03)*.08))-this.wind)*ease;this.fog+=((this.weather==='fog'?.65:0)-this.fog)*ease;
  for(const a of this.agents){
   const r=ROLES[a.role],rest=['sleep','rest','warm'].includes(a.action);a.signal=Math.max(0,a.signal-dt*.8);a.energy=clamp(a.energy+dt*(rest?.02:a.action==='walk'?-.0035:-.001));a.hunger=clamp(a.hunger+dt*.0018);a.social=clamp(a.social+dt*.001);a.comfort=clamp(a.comfort+dt*(nodes[a.room].indoor?.001:-.002*Math.max(0,10-this.temperature)));this.cleanliness[a.room]=Math.max(0,this.cleanliness[a.room]-dt*.0005);
   const toRoom=a.plan?.room??a.room;const sleep=this.shouldSleep(a),interrupted=(sleep&&a.action!=='sleep'&&a.plan?.kind!=='sleep')||(!sleep&&a.action==='sleep')||(!sleep&&this.badWeather()&&!nodes[toRoom].indoor);
   if(interrupted)this.decide(a);
   if(a.path.length){const p=a.path[0],dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy),step=dt*(r.animal?.028:.026);if(d<step+.002){a.x=p.x;a.y=p.y;a.path.shift();if(ROOMS.some(room=>room.id===p.node))a.room=p.node;if(!a.path.length&&a.plan){const plan=a.plan;a.room=plan.room;this.begin(a,plan.kind,plan.reason,plan.duration);}}else{a.x+=dx/d*step;a.y+=dy/d*step;a.steps+=step;if(a.steps>.07){a.steps=0;this.sound(a,r.id==='horse'?'hoof':r.animal?'paw':'step');}}}
   else{
    if(['eat','graze','tea'].includes(a.action)){const available=r.animal?this.petFood:this.meals;if(available>.01){a.hunger=Math.max(0,a.hunger-dt*.05);if(r.animal)this.petFood=Math.max(0,this.petFood-dt*.002);else this.meals=Math.max(0,this.meals-dt*.002);}}
    if(a.action==='clean')this.cleanliness[a.room]=clamp(this.cleanliness[a.room]+dt*.025);
    if(['warm','purr','pet','brush'].includes(a.action))a.comfort=clamp(a.comfort+dt*.015);
    if(SOUND[a.action]&&this.elapsed>a.voiceAt){this.sound(a);a.voiceAt=this.elapsed+4+this.random()*7;}
    if(this.elapsed>=a.until){this.finish(a);this.decide(a);}
   }
  }
  this.connections=this.connections.filter(e=>this.elapsed-e.born<4);this.activity=this.agents.filter(a=>!['sleep','rest','warm'].includes(a.action)).length/this.agents.length;
 }
 drain(){return this.outbox.splice(0);}
 get selected(){return this.agents[this.selectedId]||this.agents[0];}
 get awake(){return this.agents.filter(a=>a.action!=='sleep').length;}
 snapshot(){return{version:1,seed:this.seed,time:this.time,speed:this.speed,holdTime:this.holdTime,climate:{...this.climate},weather:this.weather,weatherMode:this.weatherMode,fireplace:this.fireplace,candles:this.candles,focus:this.focus,selectedId:this.selectedId,agents:this.agents.map(a=>({id:a.id,room:a.room,energy:a.energy,hunger:a.hunger,comfort:a.comfort,social:a.social,memory:a.memory,friends:a.friends}))};}
}
