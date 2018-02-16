/** global: chrome */
/** global: browser */

(function() {
	var popup = {
		init: function() {
			var callback = function(tabs) {
				( chrome || browser ).runtime.sendMessage({ id: 'get_apps', tab: tabs[0], source: 'popup.js' }, function(response) {
					if ( /complete|interacrive|loaded/.test(document.readyState) ) {
						popup.displayApps(response)
					} else {
						document.addEventListener('DOMContentLoaded', function() { popup.displayApps(response) });
					}
				});
			};

			try {
				// Chrome, Firefox
				browser.tabs.query({ active: true, currentWindow: true }).then(callback);
			} catch ( e ) {
				// Edge
				browser.tabs.query({ active: true, currentWindow: true }, callback);
			}
		},

		displayApps: function(response) {
			var
				appName, confidence, version,
				detectedApps = document.querySelector('#detected-apps');
				html = '';

			if ( response.tabCache && response.tabCache.count > 0 ) {
				for ( appName in response.tabCache.appsDetected ) {
					confidence = response.tabCache.appsDetected[appName].confidenceTotal;
					version    = response.tabCache.appsDetected[appName].version;

					html +=
						'<div class="detected-app">' +
							'<a target="_blank" href="https://wappalyzer.com/applications/' + popup.slugify(appName) + '">' +
								'<img src="images/icons/' + ( response.apps[appName].icon || 'default.svg' ) + '"/>' +
								'<span class="label">' +
									'<span class="name">' + appName + '</span>' +
									( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' ) +
								'</span>' +
							'</a>';

					response.apps[appName].cats.forEach(function(cat) {
						html +=
							'<a target="_blank" href="https://wappalyzer.com/categories/' + popup.slugify(response.categories[cat].name) + '">' +
								'<span class="category"><span class="name">' + browser.i18n.getMessage('categoryName' + cat) + '</span></span>' +
							'</a>';
					});

					html +=
							'</a>' +
						'</div>';
				}
			} else {
				html = '<div class="empty">' + browser.i18n.getMessage('noAppsDetected') + '</div>';
			}

			detectedApps.innerHTML = html;

			// Force redraw after popup animation on Mac OS
			setTimeout(function() {
				document.body.innerHTML += '<span style="line-height: 1px;"> </span>';
			}, 600);
		},

		slugify: function(string) {
			return string.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/(?:^-|-$)/, '');
		}
	};

	popup.init();
}());
