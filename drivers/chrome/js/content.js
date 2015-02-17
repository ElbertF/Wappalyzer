(function() {
	var c = {
		// GXXX addition
		createWappylizerDoc: function(tabCache)
		{
			// Current date
			var d = new Date();

			// Round the date down to the zero hour for this day
			var epoch_rounded = new Date(d.getFullYear(), d.getMonth(), d.getDate());

			var doc;
			var apps = [];

			for ( app in tabCache.appsDetected )
			{
				var full_ver = tabCache.appsDetected[app].app.trim() + " " + tabCache.appsDetected[app].version;

				apps.push( full_ver.trim() );
			}

			doc = {
				'originator': 'wappalyzer',
				'title': 'Web App Versions Analysis',
				'date': (epoch_rounded/1000),
				'apps': apps
			};

			return doc;
		},
		
		// GXXX addition
		waCallback: function( response )
		{
			console.log(' [*] Sent Wappalyzer doc');			
			
			// Send the document to our server
			msgSendExtensionIdle( response.tab_id, response.taburl, chrome.i18n.getMessage('@@extension_id') );
		},
		
		init: function() {
			var html = document.documentElement.outerHTML;

			c.log('init');

			if ( html.length > 50000 ) {
				html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
			}

			chrome.extension.sendRequest({ id: 'analyze', subject: { html: html } });

			c.getEnvironmentVars();
		},

		log: function(message) {
			chrome.extension.sendRequest({ id: 'log', message: '[ content.js ] ' + message });
		},

		getEnvironmentVars: function() {
			var container, script;

			c.log('getEnvironmentVars');

			if ( typeof document.documentElement.innerHTML === 'undefined' ) {
				return;
			}

			try {
				container = document.createElement('wappalyzerData');

				container.setAttribute('id',    'wappalyzerData');
				container.setAttribute('style', 'display: none');

				script = document.createElement('script');

				script.setAttribute('id', 'wappalyzerEnvDetection');
				script.setAttribute('src', chrome.extension.getURL('js/inject.js'));

				container.addEventListener('wappalyzerEvent', (function(event) {
					var environmentVars = event.target.childNodes[0].nodeValue;

					document.documentElement.removeChild(container);
					document.documentElement.removeChild(script);

					c.log('getEnvironmentVars: ' + environmentVars);

					environmentVars = environmentVars.split(' ').slice(0, 500);

					chrome.extension.sendRequest({ id: 'analyze', subject: { env: environmentVars } }, function(response) {
						// GXXX addition
						if ( response.taburl.toLowerCase() === document.location.href.toLowerCase() )
						{
							console.log( " ========== MAIN FRAME ========");
							console.log( " [*] tabCache:");
							console.log( response.tabCache );
							
							wappylizer_doc = c.createWappylizerDoc( response.tabCache );
							
							console.log( wappylizer_doc );
							
							msgSendExtensionDoc( response.tab_id, location.href, wappylizer_doc, c.waCallback);
						}else
						{
							console.log( " ========== NOT MAIN FRAME ========");
							console.log( " [*] tabCache:");
							console.log( response.tabCache );		
						}				
					});
				}), true);

				document.documentElement.appendChild(container);
				document.documentElement.appendChild(script);
			} catch(e) {
				c.log('Error: ' + e);
			}
		}
	}

	// GXXX addition
	var harvest_timer = 0;
	chrome.extension.sendMessage(spotkickCoreExtensionId, {type: "process_page", originating_url: location.href }, 
	function(response) {
		if ( !response.ignore )
		{
			console.log( " [*] Wappalyzer: I was NOT told to ignore this page");
			
			// Not ignoring
			$(document).ready(function() {
				var harvest_ms = 5000;  // 5 seconds

				// Process the page
				if ( harvest_timer != 0 )
				{
					console.log(' [*] Clearing Timer');
					clearInterval( harvest_timer );
				}	

				// Wait to process page
				console.log(response);
				harvest_timer = setTimeout( function(){
					c.init();
				}, harvest_ms );
			});
		}else
		{
			console.log( " [*] Wappalyzer: I was told to ignore this page");
		}		
	} );
}());
