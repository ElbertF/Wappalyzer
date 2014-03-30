document.addEventListener('DOMContentLoaded', function() {
	var
		d              = document,
		detectedApps   = d.getElementById('detected-apps');

	var popup = {
		init: function() {
			d.getElementById('options').addEventListener('click', function() {
				window.open(chrome.extension.getURL('options.html'));
			});

			chrome.tabs.getSelected(null, function(tab) {
				if ( tab.url.match(/https?:\/\//) ) {
					detectedApps.innerHTML = '<div class="empty">' + chrome.i18n.getMessage('noAppsDetected') + '</div>';
				} else {
					detectedApps.innerHTML = '<div class="empty">' + chrome.i18n.getMessage('nothingToDo') + '</div>';
				}
			});

			popup.displayApps();
		},

		displayApps: function() {
			var appName, confidence, version;

			chrome.tabs.getSelected(null, function(tab) {
				chrome.extension.sendRequest({ id: 'get_apps', tab: tab }, function(response) {
					if ( response.tabCache && response.tabCache.count > 0 ) {
						detectedApps.innerHTML = '';

						for ( appName in response.tabCache.appsDetected ) {
							confidence = response.tabCache.appsDetected[appName].confidenceTotal;
							version    = response.tabCache.appsDetected[appName].version;

							html =
								'<div class="detected-app">' +
									'<a target="_blank" href="https://wappalyzer.com/applications/' + appName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '?pk_campaign=chrome&pk_kwd=popup">' +
										'<img src="images/icons/' + appName + '.png"/>' +
										'<span class="label"><span class="name">' + appName + '</span>' + ( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' ) + '</span>' +
									'</a>';

							response.apps[appName].cats.forEach(function(cat) {
								html +=
									'<a target="_blank" href="https://wappalyzer.com/categories/' + response.categories[cat] + '?pk_campaign=chrome&pk_kwd=popup">' +
										'<span class="category"><span class="name">' + chrome.i18n.getMessage('categoryName' + cat) + '</span></span>' +
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
