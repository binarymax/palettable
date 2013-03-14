/********************************
*
*  HTML5 Paint Tool Manager
*  Copyright (c) 2011, Max Irwin
*
*  Requires:$P, $color,
*				jQuery 1.6.2+,
*				jQueryUI 1.8.6+,
*
*********************************/

var $tools = window.$tools = (function() {
	
	var tools = [];
	var toolid = 0;

	var load = function(container) { 
		
		$.ui.tools = container;
		$.ui.tools.list = container.find("#tools");
		_.each(tools,function(tool){
			var element = $($templates.tool(tool));
			$.ui.tools.list.append(element);
			element.on("click",function(e){
				tool.use();
				e.stopPropagation();
				return false;
			});
		});
		
		tools[0].use();
		
	};

	//Extendable event driven Toolbox
	var tool = function(name,keyCode,events,settings) {
		var self = this;
		this.name = name;
		this.id = "tool" + ++toolid;
		this.keyCode = keyCode;
		this.events = events;

		//Settings objects
		this.settings = {};
		for(i in settings){
			if(settings.hasOwnProperty(i)) {
				var s = settings[i];
				this.settings[i] = (new $.setting(this,i,s.type,s.initial,s.min,s.max,s.divisions));
			}
		}
		
		//state objects
		this.active = false;
		this.startXY = null;
		this.currXY = null;
		this.endXY = null;
		var item = this;
		//bind all the events to the tool
		_.each(this.events,function(delegate,name) {
			item.events[name] = $.getEventWrapper(delegate,self);
		});
		
		
		
	};
	
	//Current color in use
	tool.color = $color.getColor();
	
	//Current tool in use
	tool.current = null;	
	
	//Start using the tool
	tool.prototype.use = function(){
		
		if(tool.current instanceof tool) tool.current.release();

		//bind all tool handlers to the canvas
		_.each(this.events,function(delegate,name) {
			$.ui.paint.on(name,".paintable",delegate);
		});

		//Render settings pane		
		this.renderSettings($.ui.toolSettings);

		//Use the tool		
		this.inuse = true;
		tool.current = this;
		$($tools).trigger("use",[this.id,this.name]);
		
		return true;
	};
	
	//Stop using the tool
	tool.prototype.release = function(){
		$.ui.paint.off(_.keys[this.events],".paintable");
		this.inuse = false;
		if(tool.current===this) tool.current=null;		
		$($tools).trigger("release",[this.id,this.name]);		
		return true;
	};
	
	//Render the settings UI elements for the tool
	tool.prototype.renderSettings = function(parent) {
		var list = $.ui.settings.list;		
		list.find("li").remove();
		for(i in this.settings) {
			if(this.settings.hasOwnProperty(i)) this.settings[i].render(list);
		}
	}
	
	//Get a setting from the UI
	tool.prototype.getSetting = function(name) {
		return (this.settings[name])?this.settings[name].val():0;
	};
	
	//Draw!
	tool.prototype.draw = function(delegate,isPreview) {
		if(isPreview) {
			$.workspace.preview(delegate);
		} else {
			$.workspace.draw(delegate);
		}
	}	
	
	//Find!
	tool.findById = function(id) {
		for(var i=0,l=tools.length;i<l;i++) {
			if (tools[i].id===id) {				
				return tools[i];
			}
		}
		return null;
	}	

	//Find!
	tool.findByName = function(name) {
		for(var i=0,l=tools.length;i<l;i++) {
			if (tools[i].name===name) {				
				return tools[i];
			}
		}
		return null
	}

	
	//add a tool to the toolbox
	var add = function(name,keyCode,events,settings) {
		 tools.push(new tool(name,keyCode,events,settings));
		 return true;
	};
	
	//Find a tool by name and start using it
	var use = function(id) {
		var item = tool.findById(id);
		if(item instanceof tool) { 
			item.use();
			return true;
		}
		return false;		
	};
	
	//Find a tool by name and start using it
	var useByName = function(name) {
		var item = tool.findByName(name);
		if(item instanceof tool) { 
			item.use();
			return true;
		}
		return false;
	};	

	//Get a list of tools
	var getTools = function() {
		return tools.map(function(i){
			return {
					id:i.id,
					name:i.name,
					keyCode:i.keyCode,
					settings:i.settings
			}
		});
	}
	
	var getTool = function() {
		return tool.current.name;
	};

	var setColor = function(rgba) {
		tool.color = rgba;
		return tool.color;
	};

	//Public methods
	return {
		name:"tools",
		load:load,
		add:add,
		use:use,
		useByName:useByName,
		getTools:getTools,
		getTool:getTool,
		setColor:setColor
	};

})();

