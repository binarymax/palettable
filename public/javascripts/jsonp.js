/*****************************************
* JSONP client
* 
* Author: Max Lovenheim Irwin
* Date:	 10/10/10
*
* Copyright(c) Max Lovenheim Irwin, 2010
*****************************************/

var JSONP = function(){	
	var timeoutId = 0;
	var timeoutCount = 0;
	var initialized = false;
	var successFunction;
	var failureFunction;
	
	//Gets the JSON data from the JSONP api
	function getRaw(url,callbackParam) {
		var TIMEOUT_IN_MILLISECONDS = 30000;
		var p = (url.indexOf('?')>-1)?'&':'?';
		var script = document.createElement("script");
		script.setAttribute("src",url + p + callbackParam + '=JSONP.callbackSuccess');
		script.setAttribute("type","text/javascript");                
		document.body.appendChild(script);
		timeoutId = setTimeout(JSONP.callbackCancel,TIMEOUT_IN_MILLISECONDS);
	}
			
	return {
		//Call this first!
		get:function(url,callbackParam,success,failure) {
			initialized=true;
			successFunction = success;
			failureFunction = failure;
			getRaw(url,callbackParam);
		},
		//success when calling API
		callbackSuccess:function(data) {
			clearTimeout(timeoutId);
			successFunction(data);
		},
		//timeout when calling API
		callbackCancel:function() {
			timeoutCount++;
			failureFunction();
		}
	};
	
}();