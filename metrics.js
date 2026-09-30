const COUNTER_ID=113103435;

export function recordRadioStart(realm){
 // The inline counter creates a queue before the async tag loads. A blocked
 // analytics script must never interrupt the world's audio or controls.
 try{
  if(typeof window!=='undefined'&&typeof window.ym==='function'){
   window.ym(COUNTER_ID,'reachGoal','radio_start',{world:['forest','castle','city'][realm]||'forest'});
  }
 }catch{}
}
