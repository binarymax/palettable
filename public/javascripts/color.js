/********************************
*
*  HTML5 Color Manager
*  Copyright (c) 2011, Max Irwin
*
*********************************/

var $color = window.$color = (function() {
		"use strict";
				
		var color = {r:0,g:0,b:0,a:255}; 
		var surface = {};
		var events = {};
		var wheel = {};
		var width = 300;
		var height = 300;

		
		//===============================================================
		//Main loader
		var load = function(container) {
			//initialize the canvas for the wheel
			var canvasWheel = $('<canvas id="wheel"></canvas>');

			$.ui.swatches = container;
			$.ui.swatches.list = container.find("#swatches");
			$.ui.swatches.append(canvasWheel.canvas(width,height));
			
			var contextWheel = canvasWheel.context();
			wheel.image = contextWheel.createImageData(width,height);
			surface = {canvas:canvasWheel,context:contextWheel,image:wheel.image};
			
			//Draw the color wheel
			wheel.draw();

			//Initialize the selection events
			wheel.active = false;

			canvasWheel.on("mousedown",function(e) {
				wheel.active=true;
				var c = $.getMouseCoords(e,canvasWheel);
				color = wheel.getPixel(c.x,c.y);
				$($color).trigger("preview");
			});
			 			
			canvasWheel.on("mousemove",function(e) {
				if(wheel.active) {
					var c = $.getMouseCoords(e,canvasWheel);				
					color = wheel.getPixel(c.x,c.y);
					$($color).trigger("preview");
				}
			});
			
			canvasWheel.on("mouseup",function(e) {
				wheel.active=false;
				var c = $.getMouseCoords(e,canvasWheel);
				color = wheel.getPixel(c.x,c.y);
				var swatch = Swatch.add("Swatch" + (swatches.length+1).toString(),color);		
				swatch.use();
			});
						
			//Add the base swatches
			Swatch.add("Black",getColorObject(0,0,0,255));
			Swatch.add("Grey",getColorObject(210,210,210,255));
			Swatch.add("White",getColorObject(255,255,255,255));
			Swatch.add("Red",getColorObject(255,0,0,255));
			Swatch.add("Green",getColorObject(0,255,0,255));
			Swatch.add("Blue",getColorObject(0,0,255,255));

		}

		//===============================================================
		//Swatches class: manages user defined colors
		var swatches = [], swatchId = 0; 
		var Swatch = function(name,color) {
			this.id = swatchId++;
			this.name = name;
			this.color = color;
			this.hex = getHex(color);
			this.rgba = getBackgroundCSS(color);
		}
		
		//Use a swatch
		Swatch.prototype.use = function() {
			color = this.color;
			Swatch.current = this;			
			$($color).trigger("use",this);
			return true;
		}

		//Current swatch in use
		Swatch.current = null;
				
		//Add a swatch
		Swatch.add = function(name,color) {
			var swatch = Swatch.current = new Swatch(name,color);
			var html = $($templates.swatch(swatch));
			swatches.push(swatch);
			$.ui.swatches.list.append(html);
			$($color).trigger("new");
			return swatch;
		}
		
		//Find a swatch and use it
		Swatch.use = function(name) {
			for(var i=0,l=swatches.length;i<l;i++) {
				if (swatches[i].name===name) {				
					return swatches[i].use();
				}
			}
			return false;
		}

		//Gets a list of swatches
		var getSwatches = function() {
			return swatches.map(function(i){
				return {name:i.name,color:i.color};
			});
		}
		
		//===============================================================
		//Color Wheel and helper functions

		//get the hue for a point
		wheel.getHue = function(x,y) {
			//Prerequisites: -1<=x<=1, -1<=y<=1
			var at2 = Math.atan2(y,x), tau = 2*Math.PI;
			return ((at2>0) ? at2:(tau + at2)) * 360/tau;
		}				
		
		//chromaonvert HSV to rgb
		wheel.hsvrgb = function(h,s,v) {
			//Prerequisites: 0<=h<=360, 0<=s<=1, 0<=v<=1			
			var rgb = [];
			var chroma = v*s;
			var H = h/60; //h'
			var x = 1-(chroma * (1-Math.abs(H%2-1)));
			chroma = 1-chroma;
			if (0<=H && H<1) rgb = [chroma,x,1]; 			
				else if (H<2) rgb = [x,chroma,1];
				else if (H<3) rgb = [1,chroma,x];
				else if (H<4) rgb = [1,x,chroma];
				else if (H<5) rgb = [x,1,chroma];
				else if (H<6) rgb = [chroma,1,x];
				else rgb = [0,0,0];
			return {r:parseInt(rgb[0]*255),g:parseInt(rgb[1]*255),b:parseInt(rgb[2]*255)}
		}
		
		//gets a pixel color from the wheel
		wheel.getPixel = function(x,y) {
				var p = (x+y*height)*4;
				return getColorObject(
					this.image.data[p+0],
					this.image.data[p+1],
					this.image.data[p+2],
					this.image.data[p+3]
				);
		}
				
		//draws the color wheel
		wheel.draw = function() {			
			var radius = 100;
			var diameter = radius*2;

			var img = surface.image;
			var data = img.data;
			
			var step = radius/10000;
			var x,y,i,x1,y1,w;
			var hue,sat,rgb;
			for(y1=-1;y1<=1;y1+=step) {			
				for(x1=-1;x1<=1;x1+=step) {
					sat = x1*x1+y1*y1;
					if(sat<=1) {
						hue = wheel.getHue(x1,y1);
						rgb = wheel.hsvrgb(hue,sat,1);
						x=parseInt((x1+1)*radius);
						y=parseInt((y1+1)*radius);
						i=(x+y*height)*4;
						//Plot
						data[i+0] = rgb.r;
						data[i+1] = rgb.g;
						data[i+2] = rgb.b;
						data[i+3] = 255;
					}
				}
			}
						
			surface.context.putImageData(img,0,0);
			
		}
		
		wheel.gradient = function(rgb) {
			
			var img = surface.image;
			var data = img.data;
			
			var miny = 210,maxy=300,x;
			var yd = (maxy-miny)/255;
			var rd = rgb.r/yd;
			var gd = rgb.g/yd;
			var bd = rgb.b/yd;
			var diff = function(c,y) { var yd2 = (maxy-y)/255; return c *= yd2;};
			for(var y=miny;y<maxy;y++) {
				rd = diff(rgb.r,y);
				gd = diff(rgb.g,y);
				bd = diff(rgb.b,y);
					
				for(var x=0;x<255;x++) {				
						i=(x+y*diameter)*4;
						//Plot
						data[i+0] = rd;
						data[i+1] = gd;
						data[i+2] = bd;
						data[i+3] = 255;
				}
			}
			
			surface.context.putImageData(img,0,0);

		}


		//===============================================================
		//Color utility functions
		var getColorObject = function(r,g,b,a) {
			 var rgba = {r:r,g:g,b:b,a:a};
			 return rgba;
		}		

		var getColorObjectFromCSS = function(rgba) {
			var s = rgba.substring(rgba.indexOf('(')+1,rgba.indexOf(')')).split(',');
			return {r:s.r,g:s.g,b:s.b,a:255};
		}		
		
		var getColorObjectFromHex = (function(hex) {
			if (!this.hexre.test(hex)) return {r:0,g:0,b:0,a:255}; //non hex number
			if (hex.length===7) hex = hex.substr(1);
			var r = parseInt(hex.substring(0,2),16);
			var g = parseInt(hex.substring(2,4),16);
			var b = parseInt(hex.substring(4,6),16);
			return {r:r,g:g,b:b,a:255};
		}).bind({hexre:/^\#?[a-f|A-F|0-9]{6,6}$/});

		var getBackgroundCSS = function(RGBA) {
			return "rgba(" + RGBA.r + "," + RGBA.g + "," + RGBA.b + "," + RGBA.a + ")"
		}
		
		var getHex = function (RGBA) {
			var r = RGBA.r.toString(16),
				g = RGBA.g.toString(16),
				b = RGBA.b.toString(16),

				hex = "#" +
			 		 (r.length==1?'0'+r:r) +
			 		 (g.length==1?'0'+g:g) +
			 		 (b.length==1?'0'+b:b);

				return hex;
		};
		
		var getHexA = function (RGBA) {
			 return getHex(RGBA) + " (" + RGBA.a + ")";
		};
		
		return {
			name:"swatches",
			load:load,
			getColor:function(){ return color; },
			setColor:function(rgba){ color = rgba },
			getSwatch:function() { return Swatch.current; },
			getHex:getHex,
			getHexA:getHexA,
			useSwatch:Swatch.use,
			getSwatches:getSwatches,
			getBackgroundCSS:getBackgroundCSS
		}
		
	})();
