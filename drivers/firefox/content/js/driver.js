/**
 * Firefox driver
 */

(function() {
	//'use strict';

	if ( wappalyzer == null ) return;

	var w = wappalyzer,
		firstRun = false,
		upgraded = false,
		prefs, strings;

	const
		d  = document,
		Cc = Components.classes,
		Ci = Components.interfaces
		;

	w.driver = {
		lastDisplayed: null,

		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( prefs != null && prefs.getBoolPref('debug') ) {
				Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService).logStringMessage(args.message);
			}
		},

		/**
		 * Initialize
		 */
		init: function() {
			var handler = function() {
				window.removeEventListener('load', handler, false);

				w.log('w.driver: browser window loaded');

				strings = d.getElementById('wappalyzer-strings');

				// Read apps.json
				var xhr = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);

				xhr.overrideMimeType('application/json');

				xhr.open('GET', 'chrome://wappalyzer/content/apps.json', true);

				xhr.onload = function() {
					var json = JSON.parse(xhr.responseText);

					w.categories = json.categories;
					w.apps       = json.apps;
				};

				xhr.send(null);

				AddonManager.getAddonByID('wappalyzer@crunchlabz.com', function(addon) {
					// Preferences
					prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.wappalyzer.');

					prefs.addObserver('', w.driver, false);

					container();

					bindings();

					// Version check
					addon.version = addon.version;

					if ( !prefs.getCharPref('version') ) {
						firstRun = true;
					} else if ( prefs.getCharPref('version') != addon.version ) {
						upgraded = true;
					}

					prefs.setCharPref('version', addon.version);

					// Listen for messages from content script
					messageManager.addMessageListener('wappalyzer', content);

					// Load content script
					messageManager.loadFrameScript('chrome://wappalyzer/content/js/content.js', true);

					gBrowser.addProgressListener({
						// Listen for location changes
						onLocationChange: function(progress, request, location, flags) {
							w.driver.displayApps();
						},

						// Get response headers
						onStateChange: function(progress, request, flags, status) {
							if ( !prefs.getBoolPref('analyzeHeaders') ) { return; }

							if ( request != null && flags & Ci.nsIWebProgressListener.STATE_STOP ) {
								if ( request.nsIHttpChannel && request.contentType == 'text/html' ) {
									if ( progress.currentURI && request.name == progress.currentURI.spec ) {
										var headers = {};

										request.nsIHttpChannel.visitResponseHeaders(function(header, value) {
											headers[header.toLowerCase()] = value;
										});

										w.analyze(progress.currentURI.host, progress.currentURI.spec, { headers: headers });
									}
								}
							}
						}
					});

					gBrowser.tabContainer.addEventListener('TabSelect', w.driver.displayApps, false);

					if ( firstRun ) {
						w.driver.goToURL({ url: w.config.websiteURL + 'installed', medium: 'install' });

						firstRun = false;
					}

					if ( upgraded ) {
						setTimeout(function() {
							w.driver.goToURL({ url: w.config.websiteURL + 'upgraded', medium: 'upgrade' });
						}, 500);

						upgraded = false;
					}
				});
			};

			window.addEventListener('load',   handler,        false);
			window.addEventListener('unload', w.driver.track, false);
		},

		// Observe preference changes
		observe: function(subject, topic, data) {
			if ( topic != 'nsPref:changed' ) { return; }

			switch(data) {
				case 'addonBar':
					container();

					break;
			}

			w.driver.displayApps();
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var
				i, j, app, confidence, elements, menuItem, menuSeparator, image, version,
				remove    = [],
				container = d.getElementById('wappalyzer-container'),
				menu      = d.getElementById('wappalyzer-applications'),
				url       = gBrowser.currentURI.spec.split('#')[0]
				;

			if ( !container ) { return; }

			if ( w.detected[url] != null && Object.keys(w.detected[url]).length ) {
				// No change
				if ( w.driver.lastDisplayed === JSON.stringify(w.detected[url]) ) { return; }
			} else {
				if ( w.driver.lastDisplayed === 'empty' ) { return; }
			}

			elements = {
				images:         container.getElementsByTagName('image'),
				menuItems:      menu     .getElementsByTagName('menuitem'),
				menuSeparators: menu     .getElementsByTagName('menuseparator')
				};

			for ( i in elements ) {
				for ( j = elements[i].length - 1; j >= 0; j -- ) {
					remove.push(elements[i][j]);
				}
			}

			if ( w.detected[url] != null && Object.keys(w.detected[url]).length ) {
				if ( !prefs.getBoolPref('showIcons') ) {
					image = d.createElement('image');

					image.setAttribute('src', 'chrome://wappalyzer/skin/images/icon_hot.png');

					container.appendChild(image);
				}

				for ( app in w.detected[url] ) {
					confidence = w.detected[url][app].confidenceTotal;
					version    = w.detected[url][app].version;

					var j, cat, showCat, categories = [];

					for ( i in w.apps[app].cats ) {
						showCat = false;

						try {
							showCat = prefs.getBoolPref('cat' + w.apps[app].cats[i]);
						} catch(e) { }

						if ( showCat ) {
							menuSeparator = d.createElement('menuseparator');
							menuItem      = d.createElement('menuitem');

							menuItem.setAttribute('class',     'wappalyzer-application menuitem-iconic');
							menuItem.setAttribute('image',     'chrome://wappalyzer/skin/images/icons/' + app + '.png');
							menuItem.setAttribute('label',     app + ( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' ));
							menuItem.setAttribute('name',      app);
							menuItem.setAttribute('data-url',  w.config.websiteURL + 'applications/' + app.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''));

							menuItem.addEventListener('command', function() {
								w.driver.goToURL({ url: this.getAttribute('data-url'), medium: 'menu' });
							});

							menu.appendChild(menuSeparator);
							menu.appendChild(menuItem);

							for ( j in w.apps[app].cats ) {
								cat = w.apps[app].cats[j];

								categories.push(strings.getString('wappalyzer.cat' + cat));

								menuItem = d.createElement('menuitem');

								menuItem.setAttribute('class',    'wappalyzer-category');
								menuItem.setAttribute('label',    strings.getString('wappalyzer.cat' + cat));
								menuItem.setAttribute('data-url', w.config.websiteURL + 'categories/' + w.categories[cat]);

								menuItem.addEventListener('command', function() {
									w.driver.goToURL({ url: this.getAttribute('data-url'), medium: 'menu' });
								});

								menu.appendChild(menuItem);
							}

							if ( prefs.getBoolPref('showIcons') ) {
								image = d.createElement('image');

								image.setAttribute('src',         'chrome://wappalyzer/skin/images/icons/' + app + '.png');
								image.setAttribute('tooltiptext', app + ( version ? ' ' + version : '' ) + ' - ' + categories.join(', '));

								container.appendChild(image);
							}

							break;
						}
					}
				}

				w.driver.lastDisplayed = JSON.stringify(w.detected[url]);
			} else {
				image         = d.createElement('image');
				menuSeparator = d.createElement('menuseparator');
				menuItem      = d.createElement('menuitem');

				image.setAttribute('src', 'chrome://wappalyzer/skin/images/icon.png');

				menuItem.setAttribute('disabled', 'true');
				menuItem.setAttribute('label',    strings.getString('wappalyzer.noAppsDetected'));

				container.appendChild(image);
				menu     .appendChild(menuSeparator);
				menu     .appendChild(menuItem);

				w.driver.lastDisplayed = 'empty';
			}

			for ( i in remove ) {
				remove[i].parentNode.removeChild(remove[i]);
			}
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
			var url = args.url + ( typeof args.medium === 'undefined' ? '' :  '?utm_source=firefox&utm_medium=' + args.medium + '&utm_campaign=extensions');

			gBrowser.selectedTab = gBrowser.addTab(url);
		},

		/**
		 * Anonymously track detected applications for research purposes
		 */
		ping: function() {
			if ( Object.keys(w.ping.hostnames).length && prefs.getBoolPref('tracking') ) {
				// Make POST request
				var request = new XMLHttpRequest();

				request.open('POST', w.config.websiteURL + 'ping/v2/', true);

				request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

				request.onreadystatechange = function(e) {
					if ( request.readyState == 4 ) { w.log('w.driver.ping: status ' + request.status); }
				};

				request.send('json=' + encodeURIComponent(JSON.stringify(w.ping)));

				w.log('w.driver.ping: ' + JSON.stringify(w.ping));

				w.ping = { hostnames: {} };
			}
		}
	};

	/**
	 * Content message listener
	 */
	function content(msg) {
		w.log('content.js');

		switch ( msg.json.action ) {
			case 'analyze':
				w.analyze(msg.json.hostname, msg.json.url, msg.json.analyze);

				break;
			case 'get prefs':
				return {
					analyzeJavaScript: prefs.getBoolPref('analyzeJavaScript'),
					analyzeOnLoad:     prefs.getBoolPref('analyzeOnLoad')
					};

				break;
		}

		msg = null;
	}

	/**
	 * Move container to address or addon bar
	 */
	function container() {
		if ( prefs.getBoolPref('addonBar') ) {
			d.getElementById('wappalyzer-addonbar').appendChild(d.getElementById('wappalyzer-container'));
		} else {
			d.getElementById('urlbar-icons').insertBefore(d.getElementById('wappalyzer-container'), d.getElementById('urlbar-icons').childNodes[0]);
		}

		d.getElementById('wappalyzer-addonbar').setAttribute('collapsed', prefs.getBoolPref('addonBar') ? 'false' : 'true');
	}

	/**
	 * Bindings
	 */
	function bindings() {
		// Menu items
		var prefix = 'wappalyzer-menu-';

		d.getElementById(prefix + 'preferences').onclick = function() {
			w.driver.goToURL({ url: 'chrome://wappalyzer/content/xul/preferences.xul' })
		};

		d.getElementById(prefix + 'feedback').onclick = function() {
			w.driver.goToURL({ url: w.config.websiteURL + 'contact', medium: 'menu' })
		};

		d.getElementById(prefix + 'website').onclick = function() {
			w.driver.goToURL({ url: w.config.websiteURL, medium: 'menu' })
		};

		d.getElementById(prefix + 'github').onclick = function() {
			w.driver.goToURL({ url: w.config.githubURL, medium: 'menu' })
		};

		d.getElementById(prefix + 'twitter').onclick = function() {
			w.driver.goToURL({ url: w.config.twitterURL, medium: 'menu' })
		};
	}

	w.init();
})();
