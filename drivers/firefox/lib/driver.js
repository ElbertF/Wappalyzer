(function() {
	'use strict';

	var
		{Cc, Ci} = require('chrome'),
		main = require('wappalyzer'),
		w = main.wappalyzer,
		mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
		tabCache = {},
		headersCache = {},
		categoryNames = {},
		data = require('sdk/self').data,
		ss = require('sdk/simple-storage'),
		sp = require("sdk/simple-prefs"),
		tabs = require('sdk/tabs'),
		panel,
		widget,
		initTab,
		addIcon,
		removeIcons,
		createPanel,
		createWidget,
		getUrlBar,
		getDocument;

	initTab = function(tab) {
		tabCache[tab.id] = { count: 0, appsDetected: [] };

		tab.on('ready', function(tab) {
			var worker = tab.attach({
				contentScriptFile: data.url('js/tab.js')
			});

			worker.port.on('analyze', function(message) {
				var url = message.url.replace(/#.*$/, '');

				if ( headersCache[url] !== undefined ) {
					message.analyze.headers = headersCache[url];
				}

				w.analyze(message.hostname, url, message.analyze);
			});

			worker.port.on('log', function(message) {
				w.log('[ tab.js ] ' + message);
			});
		});
	};

	tabs.on('open', initTab);

	tabs.on('close', function(tab) {
		tabCache[tab.id] = null;
	});

	tabs.on('activate', function(tab) {
		w.driver.displayApps();
	});

	addIcon = function(appName) {
		var
			icon        = getDocument().createElement('image'),
			url         = appName !== undefined ? 'images/icons/' + appName + '.png' : 'images/icon32.png',
			tooltipText = ( appName !== undefined ? appName + ' - ' + require('sdk/l10n').get('clickForDetails') + ' - ' : '' ) + require('sdk/l10n').get('name');

		icon.setAttribute('src',         data.url(url));
		icon.setAttribute('class',       'wappalyzer-icon');
		icon.setAttribute('width',       '16');
		icon.setAttribute('height',      '16');
		icon.setAttribute('style',       'margin: 0 1px;');
		icon.setAttribute('tooltiptext', tooltipText);

		getUrlBar().appendChild(icon);

		return icon;
	};

	removeIcons = function() {
		var icons;

		do {
			icons = getUrlBar().getElementsByClassName('wappalyzer-icon');

			if ( icons.length ) {
				getUrlBar().removeChild(icons[0]);
			}
		} while ( icons.length );
	};

	createPanel = function() {
		if ( panel ) {
			panel.destroy();
		}

		panel = require('sdk/panel').Panel({
			width: 250,
			height: 50,
			contentURL: data.url('panel.html'),
			contentScriptFile: data.url('js/panel.js'),
			position: { right: 30, top: 30 }
		});

		panel.port.on('resize', function(height) {
			panel.height = height;
		});

		panel.port.on('goToUrl', function(url) {
			panel.hide();

			w.driver.goToURL({ url: w.config.websiteURL + url, medium: 'panel' });
		});
	}

	createWidget = function() {
		createPanel();

		widget = require('sdk/widget').Widget({
			id: 'wappalyzer',
			label: 'Wappalyzer',
			contentURL: data.url('images/icon32.png'),
			panel: panel
		});
	}

	getUrlBar = function() {
		var
			urlBar = getDocument().getElementById('wappalyzer-urlbar'),
			show = true;

		if ( !urlBar ) {
			urlBar = getDocument().createElement('hbox');

			urlBar.setAttribute('id',          'wappalyzer-urlbar');
			urlBar.setAttribute('style',       'cursor: pointer; margin: 0 2px;');
			urlBar.setAttribute('tooltiptext', require('sdk/l10n').get('name'));

			urlBar.addEventListener('mouseover', function() {
				if ( panel.isShowing ) {
					show = false;
				}
			});

			urlBar.addEventListener('mouseout', function() {
				show = true;
			});

			urlBar.addEventListener('click', function() {
				if ( show ) {
					panel.show();

					show = false;
				} else {
					panel.hide();

					show = true;
				}
			}, false);

			getDocument().getElementById('urlbar-icons').appendChild(urlBar);
		}

		return urlBar;
	}

	getDocument = function() {
		return mediator.getMostRecentWindow('navigator:browser').document;
	}

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
		init: function(callback) {
			var json = JSON.parse(data.load('apps.json'));

			if ( sp.prefs.urlbar ) {
				createPanel();
			} else {
				createWidget();
			}

			try {
				var version = require('sdk/self').version;

				if ( !ss.storage.version ) {
					w.driver.goToURL({ url: w.config.websiteURL + 'installed', medium: 'install' });
				} else if ( version !== ss.storage.version ) {
					w.driver.goToURL({ url: w.config.websiteURL + 'upgraded', medium: 'upgrade', background: true });
				}

				ss.storage.version = version;
			} catch(e) { }

			w.apps = json.apps;
			w.categories = json.categories;

			for ( var id in w.categories ) {
				categoryNames[id] = require('sdk/l10n').get('cat' + id);
			}

			for each ( var tab in tabs ) {
				initTab(tab);
			}

			sp.on('urlbar', function() {
				if ( !sp.prefs.urlbar ) {
					removeIcons();

					createWidget();
				} else {
					widget.destroy();

					createPanel();
				}

				w.driver.displayApps();
			});

			var httpRequestObserver = {
				init: function() {
					var observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);

					observerService.addObserver(this, 'http-on-examine-response', false);
				},

				observe: function(subject, topic, data) {
					if ( topic == 'http-on-examine-response' ) {
						subject.QueryInterface(Ci.nsIHttpChannel);

						this.onExamineResponse(subject);
					}
				},

				onExamineResponse: function (subject) {
					var uri = subject.URI.spec.replace(/#.*$/, ''); // Remove hash

					if ( headersCache.length > 50 ) {
						headersCache = {};
					}

					if ( subject.contentType === 'text/html' ) {
						if ( headersCache[uri] === undefined ) {
							headersCache[uri] = {};
						}

						subject.visitResponseHeaders(function(header, value) {
							headersCache[uri][header.toLowerCase()] = value;
						});
					}
				}
			};

			httpRequestObserver.init();
		},

		goToURL: function(args) {
			var url = args.url + ( typeof args.medium === 'undefined' ? '' : '?pk_campaign=firefox&pk_kwd=' + args.medium);

			tabs.open({ url: url, inBackground: args.background !== undefined && args.background });
		},

		displayApps: function() {
			var
				url   = tabs.activeTab.url.replace(/#.*$/, ''),
				count = w.detected[url] ? Object.keys(w.detected[url]).length : 0;

			w.log('display apps');

			if ( panel === undefined ) {
				if ( sp.prefs.urlbar ) {
					createPanel();
				} else {
					createWidget();
				}
			}

			if ( tabCache[tabs.activeTab.id] === undefined ) {
				initTab(tabs.activeTab);
			}

			tabCache[tabs.activeTab.id].count = count;
			tabCache[tabs.activeTab.id].appsDetected = w.detected[url];

			if ( sp.prefs.urlbar ) {
				removeIcons();

				// Add icons
				if ( count ) {
					for ( appName in tabCache[tabs.activeTab.id].appsDetected ) {
						addIcon(appName);
					}
				} else {
					addIcon();
				}
			} else {
				widget.contentURL = data.url('images/icon32_hot.png');

				if ( count ) {
					// Find the main application to display
					var
						appName,
						found = false;

					w.driver.categoryOrder.forEach(function(match) {
						for ( appName in w.detected[url] ) {
							w.apps[appName].cats.forEach(function(cat) {
								if ( cat == match && !found ) {
									widget.contentURL = data.url('images/icons/' + appName + '.png'),

									found = true;
								}
							});
						}
					});
				}
			}

			panel.port.emit('displayApps', { tabCache: tabCache[tabs.activeTab.id], apps: w.apps, categories: w.categories, categoryNames: categoryNames });
		},

		ping: function() {
			var Request = require('sdk/request').Request;

			if ( Object.keys(w.ping.hostnames).length && sp.prefs.tracking ) {
				Request({
					url: w.config.websiteURL + 'ping/v2/',
					content: { json: encodeURIComponent(JSON.stringify(w.ping)) },
					onComplete: function (response) {
						w.log('w.driver.ping: status ' + response.status);
					}
				}).post();

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
			38, // Media Server
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
			41, // Payment Processor
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
			37, // Network Device
			39, // Webcam
			40, // Printer
			36, // Advertising Network
			19  // Miscellaneous
		]
	}

	w.init();
}());
