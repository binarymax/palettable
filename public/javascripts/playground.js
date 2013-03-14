var $playground = window.$playground = (function() {

	var load = function(container) {
		
		$.ui.playground = container;
		$.ui.playground.list = container.find("#playground");
		
	};
	
	var _spriteid = 0;
	
	//===============================================================
	//Playground class
	var Playgrounds = [];
	var Playground = function(workspace,width,height) {
		var self = this;
		this.fps = 12;
		this.width = width;
		this.height = height;
		this.workspace = workspace;
		this.playInterval = -1;
		this.spriteIndex = -1;
		this.spriteShown = 0;
		this.sprites = [];
		
		workspace.jq.on("frame",function(e,frame){
			self.addSprite(frame).show();
		});
		
		this.play();
		
	};

	Playgrounds.add = function(workspace,width,height) {
		var playground = new Playground(workspace,width,height);
		Playgrounds.push(playground);
		return playground;
	};
	
	Playground.prototype.play = function(){
		var self = this;
		var time = (parseInt(1000/this.fps));
		if (this.playInterval<1) this.playInterval = setInterval(function(){self.next()},time);
	};
	Playground.prototype.stop = function(){
		clearInterval(this.playInterval);
	};
	Playground.prototype.next = function(){
		var self = this;
		this.spriteShown++;
		if (this.spriteShown===this.sprites.length) this.spriteShown = 0;
		for(var i=0,l=this.sprites.length;i<l;i++) {
			if(this.sprites[i].index===self.spriteShown) this.sprites[i].show();
			else this.sprites[i].hide();
		}
	};
	Playground.prototype.addSprite = function(frame){
		var sprite = new Sprite(frame,++this.spriteIndex,this.width,this.height);
		$.ui.playground.list.append(sprite);
		$.ui.playground.list.children(".cell").hide();
		sprite.context.drawImage(frame.canvas,0,0);
		this.sprites.push(sprite);
		return sprite;
	};
	
	//===============================================================
	//Sprite class
	var Sprite = function(frame,index,width,height) {

		var self = this;
		this.width = width;
		this.height = height;
		this.index = index;
		
		var jq = this.jq = $($templates.sprite({
			id:_spriteid++,
			width:this.width,
			height:this.height
		}));
		
		$.ui.playground.list.append(jq);
		
		this.sprite = jq.find(".sprite").canvas(width,height);
		this.spriteCanvas  = this.sprite[0];
		this.spriteContext = $(this.sprite).context();	
		
		frame.jq.on("change",function(e,frame){
			self.change(frame);
		});
		
	};

		Sprite.prototype = {
			get context() { return this.spriteContext; },
			get canvas() { return this.spriteCanvas; }			
		};
		Sprite.prototype.show = function(){ this.jq.show(); };
		Sprite.prototype.hide = function(){ this.jq.hide(); };
		Sprite.prototype.change = function(frame){
			this.context.drawImage(frame.thumb.canvas,0,0); 
		};
	
	
	return {
		name:"playground",
		load:load,
		add:Playgrounds.add
	};
	
})();