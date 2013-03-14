var $settings = window.$settings = (function() {

	var load = function(container) {
		$.ui.settings = container;
		$.ui.settings.list = container.find("#settings");
	};
	
	//Settings Class
	var settingid = 0;
	var settingtypes = "slider checkbox textbox radio".split(" ");
	var Setting = function(parent,name,type,initial,min,max,divisions) {
		//verify that the type is OK:
		for(var i=0,l=settingtypes.length,foundtype=false;i<l;i++) if(settingtypes[i]==type) foundtype=true;
		if(!foundtype) throw new Error("Setting type [" + type + "] is not valid");
		
		//initialize Setting object
		this.id = "setting" + (++settingid);
		this.parent = parent;
		this.name = name;
		this.type = type;
		this.divisions = divisions;
		this.value = (this.divisions)?initial*divisions:initial;
		this.min = (this.divisions)?min*divisions:min;
		this.max = (this.divisions)?max*divisions:max;
	};
	
	Setting.prototype.val = function() {
			var val;
			if(arguments.length) {
				val = arguments[0];
				$("#"+this.id).val(val);
			} else { 
				val = $("#"+this.id).val();
			}
			this.value = (val.indexOf(".")>-1)?parseFloat(val):parseInt(val);
			return this.value;
	};
	
	//Renders a Setting to the UI
	Setting.prototype.render = function(parentElement) {  
		return Setting[this.type].call(this,parentElement);
	};
	
	Setting.container = function(parent) {
		var container = $("<ul></ul>");
		$(parent).append(container); 
		return container;
	};
	
	Setting.wrapper = function(name) {
		return $("<li class='setting'><span>"+name+":</span></li>");
	};
	
	//Static Setting UI functions
	Setting.slider = function(parentElement) {
			var self = this;
			var slidervalue = $("<input type='text' class='slidervalue'>");
			var slider = $("<div class='slider'></div>");
			var obj = Setting.wrapper(self.name);
			slider.append(slidervalue)
			obj.append(slider);
			parentElement.append(obj);
			slidervalue.attr("id",self.id);
			self.guage = new $.guage(slidervalue,self.min,self.max,self.value,function(guagevalue){
					self.value=guagevalue;					
					slidervalue.trigger("change");
			});	
	};
	
	Setting.checkbox = function(parentElement) {
	};
	
	Setting.textbox = function(parentElement) {
			var self = this;
			var textvalue = $("<input type='text' class='textvalue' />");
			var wrapper = $("<div class='wrapper'></div>");
			var obj = Setting.wrapper(self.name);
			wrapper.append(textvalue);
			obj.append(wrapper);
			parentElement.append(obj);
			textvalue.attr("id",self.id);	
	};
	
	Setting.action = function(parentElement) {
			var self = this;
			var textvalue = $("<input type='button' class='textvalue' />");
			var wrapper = $("<div class='wrapper'></div>");
			var obj = Setting.wrapper(self.name);
			wrapper.append(textvalue);
			obj.append(wrapper);
			parentElement.append(obj);
			textvalue.attr("id",self.id);
	};
	
	$.setting = Setting;
	
	//Public methods
	return {
		name:"settings",
		load:load
	};	

})();