"use strict";

(function() {
	var
		data    = {},
		lastEnv = [],
		prefs   = sendSyncMessage('wappalyzer', { action: 'get prefs' })[0]
		;

	addEventListener('DOMContentLoaded', function() {
		removeEventListener('DOMContentLoaded', onLoad, false);

		onLoad();
	}, false);

	function onLoad() {
		if ( content.document.contentType != 'text/html' ) {
			return;
		}

		if ( prefs.analyzeJavaScript && prefs.analyzeOnLoad ) {
			content.document.documentElement.addEventListener('load', function() {
				var env = Object.keys(content.wrappedJSObject).slice(0, 500);

				lastEnv = env;

				// Only analyze new variables
				env = { env: env.filter(function(i) { return lastEnv.indexOf(i) === -1; }) };

				if ( env.length ) {
					sendAsyncMessage('wappalyzer', {
						action: 'analyze',
						analyze: { env: env }
						});
				}

				env = null;

				removeEventListener('load', onLoad, true);
			}, true);
		}

		// HTML
		var html = content.document.documentElement.outerHTML;

		// Comments outside HTML
		//if ( content.document.lastChild.nodeType === 8 ) {
			//content.alert(content.document.lastChild.nodeValue);
		//}

		if ( html.length > 50000 ) {
			html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
		}

		data = { html: html };

		if ( prefs.analyzeJavaScript ) {
			data.env = Object.keys(content.wrappedJSObject).slice(0, 500);

			lastEnv = data.env;
		}

		sendAsyncMessage('wappalyzer', {
			action:   'analyze',
			hostname: content.location.hostname,
			url:      content.location.href,
			analyze:  data
			});

		data = null;
	}
})();
