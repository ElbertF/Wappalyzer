/**
 * Bookmarklet driver
 */

(function() {
	if ( wappalyzer == null ) return;

	var
		w             = wappalyzer,
		debug         = true
		d             = window.document,
		container     = d.getElementById('wappalyzer-container'),
		domain        = window.top.location.host,
		url           = window.top.location.href,
		categoryNames = {
			 1: 'CMS',
			 2: 'Message Board',
			 3: 'Database Manager',
			 4: 'Documentation Tool',
			 5: 'Widget',
			 6: 'Web Shop',
			 7: 'Photo Gallery',
			 8: 'Wiki',
			 9: 'Hosting Panel',
			10: 'Analytics',
			11: 'Blog',
			12: 'Javascript Framework',
			13: 'Issue Tracker',
			14: 'Video Player',
			15: 'Comment System',
			16: 'Captcha',
			17: 'Font Script',
			18: 'Web Framework',
			19: 'Miscellaneous',
			20: 'Editor',
			21: 'LMS',
			22: 'Web Server',
			23: 'Cache Tool',
			24: 'Rich Text Editor',
			25: 'Javascript Graphics',
			26: 'Mobile Framework',
			27: 'Programming Language',
			28: 'Operating System',
			29: 'Search Engine'
			}
		;

	w.driver = {
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

			var env = new Array;

			for ( i in window ) { env.push(i); }

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
							if ( line ) {
								name  = line.substring(0, line.indexOf(': '));
								value = line.substring(line.indexOf(': ') + 2, line.length - 1);

								responseHeaders[name] = value;
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
				category,
				html
				;

			html =
				'<a id="wappalyzer-close" href="javascript: window.document.body.removeChild(window.document.getElementById(\'wappalyzer-container\')); void(0);">' +
					'Close' +
				'</a>' +
				'<div id="wappalyzer-apps">'
				;

			if ( w.detected[url] != null && w.detected[url].length ) {
				w.detected[url].forEach(function(app, i) {
					html +=
						'<div class="wappalyzer-app' + ( !i ? ' wappalyzer-first' : '' ) + '">' +
							'<a target="_blank" class="wappalyzer-application" href="' + w.config.websiteURL + 'applications/' + app.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '">' +
								'<strong>' +
									'<img src="' + w.config.websiteURL + 'bookmarklet/images/icons/' + app + '.png" width="16" height="16"/> ' + app +
								'</strong>' +
							'</a>'
							;

					for ( cat in w.apps[app].cats ) {
						category = w.apps[app].cats[cat];

						html += '<a target="_blank" class="wappalyzer-category" href="' + w.config.websiteURL + 'categories/' + w.categories[category] + '">' + categoryNames[category] + '</a>';
					}

					html += '</div>';
				});
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
		}
	};

	w.init();
})();
