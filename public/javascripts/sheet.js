$sheets = window.$sheets = (function() {
	"use strict";
	
	var load = function(container) {
			$.ui.sheets = container;
			$.ui.sheets.list = container.find("#swatches");
			$.ui.sheets.append(canvasWheel.canvas(width,height));	
	};
	
	return {
		load:load,
		name:"sheets",
		title:"Sprite Sheet"
	}

})();
