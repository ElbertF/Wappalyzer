/** global: chrome */
/** global: browser */

(function() {
	var popup = {
		init: function() {
			popup.update([ 'p', {}, ' ' ], document, {});

			var func = function(tabs) {
				( chrome || browser ).runtime.sendMessage({ id: 'get_apps', tab: tabs[0], source: 'popup.js' }, function(response) {
					popup.update(popup.appsToDomTemplate(response));
				});
			};

			try {
				// Chrome, Firefox
				browser.tabs.query({ active: true, currentWindow: true }).then(func);
			} catch ( e ) {
				// Edge
				browser.tabs.query({ active: true, currentWindow: true }, func);
			}
		},

		update: function(dom) {
			if ( /complete|interactive|loaded/.test(document.readyState) ) {
				popup.replaceDom(dom);
			} else {
				document.addEventListener('DOMContentLoaded', function() {
					popup.replaceDom(dom);
				});
			}
		},

		replaceDom: function(domTemplate) {
			var body = document.body;

			while ( body.firstChild ) {
				body.removeChild(body.firstChild);
			}

			body.appendChild(jsonToDOM(domTemplate, document, {}));
		},

		appsToDomTemplate: function(response) {
			var
				appName, confidence, version,
				categories = [],
				template = [];

			if ( response.tabCache && response.tabCache.count > 0 ) {
				for ( appName in response.tabCache.appsDetected ) {
					confidence = response.tabCache.appsDetected[appName].confidenceTotal;
					version    = response.tabCache.appsDetected[appName].version;
					categories = [];

					response.apps[appName].cats.forEach(function(cat) {
						categories.push(
							[
								'a', {
									target: '_blank',
									href: 'https://wappalyzer.com/categories/' + popup.slugify(response.categories[cat].name)
								}, [
									'span', {
										class: 'category'
									}, [
										'span', {
											class: 'name'
										},
										browser.i18n.getMessage('categoryName' + cat)
									]
								]
							]
						);
					});

					template.push(
						[
							'div', {
								class: 'detected-app'
							}, [
								'a', {
									target: '_blank',
									href: 'https://wappalyzer.com/applications/' + popup.slugify(appName)
								}, [
									'img', {
										src: 'images/icons/' + ( response.apps[appName].icon || 'default.svg' )
									}
								], [
									'span', {
										class: 'label'
									}, [
										'span', {
											class: 'name'
										},
									 	appName
									],
									( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' )
								]
							],
							categories
						]
					);
				}
			} else {
				template = [
					'div', {
						class: 'empty'
					},
					browser.i18n.getMessage('noAppsDetected')
				];
			}

			return template;
		},

		slugify: function(string) {
			return string.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/(?:^-|-$)/, '');
		}
	};

	popup.init();
}());
