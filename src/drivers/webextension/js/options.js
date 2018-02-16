/** global: browser */
/** global: wappalyzer */

document.addEventListener('DOMContentLoaded', function() {
	var d = document;

	var options = {
		init: function() {
			options.load();

			d.querySelector('#github').addEventListener('click', function() {
				open(wappalyzer.config.githubURL);
			});

			d.querySelector('#twitter').addEventListener('click', function() {
			 	open(wappalyzer.config.twitterURL);
			});

			d.querySelector('#wappalyzer').addEventListener('click', function() {
				open(wappalyzer.config.websiteURL);
			});
		},

		get: function(name, defaultValue, callback) {
			browser.storage.local.get(name).then(function(item) {
				callback(item.hasOwnProperty(name) ? item[name] : defaultValue);
			});
		},

		set: function(name, value) {
			var option = {};

			option[name] = value;

			browser.storage.local.set(option);
		},

		load: function() {
			options.get('upgradeMessage', true, function(value) {
				var el = d.querySelector('#option-upgrade-message');

				el.checked = value;

				el.addEventListener('change', function() {
					options.set('upgradeMessage', el.checked);
				});
			});

			options.get('dynamicIcon', true, function(value) {
				var el = d.querySelector('#option-dynamic-icon');

				el.checked = value;

				el.addEventListener('change', function() {
					options.set('dynamicIcon', el.checked);
				});
			});

			options.get('tracking', true, function(value) {
				var el = d.querySelector('#option-tracking');

				el.checked = value;

				el.addEventListener('change', function() {
					options.set('tracking', el.checked);
				});
			});
		}
	};

	options.init();
});
