document.addEventListener('DOMContentLoaded', function() {
	var
		d              = document,
		analyzeHeaders = d.getElementById('analyze-headers'),
		detectedApps   = d.getElementById('detected-apps')
		;

	var popup = {
		pollHeaders: null,

		init: function() {
			d.getElementById('options').addEventListener('click', function() {
				window.open(chrome.extension.getURL('options.html'));
			});

			analyzeHeaders.innerHTML = chrome.i18n.getMessage('analyzeHeaders');
			analyzeHeaders.removeAttribute('disabled');

			chrome.tabs.getSelected(null, function(tab) {
				if ( tab.url.match(/https?:\/\//) ) {
					detectedApps.innerHTML = '<div class="empty">' + chrome.i18n.getMessage('noAppsDetected') + '</div>';

					analyzeHeaders.addEventListener('click', function() {
						analyzeHeaders.setAttribute('disabled', 'disabled');

						chrome.extension.sendRequest({ id: 'fetch_headers', tab: tab });

						popup.pollHeaders = setInterval(popup.displayApps, 100);
					});

					if ( parseInt(localStorage['autoAnalyzeHeaders']) ) {
						analyzeHeaders.click();
					}
				} else {
					detectedApps.innerHTML = '<div class="empty">' + chrome.i18n.getMessage('nothingToDo') + '</div>';

					analyzeHeaders.setAttribute('disabled', 'disabled');
				}
			});

			popup.displayApps();
		},

		displayApps: function() {
			var appName, confidence, version;

			chrome.tabs.getSelected(null, function(tab) {
				chrome.extension.sendRequest({ id: 'get_apps', tab: tab }, function(response) {
					if ( response.tabCache.analyzed.indexOf('headers') > 0 ) {
						if ( popup.pollHeaders != null ) {
							clearTimeout(popup.pollHeaders);

							analyzeHeaders.innerHTML = chrome.i18n.getMessage('analyzeHeadersDone');
						}
					}

					if ( response.tabCache.count > 0 ) {
						detectedApps.innerHTML = '';

						for ( appName in response.tabCache.appsDetected ) {
							confidence = response.tabCache.appsDetected[appName].confidenceTotal;
							version    = response.tabCache.appsDetected[appName].version;

							html =
								'<div class="detected-app">' +
									'<a target="_blank" href="http://wappalyzer.com/applications/' + appName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '?utm_source=chrome&utm_medium=popup&utm_campaign=extensions">' +
										'<img src="images/icons/' + appName + '.png"/>' +
										'<span class="label">' + appName + ( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' ) + '</span>' +
									'</a>';

							response.apps[appName].cats.forEach(function(cat) {
								html +=
									'<a target="_blank" href="http://wappalyzer.com/categories/' + response.categories[cat] + '?utm_source=chrome&utm_medium=popup&utm_campaign=extensions">' +
										'<span class="category">' + chrome.i18n.getMessage('categoryName' + cat) + '</span>' +
									'</a>';
							});

							html +=
									'</a>' +
								'</div>';

							detectedApps.innerHTML = detectedApps.innerHTML + html;
						}
					}
				});
			});
		}
	};

	popup.init();
});
