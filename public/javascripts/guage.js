/*
	MIT License
	Copyright (c) 2012, Max Irwin
*/

(function() {
	//
	// Makes a volume-style setting gauge
	//
	var Guage = function(input,min,max,val,callback){
		var self = this;
		var parent = input.parent();
		var gauge  = Guage.element(parent,"div","gauge");
		var flt = parseInt(min)!==min || parseInt(max)!==max;
		var inc = flt?(max-min)/Guage.lineCount:Math.round((max-min)/Guage.lineCount);
	
		this.input = input;
		this.gauge = gauge;
		this.lines = [];
		this.min = min;
		this.max = max;
		this.val = val;	
	
		for(var i=0,v=min;i<=Guage.lineCount;i++) {
			var line = $('<div class="guageline">&nbsp;&nbsp;</div>');
			line.data("value",v);			
			line.on("click",function(e) {
				var val = $(this).data("value"); 
				val = flt?parseFloat(val):parseInt(val); 
				self.change(val);
				callback(val);
			});
			this.lines.push({val:v,jq:line});
			v = (flt?Math.round((inc*(i+1))*100)/100:inc*(i+1)) + min;
		}
		this.change(val);
	}
	
	Guage.lineCount = 15;
	
	Guage.element = function(parent,type,cls,attrs) {
		var element = document.createElement(type);
		element.setAttribute("class",cls);
		for(i in attrs) {
			if(attrs.hasOwnProperty(i)) {
				element.setAttribute(i,attrs[i]);
			}
		}
		parent.append(element);
		return element;
	}	
	
	//Set input value and highlight gauge 
	Guage.prototype.change = function(val) {
		this.val = val;
		this.input.val(val);
		for(var i=0;i<=Guage.lineCount;i++) {
			var line = this.lines[i];
			if (val<line.val) {			
				line.jq.removeClass("on");
			} else {			
				line.jq.addClass("on");
			}
		}
	}

	$.guage = Guage;

})();