/*******************************************
 *
 * Tool Definitions
 *
 *******************************************/

//Pencil tool:	
$tools.add("pencil","N", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
				var item = this;
				var thickness = item.settings["thickness"].value;
				this.draw(function(ctx) {
					ctx.fillStyle = $color.getBackgroundCSS($color.getColor());
					ctx.fillRect(item.startXY.x,item.startXY.y,thickness,thickness);
				});

			}, 
			"mousemove":function(e) {
				if(this.active) {			
					this.currXY = {x:e.x,y:e.y};
					var item = this;
					var thickness = item.settings["thickness"].value;
					this.draw(function(ctx) {
						ctx.fillStyle = $color.getBackgroundCSS($color.getColor());
						ctx.fillRect(item.currXY.x,item.currXY.y,thickness,thickness);
					});
					this.startXY = {x:e.x,y:e.y};
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
			},
			"mouseleave":function(e) {
				this.active=false;
			}
	}, {
			"thickness":{type:"slider",initial:1,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}
);

//Pencil tool:	
$tools.add("eraser","E", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
				var item = this;
				var thickness = item.settings["thickness"].value;
				this.draw(function(ctx) {
					ctx.clearRect(item.startXY.x,item.startXY.y,thickness,thickness);
				});

			}, 
			"mousemove":function(e) {
				if(this.active) {			
					this.currXY = {x:e.x,y:e.y};
					var item = this;
					var thickness = item.settings["thickness"].value;
					this.draw(function(ctx) {
						ctx.clearRect(item.currXY.x,item.currXY.y,thickness,thickness);
					});
					this.startXY = {x:e.x,y:e.y};
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
			},
			"mouseleave":function(e) {
				this.active=false;
			}
	}, {
			"thickness":{type:"slider",initial:1,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}
);


//Fan tool:	
$tools.add("fan","F", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
			}, 
			"mousemove":function(e) {
				if(this.active) {
					var item = this;
					this.currXY = {x:e.x,y:e.y};
					this.draw(function(ctx) {
						ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
						ctx.lineWidth = item.settings["thickness"].value;
						ctx.beginPath();
						ctx.moveTo(item.startXY.x,item.startXY.y);
						ctx.lineTo(item.currXY.x,item.currXY.y);
						ctx.stroke();
						ctx.closePath();
					});
					
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
			}
	}, {
			"thickness":{type:"slider",initial:1,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}
);

//line tool:	
$tools.add("line","L", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
			}, 
			"mousemove":function(e) {
				if(this.active) {
					this.currXY = {x:e.x,y:e.y};
					var item = this;
					this.draw(function(ctx) {
						ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
						ctx.lineWidth = item.settings["thickness"].value;
						ctx.beginPath();
						ctx.moveTo(item.startXY.x,item.startXY.y);
						ctx.lineTo(item.currXY.x,item.currXY.y);
						ctx.stroke();
						ctx.closePath();
					}, true);					
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
				var item = this;
				this.draw(function(ctx) {
					ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
					ctx.lineWidth = item.settings["thickness"].value;
					ctx.beginPath();
					ctx.moveTo(item.startXY.x,item.startXY.y);
					ctx.lineTo(item.endXY.x,item.endXY.y);
					ctx.stroke();
					ctx.closePath();
				});
				
			}
	}, {
			"thickness":{type:"slider",initial:1,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}
);

