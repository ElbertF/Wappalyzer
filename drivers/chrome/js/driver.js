/**
 * Chrome driver
 */

(function() {
	if ( wappalyzer == null ) { return; }

	var w = wappalyzer,
		firstRun = false,
		upgraded = false,
		tab, tabCache = {};

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			console.log(args.message);
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('init');

			chrome.browserAction.setBadgeBackgroundColor({ color: [255, 102, 0, 255] });

			// Load apps.json
			var xhr = new XMLHttpRequest();

			xhr.open('GET', 'apps.json', true);

			xhr.overrideMimeType('application/json');

			xhr.onload = function() {
				var json = JSON.parse(xhr.responseText);

				w.categories = json.categories;
				w.apps       = json.apps;
			};

			xhr.send(null);

			// Version check
			try {
				var version = chrome.app.getDetails().version;

				if ( localStorage['version'] == null ) {
					firstRun = true;

					// Set defaults
					for ( option in defaults ) {
						localStorage[option] = defaults[option];
					}
				} else if ( version !== localStorage['version'] && localStorage['upgradeMessage'] ) {
					upgraded = true;
				}

				localStorage['version'] = version;
			} catch(e) { }

			chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
				if ( typeof request.id != 'undefined' ) {
					w.log('request: ' + request.id);

					switch ( request.id ) {
						case 'log':
							w.log(request.message);

							break;
						case 'analyze':
							tab = sender.tab;

							var hostname, a = document.createElement('a');

							a.href = tab.url;

							hostname = a.hostname;

							w.analyze(hostname, tab.url, request.subject);

							for ( subject in request.subject ) {
								tabCache[tab.id].analyzed.push(subject);
							}

							break;
						case 'fetch_headers':
							chrome.tabs.executeScript(request.tab.id, { file: 'js/headers.js' });

							break;
						case 'get_apps':
							sendResponse({
								tabCache:   tabCache[request.tab.id],
								apps:       w.apps,
								categories: w.categories
								});

							break;
					}
				}
			});

			chrome.tabs.getAllInWindow(null, function(tabs) {
				tabs.map(function(tab) {
					if ( tab.url.match(/^https?:\/\//) ) {
						chrome.tabs.executeScript(tab.id, { file: 'js/content.js' });
					}
				})
			});

			chrome.tabs.onRemoved.addListener(function(tabId) {
				w.log('remove tab');

				tabCache[tabId] = null;
			});

			if ( firstRun ) {
				driver('goToURL', { url: w.config.websiteURL + 'installed', medium: 'install' });
					firstRun = false;
				}
			if ( upgraded ) {
				driver('goToURL', { url: w.config.websiteURL + 'upgraded', medium: 'upgrade' });
				upgraded = false;
			}
		},

		goToURL: function(args) {
			var url = args.url + ( typeof args.medium === 'undefined' ? '' :  '?utm_source=chrome&utm_medium=' + args.medium + '&utm_campaign=extensions');

			window.open(url);
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var count = w.detected[tab.url] ? Object.keys(w.detected[tab.url]).length.toString() : '0';

			if ( tabCache[tab.id] == null ) {
				tabCache[tab.id] = {
					count: 0,
					appsDetected: [],
					analyzed: []
					};
			}

			tabCache[tab.id].count        = count;
			tabCache[tab.id].appsDetected = w.detected[tab.url];

			if ( count > 0 ) {
				// Find the main application to display
				var i, appName, found = false;

				w.driver.categoryOrder.map(function(match) {
					for ( appName in w.detected[tab.url] ) {
						w.apps[appName].cats.map(function(cat) {
							if ( cat == match && !found ) {
								chrome.browserAction.setIcon({ tabId: tab.id, path: 'images/icons/' + appName + '.png' });

								found = true;
							}
						});
					}
				});

				chrome.browserAction.setBadgeText({ tabId: tab.id, text: count });
			};
		},

		/**
		 * Anonymously track detected applications for research purposes
		 */
		ping: function() {
			if ( Object.keys(w.ping.hostnames).length && localStorage['tracking'] ) {
				// Make POST request
				var xhr = new XMLHttpRequest();

				xhr.open('POST', w.config.websiteURL + 'ping/v2/', true);

				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

				xhr.onreadystatechange = function(e) {
					if ( request.readyState == 4 ) { w.log('w.driver.ping: status ' + request.status); }
				};

				xhr.send('json=' + encodeURIComponent(JSON.stringify(w.ping)));

				w.log('w.driver.ping: ' + JSON.stringify(w.ping));

				w.ping = { hostnames: {} };
			}
		},

		categoryOrder: [ // Used to pick the main application
			 1, // CMS
			11, // Blog
			 6, // Web Shop
			 2, // Message Board
			 8, // Wiki
			13, // Issue Tracker
			30, // Web Mail
			18, // Web Framework
			21, // LMS
			 7, // Photo Gallery
			 3, // Database Manager
			34, // Database
			 4, // Documentation Tool
			 9, // Hosting Panel
			29, // Search Engine
			12, // Javascript Framework
			26, // Mobile Framework
			25, // Javascript Graphics
			22, // Web Server
			27, // Programming Language
			28, // Operating System
			15, // Comment System
			20, // Editor
			10, // Analytics
			32, // Marketing Automation
			31, // CDN
			23, // Cache Tool
			17, // Font Script
			24, // Rich Text Editor
			35, // Map
			 5, // Widget
			14, // Video Player
			16, // Captcha
			33, // Web Server Extension
			36, // Advertising Network
			19  // Miscellaneous
			]
	};

	w.init();
})();
