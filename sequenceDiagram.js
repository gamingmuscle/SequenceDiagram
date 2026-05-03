/*
	sequenceDiagram.js
	v0.0.1
*/
'use strict';
let diagram = function () 
{
	var uid = 'sqd-' + Math.random().toString(36).slice(2,7);
	this.uid        = uid;
  	this.filterId   = uid + '-shadow';
  	this.markerRId  = uid + '-right';
  	this.markerLId  = uid + '-left';
	this.ns = "http://www.w3.org/2000/svg";
	this.actors=[];
	this.actorsPos={};
	this.signals=[];
	this.title=null;
	this.textSize=16;
	this.signalHeight=24;
	this.signalBuffer=5;
	this.minXGap=32;
	this.minHeight=24;
	this.minWidth=50;
	this.wrappers={};
	this.classRoot="squncDgrm"
	this.dClass={actor:[],signal:[]};
	this.markers={left:createMarker(this,document.createElementNS(this.ns,'marker'),"M 10 0 L 0 5 L 10 10 Z",0,5),right:createMarker(this,document.createElementNS(this.ns,'marker'),"M 0 0 L 10 5 L 0 10 Z",10,5)};
	this.markers.left.setAttribute("id",this.markerLId);
	this.markers.right.setAttribute("id",this.markerRId);
	this.filter=createFilter(this,document.createElementNS(this.ns,'filter'));
	this.parseFunc=[];
	this.parserRules=[];
	function createMarker($this,marker,moveToPath,x,y)
	{	
		marker.setAttribute("markerWidth",5);
		marker.setAttribute("markerHeight",8);
		marker.setAttribute("viewBox","0 0 10 10");
		marker.setAttribute("refX",x);
		marker.setAttribute("refY",y);
		marker.setAttribute("class","squncDgrm-marker_arrow");
		var path=document.createElementNS($this.ns,'path');
		path.setAttribute("d",moveToPath);
		marker.appendChild(path);

		return marker;
	}
	function createFilter($this,filter)
	{
		filter.setAttribute('id',$this.filterId);
		filter.setAttribute('height','130%');
		var fgb=document.createElementNS($this.ns,'feGaussianBlur');
		fgb.setAttribute('in','SourceAlpha');
		fgb.setAttribute('stdDeviation',3);
		var fo=document.createElementNS($this.ns,'feOffset');
		fo.setAttribute('dx',2);
		fo.setAttribute('dy',2);
		fo.setAttribute('result','offsetblur');
		var fct=document.createElementNS($this.ns,'feComponentTransfer');
		var ffa=document.createElementNS($this.ns,'feFuncA');
		ffa.setAttribute('type','linear');
		ffa.setAttribute('slope',0.5);
		fct.appendChild(ffa);
		var fm=document.createElementNS($this.ns,'feMerge');
		fm.appendChild(document.createElementNS($this.ns,'feMergeNode'));
		var fmn=document.createElementNS($this.ns,'feMergeNode');
		fmn.setAttribute("in","SourceGraphic");
		fm.appendChild(fmn);
		filter.appendChild(fgb);
		filter.appendChild(fo);
		filter.appendChild(fct);
		filter.appendChild(fm);
		return filter;
	}
}
diagram.signal = function(signal,a,b,message)
{
	var $this=this;
	this.setProperty=function(key,value)
	{
		$this[key]=value;
	};
	this.actorA=a;
	this.actorB=b;
	this.message=message;
	var t=0;
	if(signal[0]=="<")
		t+=1;
	if(signal[signal.length-1]==">")
		t+=2;
	switch(t)
	{
		case 0: this.setProperty('direction',"none");
			break;
		case 1: this.setProperty('direction',"left");
			break;
		case 2: this.setProperty('direction',"right");
			break;
		case 3: this.setProperty('direction',"bi");
			break;
	}
	if(signal.length==3)
		this.setProperty('dashed',true);
	
};
diagram.actor = function(key,name)
{
	this.key=key;
	this.name=name;
	this.setProperty=function (key,value)
	{
		this[key]=value;
	};
};

