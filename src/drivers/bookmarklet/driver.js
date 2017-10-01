/**
 * WebExtension driver
 */

/** global: wappalyzer */
/** global: XMLHttpRequest */

(function() {
	if ( typeof wappalyzer === 'undefined' ) {
		return;
	}

	var
		w             = wappalyzer,
		debug         = true,
		d             = window.document,
		container     = d.getElementById('wappalyzer-container'),
		domain        = window.top.location.host,
		url           = window.top.location.href.replace(/#.*$/, ''),
		hasOwn        = Object.prototype.hasOwnProperty;

	w.driver = {
		timeout: 1000,

		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( debug && console != null && console[args.type] != null ) {
				console[args.type](args.message);
			}
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.driver.getEnvironmentVars();
			w.driver.getResponseHeaders();
		},

		getEnvironmentVars: function() {
			w.log('func: getEnvironmentVars');

			var i, env = [];

			for ( i in window ) {
				env.push(i);
			}

			w.analyze(domain, url, { html: d.documentElement.innerHTML, env: env });
		},

		getResponseHeaders: function() {
			w.log('func: getResponseHeaders');

			var xhr = new XMLHttpRequest();

			xhr.open('GET', url, true);

			xhr.onreadystatechange = function() {
				if ( xhr.readyState === 4 && xhr.status ) {
					var headers = xhr.getAllResponseHeaders().split("\n");

					if ( headers.length > 0 && headers[0] != '' ) {
						w.log('responseHeaders: ' + xhr.getAllResponseHeaders());

						var responseHeaders = {};

						headers.forEach(function(line) {
							var name, value;

							if ( line ) {
								name  = line.substring(0, line.indexOf(': '));
								value = line.substring(line.indexOf(': ') + 2, line.length - 1);

								responseHeaders[name.toLowerCase()] = value;
							}
						});

						w.analyze(domain, url, { headers: responseHeaders });
					}
				}
			}

			xhr.send();
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			w.log('func: diplayApps');

			var
				i,
				first = true,
				app,
				category,
				html;

			html =
				'<a id="wappalyzer-close" href="javascript: window.document.body.removeChild(window.document.getElementById(\'wappalyzer-container\')); void(0);">' +
					'Close' +
				'</a>' +
				'<div id="wappalyzer-apps">';

			if ( detected[url] != null && Object.keys(detected[url]).length ) {
				for ( app in detected[url] ) {
					if ( !hasOwn.call(detected[url], app) ) {
						continue;
					}

					html +=
						'<div class="wappalyzer-app' + ( first ? ' wappalyzer-first' : '' ) + '">' +
							'<a target="_blank" class="wappalyzer-application" href="' + w.config.websiteURL + 'applications/' + app.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '">' +
								'<strong>' +
									'<img src="' + w.config.websiteURL + 'images/icons/' + (w.apps[app].icon || 'default.svg') + '" width="16" height="16"/> ' + app +
								'</strong>' +
							'</a>';

					for ( i in w.apps[app].cats ) {
						if ( !hasOwn.call(w.apps[app].cats, i) ) {
							continue;
						}

						category = w.categories[w.apps[app].cats[i]].name;

						html += '<a target="_blank" class="wappalyzer-category" href="' + w.config.websiteURL + 'categories/' + w.driver.slugify(category) + '">' + category + '</a>';
					}

					html += '</div>';

					first = false;
				}
			} else {
				html += '<div id="wappalyzer-empty">No applications detected</div>';
			}

			html += '</div>';

			container.innerHTML = html;
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
			window.open(args.url);
		},

		slugify: function(string) {
			return string.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
		}
	};

	w.driver.init();
})();
