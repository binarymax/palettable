var $paint = window.$paint = (function($){
  
	//Full Arc in radians
	const _360 = 2 * Math.PI;

	//Image sizes variables
	var _width;
	var _height;
	var _size;

	//The palette of the image
	var _colors = [];
	var _colorshex = [];
	var _colornum = 0;

	var _panelid = 0;
		
	//Moustache templates
	_.templateSettings = { interpolate : /\{\{(.+?)\}\}/g };

	//------------------------------------------------------------------
	//Gets a querystring value:
	$.querystring = function(key,url){
	  url = url || window.location.search;
	  key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]"); 
	  var regex = new RegExp("[\\?&]"+key+"=([^&#]*)"); 
	  var results = regex.exec( url );
	  return (!results)?"":decodeURIComponent(results[1].replace(/\+/g, " "));
	};
	
	//------------------------------------------------------------------
	//Event builder:
	$.workerEvent = function(source,result,ready,message) {
		return function(event) {
			var data = event.data;
			switch (data.type) {
		        case "message":
			        console.log(data.data);
			        if(message) message(data.data);
			        break;
		        case "result":
		          result(data.data);
		          break;
		        case "ready":
		          ready(data.data);
		  	      break;
	     	}
		};	
	};
	
	//------------------------------------------------------------------
	//Palette Extractor Worker
	$.getColors = function(data,callback){
		var paletteworker = new Worker('/javascripts/paletteworker.js?random='+parseInt(Math.random()*100000).toString());
		paletteworker.onmessage = workerEvent("palette",callback);
		paletteworker.postMessage({'imagedata':data});
	};	
	
	//------------------------------------------------------------------
	//Coordinate normalizer 
	$.getMouseCoords = function(e,canvas) {
		var x,y,scale = canvas.data("scale")||1;
		if(typeof e.offsetX === "undefined") {x = e.pageX-canvas.offset().left; y = e.pageY-canvas.offset().top;} 
		else {x = e.offsetX;y = e.offsetY;}
		x = parseInt(x/scale);
		y = parseInt(y/scale);
		return {x:x,y:y,scale:scale};
	};

	//------------------------------------------------------------------	
	//Wraps events for consistent parameters
	$.getEventWrapper = function(delegate,obj) {
		var callback = delegate.bind(obj);
		return (function(e) {			
			e = e||window.event;
			callback($.getMouseCoords(e,$(this)));
			if(e.stopPropagation) e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			return false;
		});
	};
	
	//------------------------------------------------------------------
	//Initializes dimensions for the project
	$.initDimensions = function(width,height) {
		_width = width;
		_height = height;
		_size = _size||_width*_height*4;
	};
	

	//------------------------------------------------------------------	
	//Random number helpers
	$.rand1 = function(max){ return Math.floor(Math.random()*max); }
	$.rand2 = function(min,max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
					
	//------------------------------------------------------------------
	//Comparison worker
	$.compare = function(leftimage,rightimage,callback) {	

		//Make the worker and start the process:
		var worker = new Worker('/javascripts/compareworker.js?random='+parseInt(Math.random()*100000).toString());
		worker.onmessage = workerEvent("worker",checkDiff,nextGen);
		worker.postMessage({'type':'init','imagedata':imagedata});
	};
	
	//------------------------------------------------------------------
	//Saves the image to the server
	$.save = function(imgname,folder,callback) {
		var imgdata = document.getElementById("copy").toDataURL(); 
		$.ajax({
			type:'post',
			data:{'name':imgname,'folder':folder,'imgdata':imgdata},
			url:imgname + '?folder=' + folder
		}).done(callback);
	}
	
	//------------------------------------------------------------------
	//Initializes a canvas/div width and height
	$.fn.canvas = function(width,height,scale) {
		var canvas = this;
		scale = scale || 1;
		width  = parseInt(width||_width) * scale;
		height = parseInt(height||_height) * scale;
		canvas[0].width  = width;
		canvas[0].height = height;
		canvas.css("width",width + 'px');
		canvas.css("height",height + 'px');
		canvas.data("scale",scale);
		return canvas;
	};
	
	//------------------------------------------------------------------
	//Initializes the context of a canvas
	$.fn.context = function(fillStyle,scale) {
		var $canvas = this;
		var canvas = $canvas[0]
		var context = canvas.getContext("2d");
		scale = scale || 1;
		context.scale(scale,scale);

		context.clear = function() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			return context;
		};
		
		if (fillStyle) {
			context.fillStyle="#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
		}

		//Disable context smoothing, gives pixel perfect representation
		context.webkitImageSmoothingEnabled = false;
		context.mozImageSmoothingEnabled = false;
	    context.oImageSmoothingEnabled = false;
	    context.imageSmoothingEnabled = false;
		
		context.scaled = scale;
		return context;
	};
	
	$.nobubble = function(e) {
		if (e.stopPropagation) e.stopPropagation(); 
		if (e.preventDefault) e.preventDefault();
		return false;
	}
	
	$.fn.draggable = (function() {
		var _offset;
		var starter = function(target) {
			return function(e) { 
				_offset = target.offset();
				_offset = { top: e.pageY - _offset.top, left: e.pageX - _offset.left };			
				$(this).data("drag",true); 
				return $.nobubble(e); 
			};
		};
		
		var end = function(e) { 
			$(this).data("drag",false);
			return $.nobubble(e); 
		};
				
		var mover = function(target,delegate) { 
			return function(e) { 
				if($(this).find(delegate).data("drag")) {
					var top  = e.pageY - _offset.top + "px";
					var left = e.pageX - _offset.left + "px";
					target.css({top:top,left:left});
				} 
			}; 
		};
		
		return function(delegate) {
			if (!delegate) return false;
			var target = $(this);			
			target.on("mousedown",delegate,starter(target));
			target.on("mouseup",delegate,end);
			target.on("mousemove",mover(target,delegate));
		};
	})();
			
	//------------------------------------------------------------------
	//Shows a palette
	$.fn.showPalette = function(colors) {
		var p = this, context = null;
		if (p.length) context = $(canvas(p)).context();
		_colors   = colors;
		_colornum = colors.length;
		for(var i=0,n=_width/_colornum;i<_colornum;i++) {
			_colorshex.push('#' + _colors[i].color);
			if (context) {
				context.fillStyle=_colorshex[i];
				context.fillRect(i*n,0,i*n+n,i*n+_height);
			}
		};
	}

	
	//------------------------------------------------------------------
	//Events
	var onSizeClick = function(e){
		var size = $(this).text().split('x');
		$.workspace.add(size[0],size[1]);
		e.stopPropagation();
		return false;
	};
	
	var onSwatchClick = function(e) {
		$color.useSwatch($(this).attr("title"));
	};
	
	//------------------------------------------------------------------
	//Keyboard Shortcuts
	var initKeys = function(ui) {
		
		keypress.combo("semicolon",function(){
			ui.trigger("lines");
		});
		
		$('input[type=text]')
		    .bind("focus", keypress.stop_listening)
		    .bind("blur", keypress.listen);

	};
	
	//------------------------------------------------------------------
	//Load helper
	var load = function() {
		var total = 0, lastheight=0;
		for(var i=0,l=arguments.length;i<l;i++) {
			var item = arguments[i];
			var height = item.height||300; 
			var panel = $($templates.panel({
				id:_panelid,
				title:item.title,
				name:item.name,
				panelwidth:item.width||400,
				panelheight:height,
				top:item.top || lastheight + 50
			}));
			panel.draggable(".move");
			lastheight += height;
			$.ui.paint.append(panel);
			$.ui[item.name] = panel;
			item.load(panel.find(".content"));
		};
	};

	//------------------------------------------------------------------
	//Document Ready:
	$(function(){

		//Initialize Templates:
		var $templates = window.$templates = {};
		$('script[type="text/template"]').each(function(){
			var $self = $(this);
			var type  = $self.attr('data-type');
			var prnt  = $self.attr('data-inherit');
			if (prnt && prnt.length) {
				prnt = prnt.split('#');
				var container = "." + (prnt[1] || "content") + ":first";
				var $parent = $($templates[(prnt[0]||"panel")]);
				$parent.find(container).append($self.html());
				console.log($parent.html);
				//$templates[type] = _.template($parent.html());
				
			} else {
				$templates[type] = _.template($self.html());
			}
			
		});

		//Declare global UI objects
		$.ui = $("<ui></ui>");
		$.ui.paint = $("#paint");
		$.ui.sizes = $("#sizes");		
		//$.ui.toolsettings = $("#toolsettings")

		//Load the modules
		load($playground,$color,$settings,$tools);

		//Initialize events
		$.ui.sizes.on("click","li",onSizeClick);
		
		//Initialize events
		$.ui.paint.on("click",".swatch",onSwatchClick);


		initKeys($.ui);
		
		$('.size[data-size="32"]').trigger("click");
		
	});
  
  //Main modules array
  var modules = [];
  var Module  = function(obj) {
    var self = this;
    _.each(obj,function(value,name){self[name] = value;});
		modules[self.name] = self;
 	};
  
  //Public functions
  function addModule(obj) {
    var mod = new Module(obj);
    mod.load(this);
 	};
   
  return addModule;

})(jQuery);