$(function() {
	var options = {
		opts: defaults,

		init: function() {
			options.load();

			$('#github'    ).click(function() { window.open(wappalyzer.config.githubURL);  });
			$('#twitter'   ).click(function() { window.open(wappalyzer.config.twitterURL); });
			$('#wappalyzer').click(function() { window.open(wappalyzer.config.websiteURL + '?utm_source=chrome&utm_medium=extension&utm_campaign=extensions'); });

			$('#options-save').click(options.save);
		},

		load: function() {
			for ( option in options.opts ) {
				if ( value = localStorage[option] ) {
					options.opts[option] = value;
				}
			}

			if ( parseInt(options.opts.autoAnalyzeHeaders) ) {
				$('#option-auto-analyze-headers').attr('checked', 'checked');
			}

			if ( parseInt(options.opts.upgradeMessage) ) {
				$('#option-upgrade-message').attr('checked', 'checked');
			}

			if ( parseInt(options.opts.tracking) ) {
				$('#option-tracking').attr('checked', 'checked');
			}
		},

		save: function() {
			options.opts.autoAnalyzeHeaders = $('#option-auto-analyze-headers').is(':checked') ? 1 : 0;
			options.opts.upgradeMessage     = $('#option-upgrade-message'     ).is(':checked') ? 1 : 0;
			options.opts.tracking           = $('#option-tracking'            ).is(':checked') ? 1 : 0;

			for ( option in options.opts ) {
				localStorage[option] = options.opts[option];
			}
			document.getElementById('options-saved').style.display = 'inline';
			setTimeout(function(){document.getElementById('options-saved').style.display = 'none';},2000);

		}
	};

	options.init();
});