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
		hasOwn        = Object.prototype.hasOwnProperty,
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
			29: 'Search Engine',
			30: 'Web Mail',
			31: 'CDN',
			32: 'Marketing Automation',
			33: 'Web Server Extensions',
			34: 'Databases',
			35: 'Maps',
			36: 'Advertising Networks',
			37: 'Network Devices',
			38: 'Media Servers',
			39: 'Webcams',
			40: 'Printers',
			41: 'Payment Processors'
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
				first = true,
				category,
				html
				;

			html =
				'<a id="wappalyzer-close" href="javascript: window.document.body.removeChild(window.document.getElementById(\'wappalyzer-container\')); void(0);">' +
					'Close' +
				'</a>' +
				'<div id="wappalyzer-apps">'
				;

			if ( w.detected[url] != null && Object.keys(w.detected[url]).length ) {
				for ( app in w.detected[url] ) {
					if(!hasOwn.call(w.detected[url], app)) {
						continue;
					}
					html +=
						'<div class="wappalyzer-app' + ( first ? ' wappalyzer-first' : '' ) + '">' +
							'<a target="_blank" class="wappalyzer-application" href="' + w.config.websiteURL + 'applications/' + app.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '">' +
								'<strong>' +
									'<img src="' + w.config.websiteURL + 'bookmarklet/images/icons/' + w.apps[app].icon + '" width="16" height="16"/> ' + app +
								'</strong>' +
							'</a>'
							;

					for ( i in w.apps[app].cats ) {
						if(!hasOwn.call(w.apps[app].cats, i)) {
							continue;
						}
						category = w.apps[app].cats[i];

						html += '<a target="_blank" class="wappalyzer-category" href="' + w.config.websiteURL + 'categories/' + w.categories[category] + '">' + categoryNames[category] + '</a>';
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
		}
	};

	w.init();
})();
