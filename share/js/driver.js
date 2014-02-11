var w = wappalyzer;

w.driver = {
	debug: false,
	data: {},
	timeout: 5000,

	/**
	 * Log messages to console
	 */
	log: function(args) {
		if ( w.driver.debug ) { print(args.type + ': ' + args.message + "\n"); }
	},

	/**
	 * Initialize
	 */
	init: function() {
		var app, apps = {};

		w.analyze(w.driver.data.host, w.driver.data.url, {
			html:    w.driver.data.html,
			headers: w.driver.data.headers
		});

		for ( app in w.detected[w.driver.data.url] ) {
			apps[app] = {
				categories: [],
				confidence: w.detected[w.driver.data.url][app].confidenceTotal,
				version:    w.detected[w.driver.data.url][app].version
				};

			w.apps[app].cats.forEach(function(cat) {
				apps[app].categories.push(w.categories[cat]);
			});
		};

		return JSON.stringify(apps);
	},

	/**
	 * Dummy
	 */
	displayApps: function() {
	}
};
