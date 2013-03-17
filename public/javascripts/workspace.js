var $workspace = window.$workspace = (function() {

	var _workspaceid = 0;
	var _workspace = -1;
	var _frameid = 0;
	var _layerid = 0;

	var _frame;

	//===============================================================
	//Workspace class
	var Workspaces = [];
	var Workspace = function(width,height){
		var id = this.id = _workspaceid++;
		var self = this;
		var scale = this.scale = 16;
		var scalewidth = this.scalewidth = width*scale;
		var scaleheight = this.scaleheight = height*scale;

		this.width = width;
		this.height = height;
		
		var jq = this.jq = $($templates.workspace({
			id:self.id,
			title:width + 'x' + height,
			name:"workspace",
			width:width,
			height:height,
			scalewidth:scalewidth,
			scaleheight:scaleheight,
			panelwidth:scalewidth+width*2,
			panelheight:scaleheight+160
		}));

		//Frames
		this.activeFrame = -1;
		this.frames = [];
		
		//Colors
		this.swatch = $color.getSwatch();
		this.swatches = [];

		$.ui.paint.append(jq);
		
		// - - - - - - - - - - - - - - 
		//Events
		$($color).on("use",function(e,swatch) {
			self.useColor(swatch); 
		});
		
		$.ui.on("lines",function(){
			jq.find(".lines").toggle();
		});

		jq.on("click",".addframe",function(){
			self.addFrame();
		});

		jq.on("click",".cloneframe",function(){
			self.cloneFrame();
		});
		
		jq.on("click",".saveframe",function(){
			self.saveFrame();
		});

		jq.on("click",".thumb",function(e){
			var thumb = $(this);
			var frameid = parseInt(thumb.attr("data-frameid"));
			jq.find(".thumb").removeClass("active");
			thumb.addClass("active");
			self.useFrame(frameid);
		});
		
		jq.draggable(".move");

		//Playground
		self.playground = $playground.add(self,width,height);

		//Add the Frame
		jq.find(".addframe").trigger("click");
		
		//Add to the list		
		Workspaces.push(this);
		
	};
	
		//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
		//Prototypes
		Workspace.prototype = { 
			get frame() { return this.frames[this.activeFrame]; }
		};
		Workspace.prototype.focus = function(){};
		Workspace.prototype.move = function(){};
		Workspace.prototype.maximize = function(){};
		Workspace.prototype.addFrame = function(){
			var frame = new Frame(this);
			_frame = frame;
			this.frames.push(frame);
			this.jq.trigger("frame",frame);
			this.useFrame(_frame.id);
			return frame;
		};
		Workspace.prototype.cloneFrame = function(){
			var frame = new Frame(this);
			frame.thumb.context.drawImage(_frame.thumb.canvas,0,0);
			frame.context.drawImage(_frame.thumb.canvas,0,0);
			_frame = frame;
			this.activeFrame++;
			this.frames.push(frame);
			this.useFrame(this.activeFrame);
			this.jq.trigger("frame",frame);			
			return frame;
		};
		Workspace.prototype.useFrame = function(frameid){
			var self = this;	
			for(var i=0,l=this.frames.length;i<l;i++) {
				if (this.frames[i].id!==frameid) {
					this.frames[i].hide();
				} else {
					this.frames[i].show();					
					_frame = this.frames[i];
					self.activeFrame = _frame.id;
					self.jq.find(".thumb").removeClass("active");
					self.jq.find(".thumb[data-frameid="+_frame.id+"]").addClass("active");
				}
			}
		};
		Workspace.prototype.useColor = function(swatch) {
			var self = this;
			var swatches = self.swatches;
			for (var i=0,l=swatches.length,found=false;i<l && !found;i++) {
				if (swatches[i].name===swatch.name) found=true;
			}
			self.swatch = swatch;
			if(!found) {
				self.swatches.push(swatch);
				self.jq.find(".colors").append($($templates.swatch(swatch)));
			}
			return swatch;
		};
		
		//Temporary to get some basic images:
		Workspace.prototype.saveFrame = function() {
			var uri = _frame.thumb.canvas.toDataURL("image/png").replace("image/png","image/octet-stream");
			document.location.href=uri;
		};
	
		$.workspace = {
			add : function(width,height){
				_workspace++; 
				return new Workspace(width,height); 
			},
			draw: function(delegate) {
				setTimeout(function(){
					
					delegate.call(_frame,_frame.thumb.context);
					var select = _frame.thumb.selection;
					if (select) {
						var copy = _frame.thumb.context.getImageData(select.x0,select.y0,select.width,select.height);
						_frame.thumb.context.clear().putImageData(copy,select.x0,select.y0);
					}
					_frame.context.clear().drawImage(_frame.thumb.canvas,0,0);
					_frame.jq.trigger("change",_frame);
				},0); 
			},
			preview: function(delegate) { 
				setTimeout(function(){
					delegate.call(_frame,_frame.thumb.preview().context.clear());
					var select = _frame.thumb.selection;
					if (select) {
						var copy = _frame.thumb.preview().context.getImageData(select.x0,select.y0,select.width,select.height);
						_frame.thumb.preview().context.clear().putImageData(copy,select.x0,select.y0);
					}					
					_frame.preview().context.clear().drawImage(_frame.thumb.preview().canvas,0,0);
				},0); 
			},
			styler: function(delegate) {
				setTimeout(function(){
					delegate.call(_frame,_frame.styler);
					//_frame.styler.clear().drawImage(_frame.styler.canvas,0,0);
				},0); 
			},

		};
	
	//===============================================================
	//Frames
	var Frame = function(workspace) {
		var id = this.id = _frameid++;
		var self = this;		
		var scale = this.scale = workspace.scale;
		var width = this.width = workspace.width;
		var height = this.height = workspace.height;
		var scalewidth = this.scalewidth = workspace.width*scale;
		var scaleheight = this.scaleheight = workspace.height*scale;
		
		var $parent = this.$parent = workspace.jq;
		var jq = this.jq = $($templates.frame({id:self.id}));
		$parent.find(".frames").append(jq);

		this.grid = jq.find(".grid").canvas(width,height,scale);
		this.gridCanvas = this.grid[0];
		this.gridContext = $(this.grid).context(null,scale);

		this.buffer = jq.find(".buffer").canvas(width,height,scale);
		this.bufferCanvas  = this.buffer[0];
		this.bufferContext = $(this.buffer).context(null,scale);

		this.stylerDiv = jq.find(".styler").canvas(width,height,scale);
		this.stylerDiv.clear = function() { self.stylerDiv.children(".outline1,.outline2").remove(); return self.stylerDiv; };
		
		this.lines = jq.find(".lines").canvas(scalewidth,scaleheight);
		this.linesCanvas  = this.lines[0];
		this.linesContext = $(this.lines).context();

		this.paintable = jq.find(".paintable").canvas(width,height,scale);
		this.paintableCanvas  = this.paintable[0];
		this.paintableContext = $(this.paintable).context(null,scale);

		gridLines(this.linesContext,width,height,scale);
		
		this.thumb = new Thumb(self);
		jq.attr("data-thumbid",this.thumb.id);
		
	};
	
		//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
		//Prototypes
		Frame.prototype = {
			get context() { return this.gridContext; },
			get canvas() { return this.gridCanvas; },
			get styler()   { return this.stylerDiv; }
		};
		Frame.prototype.preview = function() {
			var self = this;
			return {
				get context () { return self.bufferContext; },
				get canvas ()  { return self.bufferCanvas; }
			};
		};		
		Frame.prototype.hide = function(){ this.jq.hide(); };
		Frame.prototype.show = function(){ this.jq.show(); };

	
	//===============================================================
	//Thumbs
	var Thumb = function(frame) {
		var self = this;
		var scale = this.scale = frame.scale;
		var id = this.id = _layerid++;
		var width = this.width = frame.width;
		var height = this.height = frame.height;
		var scalewidth = this.scalewidth = frame.width*scale;
		var scaleheight = this.scaleheight = frame.height*scale;

		var $parent = this.$parent = frame.jq;
		var $workspace = this.$workspace = $parent.parents(".workspace:first");
		var jq = this.jq = $($templates.thumb({id:self.id,frameid:frame.id}));
		$workspace.find(".thumbs").append(jq);

		this.tiny = jq.find(".tiny").canvas(width,height);
		this.tinyCanvas  = this.tiny[0];
		this.tinyContext = $(this.tiny).context();

		this.buffer = jq.find(".buffer").canvas(width,height);
		this.bufferCanvas  = this.buffer[0];
		this.bufferContext = $(this.buffer).context();
		
		this.selection = null;

	};
	
		//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
		//Prototypes
		Thumb.prototype = {
			get context() { return this.tinyContext; },
			get canvas() { return this.tinyCanvas; }
		};
		Thumb.prototype.preview = function() {
			var self = this;
			return {
				get context () { return self.bufferContext; },
				get canvas ()  { return self.bufferCanvas; }
			};
		};

	
	//===============================================================
	var gridLines = function(g,width,height,scale) {
		var strokeStyle = "rgba(200,200,255,0.5)"; 
		var rgba = {r:200,g:200,b:255,a:255};
		for(var x=0;x<width;x++){
			$tools.bresehnam(x*scale,0,x*scale,height*scale,g,width*scale,height*scale,rgba);
			/*
			g.beginPath();			
			g.strokeStyle = strokeStyle;
			g.strokeWidth = 1;
			g.moveTo(x*scale,0);
			g.lineTo(x*scale,height*scale);
			g.closePath();
			g.stroke();
			*/			
		}
		
		for(var y=0;y<height;y++){
			$tools.bresehnam(0,y*scale,width*scale,y*scale,g,width*scale,height*scale,rgba);
			/*
			g.beginPath();			
			g.strokeStyle = strokeStyle;
			g.strokeWidth = 1;
			g.moveTo(0,y*scale);
			g.lineTo(width*scale,y*scale);
			g.closePath();
			g.stroke();
			*/			
		}			
	}

	return Workspace;

})();