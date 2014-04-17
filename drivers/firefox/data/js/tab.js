(function() {
	var lastEnv = [];

	try {
		if ( document && document.documentElement && document.contentType === 'text/html' ) {
			var
				html = document.documentElement.outerHTML
				env = [];

			self.port.emit('log', 'init');

			if ( html.length > 50000 ) {
				html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
			}

			self.port.emit('analyze', {
				hostname: location.hostname,
				url:      location.href,
				analyze:  { html: html }
			});

			setTimeout(function() {
				var env = Object.keys(unsafeWindow).slice(0, 500);

				self.port.emit('analyze', {
					hostname: location.hostname,
					url:      location.href,
					analyze:  { env: env }
				});
			}, 1000);
		}
	} catch (e) { }
}());
