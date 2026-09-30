export const PLACES=[
 {id:'home',name:'Тёплые окна',x:.389,y:.355,indoor:true,icon:'⌂'},
 {id:'bakery',name:'Пекарня',x:.149,y:.533,indoor:true,icon:'◒'},
 {id:'cafe',name:'Кафе',x:.295,y:.610,indoor:true,icon:'◡'},
 {id:'bookshop',name:'Книжная лавка',x:.747,y:.397,indoor:true,icon:'▤'},
 {id:'park',name:'Тихий сад',x:.729,y:.650,indoor:false,icon:'❋'},
 {id:'square',name:'Площадь',x:.505,y:.530,indoor:false,icon:'◇'},
 {id:'stop',name:'Остановка',x:.424,y:.717,indoor:false,icon:'↔'}
];
export const ROLES=[
 {id:'baker',group:'Маленькие дела',glyph:'◒',color:'#f0c188',names:['Пекарь Лев','Пекарь Марта'],home:'home'},
 {id:'barista',group:'Маленькие дела',glyph:'◡',color:'#eab49b',names:['Бариста Нина','Бариста Тим'],home:'home'},
 {id:'bookseller',group:'Маленькие дела',glyph:'▤',color:'#bdd4ce',names:['Книготорговец Софья'],home:'home'},
 {id:'gardener',group:'Маленькие дела',glyph:'❋',color:'#bcce95',names:['Садовник Фёдор'],home:'home'},
 {id:'courier',group:'Маленькие дела',glyph:'◇',color:'#ebd7a1',names:['Почтальон Саша'],home:'home'},
 {id:'neighbor',group:'Соседи',glyph:'·',color:'#d4c8e6',names:['Вера','Даниил','Соня','Миша','Ася','Марк','Лиза','Артём','Тася','Илья'],home:'home'},
 {id:'artist',group:'Соседи',glyph:'✎',color:'#e8bcba',names:['Художница Эмма'],home:'home'},
 {id:'keeper',group:'Соседи',glyph:'✧',color:'#aec6e1',names:['Смотритель Лука'],home:'home'},
 {id:'cat',group:'Звери',glyph:'●',color:'#efc790',names:['Кот Булочка','Кошка Корица','Кот Туман'],home:'cafe',animal:true},
 {id:'dog',group:'Звери',glyph:'◆',color:'#d4b797',names:['Пёс Бублик','Собака Мята'],home:'home',animal:true}
];
export const TASKS={walk:'идёт по знакомой улице',sleep:'спит дома',rest:'отдыхает',bake:'месит тесто',coffee:'готовит кофе',serve:'ставит чашки на стол',drink:'пьёт тёплый напиток',eat:'ест',read:'листает книгу',draw:'рисует в блокноте',meet:'беседует с соседом',garden:'поливает цветы',deliver:'приносит письмо',tidy:'протирает стол',purr:'мурлычет рядом',sniff:'гуляет и исследует запахи',wait:'ждёт трамвай',ride:'едет на трамвае',feed:'ест угощение'};
const SOUND={bake:'bake',coffee:'coffee',serve:'cup',drink:'cup',eat:'bake',read:'book',draw:'book',meet:'chat',garden:'watering',deliver:'door',tidy:'bake',purr:'purr',sniff:'paw',feed:'paw'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const nodes={...Object.fromEntries(PLACES.map(r=>[r.id,r])),west:{id:'west',x:.334,y:.456},north:{id:'north',x:.547,y:.32},east:{id:'east',x:.677,y:.463},south:{id:'south',x:.50,y:.632},parkGate:{id:'parkGate',x:.662,y:.695}};
const graph={home:['west','north'],west:['home','bakery','square'],bakery:['west','cafe'],cafe:['bakery','south'],north:['home','bookshop'],bookshop:['north','east'],east:['bookshop','square','parkGate'],square:['west','east','south'],south:['square','cafe','stop','parkGate'],parkGate:['east','south','park'],park:['parkGate'],stop:['south']};
export function route(from,to){const queue=[[from]],seen=new Set([from]);while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===to)return path;for(const n of graph[last]||[])if(!seen.has(n)){seen.add(n);queue.push([...path,n]);}}return[];}
export class CityWorld{
 constructor(saved){
  this.seed=(saved?.seed>>>0)||0x513c498a;this.elapsed=0;this.time=Number.isFinite(saved?.time)?clamp(saved.time,0,1439):18*60;this.speed=[.5,1,2,4].includes(saved?.speed)?saved.speed:1;this.holdTime=saved?.holdTime??true;this.paused=false;
  this.weatherMode=['auto','clear','rain','fog','custom'].includes(saved?.weatherMode)?saved.weatherMode:'clear';this.weather=['clear','rain','fog'].includes(saved?.weather)?saved.weather:'clear';this.weatherAge=0;this.rain=0;this.fog=0;this.wind=.12;
  this.climate={temperature:Number.isFinite(saved?.climate?.temperature)?clamp(saved.climate.temperature,-5,35):saved?.climate?.temperature===null?null:20,wind:Number.isFinite(saved?.climate?.wind)?clamp(saved.climate.wind):saved?.climate?.wind===null?null:.12,rain:Number.isFinite(saved?.climate?.rain)?clamp(saved.climate.rain):null};
  this.lights=Number.isFinite(saved?.lights)?clamp(saved.lights):.8;this.focus=PLACES.some(r=>r.id===saved?.focus)?saved.focus:'all';this.selectedId=Number.isInteger(saved?.selectedId)?clamp(saved.selectedId,0,23):0;
  this.events=[];this.eventId=0;this.outbox=[];this.connections=[];this.lastLog=-10;this.invitePhase='idle';this.inviteUntil=0;this.lastInvite=-100;this.inviteId=0;this.petFood=.8;this.bread=.8;this.coffeeStock=.8;this.agents=[];
  this.tram={active:false,progress:0,x:.055,y:.577,next:12,boarded:false};
  for(let role=0;role<ROLES.length;role++)for(const name of ROLES[role].names){const r=ROLES[role],place=r.id==='baker'?'bakery':r.id==='barista'||r.id==='cat'?'cafe':r.id==='bookseller'?'bookshop':r.id==='gardener'||r.id==='dog'?'park':this.random()<.4?'square':'home',point=nodes[place];this.agents.push({id:this.agents.length,role,name,place,x:point.x+(this.random()-.5)*.04,y:point.y+(this.random()-.5)*.03,energy:.68+this.random()*.25,hunger:.2+this.random()*.3,comfort:.85,social:.3+this.random()*.3,action:'rest',reason:'прислушивается к своему кварталу',until:this.random()*6,voiceAt:0,signal:0,path:[],plan:null,friends:{},memory:[],phase:this.random()*6.28,steps:0,invited:0,lastTrip:-100});}
  if(Array.isArray(saved?.agents))for(const a of this.agents){const p=saved.agents.find(v=>v.id===a.id);if(!p)continue;for(const k of ['energy','hunger','comfort','social'])if(Number.isFinite(p[k]))a[k]=clamp(p[k]);if(PLACES.some(r=>r.id===p.place)){a.place=p.place;a.x=nodes[p.place].x+(this.random()-.5)*.04;a.y=nodes[p.place].y+(this.random()-.5)*.03;}a.memory=Array.isArray(p.memory)?p.memory.filter(v=>typeof v==='string').slice(0,3):[];a.friends=p.friends&&typeof p.friends==='object'?p.friends:{};}
  this.updateLight();this.log('Здесь идут маленькие дела. Можно остаться и послушать.');
 }
 random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 updateLight(){const h=this.time/60;this.daylight=clamp((Math.sin((h-6)*Math.PI/12)+.28)*1.22);this.night=1-this.daylight;this.period=h<6||h>=22?'Ночь':h<10?'Утро':h<17?'День':'Вечер';this.temperature=this.climate.temperature??(13+this.daylight*10-this.rain*3);}
 setTime(hour){if(!Number.isFinite(hour))return;this.time=clamp(hour,0,23.99)*60;this.updateLight();for(const a of this.agents)if(a.action!=='ride')this.decide(a);this.log('В квартале '+this.period.toLowerCase()+'.');}
 setWeather(mode){if(!['auto','clear','rain','fog'].includes(mode))return;this.weatherMode=mode;this.climate.rain=null;this.weatherAge=0;if(mode!=='auto')this.weather=mode;}
 setClimate(key,value){if(!['temperature','wind','rain'].includes(key)||!Number.isFinite(value))return;this.climate[key]=clamp(value,key==='temperature'?-5:0,key==='temperature'?35:1);if(key==='rain'){this.weatherMode='custom';this.weather=value>.03?'rain':'clear';}this.updateLight();}
 autoClimate(){this.climate={temperature:null,wind:null,rain:null};this.setWeather('auto');this.updateLight();}
 badWeather(){return this.rain>.35||this.wind>.7||this.temperature<6||this.temperature>31;}
 log(text,a=null){if(a){a.memory.unshift(text);a.memory.length=Math.min(3,a.memory.length);}if(this.elapsed-this.lastLog<1&&a)return;this.lastLog=this.elapsed;this.events.unshift({id:++this.eventId,time:this.time,text,agentId:a?.id??null});this.events.length=Math.min(8,this.events.length);}
 sound(a,kind=SOUND[a.action]){if(!kind)return;if(kind==='chat'&&!this.peer(a))return;a.signal=1;this.outbox.push({type:'event',kind,pan:clamp((a.x-.5)*1.5,-.7,.7),place:a.place,id:a.id,variation:this.random(),gain:this.focus==='all'||this.focus===a.place?1:.12});}
 begin(a,kind,reason,duration=16){a.action=kind;a.reason=reason;a.until=this.elapsed+duration;a.path=[];a.plan=null;a.voiceAt=this.elapsed+3+this.random()*7;this.sound(a);if(!['sleep','rest'].includes(kind))this.log(a.name+': '+TASKS[kind]+'.',a);}
 go(a,place,kind,reason,duration=16){if(!nodes[place])return;if(a.place===place&&!a.path.length){this.begin(a,kind,reason,duration);return;}const nearest=Object.values(nodes).reduce((best,n)=>Math.hypot(a.x-n.x,a.y-n.y)<Math.hypot(a.x-best.x,a.y-best.y)?n:best,nodes[a.place]);a.path=route(nearest.id,place).map(id=>({x:nodes[id].x,y:nodes[id].y,node:id}));a.path.push({x:nodes[place].x+(this.random()-.5)*.05,y:nodes[place].y+(this.random()-.5)*.035,node:place});a.plan={place,kind,reason,duration};a.action='walk';a.reason=reason;a.until=Infinity;}
 peer(a){return this.agents.find(b=>b.id!==a.id&&b.place===a.place&&!ROLES[b.role].animal&&!['sleep','walk','ride'].includes(b.action));}
 shouldSleep(a){const r=ROLES[a.role],h=this.time/60;if(r.id==='cat')return false;if((this.invitePhase==='brewing'&&r.id==='barista')||(a.invited===this.inviteId&&this.invitePhase==='ready'&&this.elapsed<this.inviteUntil))return false;if(r.id==='keeper')return h>=4&&h<11;if(r.id==='baker')return h>=22||h<5;return h>=23||h<6;}
 decide(a){
  const r=ROLES[a.role],h=this.time/60;
  if(this.shouldSleep(a)){this.go(a,r.home,'sleep','отдыхает в знакомом тёплом месте',24);return;}
  if(!nodes[a.place].indoor&&this.badWeather()){this.go(a,r.animal?'cafe':'bookshop',r.animal?'rest':'read','укрывается от непогоды',20);return;}
  if(r.id==='barista'&&this.invitePhase==='brewing'){this.go(a,'cafe','coffee','готовит напитки для встречи соседей',12);return;}
  if(a.invited===this.inviteId&&this.invitePhase==='ready'&&this.elapsed<this.inviteUntil){this.go(a,'cafe',this.peer(a)?'meet':'drink','остался на чашку кофе с соседями',22);return;}
  if(a.energy<.23){this.go(a,r.home,'rest','устал и отдыхает в тишине',24);return;}
  if(a.hunger>.64){this.go(a,r.animal?'cafe':'bakery',r.animal?'feed':'eat','проголодался и идёт за угощением',14);return;}
  if(r.id==='cat'){this.go(a,this.random()<.7?'cafe':'bookshop','purr','устроился рядом с людьми',20);return;}
  if(r.id==='dog'){this.go(a,this.badWeather()?'cafe':'park',this.badWeather()?'rest':'sniff','знает все любимые места квартала',18);return;}
  if(r.id==='baker'&&h>=5&&h<18){this.go(a,'bakery','bake','готовит свежий хлеб для соседей',17);return;}
  if(r.id==='barista'&&h>=7&&h<23){this.go(a,'cafe',this.coffeeStock<.75?'coffee':this.random()<.55?'serve':'tidy','заботится о маленьком кафе',15);return;}
  if(r.id==='bookseller'&&h>=9&&h<21){this.go(a,'bookshop',this.peer(a)&&this.random()<.4?'meet':'read','выбирает книги для посетителей',19);return;}
  if(r.id==='gardener'&&h>=7&&h<19){this.go(a,this.badWeather()?'home':'park',this.badWeather()?'read':'garden','ухаживает за цветами и отдыхает между делами',18);return;}
  if(r.id==='courier'&&h>=8&&h<19){this.go(a,['home','bookshop','bakery'][Math.floor(this.random()*3)],'deliver','разносит письма знакомым соседям',12);return;}
  if(r.id==='keeper'){this.go(a,this.badWeather()?'cafe':this.random()<.5?'square':'stop','tidy','поддерживает порядок и проверяет вечерние фонари',16);return;}
  const peer=this.peer(a);
  if(a.social>.45&&peer&&!r.animal){this.begin(a,'meet','рад знакомому лицу рядом',18);this.bond(a,peer);return;}
  if(h>=6&&h<22&&!this.badWeather()&&this.elapsed-a.lastTrip>120&&this.random()<.13){a.lastTrip=this.elapsed;this.go(a,'stop','wait','решил прокатиться по знакомому маршруту',40);return;}
  if(h>=21){this.go(a,'home',this.random()<.6?'read':'drink','проводит вечер у тёплого окна',24);return;}
  if(this.badWeather()){this.go(a,this.random()<.5?'cafe':'bookshop',this.random()<.5?'read':'drink','выбрал уютное место под крышей',20);return;}
  if(a.social>.58){this.go(a,'cafe','drink','хочет побыть рядом с соседями',18);return;}
  const choice=this.random();this.go(a,choice<.34?'cafe':choice<.6?'bookshop':choice<.82?'park':'square',choice<.34?'drink':choice<.6?'read':r.id==='artist'?'draw':'rest','нашёл время для любимого маленького дела',18+this.random()*12);
 }
 bond(a,b){a.friends[b.id]=Math.min(30,(a.friends[b.id]||0)+1);b.friends[a.id]=Math.min(30,(b.friends[a.id]||0)+1);a.social=Math.max(0,a.social-.35);b.social=Math.max(0,b.social-.2);a.comfort=clamp(a.comfort+.08);b.comfort=clamp(b.comfort+.04);this.connections.push({a:a.id,b:b.id,born:this.elapsed});this.log(a.name+' и '+b.name+' немного посидели вместе.',a);}
 finish(a){
  if(a.action==='bake')this.bread=clamp(this.bread+.35);
  if(a.action==='coffee'){this.coffeeStock=clamp(this.coffeeStock+.35);if(this.invitePhase==='brewing'){this.invitePhase='ready';this.inviteUntil=this.elapsed+140;this.log('Кофе готов. Соседи собираются за одним столом.');const guests=this.agents.filter(b=>['neighbor','artist'].includes(ROLES[b.role].id)).slice(0,6);for(const b of guests){b.invited=this.inviteId;this.go(b,'cafe','drink','приглашён на тёплую встречу',20);}}}
  if(['meet','drink','read','draw'].includes(a.action)){const b=this.peer(a);if(b)this.bond(a,b);}
  if(a.action==='ride'){a.place='stop';a.x=nodes.stop.x;a.y=nodes.stop.y;this.log(a.name+' вернулся с короткой поездки.',a);}
 }
 requestCoffee(){if(this.paused||this.invitePhase==='brewing'||this.elapsed-this.lastInvite<50)return false;this.lastInvite=this.elapsed;this.inviteId++;this.invitePhase='brewing';this.inviteUntil=0;for(const a of this.agents.filter(a=>ROLES[a.role].id==='barista'))this.decide(a);this.log('В кафе поставили дополнительные чашки. Бариста готовит кофе.');return true;}
 feedPets(){if(this.paused)return false;this.petFood=1;for(const a of this.agents.filter(a=>ROLES[a.role].animal))this.go(a,'cafe','feed','заметил свежее угощение у кафе',18);this.log('У кафе оставили угощение. Звери собираются рядом.');return true;}
 tickTram(dt){
  const tram=this.tram,h=this.time/60;
  if(!tram.active&&h>=6&&h<23&&this.elapsed>=tram.next){tram.active=true;tram.progress=0;tram.boarded=false;this.outbox.push({type:'event',kind:'tram',pan:-.7,gain:this.focus==='all'||this.focus==='stop'?1:.2});this.log('Тихий трамвай проходит мимо знакомых окон.');}
  if(tram.active){tram.progress+=dt/13;tram.x=.055+tram.progress*.49;tram.y=.576+tram.progress*.337;
   if(tram.progress>.58&&!tram.boarded){tram.boarded=true;for(const a of this.agents.filter(a=>a.action==='wait'))this.begin(a,'ride','сел в трамвай на короткий круг',14);}
   if(tram.progress>=1){tram.active=false;tram.next=this.elapsed+65+this.random()*35;}
  }
 }
 tick(dt){
  if(this.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.25);this.elapsed+=dt;if(!this.holdTime)this.time=(this.time+dt*2*this.speed)%1440;this.updateLight();this.weatherAge+=dt;
  if(this.weatherMode==='auto'&&this.weatherAge>90){this.weather=['clear','rain','fog'][Math.floor(this.random()*3)];this.weatherAge=0;}
  const ease=1-Math.exp(-dt*.4);this.rain+=((this.climate.rain??(this.weather==='rain'?.7:0))-this.rain)*ease;this.wind+=((this.climate.wind??(.12+this.rain*.4+Math.sin(this.elapsed*.03)*.08))-this.wind)*ease;this.fog+=((this.weather==='fog'?.65:0)-this.fog)*ease;this.tickTram(dt);
  if(this.invitePhase==='ready'&&this.elapsed>this.inviteUntil)this.invitePhase='idle';
  for(const a of this.agents){
   const r=ROLES[a.role],rest=['sleep','rest','read'].includes(a.action);a.signal=Math.max(0,a.signal-dt*.7);a.energy=clamp(a.energy+dt*(rest?.015:a.action==='walk'?-.003:-.001));a.hunger=clamp(a.hunger+dt*.0015);a.social=clamp(a.social+dt*.0017);a.comfort=clamp(a.comfort+dt*(nodes[a.place].indoor?.001:-.002*Math.max(0,10-this.temperature)));
   if(a.action==='ride'){if(this.tram.active){a.x=this.tram.x;a.y=this.tram.y;}if(this.elapsed>=a.until){this.finish(a);this.decide(a);}continue;}
   const destination=a.plan?.place??a.place,sleep=this.shouldSleep(a);if((sleep&&a.action!=='sleep'&&a.plan?.kind!=='sleep')||(!sleep&&a.action==='sleep')||(!sleep&&this.badWeather()&&!nodes[destination].indoor))this.decide(a);
   if(a.path.length){const point=a.path[0],dx=point.x-a.x,dy=point.y-a.y,d=Math.hypot(dx,dy),step=dt*(r.animal?.032:.030);if(d<step+.002){a.x=point.x;a.y=point.y;a.path.shift();if(PLACES.some(p=>p.id===point.node))a.place=point.node;if(!a.path.length&&a.plan){const plan=a.plan;a.place=plan.place;this.begin(a,plan.kind,plan.reason,plan.duration);}}else{a.x+=dx/d*step;a.y+=dy/d*step;a.steps+=step;if(a.steps>.075){a.steps=0;this.sound(a,r.animal?'paw':'footstep');}}}
   else{
    if(a.action==='eat'){a.hunger=Math.max(0,a.hunger-dt*.038*(this.bread>.01?1:.3));this.bread=Math.max(0,this.bread-dt*.001);}
    if(a.action==='feed'&&this.petFood>.01){a.hunger=Math.max(0,a.hunger-dt*.045);this.petFood=Math.max(0,this.petFood-dt*.001);}
    if(a.action==='drink'){a.hunger=Math.max(0,a.hunger-dt*.008);a.comfort=clamp(a.comfort+dt*.01);this.coffeeStock=Math.max(0,this.coffeeStock-dt*.003);}
    if(['purr','meet','read','draw'].includes(a.action))a.comfort=clamp(a.comfort+dt*.01);
    if(SOUND[a.action]&&this.elapsed>a.voiceAt){this.sound(a);a.voiceAt=this.elapsed+5+this.random()*8;}
    if(this.elapsed>=a.until){this.finish(a);this.decide(a);}
   }
  }
  this.connections=this.connections.filter(e=>this.elapsed-e.born<5);this.activity=this.agents.filter(a=>!['sleep','rest','read'].includes(a.action)).length/this.agents.length;
 }
 drain(){return this.outbox.splice(0);}
 get selected(){return this.agents[this.selectedId]||this.agents[0];}
 get awake(){return this.agents.filter(a=>a.action!=='sleep').length;}
 snapshot(){return{version:1,seed:this.seed,time:this.time,speed:this.speed,holdTime:this.holdTime,climate:{...this.climate},weather:this.weather,weatherMode:this.weatherMode,lights:this.lights,focus:this.focus,selectedId:this.selectedId,agents:this.agents.map(a=>({id:a.id,place:a.place,energy:a.energy,hunger:a.hunger,comfort:a.comfort,social:a.social,memory:a.memory,friends:a.friends}))};}
}
