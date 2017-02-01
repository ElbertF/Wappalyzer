(function() {
	var
		url,
		originalUrl,
		scriptDir,
		scriptPath      = require('fs').absolute(require('system').args[0]),
		resourceTimeout = 9000,
		args            = [],
		debug           = false; // Output debug messages
		quiet           = false; // Don't output errors

	try {
		// Working directory
		scriptDir = scriptPath.split('/'); scriptDir.pop(); scriptDir = scriptDir.join('/');

		require('fs').changeWorkingDirectory(scriptDir);

		require('system').args.forEach(function(arg, i) {
			var arr = /^(--[^=]+)=(.+)$/.exec(arg);

			if ( arr && arr.length === 3 ) {
				arg   = arr[1];
				value = arr[2];
			}

			switch ( arg ) {
				case '-v':
				case '--verbose':
					debug = true;

					break;
				case '-q':
				case '--quiet':
					quiet = true;

					break;
				case '--resource-timeout':
					resourceTimeout = value;

					break;
				default:
					url = originalUrl = arg;
			}
		});

		if ( !url ) {
			throw new Error('Usage: phantomjs ' + require('system').args[0] + ' <url>');
		}

		if ( !phantom.injectJs('wappalyzer.js') ) {
			throw new Error('Unable to open file js/wappalyzer.js');
		}

		wappalyzer.driver = {
			timeout: 1000,

			/**
			 * Log messages to console
			 */
			log: function(args) {
				if ( args.type === 'error' ) {
					if ( !quiet ) {
						require('system').stderr.write(args.message + "\n");
					}
				} else if ( debug || args.type !== 'debug' ) {
					require('system').stdout.write(args.message + "\n");
				}
			},

			/**
			 * Display apps
			 */
			displayApps: function() {
				var
					app, cats,
					apps  = [],
					count = wappalyzer.detected[url] ? Object.keys(wappalyzer.detected[url]).length : 0;

				wappalyzer.log('driver.displayApps');

				if ( count ) {
					for ( app in wappalyzer.detected[url] ) {
						cats = [];

						wappalyzer.apps[app].cats.forEach(function(cat) {
							cats.push(wappalyzer.categories[cat]);
						});

						apps.push({
							name: app,
							confidence: wappalyzer.detected[url][app].confidenceTotal,
							version:    wappalyzer.detected[url][app].version,
							icon:       wappalyzer.apps[app].icon,
							categories: cats
						});
					}

					wappalyzer.driver.sendResponse(apps);
				}
			},

			/**
			 * Send response
			 */
			sendResponse: function(apps) {
				apps = apps || [];

				require('system').stdout.write(JSON.stringify({ url: url, originalUrl: originalUrl, applications: apps }) + "\n");
			},

			/**
			 * Initialize
			 */
			init: function() {
				var
					page, hostname,
					headers = {};
					a       = document.createElement('a'),
					json    = JSON.parse(require('fs').read('apps.json'));

				wappalyzer.log('driver.init');

				a.href = url.replace(/#.*$/, '');

				hostname = a.hostname;

				wappalyzer.apps       = json.apps;
				wappalyzer.categories = json.categories;

				page = require('webpage').create();

				page.settings.loadImages      = false;
				page.settings.userAgent       = 'Mozilla/5.0 (compatible; Wappalyzer; +https://github.com/AliasIO/Wappalyzer)';
				page.settings.resourceTimeout = resourceTimeout;

				page.onConsoleMessage = function(message) {
					require('system').stdout.write(message + "\n");
				};

				page.onError = function(message) {
					wappalyzer.log(message, 'error');
				};

				page.onResourceTimeout = function() {
					wappalyzer.log('Resource timeout', 'error');

					wappalyzer.driver.sendResponse();

					phantom.exit(1);
				};

				page.onResourceReceived = function(response) {
					if ( response.url.replace(/\/$/, '') === url.replace(/\/$/, '') ) {
						if ( response.redirectURL ) {
							url = response.redirectURL;

							return;
						}

						if ( response.stage === 'end' && response.status === 200 && response.contentType.indexOf('text/html') !== -1 ) {
							response.headers.forEach(function(header) {
								headers[header.name.toLowerCase()] = header.value;
							});
						}
					}
				};

				page.onResourceError = function(resourceError) {
					wappalyzer.log(resourceError.errorString, 'error');
				};

				page.open(url, function(status) {
					var html, environmentVars;

					if ( status === 'success' ) {
						html = page.content;

						if ( html.length > 50000 ) {
							html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
						}

						// Collect environment variables
						environmentVars = page.evaluate(function() {
							var i, environmentVars;

							for ( i in window ) {
								environmentVars += i + ' ';
							}

							return environmentVars;
						});

						wappalyzer.log({ message: 'environmentVars: ' + environmentVars });

						environmentVars = environmentVars.split(' ').slice(0, 500);

						wappalyzer.analyze(hostname, url, {
							html:    html,
							headers: headers,
							env:     environmentVars
						});

						phantom.exit(0);
					} else {
						wappalyzer.log('Failed to fetch page', 'error');

						wappalyzer.driver.sendResponse();

						phantom.exit(1);
					}
				});
			}
		};

		wappalyzer.init();
	} catch ( e ) {
		wappalyzer.log(e, 'error');

		wappalyzer.driver.sendResponse();

		phantom.exit(1);
	}
})();
