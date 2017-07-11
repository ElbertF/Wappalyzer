/**
 * Wappalyzer v4
 *
 * Created by Elbert Alias <elbert@alias.io>
 *
 * License: GPLv3 http://www.gnu.org/licenses/gpl-3.0.txt
 */

var wappalyzer = (function() {
	//'use strict';

	/**
	 * Application class
	 */
	var Application = function(app, detected) {
		this.app             = app;
		this.confidence      = { };
		this.confidenceTotal = 0;
		this.detected        = Boolean(detected);
		this.excludes        = [ ];
		this.version         = '';
		this.versions        = [ ];
	};

	Application.prototype = {
		/**
		 * Calculate confidence total
		 */
		getConfidence: function() {
			var
				id,
				total = 0;

			for ( id in this.confidence ) {
				total += this.confidence[id];
			}

			return this.confidenceTotal = Math.min(total, 100);
		},

		/**
		 * Resolve version number (find the longest version number that contains all shorter detected version numbers)
		 */
		getVersion: function() {
			var i, resolved;

			if ( !this.versions.length ) {
				return;
			}

			this.versions.sort(function(a, b) {
				return a.length - b.length;
			});

			resolved = this.versions[0];

			for ( i = 1; i < this.versions.length; i++ ) {
				if ( this.versions[i].indexOf(resolved) === -1 ) {
					break;
				}

				resolved = this.versions[i];
			}

			return this.version = resolved;
		},

		setDetected: function(pattern, type, value, key) {
			this.detected = true;

			// Set confidence level
			this.confidence[type + ' ' + ( key ? key + ' ' : '' ) + pattern.regex] = pattern.confidence || 100;

			// Detect version number
			if ( pattern.version ) {
				var
					version = pattern.version,
					matches = pattern.regex.exec(value);

				if ( matches ) {
					matches.forEach(function(match, i) {
						// Parse ternary operator
						var ternary = new RegExp('\\\\' + i + '\\?([^:]+):(.*)$').exec(version);

						if ( ternary && ternary.length === 3 ) {
							version = version.replace(ternary[0], match ? ternary[1] : ternary[2]);
						}

						// Replace back references
						version = version.replace(new RegExp('\\\\' + i, 'g'), match || '');
					});

					if ( version && this.versions.indexOf(version) < 0 ) {
						this.versions.push(version);
					}

					this.getVersion();
				}
			}
		}
	};

	var asArray = function(value) {
		return typeof value === 'string' ? [ value ] : value;
	};

	/**
	 * Call driver functions
	 */
	var driver = function(func, args) {
		if ( typeof w.driver[func] !== 'function' ) {
			w.log('not implemented: w.driver.' + func, 'core', 'warn');

			return;
		}

		return w.driver[func](args);
	};

	/**
	 * Parse apps.json patterns
	 */
	var parsePatterns = function(patterns) {
		var
			key,
			parsed = {};

		// Convert string to object containing array containing string
		if ( typeof patterns === 'string' || patterns instanceof Array ) {
			patterns = {
				main: asArray(patterns)
			};
		}

		for ( key in patterns ) {
			parsed[key] = [];

			asArray(patterns[key]).forEach(function(pattern) {
				var attrs = {};

				pattern.split('\\;').forEach(function(attr, i) {
					if ( i ) {
						// Key value pairs
						attr = attr.split(':');

						if ( attr.length > 1 ) {
							attrs[attr.shift()] = attr.join(':');
						}
					} else {
						attrs.string = attr;

						try {
							attrs.regex = new RegExp(attr.replace('/', '\/'), 'i'); // Escape slashes in regular expression
						} catch (e) {
							attrs.regex = new RegExp();

							w.log(e + ': ' + attr, 'error', 'core');
						}
					}
				});

				parsed[key].push(attrs);
			});
		}

		// Convert back to array if the original pattern list was an array (or string)
		if ( parsed.hasOwnProperty('main') ) {
			parsed = parsed.main;
		}

		return parsed;
	};

	/**
	 * Main script
	 */
	var w = {
		apps: {},
		cats: null,
		ping: {
			hostnames: { }
		},
		adCache: [],
		detected: {},

		config: {
			websiteURL: 'https://wappalyzer.com/',
			twitterURL: 'https://twitter.com/Wappalyzer',
			githubURL: 'https://github.com/AliasIO/Wappalyzer',
		},

		validation: {
			hostname: /(www.)?((.+?)\.(([a-z]{2,3}\.)?[a-z]{2,6}))$/,
			hostnameBlacklist: /((local|dev(elopment)?|stag(e|ing)?|test(ing)?|demo(shop)?|admin|google|cache)\.|\/admin|\.local)/
		},

		/**
		 * Log messages to console
		 */
		log: function(message, source, type) {
			driver('log', {
				source: source || '',
				message: JSON.stringify(message),
				type: type || 'debug'
			});
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('Function call: w.init()', 'core');

			// Initialize driver
			if ( w.driver !== undefined ) {
				driver('init');
			} else {
				w.log('No driver, exiting', 'core');
			}
		},

		/**
		 * Analyze the request
		 */
		analyze: function(hostname, url, data) {
			var
				app,
				apps = {};

			w.log('Function call: w.analyze()', 'core');

			if ( w.apps === undefined || w.categories === undefined ) {
				w.log('apps.json not loaded, check for syntax errors', 'core');

				return;
			}

			// Remove hash from URL
			data.url = url = url.split('#')[0];

			if ( typeof data.html !== 'string' ) {
				data.html = '';
			}

			if ( w.detected[url] === undefined ) {
				w.detected[url] = {};
			}

			for ( app in w.apps ) {
				apps[app] = w.detected[url] && w.detected[url][app] ? w.detected[url][app] : new Application(app);

				if ( url ) {
					w.analyzeUrl(apps[app], url);
				}

				if ( data.html ) {
					w.analyzeHtml(apps[app], data.html);
					w.analyzeScript(apps[app], data.html);
					w.analyzeMeta(apps[app], data.html);
				}

				if ( data.headers ) {
					w.analyzeHeaders(apps[app], data.headers);
				}

				if ( data.env ) {
					w.analyzeEnv(apps[app], data.env);
				}
			}

			for ( app in apps ) {
				if ( !apps[app].detected ) {
					delete apps[app];
				}
			}

			w.resolveExcludes(apps);
			w.resolveImplies(apps, url);

			w.cacheDetectedApps(apps, url);
			w.trackDetectedApps(apps, url, hostname, data.html);

			if ( Object.keys(apps).length ) {
				w.log(Object.keys(apps).length + ' apps detected: ' + Object.keys(apps).join(', ') + ' on ' + url, 'core');
			}

			driver('displayApps');
		},

		resolveExcludes: function(apps) {
			var
				app,
				excludes = [];

			// Exclude app in detected apps only
			for ( app in apps ) {
				if ( w.apps[app].excludes ) {
					asArray(w.apps[app].excludes).forEach(function(excluded) {
						excludes.push(excluded);
					});
				}
			}

			// Remove excluded applications
			for ( app in apps ) {
				if ( excludes.indexOf(app) !== -1 ) {
					delete apps[app];
				}
			}
		},

		resolveImplies: function(apps, url) {
			var
				confidence,
				id,
				checkImplies = true;

			// Implied applications
			// Run several passes as implied apps may imply other apps
			while ( checkImplies ) {
				checkImplies = false;

				for ( app in apps ) {
					confidence = apps[app].confidence;

					if ( w.apps[app] && w.apps[app].implies ) {
						asArray(w.apps[app].implies).forEach(function(implied) {
							implied = parsePatterns(implied)[0];

							if ( !w.apps[implied.string] ) {
								w.log('Implied application ' + implied.string + ' does not exist', 'core', 'warn');

								return;
							}

							if ( !apps.hasOwnProperty(implied.string) ) {
								apps[implied.string] = w.detected[url] && w.detected[url][implied.string] ? w.detected[url][implied.string] : new Application(implied.string, true);

								checkImplies = true;
							}

							// Apply app confidence to implied app
							for ( id in confidence ) {
								apps[implied.string].confidence[id + ' implied by ' + app] = confidence[id] * ( implied.confidence ? implied.confidence / 100 : 1 );
							}
						});
					}
				}
			}
		},

		/**
		 * Cache detected applications
		 */
		cacheDetectedApps: function(apps, url) {
			var app, id, confidence;

			for ( app in apps ) {
				confidence = apps[app].confidence;

				// Per URL
				w.detected[url][app] = apps[app];

				for ( id in confidence ) {
					w.detected[url][app].confidence[id] = confidence[id];
				}
			}
		},

		checkAdCache: function() {
			if ( Object.keys(w.ping.hostnames).length >= 50 || w.adCache.length >= 50 ) {
				driver('ping');
			}
		},

		/**
		 * Track detected applications
		 */
		trackDetectedApps: function(apps, url, hostname, html) {
			var app, match;

			for ( app in apps ) {
				if ( w.detected[url][app].getConfidence() >= 100 && w.validation.hostname.test(hostname) && !w.validation.hostnameBlacklist.test(url) ) {
					if ( !w.ping.hostnames.hasOwnProperty(hostname) ) {
						w.ping.hostnames[hostname] = {
							applications: {},
							meta: {}
						};
					}

					if ( !w.ping.hostnames[hostname].applications.hasOwnProperty(app) ) {
						w.ping.hostnames[hostname].applications[app] = {
							hits: 0
						};
					}

					w.ping.hostnames[hostname].applications[app].hits ++;

					if ( apps[app].version ) {
						w.ping.hostnames[hostname].applications[app].version = apps[app].version;
					}
				}
			}

			// Additional information
			if ( w.ping.hostnames.hasOwnProperty(hostname) ) {
				match = html.match(/<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"/i);

				if ( match && match.length ) {
					w.ping.hostnames[hostname].meta['language'] = match[1];
				}
			}
			w.checkAdCache();
		},

		/**
		 * Analyze URL
		 */
		analyzeUrl: function(app, url) {
			var patterns = parsePatterns(w.apps[app.app].url);

			if ( patterns.length ) {
				patterns.forEach(function(pattern) {
					if ( pattern.regex.test(url) ) {
						app.setDetected(pattern, 'url', url);
					}
				});
			}
		},

		/**
		 * Analyze HTML
		 */
		analyzeHtml: function(app, html) {
			var patterns = parsePatterns(w.apps[app.app].html);

			if ( patterns.length ) {
				patterns.forEach(function(pattern) {
					if ( pattern.regex.test(html) ) {
						app.setDetected(pattern, 'html', html);
					}
				});
			}
		},

		/**
		 * Analyze script tag
		 */
		analyzeScript: function(app, html) {
			var
				regex = new RegExp('<script[^>]+src=("|\')([^"\']+)', 'ig'),
				patterns = parsePatterns(w.apps[app.app].script);

			if ( patterns.length ) {
				patterns.forEach(function(pattern) {
					var match;

					while ( (match = regex.exec(html)) ) {
						if ( pattern.regex.test(match[2]) ) {
							app.setDetected(pattern, 'script', match[2]);
						}
					}
				});
			}
		},

		/**
		 * Analyze meta tag
		 */
		analyzeMeta: function(app, html) {
			var
				content, match, meta,
				regex = /<meta[^>]+>/ig,
				patterns = parsePatterns(w.apps[app.app].meta);

			if ( patterns ) {
				while ( (match = regex.exec(html)) ) {
					for ( meta in patterns ) {
						if ( new RegExp('(name|property)=["\']' + meta + '["\']', 'i').test(match) ) {
							content = match.toString().match(/content=("|')([^"']+)("|')/i);

							patterns[meta].forEach(function(pattern) {
								if ( content && content.length === 4 && pattern.regex.test(content[2]) ) {
									app.setDetected(pattern, 'meta', content[2], meta);
								}
							});
						}
					}
				}
			}
		},

		/**
		 * analyze response headers
		 */
		analyzeHeaders: function(app, headers) {
			var
				header,
				patterns = parsePatterns(w.apps[app.app].headers);

			if ( headers ) {
				for ( header in patterns ) {
					patterns[header].forEach(function(pattern) {
						header = header.toLowerCase();

						if ( headers.hasOwnProperty(header) && pattern.regex.test(headers[header]) ) {
							app.setDetected(pattern, 'headers', headers[header], header);
						}
					});
				}
			}
		},

		/**
		 * Analyze environment variables
		 */
		analyzeEnv: function(app, envs) {
			var patterns = parsePatterns(w.apps[app.app].env);

			if ( patterns.length ) {
				patterns.forEach(function(pattern) {
					var env;

					for ( env in envs ) {
						if ( pattern.regex.test(envs[env]) ) {
							app.setDetected(pattern, 'env', envs[env]);
						}
					}
				});
			}
		}
	};

	return w;
})();

// CommonJS package
// See http://wiki.commonjs.org/wiki/CommonJS
if ( typeof exports === 'object' ) {
	exports.wappalyzer = wappalyzer;
}