//rectangle tool:	
$tools.add("rectangle","R", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
			}, 
			"mousemove":function(e) {
				if(this.active) {
					this.currXY = {x:e.x,y:e.y};
					var item = this;
					this.draw(function(ctx) {
						ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
						ctx.lineWidth = item.settings["thickness"].value;
						ctx.beginPath();
						var x,w,y,h; 
						x=(item.startXY.x<item.currXY.x)?item.startXY.x:item.currXY.x;
						w=Math.abs(item.startXY.x-item.currXY.x);
						y=(item.startXY.y<item.currXY.y)?item.startXY.y:item.currXY.y;
						h=Math.abs(item.startXY.y-item.currXY.y);
						ctx.strokeRect(x,y,w,h);
						ctx.closePath();
					}, true); //true=>preview!
					
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
				var item = this;
				this.draw(function(ctx) {
					ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
					ctx.lineWidth = item.settings["thickness"].value;
					ctx.beginPath();
					var x,w,y,h; 
					x=(item.startXY.x<item.endXY.x)?item.startXY.x:item.endXY.x;
					w=Math.abs(item.startXY.x-item.endXY.x);
					y=(item.startXY.y<item.endXY.y)?item.startXY.y:item.endXY.y;
					h=Math.abs(item.startXY.y-item.endXY.y);
					ctx.strokeRect(x,y,w,h);
					ctx.closePath();
				});
				
			}
	}, {
			"thickness":{type:"slider",initial:1,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}
);

//Brush tool:	
$tools.add("circle","C", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;		
			}, 
			"mousemove":function(e) {
				if(this.active) {
					this.currXY = {x:e.x,y:e.y};
					var item = this;
					this.draw(function(ctx) {
						ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
						ctx.lineWidth = item.settings["thickness"].value;
						ctx.beginPath();
						var cx,cy,radius;
						cx=parseInt((item.startXY.x+item.currXY.x)/2);
						cy=parseInt((item.startXY.y+item.currXY.y)/2);
						radius=parseInt(Math.sqrt(
							(item.startXY.x-item.currXY.x)*(item.startXY.x-item.currXY.x) + 
							(item.startXY.y-item.currXY.y)*(item.startXY.y-item.currXY.y)
						)/4);
						ctx.arc(cx,cy, radius, 0, Math.PI*2, true); 
						ctx.closePath();
						ctx.stroke();
					},true);
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
				var item = this;
				this.draw(function(ctx) {
					ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
					ctx.lineWidth = item.settings["thickness"].value;
					ctx.beginPath();
					var cx,cy,radius;
					cx=parseInt((item.startXY.x+item.endXY.x)/2);
					cy=parseInt((item.startXY.y+item.endXY.y)/2);
					radius=parseInt(Math.sqrt(
						(item.startXY.x-item.endXY.x)*(item.startXY.x-item.endXY.x) + 
						(item.startXY.y-item.endXY.y)*(item.startXY.y-item.endXY.y)
					)/4);
					ctx.arc(cx,cy, radius, 0, Math.PI*2, true); 
					ctx.closePath();
					ctx.stroke();
				});
			},
			"mouseleave":function(e) {
				this.active=false;
			}
	}, {
			"thickness":{type:"slider",initial:2,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}	
);


//Sketch tool:	
$tools.add("pen","P", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
			}, 
			"mousemove":function(e) {
				if(this.active) {			
					this.currXY = {x:e.x,y:e.y};
					var item = this;
					var thickness = item.settings["thickness"].value;
					this.draw(function(ctx) {
						ctx.strokeStyle = $color.getBackgroundCSS($color.getColor());
						ctx.lineWidth = item.settings["thickness"].value;
						ctx.beginPath();
						ctx.moveTo(item.startXY.x,item.startXY.y);
						ctx.lineTo(item.currXY.x,item.currXY.y);
						ctx.stroke();
						ctx.closePath();
					});
					this.startXY = {x:e.x,y:e.y};
					
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
			},
			"mouseleave":function(e) {
				this.active=false;
			}
	}, {
			"thickness":{type:"slider",initial:1,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}
);


//Brush tool:	
$tools.add("brush","B", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
				var item = this;
				var radius = item.settings["size"].value;
				this.draw(function(ctx) {
					ctx.fillStyle = $color.getBackgroundCSS($color.getColor());
					ctx.beginPath();
					ctx.arc(item.startXY.x,item.startXY.y, radius, 0, Math.PI*2, true); 
					ctx.closePath();
					ctx.fill();
				});			
		
			}, 
			"mousemove":function(e) {
				if(this.active) {
					this.currXY = {x:e.x,y:e.y};
					var item = this;
					var radius = item.settings["size"].value;
					this.draw(function(ctx) {
						ctx.fillStyle = $color.getBackgroundCSS($color.getColor());
						ctx.beginPath();
						ctx.arc(item.currXY.x,item.currXY.y, radius, 0, Math.PI*2, true); 
						ctx.closePath();
						ctx.fill();
					});
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
			},
			"mouseleave":function(e) {
				this.active=false;
			}
	}, {
			"size":{type:"slider",initial:1,min:1,max:8}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}	
);

