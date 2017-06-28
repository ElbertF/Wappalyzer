/**
 * WebExtension driver
 */

/** global: browser */
/** global: chrome */
/** global: wappalyzer */
/** global: XMLHttpRequest */

(function() {
	if ( wappalyzer == null ) {
		return;
	}

	var w = wappalyzer,
		firstRun = false,
		upgraded = false,
		tab,
		tabCache = {},
		headersCache = {};

	w.driver = {
		timeout: 1000,

		/**
		 * Log messages to console
		 */
		log: function(args) {
			console.log('[wappalyzer ' + args.type + ']', '[' + args.source + ']', JSON.parse(args.message));
		},

		/**
		 * Get a value from localStorage
		 */
		getOption: function(name, defaultValue, callback) {
			var func = function(item) {
				callback(item.hasOwnProperty(name) ? item[name] : defaultValue);
			};

			try {
				// Chrome, Firefox
				browser.storage.local.get(name).then(func);
			} catch ( e ) {
				// Edge
				browser.storage.local.get(name, func);
			}
		},

		/**
		 * Set a value in localStorage
		 */
		setOption: function(name, value) {
			var option = {};

			option[name] = value;

			browser.storage.local.set(option);
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('Function call: w.driver.init()', 'driver');

			// Load apps.json
			var xhr = new XMLHttpRequest();

			xhr.open('GET', 'apps.json', true);

			xhr.overrideMimeType('application/json');

			xhr.onload = function() {
				var json = JSON.parse(xhr.responseText);

				w.categories = json.categories;
				w.apps       = json.apps;

				w.driver.categoryOrder = Object.keys(w.categories).sort(function(a, b) {
					return w.categories[a].priority - w.categories[b].priority;
				});
			};

			xhr.send(null);

			// Version check
			try {
				var version = browser.runtime.getManifest().version;

				w.driver.getOption('version', null, function(previousVersion) {
					if ( previousVersion === null ) {
						w.driver.goToURL({
						 	url: w.config.websiteURL + 'installed'
						});
					} else if ( version !== previousVersion ) {
						w.driver.getOption('upgradeMessage', true, function(upgradeMessage) {
							if ( upgradeMessage ) {
								w.driver.goToURL({
									url: w.config.websiteURL + 'upgraded',
									background: true
								});
							}
						});
					}

					w.driver.setOption('version', version);
				});
			} catch(e) {
				// Do nothing
			}

			( chrome || browser ).runtime.onMessage.addListener(w.driver.onMessage);

			var callback = function(tabs) {
				tabs.forEach(function(tab) {
					if ( tab.url.match(/^https?:\/\//) ) {
						browser.tabs.executeScript(tab.id, { file: 'js/content.js' });
					}
				})
			};

			try {
				browser.tabs.query({}).then(callback);
			} catch ( e ) {
				browser.tabs.query({}, callback);
			}

			browser.tabs.onRemoved.addListener(function(tabId) {
				tabCache[tabId] = null;
			});

			// Live intercept headers using webRequest API
			browser.webRequest.onCompleted.addListener(function(details) {
				var responseHeaders = {};

				if ( details.responseHeaders ) {
					var uri = details.url.replace(/#.*$/, ''); // Remove hash

					details.responseHeaders.forEach(function(header) {
						responseHeaders[header.name.toLowerCase()] = header.value || '' + header.binaryValue;
					});

					if ( headersCache.length > 50 ) {
						headersCache = {};
					}

					if ( /text\/html/.test(responseHeaders['content-type']) ) {
						if ( headersCache[uri] === undefined ) {
							headersCache[uri] = {};
						}

						for ( var header in responseHeaders ) {
							if ( responseHeaders.hasOwnProperty(header) ) {
								headersCache[uri][header] = responseHeaders[header];
							}
						}
					}
				}
			}, { urls: [ 'http://*/*', 'https://*/*' ], types: [ 'main_frame' ] }, [ 'responseHeaders' ]);

			if ( firstRun ) {
				w.driver.goToURL({ url: w.config.websiteURL + 'installed', medium: 'install' });

				firstRun = false;
			}

			if ( upgraded ) {
				w.driver.goToURL({ url: w.config.websiteURL + 'upgraded', medium: 'upgrade', background: true });

				upgraded = false;
			}
		},

		onMessage: function(message, sender, sendResponse) {
			var
				hostname,
				response,
				a = document.createElement('a');

			if ( typeof message.id != 'undefined' ) {
				if ( message.id !== 'log' ) {
					w.log('Message received from ' + message.source + ': ' + message.id, 'driver');
				}

				switch ( message.id ) {
					case 'log':
						w.log(message.message, message.source);

						break;
					case 'analyze':
						tab = sender.tab;

						a.href = tab.url.replace(/#.*$/, '');

						hostname = a.hostname;

						if ( headersCache[a.href] !== undefined ) {
							message.subject.headers = headersCache[a.href];
						}

						w.analyze(hostname, a.href, message.subject);

						break;
					case 'ad_log':
						w.adCache.push(message.subject);

						break;
					case 'get_apps':
						response = {
							tabCache:   tabCache[message.tab.id],
							apps:       w.apps,
							categories: w.categories
						};

						break;
					default:
				}

				sendResponse(response);
			}

		},

		/**
		 * Open a tab
		 */
		goToURL: function(args) {
			browser.tabs.create({
				url: args.url,
				active: args.background === undefined || !args.background
			});
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var
				url   = tab.url.replace(/#.*$/, ''),
				count = w.detected[url] ? Object.keys(w.detected[url]).length.toString() : '0';

			if ( tabCache[tab.id] == null ) {
				tabCache[tab.id] = {
					count: 0,
					appsDetected: []
					};
			}

			tabCache[tab.id].count        = count;
			tabCache[tab.id].appsDetected = w.detected[url];

			if ( count > 0 ) {
				w.driver.getOption('dynamicIcon', true, function(dynamicIcon) {
					var appName, found = false;

					// Find the main application to display
					w.driver.categoryOrder.forEach(function(match) {
						for ( appName in w.detected[url] ) {
							w.apps[appName].cats.forEach(function(cat) {
								var icon = w.apps[appName].icon || 'default.svg';

								if ( !dynamicIcon ) {
									icon = 'default.svg';
								}

								if ( cat === match && !found ) {
									if ( /\.svg$/i.test(icon) ) {
										icon = 'converted/' + icon.replace(/\.svg$/, '.png');
									}

									browser.pageAction.setIcon({
										tabId: tab.id,
										path: 'images/icons/' + icon
									});

									found = true;
								}
							});
						}
					});

					if ( typeof chrome !== 'undefined' ) {
						// Browser polyfill doesn't seem to work here
						chrome.pageAction.show(tab.id);
					} else {
						browser.pageAction.show(tab.id);
					}
				});
			};
		},

		/**
		 * Anonymously track detected applications for research purposes
		 */
		ping: function() {
			w.driver.getOption('tracking', true, function(tracking) {
				if ( Object.keys(w.ping.hostnames).length && tracking ) {
					w.driver.post('http://ping.wappalyzer.com/v2/', w.ping);

					w.ping = { hostnames: {} };

					w.driver.post('https://ad.wappalyzer.com/log/wp/', w.adCache);

					w.adCache = [];
				}
			});
		},

		/**
		 * Make POST request
		 */
		post: function(url, data) {
			var xhr = new XMLHttpRequest();

			xhr.open('POST', url, true);

			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

			xhr.onreadystatechange = function() {
				if ( xhr.readyState == 4 ) {
					w.log({ 'POST request': { url: url, status: xhr.status, data: data } }, 'driver');
				}
			};

			xhr.send('json=' + encodeURIComponent(JSON.stringify(data)));
		}
	};

	w.init();
}());
