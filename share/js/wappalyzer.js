/**
 * Wappalyzer v2
 *
 * Created by Elbert F <info@elbertf.com>
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
		this.confidence      = {};
		this.confidenceTotal = 0;
		this.detected        = Boolean(detected);
		this.version         = '';
		this.versions        = [];
	};

	Application.prototype = {
		/**
		 * Calculate confidence total
		 */
		getConfidence: function() {
			var total = 0;

			for ( id in this.confidence ) {
				total += this.confidence[id];
			}

			return this.confidenceTotal = Math.min(total, 100);
		},

		/**
		 * Resolve version number (find the longest version number that contains all shorter detected version numbers)
		 */
		getVersion: function() {
			var i, next, resolved;

			if ( !this.versions.length ) {
				return;
			}

			this.versions.sort(function(a, b) {
				return a.length > b.length ? 1 : ( a.length < b.length ? -1 : 0 );
			});

			resolved = this.versions[0];

			for ( i in this.versions ) {
				next = parseInt(i) + 1;

				if ( next < this.versions.length ) {
					if ( this.versions[next].indexOf(this.versions[i]) !== -1 ) {
						resolved = this.versions[next];
					} else {
						break;
					}
				}
			}

			return this.version = resolved;
		},

		setDetected: function(pattern, type, value, key) {
			this.detected = true;

			// Set confidence level
			this.confidence[type + ' ' + ( key ? key + ' ' : '' ) + pattern.regex] = pattern.confidence ? pattern.confidence : 100;

			// Detect version number
			if ( pattern.version ) {
				var
					version = pattern.version,
					matches = pattern.regex.exec(value)
					;

				w.log({ matches: matches, version: version });

				if ( matches ) {
					matches.map(function(match, i) {
						// Parse ternary operator
						var ternary = new RegExp('\\\\' + i + '\\?([^:]+):(.+)$').exec(version);

						if ( ternary && ternary.length === 3 ) {

							w.log({ match: match, i: i, ternary: ternary });

							version = version.replace(ternary[0], match ? ternary[1] : ternary[2]);

							w.log({ version: version });
						}

						// Replace back references
						version = version.replace('\\' + i, match ? match : '');
					});

					if ( version ) {
						this.versions.push(version);
					}

					this.getVersion();
				}
			}
		}
	};

	var Profiler = function() {
		this.regexCount = 0;
		this.startTime  = new Date().getTime();
		this.lastTime   = new Date().getTime();
		this.slowest    = { duration: null, app: '', type: '', pattern: '' };
		this.timedOut   = false;
	};

	Profiler.prototype = {
		checkPoint: function(app, type, regex) {
			var duration = new Date().getTime() - this.lastTime;

			if ( !this.slowest.duration || duration > this.slowest.duration ) {
				this.slowest.duration = duration;
				this.slowest.app      = app;
				this.slowest.type     = type;
				this.slowest.regex    = regex;
			}
			this.regexCount++;
			this.lastTime = new Date().getTime();

			this.timedOut = this.getDuration() > 1000;
		},

		getDuration: function() {
			return new Date().getTime() - this.startTime;
		}
	};

	/**
	 * Call driver functions
	 */
	var driver = function(func, args) {
		if ( typeof w.driver[func] !== 'function' ) {
			w.log('not implemented: w.driver.' + func, 'warn');

			return;
		}

		if ( func !== 'log' ) { w.log('w.driver.' + func); }

		return w.driver[func](args);
	};

	/**
	 * Parse apps.json patterns
	 */
	var parse = function(patterns) {
		var
			attrs,
			parsed = []
			;

		// Convert single patterns to an array
		if ( typeof patterns === 'string' ) {
			patterns = [ patterns ];
		}

		patterns.map(function(pattern) {
			attrs = {};

			pattern.split('\\;').map(function(attr, i) {
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

						w.log(e + ': ' + attr, 'warn');
					}
				}
			});

			parsed.push(attrs);
		});

		return parsed;
	};

	/**
	 * Main script
	 */
	var w = {
		apps:     {},
		cats:     null,
		ping:     { hostnames: {} },
		detected: {},

		config: {
			environment: 'dev', // dev | live
			websiteURL: 'http://wappalyzer.com/',
			twitterURL: 'https://twitter.com/Wappalyzer',
			githubURL:  'https://github.com/ElbertF/Wappalyzer',
		},

		/**
		 * Log messages to console
		 */
		log: function(message, type) {
			if ( w.config.environment === 'dev' ) {
				if ( typeof type === 'undefined' ) {
					type = 'debug';
				}

				if ( typeof message === 'object' ) {
					message = JSON.stringify(message);
				}

				driver('log', { message: '[wappalyzer ' + type + '] ' + message, type: type });
			}
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('w.init');

			// Checks
			if ( typeof w.driver === 'undefined' ) {
				w.log('no driver, exiting');

				return;
			}

			// Initialize driver
			driver('init');
		},

		/**
		 * Analyze the request
		 */
		analyze: function(hostname, url, data) {
			var
				i, j, app, confidence, type, regexMeta, regexScript, match, content, meta, header, version,
				profiler = new Profiler(),
				apps     = {}
				;

			w.log('w.analyze');

			data.url = url = url.split('#')[0];

			if ( typeof w.apps === 'undefined' || typeof w.categories === 'undefined' ) {
				w.log('apps.json not loaded, check for syntax errors');

				return;
			}

			if ( typeof w.detected[url] === 'undefined' ) {
				w.detected[url] = {};
			}

			for ( app in w.apps ) {
				// Exit loop after one second to prevent CPU hogging
				// Remaining patterns will not be evaluated
				if ( profiler.timedOut ) {
					w.log('Timeout, exiting loop');

					break;
				}

				apps[app] = w.detected[url] && w.detected[url][app] ? w.detected[url][app] : new Application(app);

				for ( type in w.apps[app] ) {
					switch ( type ) {
						case 'url':
							parse(w.apps[app][type]).map(function(pattern) {

								if ( pattern.regex.test(url) ) {
									apps[app].setDetected(pattern, type, url);
								}
							profiler.checkPoint(app, type, pattern.regex);
							});

							break;
						case 'html':
							if ( typeof data[type] !== 'string' || !data.html ) {
								break;
							}

							parse(w.apps[app][type]).map(function(pattern) {

								if ( pattern.regex.test(data[type]) ) {
									apps[app].setDetected(pattern, type, data[type]);
								}
							profiler.checkPoint(app, type, pattern.regex);
							});

							break;
						case 'script':
							if ( typeof data.html !== 'string' || !data.html ) {
								break;
							}

							regexScript = new RegExp('<script[^>]+src=("|\')([^"\']+)', 'ig');

							parse(w.apps[app][type]).map(function(pattern) {

								while ( match = regexScript.exec(data.html) ) {
									if ( pattern.regex.test(match[2]) ) {
										apps[app].setDetected(pattern, type, match[2]);
									}
								}
							profiler.checkPoint(app, type, pattern.regex);
							});

							break;
						case 'meta':
							if ( typeof data.html !== 'string' || !data.html ) {
								break;
							}

							regexMeta = /<meta[^>]+>/ig;

							while ( match = regexMeta.exec(data.html) ) {
								for ( meta in w.apps[app][type] ) {
									profiler.checkPoint(app, type, regexMeta);

									if ( new RegExp('name=["\']' + meta + '["\']', 'i').test(match) ) {
										content = match.toString().match(/content=("|')([^"']+)("|')/i);

										parse(w.apps[app].meta[meta]).map(function(pattern) {

											if ( content && content.length === 4 && pattern.regex.test(content[2]) ) {
												apps[app].setDetected(pattern, type, content[2], meta);
											}
										profiler.checkPoint(app, type, pattern.regex);
										});
									}
								}
							}

							break;
						case 'headers':
							if ( typeof data[type] !== 'object' || !data[type] ) {
								break;
							}

							for ( header in w.apps[app].headers ) {
								parse(w.apps[app][type][header]).map(function(pattern) {

									if ( typeof data[type][header] === 'string' && pattern.regex.test(data[type][header]) ) {
										apps[app].setDetected(pattern, type, data[type][header], header);
									}
									profiler.checkPoint(app, type, pattern.regex);
								});
							}

							break;
						case 'env':
							if ( typeof data[type] !== 'object' || !data[type] ) {
								break;
							}

							parse(w.apps[app][type]).map(function(pattern) {
								for ( i in data[type] ) {

									if ( pattern.regex.test(data[type][i]) ) {
										apps[app].setDetected(pattern, type, data[type][i]);
									}
								}
							profiler.checkPoint(app, type, pattern.regex);
							});

							break;
					}
				}
			}

			w.log('[ PROFILER ] Tested ' + profiler.regexCount + ' regular expressions in ' + ( profiler.getDuration() / 1000 ) + 's');
			w.log('[ PROFILER ] Slowest pattern took ' + ( profiler.slowest.duration / 1000 ) + 's: ' + profiler.slowest.app + ' | ' + profiler.slowest.type + ' | ' + profiler.slowest.regex);

			for ( app in apps ) {
				if ( !apps[app].detected ) {
					delete apps[app];
				}
			}

			// Implied applications
			// Run several passes as implied apps may imply other apps
			for ( i = 0; i < 3; i ++ ) {
				for ( app in apps ) {
					confidence = apps[app].confidence;

					if ( w.apps[app] && w.apps[app].implies ) {
						// Cast strings to an array
						if ( typeof w.apps[app].implies === 'string' ) {
							w.apps[app].implies = [ w.apps[app].implies ];
						}

						w.apps[app].implies.map(function(implied) {
							implied = parse(implied)[0];

							if ( !w.apps[implied.string] ) {
								w.log('Implied application ' + implied.string + ' does not exist', 'warn');

								return;
							}

							if ( !apps.hasOwnProperty(implied.string) ) {
								apps[implied.string] = w.detected[url] && w.detected[url][implied.string] ? w.detected[url][implied.string] : new Application(implied.string, true);
							}

							// Apply app confidence to implied app
							for ( id in confidence ) {
								apps[implied.string].confidence[id + ' implied by ' + app] = confidence[id] * ( implied.confidence ? implied.confidence / 100 : 1 );
							}
						});
					}
				}
			}

			w.log(Object.keys(apps).length + ' apps detected: ' + Object.keys(apps).join(', ') + ' on ' + url);

			// Keep history of detected apps
			for ( app in apps ) {
				confidence = apps[app].confidence;
				version    = apps[app].version;

				// Per URL
				w.detected[url][app] = apps[app];

				for ( id in confidence ) {
					w.detected[url][app].confidence[id] = confidence[id];
				}

				if ( w.detected[url][app].getConfidence() >= 100 ) {
					// Per hostname
					if ( /(www.)?((.+?)\.(([a-z]{2,3}\.)?[a-z]{2,6}))$/.test(hostname) && !/((local|dev(elopment)?|stag(e|ing)?|test(ing)?|demo(shop)?|admin|google)\.|\/admin|\.local)/.test(url) ) {
						if ( !w.ping.hostnames.hasOwnProperty(hostname) ) {
							w.ping.hostnames[hostname] = { applications: {}, meta: {} };
						}

						if ( !w.ping.hostnames[hostname].applications.hasOwnProperty(app) ) {
							w.ping.hostnames[hostname].applications[app] = { hits: 0 };
						}

						w.ping.hostnames[hostname].applications[app].hits ++;

						if ( version ) {
							w.ping.hostnames[hostname].applications[app].version = version;
						}
					} else {
						w.log('Ignoring hostname "' + hostname + '"');
					}
				}
			}

			// Additional information
			if ( w.ping.hostnames.hasOwnProperty(hostname) ) {
				if ( typeof data.html === 'string' && data.html ) {
					match = data.html.match(/<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"/i);

					if ( match && match.length ) {
						w.ping.hostnames[hostname].meta['language'] = match[1];
					}

					regexMeta = /<meta[^>]+>/ig;

					while ( match = regexMeta.exec(data.html) ) {
						if ( !match.length ) { continue; }

						match = match[0].match(/name="(author|copyright|country|description|keywords)"[^>]*content="([^"]+)"/i);

						if ( match && match.length === 3 ) {
							w.ping.hostnames[hostname].meta[match[1]] = match[2];
						}
					}
				}

				w.log({ hostname: hostname, ping: w.ping.hostnames[hostname] });
			}

			if ( Object.keys(w.ping.hostnames).length >= 50 ) { driver('ping'); }

			apps = null;
			data = null;

			driver('displayApps');
		}
	};

	return w;
})();

// CommonJS package
// See http://wiki.commonjs.org/wiki/CommonJS
if ( typeof exports === 'object' ) {
	exports.wappalyzer = wappalyzer;
}