//Fill tool:	
$tools.add("fill","K", {
			"mousedown":function(e) {
				this.active=true;
				this.startXY = {x:e.x,y:e.y};
				this.endXY = null;
			}, 
			"mousemove":function(e) {
				if(this.active) {
					this.startXY = {x:e.x,y:e.y};
				}
			}, 
			"mouseup":function(e) {
				this.active=false;
				this.endXY = {x:e.x,y:e.y};
				var item = this;
				this.draw(function() {
					var self = this;
					if(!self.isActive) {
						self.isActive = true;
						floodfill(item.endXY.x,item.endXY.y,$color.getColor(),self.thumb.context,self.width,self.height,item.settings["tolerance"].value);
						self.isActive = false;
					}
				});
			},
			"mouseleave":function(e) {
				this.active=false;
			}
	}, {
			"tolerance":{type:"slider",initial:16,min:0,max:32}
			//,"opacity":{type:"slider",initial:1.0,min:0.1,max:1.0,divisions:20}
	}
);

//Floodfill functions

function floodfill(x,y,fillcolor,ctx,width,height,tolerance) {
	var img = ctx.getImageData(0,0,width,height);
	var data = img.data;
	var length = data.length;
	var Q = [];
	var i = (x+y*width)*4;
	var e = i, w = i, me, mw, w2 = width*4;
	var targetcolor = [data[i],data[i+1],data[i+2],data[i+3]];
	var targettotal = data[i]+data[i+1]+data[i+2]+data[i+3];
	//tolerance*=4;
	if(!pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) { return false; }
	Q.push(i);
	while(Q.length) {
		i = Q.pop();
		if(pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
			e = i;
			w = i;
			mw = parseInt(i/w2)*w2; //left bound
			me = mw+w2;	//right bound			
			while(mw<(w-=4) && pixelCompareAndSet(w,targetcolor,targettotal,fillcolor,data,length,tolerance)); //go left until edge hit
			while(me>(e+=4) && pixelCompareAndSet(e,targetcolor,targettotal,fillcolor,data,length,tolerance)); //go right until edge hit
			for(var j=w;j<e;j+=4) {
				if(j-w2>=0 		&& pixelCompare(j-w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j-w2); //queue y-1
				if(j+w2<length	&& pixelCompare(j+w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j+w2); //queue y+1
			} 			
		}
	}
	ctx.putImageData(img,0,0);
}

function pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {	
	if (i<0||i>=length) return false; //out of bounds
	if (data[i+3]===0)  return true;  //surface is invisible
	
	if (
		(targetcolor[3] === fillcolor.a) && 
		(targetcolor[0] === fillcolor.r) && 
		(targetcolor[1] === fillcolor.g) && 
		(targetcolor[2] === fillcolor.b)
	) return false; //target is same as fill
	
	if (
		(targetcolor[3] === data[i+3]) &&
		(targetcolor[0] === data[i]  ) && 
		(targetcolor[1] === data[i+1]) &&
		(targetcolor[2] === data[i+2])
	) return true; //target matches surface 
	
	if (
		Math.abs(targetcolor[3] - data[i+3])<=(255-tolerance) &&
		Math.abs(targetcolor[0] - data[i]  )<=tolerance && 
		Math.abs(targetcolor[1] - data[i+1])<=tolerance &&
		Math.abs(targetcolor[2] - data[i+2])<=tolerance
	) return true; //target to surface within tolerance 
	
	return false; //no match
}

function pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {
	if(pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
		//fill the color
		data[i] 	 = fillcolor.r;
		data[i+1] = fillcolor.g;
		data[i+2] = fillcolor.b;
		data[i+3] = fillcolor.a;
		return true;
	}
	return false;
}

// Line functions
function bresenham (x0,y0,x1,y1,context,color) {
/*
dx := abs(x1-x0)
dy := abs(y1-y0) 
if x0 < x1 then sx := 1 else sx := -1
if y0 < y1 then sy := 1 else sy := -1
err := dx-dy
 
loop
setPixel(x0,y0)
if x0 = x1 and y0 = y1 exit loop
e2 := 2*err
if e2 > -dy then 
err := err - dy
x0 := x0 + sx
end if
if e2 <  dx then 
err := err + dx
y0 := y0 + sy 
end if
end loop
*/	
};