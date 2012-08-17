/**
 * Firefox driver
 */

(function() {
	//'use strict';

	if ( wappalyzer == null ) return;

	var prefs, strings, w = wappalyzer;
	const Cc = Components.classes, Ci = Components.interfaces;
	
	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( prefs != null && prefs.getBoolPref('debug') ) {
				Cc['@mozilla.org/consoleservice;1']
					.getService(Ci.nsIConsoleService)
					.logStringMessage(args.message);
			}
		},

		/**
		 * Initialize
		 */
		init: function(callback) {
			var handler = function() {
				window.removeEventListener('load', handler, false);

				w.log('w.driver: browser window loaded');

				strings = document.getElementById('wappalyzer-strings');

				AddonManager.getAddonByID('wappalyzer@crunchlabz.com', function(addon) {
					// Load jQuery
					(function () {
						Cc['@mozilla.org/moz/jssubscript-loader;1']
							.getService(Ci.mozIJSSubScriptLoader)
							.loadSubScript('chrome://wappalyzer/content/js/lib/jquery.min.js')
							;
					})();

					// Preferences
					prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.wappalyzer.');

					container();

					// Version check
					addon.version = addon.version;

					if ( !prefs.getCharPref('version') ) {
						w.config.firstRun = true;
					} else if ( prefs.getCharPref('version') != addon.version ) {
						w.config.upgraded = true;
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
							if ( request && request.nsIHttpChannel && flags & Ci.nsIWebProgressListener.STATE_STOP ) {
								var headers = new Object();

								request.nsIHttpChannel.visitResponseHeaders(function(header, value) {
									headers[header] = value;
								});

								if ( progress.currentURI ) w.analyze(progress.currentURI.host, progress.currentURI.spec, { headers: headers });
							}
						}
					});

					gBrowser.tabContainer.addEventListener('TabSelect', w.driver.displayApps, false);

					callback();
				});
			};

			window.addEventListener('load',   handler,        false);
			window.addEventListener('unload', w.driver.track, false);
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var url = gBrowser.currentURI.spec.split('#')[0];

			$('#wappalyzer-container > image, #wappalyzer-menu > menuitem, #wappalyzer-menu > menuseparator').remove();

			if ( w.detected[url] != null && w.detected[url].length ) {
				if ( !prefs.getBoolPref('showIcons') ) {
					var image = $('<image/>')
						.attr('src', 'chrome://wappalyzer/skin/images/icon_hot.png')
						;

					$('#wappalyzer-container').prepend(image);
				}

				w.detected[url].map(function(app, i) {

					for ( var i in w.apps[app].cats ) {
						if ( prefs.getBoolPref('cat' + w.apps[app].cats[i]) ) {
							if ( prefs.getBoolPref('showIcons') ) {
								var image = $('<image/>')
								.attr('src', 'chrome://wappalyzer/skin/images/icons/' + app + '.png')
								;

								$('#wappalyzer-container').prepend(image);
							}

							var menuSeparator = $('<menuseparator/>');

							$('#wappalyzer-menu').append(menuSeparator);

							var menuItem = $('<menuitem/>')
								.attr('class', 'wappalyzer-application menuitem-iconic')
								.attr('image', 'chrome://wappalyzer/skin/images/icons/' + app + '.png')
								.attr('label', app)
								;

							menuItem.bind('command', function() {
								w.driver.goToURL({ url: w.config.websiteURL + 'applications/' + app.toLowerCase().replace(/ /g, '-').replace(/[^\w]/g, '') });
							});

							$('#wappalyzer-menu').append(menuItem);

							for ( var i in w.apps[app].cats ) {
								var cat = w.apps[app].cats[i];

								var menuItem = $('<menuitem/>')
									.attr('class', 'wappalyzer-category')
									.attr('label', strings.getString('wappalyzer.cat' + cat))
									;

								menuItem.bind('command', function() {
									w.driver.goToURL({ url: w.config.websiteURL + 'categories/' + w.categories[cat] });
								});

								$('#wappalyzer-menu').append(menuItem);
							}
							break;
						}
					}
				});
			} else {
				var image = $('<image/>')
					.attr('src', 'chrome://wappalyzer/skin/images/icon.png')
					;

				$('#wappalyzer-container').prepend(image);

				var menuSeparator = $('<menuseparator/>');

				$('#wappalyzer-menu').append(menuSeparator);

				var menuItem = $('<menuitem/>')
					.attr('disabled', 'true')
					.attr('label', strings.getString('wappalyzer.noAppsDetected'))
					;

				$('#wappalyzer-menu').append(menuItem);
			}
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
			gBrowser.selectedTab = gBrowser.addTab(args.url);
		},

		/**
		 * Anonymously track detected applications
		 */
		track: function() {
			if ( prefs.getBoolPref('tracking') ) {
				var report = '';

				if ( w.history ) {
					for ( hostname in w.history ) {
						report += '[' + hostname;

						w.history[hostname].map(function(data) {
							report += '|' + data.app + ':' + data.hits;
						});

						report += ']';
					};

					// Make POST request
					var request = new XMLHttpRequest();

					request.open('POST', w.config.websiteURL + '_track.php', true);

					request.channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;

					request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

					request.onreadystatechange = function(e) {
						if ( request.readyState == 4 ) {
							if ( request.status == 200 ) {
								w.history = new Object();

								w.log('w.driver.track: ' + report);
							}

							report = '';

							if ( request.close ) request.close();

							request = false;
						}
					};

					request.send('d=' + encodeURIComponent(report));
				}
			}
		},
	};

	/**
	 * Content message listener
	 */
	function content(msg) {
		w.log('content.js');

		w.analyze(msg.json.hostname, msg.json.url, { html: msg.json.html, env: msg.json.env });

		msg = null;
	}

	/**
	 * Move container to address or addon bar
	 */
	function container() {
		$('#wappalyzer-container')
			.remove()
			.prependTo(prefs.getBoolPref('addonBar') ? $('#wappalyzer-addonbar') : $('#urlbar-icons'));

		// Menu items
		var prefix = '#wappalyzer-menu-';

		$(prefix + 'icons')
			.attr('checked', prefs.getBoolPref('showIcons') ? 'true' : 'false')
			.bind('command', function() {
				prefs.setBoolPref('showIcons', !prefs.getBoolPref('showIcons'));

				$(this).attr('checked', prefs.getBoolPref('showIcons') ? 'true' : 'false');

				w.driver.displayApps();
			});

		$(prefix + 'preferences'  )
			.bind('command', function() {
				w.driver.goToURL({ url: 'chrome://wappalyzer/content/xul/preferences.xul' })
			});

		$(prefix + 'addonbar'  )
			.attr('checked', prefs.getBoolPref('addonBar') ? 'true' : 'false')
			.bind('command', function() {
				prefs.setBoolPref('addonBar', !prefs.getBoolPref('addonBar'));

				$(this).attr('checked', prefs.getBoolPref('addonBar') ? 'true' : 'false');

				container();

				if ( prefs.getBoolPref('addonBar') ) {
					alert(strings.getString('wappalyzer.addonBar'));
				}
			});

		$(prefix + 'donate')
			.bind('command', function() {
				w.driver.goToURL({ url: w.config.websiteURL + 'donate' })
			});

		$(prefix + 'feedback')
			.bind('command', function() {
				w.driver.goToURL({ url: w.config.websiteURL + 'contact' })
			});

		$(prefix + 'website')
			.bind('command', function() {
				w.driver.goToURL({ url: w.config.websiteURL })
			});

		$(prefix + 'github' )
			.bind('command', function() {
				w.driver.goToURL({ url: w.config.githubURL })
			});

		$(prefix + 'twitter')
			.bind('command', function() {
				w.driver.goToURL({ url: w.config.twitterURL})
			});

		$(prefix + 'gplus')
			.bind('command', function() {
				w.driver.goToURL({ url: w.config.gplusURL })
			});
	}

	w.init();
})();
