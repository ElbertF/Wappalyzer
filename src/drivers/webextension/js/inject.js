(function() {
	try {
		var i, environmentVars = '', e = document.createEvent('Events');

		e.initEvent('wappalyzerEvent', true, false);

		for ( i in window ) {
			environmentVars += i + ' ';
		}

		document.getElementById('wappalyzerData').appendChild(document.createComment(environmentVars));
		document.getElementById('wappalyzerData').dispatchEvent(e);
	} catch(e) {
		// Fail quietly
 	}
}());
