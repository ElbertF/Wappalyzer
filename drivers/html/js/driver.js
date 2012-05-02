(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( console != null ) console[args.type](args.message);
		},

		/**
		 * Initialize
		 */
		init: function() {
			window.document.addEventListener('DOMContentLoaded', function() {
				w.analyze('google.com', 'http://google.com', {
					html:    '<script src="jquery.js"><meta name="generator" content="WordPress"/>',
					headers: { 'Server': 'Apache' },
					env:     [ 'Mootools' ]
				});
			});
		},

		/**
		 * Display apps
		 */
		displayApps: function(args) {
			document.getElementById('apps').innerHTML = '';

			args.apps.map(function(app) {
				document.getElementById('apps').innerHTML += '<img src="images/icons/' + app + '.png" width="16" height="16"/> ' + app + '<br/>';
			});
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
			window.open(args.url);
		}
	};

	w.init();
})();
