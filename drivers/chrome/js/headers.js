(function() {
	var c = {
		init: function() {
			c.log('init');

			c.getResponseHeaders();
		},

		log: function(message) {
			chrome.extension.sendRequest({ id: 'log', message: '[ content.js ] ' + message });
		},

		getResponseHeaders: function() {
			var xhr = new XMLHttpRequest();

			xhr.open('GET', window.location, true);

			xhr.onreadystatechange = function() {
				if ( xhr.readyState === 4 && xhr.status ) {
					var headers = xhr.getAllResponseHeaders().split("\n");

					if ( headers.length > 0 && headers[0] != '' ) {
						c.log('responseHeaders: ' + xhr.getAllResponseHeaders());

						var responseHeaders = {};

						headers.forEach(function(line) {
							if ( line ) {
								name  = line.substring(0, line.indexOf(': ')).toLowerCase();
								value = line.substring(line.indexOf(': ') + 2, line.length - 1);

								responseHeaders[name] = value;
							}
						});

						chrome.extension.sendRequest({ id: 'analyze', subject: { headers: responseHeaders } });
					}
				}
			}

			xhr.send();
		}
	}

	c.init();
})();