diagram.prototype.getActor = function(key,actor)
{
	if(typeof this.actors == "undefined")this.actors=[];
	if(typeof this.actors[this.actorsPos[key]] != "undefined") return this.actors[this.actorsPos[key]];
	else if(typeof actor !="undefined")
	{
		var index=this.actors.length;
		this.actors.push(actor);
		this.actorsPos[key]=index;
	}
	
	return this.actors[this.actorsPos[key]];
};
diagram.prototype.getSignal = function (signal)
{
	signal.index=this.signals.length;
	this.signals.push(signal);
	
	return this.signals[this.signals.length-1];
}
diagram.prototype.setContainerDiv = function (div)
{
	this.container=document.getElementById(div);
};
diagram.prototype.parse = function(input)
{
	var pattern=/^(")?(.*?)\1([<>-]{2,3})(")?(.*?)\4:(.*)$/;
	var parts=input.split(/\r|\n/);
	var $this=this;
	parts.forEach( function (item)
	{
		var matches=item.match(pattern);
		if(!matches) return;
		var actorAKey=matches[2];
		var signalStr=matches[3];
		var actorBKey=matches[5];
		var message=matches[6].trim();
		var a=new diagram.actor(actorAKey,actorAKey);
		var b=new diagram.actor(actorBKey,actorBKey);
		a=$this.getActor(actorAKey,a);
		b=$this.getActor(actorBKey,b);
		var signal;
		if($this.actorsPos[a.key]>$this.actorsPos[b.key])
		{
			signal=new diagram.signal(flipSignal(signalStr),b,a,message);
			signal.setProperty("backref",true);
		}
		else signal=new diagram.signal(signalStr,a,b,message);
		$this.getSignal(signal);
	});
};
diagram.prototype.addParser = function (rule,parseFunc)
{
	this.parseFunc[this.parserRules.length]=parseFunc;
	this.parserRules.push(rule);
}
diagram.prototype.addWrapper=function(key,wrapper)
{
	this.wrappers[key]=wrapper;
}
diagram.prototype.addClass=function (key,clss)
{
	this.dClass[key].push(clss);
}
diagram.prototype.draw = function ()
{
	this.shifted=false;
	//clear container of any child nodes
	while (this.container.firstChild) 
	{
		this.container.removeChild(this.container.lastChild);
	}
	//draw SVG
	var x=10;
	var y=5;
	var svg=document.createElementNS(this.ns,'svg');
	//
	svg.setAttributeNS(null,'height',(this.signals.length+2)*(this.signalHeight+this.signalBuffer)+48);
	//svg.setAttributeNS(null, 'overflow', 'visible');
	svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
	svg.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
	svg.setAttribute("version","1.1");
	svg.setAttribute("class",this.classRoot);
	svg.appendChild(this.filter);
	var $this=this;
	this.container.appendChild(svg);
	this.actors.forEach(function (actor)
	{ 
		var xw=$this.drawActor(svg,x,y,actor);
		x=x+xw+$this.minXGap;
	});
	y=y+$this.minHeight+this.signalHeight;
	
	svg.appendChild(this.markers.right);
	svg.appendChild(this.markers.left);
	this.signals.forEach(function (signal){
		$this.drawSignal(svg,y,signal);
		y+=$this.signalHeight+$this.signalBuffer;
	});
	
	svg.setAttributeNS(null,'width',this.actors[this.actors.length-1].x_pos+this.actors[this.actors.length-1].width/2+32	);
};
diagram.prototype.createLine=function(x,y,x2,y2,line,opt)
{
	line.setAttribute('x1',x);
	line.setAttribute('x2',x2);
	line.setAttribute('y1',y);
	line.setAttribute('y2',y2);
	line.setAttribute('stroke', '#000');
	return line;
}
diagram.prototype.createBox=function(x,y,box)
{
	var $this=this;
	box.setAttributeNS(null,'x',x);
	box.setAttributeNS(null,'y',y);
	box.setAttributeNS(null, 'width', $this.minWidth);
	box.setAttributeNS(null, 'height',$this.minHeight);
	return box;
}
diagram.prototype.drawActor = function (svg,x,y,actor)
{
	var $this=this;
	var createBox=function(x,y,box)
	{
		box.setAttributeNS(null,'x',x);
		box.setAttributeNS(null,'y',y);
		box.setAttributeNS(null, 'width', $this.minWidth);
		box.setAttributeNS(null, 'height',$this.minHeight);
		return box;
	}
	
	var clss=this.dClass.actor.join(" ");
	var yOffset=(this.signals.length+2)*(this.signalHeight+this.signalBuffer);
	var xOffset=10;
	var line=document.createElementNS(this.ns,'line');
	var rect = this.createBox(x,y,document.createElementNS(this.ns, 'rect'));
	var brect = this.createBox(x,y+yOffset,document.createElementNS(this.ns, 'rect'));
	var tg=document.createElementNS(this.ns,"g");
	var bg=document.createElementNS(this.ns,"g");
	tg.setAttribute("class","squncDgrm-actor "+clss);
	tg.setAttribute("style","filter:url(#"+this.filterId+")");
	bg.setAttribute("class","squncDgrm-actor "+clss);
	bg.setAttribute("style","filter:url(#"+this.filterId+")");
	var txt=document.createElementNS(this.ns,"text");
	var btxt=document.createElementNS(this.ns,"text");
	txt.setAttribute('fill', '#000');
	txt.setAttribute("text-anchor","middle");
	txt.textContent=actor.name;
	btxt.setAttribute('fill', '#000');
	btxt.setAttribute("text-anchor","middle");
	btxt.textContent=actor.name;
	tg.appendChild(txt);
	if(this.wrappers.actor)
		svg.appendChild(this.wrappers.actor(actor,tg));
	else svg.appendChild(tg);
	var bbox = txt.getBBox();
	var xwidth = bbox.width+16;	
	actor.x_pos=x+xwidth/2;
	line=this.createLine(x+xwidth/2,y+$this.minHeight,x+xwidth/2,y+yOffset,line)
	line.setAttribute('id',this.uid+"-actorLine_"+actor.key);
	line.setAttribute('class','squncDgrm-actor_line')
	actor.width=xwidth;
	txt.setAttribute('x', x+xwidth/2);//50% rect width
	txt.setAttribute('y', y+18);//75% rect width
	rect.setAttributeNS(null, 'width', xwidth);
	brect.setAttributeNS(null, 'width', xwidth);

	tg.insertBefore(rect,tg.childNodes[tg.childNodes.length-1]);
	btxt.setAttribute('y', y+18+yOffset);
	btxt.setAttribute('x', x+xwidth/2);//50% rect width
	bg.appendChild(brect);
	bg.appendChild(btxt);
	if(this.wrappers.actor)
		svg.appendChild(this.wrappers.actor(actor,bg));
	else svg.appendChild(bg);

	svg.appendChild(line);
	tg.setAttribute('id',this.uid+"-actorTop_"+actor.key);
	bg.setAttribute('id',this.uid+"-actorBottom_"+actor.key);
	actor.svgT=this.uid+"-actorTop_"+actor.key;
	actor.svgL=this.uid+"-actorLine_"+actor.key;
	actor.svgB=this.uid+"-actorBottom_"+actor.key;
	return xwidth;
};
diagram.prototype.drawSignal = function (svg,y,signal)
{

	var line=document.createElementNS(this.ns,'line');
	line.setAttribute('x1',signal.actorA.x_pos);
	line.setAttribute('x2',signal.actorB.x_pos);
	line.setAttribute('y1',y);
	line.setAttribute('y2',y);
	line.setAttribute('stroke', '#000');
	line.setAttribute('class','squncDgrm-signal_line');
	line.setAttribute('id',this.uid+'-signal-line-'+signal.index);
	var g=document.createElementNS(this.ns,'g');
	g.setAttribute('class','squncDgrm-signal');
	g.setAttribute('id',this.uid+'-signal-group-'+signal.index);
	var txt=document.createElementNS(this.ns,'text');
	txt.setAttribute('fill', '#000');
	txt.setAttribute("text-anchor","middle");
	txt.setAttribute('x',(signal.actorA.x_pos+signal.actorB.x_pos)/2);
	txt.setAttribute('y',y+6);//why 6?
	txt.textContent=signal.message;
	txt.setAttribute('class','squncDgrm-signal_message');
	switch(signal.direction)
	{
		case "left": line.setAttribute("marker-start","url(#" + this.markerLId + ")");
			break;
		case "right": line.setAttribute("marker-end","url(#" + this.markerRId + ")");
			break;
		case "bi": 
			line.setAttribute("marker-start","url(#" + this.markerLId + ")");
			line.setAttribute("marker-end","url(#" + this.markerRId + ")");
			break;
	}
	svg.appendChild(line);
	g.appendChild(txt);
	if(this.wrappers.signal)
		svg.appendChild(this.wrappers.signal(signal,g));
	else svg.appendChild(g);
	//check txt width and adjust positions if necessary
	var bbox = txt.getBBox();
	var w=bbox.width+64;//buffer of 32px either side
	var delta=signal.actorB.x_pos-signal.actorA.x_pos;
	if(w>delta)
	{
		var shiftFrom=this.actorsPos[signal.actorB.key];
		delta=w-delta;
		this.shiftActors(signal.actorB,delta);
		line.setAttribute('x2',signal.actorB.x_pos);
		txt.setAttribute('x',(signal.actorA.x_pos+signal.actorB.x_pos)/2);
		this.shiftSignals(signal,shiftFrom);
	}
	var box=this.createBox(signal.actorA.x_pos+24+(signal.actorB.x_pos-signal.actorA.x_pos-w)/2,y-this.minHeight/2,document.createElementNS(this.ns,'rect'));
	box.setAttribute('width',w-48);
	box.setAttribute('fill','#fff');
	box.setAttribute('class','squncDgrm-signal_rect');
	g.insertBefore(box,g.childNodes[g.childNodes.length-1]);
}
function flipSignal(s) 
{
      var hasLeft  = s[0] === '<';
      var hasRight = s[s.length - 1] === '>';
      if (hasLeft === hasRight) return s;  // bi or none — unchanged
      return (hasRight ? '<' : '-') + s.slice(1, -1) + (hasLeft ? '>' : '-');
}
diagram.prototype.shiftSignals=function(signal,shiftedActorIndex)
{
	var $this=this;
	for(var i=0;i<signal.index;i++)
	{
		var sig=$this.signals[i];
		var aIdx=$this.actorsPos[sig.actorA.key];
		var bIdx=$this.actorsPos[sig.actorB.key];
		if(aIdx<shiftedActorIndex && bIdx<shiftedActorIndex) continue;
		var dsig=document.getElementById($this.uid+'-signal-line-'+i);
		var dg=document.getElementById($this.uid+'-signal-group-'+i);
		dsig.setAttribute("x1",sig.actorA.x_pos);
		dsig.setAttribute("x2",sig.actorB.x_pos);
		var midX=(sig.actorA.x_pos+sig.actorB.x_pos)/2;
		var children=dg.childNodes;
		children[children.length-1].setAttribute("x",midX);
		var rectW=parseFloat(children[0].getAttribute("width"));
		children[0].setAttribute("x",midX-rectW/2);
	}
}
diagram.prototype.shiftActors=function(actor,delta)
{
	this.shifted=true;
	
	for(var i=this.actorsPos[actor.key];i<this.actors.length;i++)
	{
		this.actors[i].x_pos+=delta;
		var tg=document.getElementById(this.actors[i].svgT);
		var line=document.getElementById(this.actors[i].svgL);
		var bg=document.getElementById(this.actors[i].svgB);
		tg.childNodes.forEach(function (item){item.setAttribute('x',parseFloat(item.getAttribute('x'))+delta)});
		line.setAttribute('x1',parseFloat(line.getAttribute('x1'))+delta);
		line.setAttribute('x2',parseFloat(line.getAttribute('x2'))+delta);
		bg.childNodes.forEach(function (item){item.setAttribute('x',parseFloat(item.getAttribute('x'))+delta);});
	}
};
