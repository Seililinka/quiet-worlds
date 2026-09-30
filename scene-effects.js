// Scene illumination uses standard compositing, including browsers without canvas.filter.
export function drawLitScene(renderer,world,lamps,exposure=.38){
 const {ctx:c,image,width,height,ox,oy,size}=renderer,day=Math.pow(Math.max(0,Math.min(1,world.daylight)),.65),night=1-day;
 c.save();c.drawImage(image,ox,oy,size,size);
 c.globalCompositeOperation='screen';c.globalAlpha=day*exposure;c.drawImage(image,ox,oy,size,size);c.globalAlpha=1;
 c.globalCompositeOperation='multiply';
 const sky=[58+197*day,72+180*day,107+137*day].map(v=>Math.round(v*(1-world.rain*.1)));
 c.fillStyle=`rgb(${sky.join(',')})`;c.fillRect(0,0,width,height);
 c.globalCompositeOperation='screen';
 const sun=c.createLinearGradient(0,0,width,height);sun.addColorStop(0,`rgba(255,234,181,${day*.16})`);sun.addColorStop(.65,`rgba(255,242,217,${day*.025})`);sun.addColorStop(1,'rgba(255,242,217,0)');c.fillStyle=sun;c.fillRect(0,0,width,height);
 // Warm pools of local light remain visible against the dark streets and grounds.
 for(const lamp of lamps){
  const x=ox+lamp.x*size,y=oy+lamp.y*size,radius=size*lamp.s;
  const shimmer=lamp.fire&&!renderer.reduced?.96+.04*Math.sin(world.elapsed*2.3):1;
  const strength=lamp.power*(.025+night*.52)*shimmer,g=c.createRadialGradient(x,y,0,x,y,radius);
  g.addColorStop(0,`rgba(255,203,126,${strength})`);g.addColorStop(.32,`rgba(255,183,90,${strength*.52})`);g.addColorStop(1,'rgba(255,166,72,0)');c.fillStyle=g;c.fillRect(x-radius,y-radius,radius*2,radius*2);
 }
 c.restore();
}

// Draw last so weather, nearby inhabitants and room dimming cannot cover the name.
export function drawSelectedName(c,name,p,width,height){
 c.save();c.globalAlpha=1;c.globalCompositeOperation='source-over';c.font='600 14px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';
 const maxWidth=Math.max(40,width-32);let text=name;
 while(text.length>1&&c.measureText(text).width>maxWidth-24)text=text.slice(0,-2)+'…';
 const labelWidth=Math.min(maxWidth,c.measureText(text).width+24),labelHeight=30;
 const below=p.y-44<52,x=Math.max(8,Math.min(width-labelWidth-8,p.x-labelWidth/2)),y=Math.max(8,Math.min(height-labelHeight-8,below?p.y+18:p.y-44));
 c.strokeStyle='rgba(255,235,176,.8)';c.lineWidth=1;c.beginPath();c.moveTo(p.x,p.y+(below?8:-8));c.lineTo(Math.max(x+10,Math.min(x+labelWidth-10,p.x)),below?y:y+labelHeight);c.stroke();
 c.shadowColor='rgba(255,210,114,.8)';c.shadowBlur=16;c.fillStyle='rgba(25,35,43,.95)';c.strokeStyle='#f3d28b';c.lineWidth=1.2;c.beginPath();c.roundRect(x,y,labelWidth,labelHeight,9);c.fill();c.stroke();
 c.shadowBlur=5;c.fillStyle='#fff5d5';c.fillText(text,x+labelWidth/2,y+labelHeight/2+.5);c.restore();
}
