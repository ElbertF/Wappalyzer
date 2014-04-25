(function() {
	'use strict';

	var
		w = require('wappalyzer').wappalyzer,
		{Cc, Ci} = require('chrome'),
		headersCache = {},
		categoryNames = {},
		windows = [],
		Window,
		Tab,
		Panel,
		Widget,
		UrlBar;

	exports.main = function(options, callbacks) {
		w.log('main: ' + options.loadReason);

		w.init();
	};

	exports.onUnload = function(reason) {
		var win;

		w.log('unload: ' + reason);

		for each ( win in windows ) {
			win.destroy();
		}
	};

	Window = function(win) {
		var
			self = this,
			tab;

		this.window = win;
		this.tabs   = {};
		this.urlBar = null;
		this.widget = null;

		if ( require('sdk/simple-prefs').prefs.urlbar ) {
			this.urlBar = new UrlBar();
		} else {
			this.widget = new Widget();
		}

		require('sdk/simple-prefs').on('urlbar', function() {
			self.destroy();

			if ( require('sdk/simple-prefs').prefs.urlbar ) {
				self.urlBar = new UrlBar();
			} else {
				self.widget = new Widget();
			}

			self.displayApps();
		});

		for each ( tab in this.window.tabs ) {
			this.tabs[tab.id] = new Tab(tab);
		}

		this.window.tabs
			.on('open', function(tab) {
				self.tabs[tab.id] = new Tab(tab);
			})
			.on('close', function(tab) {
				self.tabs[tab.id] = null;
			})
			.on('activate', function(tab) {
				self.displayApps();
			});

		self.displayApps();
	};

	Window.prototype.displayApps = function() {
		var
			self = this,
			tab = this.window.tabs.activeTab,
			url,
			count = 0,
			message = {};

		w.log('Window.displayApps');

		if ( !tab || require('sdk/tabs').activeTab !== tab ) {
			return;
		}

		url   = tab.url.replace(/#.*$/, '');
		count = w.detected[url] ? Object.keys(w.detected[url]).length : 0;

		this.tabs[tab.id].count = count;
		this.tabs[tab.id].appsDetected = w.detected[url];

		message = {
			tabs: this.tabs[tab.id],
			apps: w.apps,
			categories: w.categories,
			categoryNames: categoryNames
		};

		if ( this.urlBar ) {
			this.urlBar.clear();

			// Add icons
			if ( count ) {
				for ( appName in this.tabs[tab.id].appsDetected ) {
					this.urlBar.addIcon(appName);
				}
			} else {
				this.urlBar.addIcon();
			}

			this.urlBar.panel.get().port.emit('displayApps', message);
		}

		if ( this.widget ) {
			this.widget.setIcon();

			if ( count ) {
				var
					appName,
					found = false;

				// Find the main application to display
				w.driver.categoryOrder.forEach(function(match) {
					for ( appName in w.detected[url] ) {
						w.apps[appName].cats.forEach(function(cat) {
							if ( cat == match && !found ) {
								self.widget.setIcon(appName);

								found = true;
							}
						});
					}
				});
			}

			this.widget.panel.get().port.emit('displayApps', message);
		}
	};

	Window.prototype.destroy = function() {
		if ( this.urlBar ) {
			this.urlBar.destroy();

			this.urlBar = null;
		}

		if ( this.widget ) {
			this.widget.destroy();

			this.widget = null;
		}
	};

	Tab = function(tab) {
		tab.on('ready', function(tab) {
			var worker = tab.attach({
				contentScriptFile: require('sdk/self').data.url('js/tab.js')
			});

			worker.port.on('analyze', function(message) {
				var url = message.url.replace(/#.*$/, '');

				if ( typeof headersCache[url] !== 'undefined' ) {
					message.analyze.headers = headersCache[url];
				}

				w.analyze(message.hostname, url, message.analyze);
			});

			worker.port.on('log', function(message) {
				w.log('[ tab.js ] ' + message);
			});
		});
	};

	Panel = function() {
		var self = this;

		this.panel = require('sdk/panel').Panel({
			width: 250,
			height: 50,
			contentURL: require('sdk/self').data.url('panel.html'),
			contentScriptFile: require('sdk/self').data.url('js/panel.js'),
			position: { right: 30, top: 30 }
		});

		this.panel.port.on('resize', function(height) {
			self.panel.height = height;
		});

		this.panel.port.on('goToUrl', function(url) {
			self.panel.hide();

			w.driver.goToURL({ url: w.config.websiteURL + url, medium: 'panel' });
		});
	};

	Panel.prototype.get = function() {
		return this.panel;
	};

	Panel.prototype.destroy = function() {
		this.panel.destroy();
	};

	Widget = function() {
		this.panel = new Panel();

		this.widget = require('sdk/widget').Widget({
			id: 'wappalyzer-' + ( new Date() ).getTime() + ( Math.floor( Math.random() * 900 ) + 100 ),
			label: 'Wappalyzer',
			contentURL: require('sdk/self').data.url('images/icon32.png'),
			panel: this.panel.get()
		});
	};

	Widget.prototype.setIcon = function(appName) {
		var url = typeof appName === 'undefined' ? 'images/icon32_hot.png' : 'images/icons/' + appName + '.png';

		this.get().contentURL = require('sdk/self').data.url(url);
	};

	Widget.prototype.get = function() {
		return this.widget;
	};

	Widget.prototype.destroy = function() {
		this.panel.destroy();

		this.widget.destroy();
	};

	UrlBar = function() {
		var self = this;

		this.panel = new Panel();

		this.onClick = function() {
			self.panel.get().show();
		}

		this.document = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator)
			.getMostRecentWindow('navigator:browser').document;

		this.urlBar = this.document.createElement('hbox');

		this.urlBar.setAttribute('id', 'wappalyzer-urlbar');
		this.urlBar.setAttribute('style', 'cursor: pointer; margin: 0 2px;');
		this.urlBar.setAttribute('tooltiptext', require('sdk/l10n').get('name'));

		this.urlBar.addEventListener('click', this.onClick);

		this.document.getElementById('urlbar-icons').appendChild(this.urlBar);
	};

	UrlBar.prototype.get = function() {
		return this.urlBar;
	};

	UrlBar.prototype.addIcon = function(appName) {
		var
			icon = this.document.createElement('image'),
			url = typeof appName === 'undefined' ? 'images/icon32.png' : 'images/icons/' + appName + '.png',
			tooltipText = ( typeof appName !== 'undefined' ? appName + ' - ' + require('sdk/l10n').get('clickForDetails') + ' - ' : '' ) + require('sdk/l10n').get('name');

		icon.setAttribute('src', require('sdk/self').data.url(url));
		icon.setAttribute('class', 'wappalyzer-icon');
		icon.setAttribute('width', '16');
		icon.setAttribute('height', '16');
		icon.setAttribute('style', 'margin: 0 1px;');
		icon.setAttribute('tooltiptext', tooltipText);

		this.get().appendChild(icon);

		return this;
	};

	UrlBar.prototype.clear = function() {
		var icons;

		do {
			icons = this.get().getElementsByClassName('wappalyzer-icon');

			if ( icons.length ) {
				this.get().removeChild(icons[0]);
			}
		} while ( icons.length );

		return this;
	};

	UrlBar.prototype.destroy = function() {
		this.panel.destroy();

		this.urlBar.removeEventListener('click', this.onClick);

		this.urlBar.remove();

		return this;
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
			var
				id,
				version,
				win,
				httpRequestObserver,
				json = JSON.parse(require('sdk/self').data.load('apps.json'));

			w.log('driver.init');

			try {
				version = require('sdk/self').version;

				if ( !require('sdk/simple-storage').storage.version ) {
					w.driver.goToURL({ url: w.config.websiteURL + 'installed', medium: 'install' });
				} else if ( version !== require('sdk/simple-storage').storage.version ) {
					w.driver.goToURL({ url: w.config.websiteURL + 'upgraded', medium: 'upgrade', background: true });
				}

				require('sdk/simple-storage').storage.version = version;
			} catch(e) { }

			w.apps = json.apps;
			w.categories = json.categories;

			for ( id in w.categories ) {
				categoryNames[id] = require('sdk/l10n').get('cat' + id);
			}

			require('sdk/windows').browserWindows
				.on('open', function(win) {
					windows.push(new Window(win));
				});

			for each ( win in require('sdk/windows').browserWindows ) {
				windows.push(new Window(win));
			}

			httpRequestObserver = {
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
						if ( typeof headersCache[uri] === 'undefined' ) {
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

			require('sdk/tabs').open({ url: url, inBackground: typeof args.background !== 'undefined' && args.background });
		},

		ping: function() {
			var Request = require('sdk/request').Request;

			if ( Object.keys(w.ping.hostnames).length && require('sdk/simple-prefs').prefs.tracking ) {
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

		displayApps: function() {
			var win;

			for each ( win in windows ) {
				win.displayApps();
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
	};
}());
