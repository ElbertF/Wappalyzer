(function() {
	//'use strict';

	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	w.categories = {
		 1: 'cms',
		 2: 'message-boards',
		 3: 'database-managers',
		 4: 'documentation-tools',
		 5: 'widgets',
		 6: 'web-shops',
		 7: 'photo-galleries',
		 8: 'wikis',
		 9: 'hosting-panels',
		10: 'analytics',
		11: 'blogs',
		12: 'javascript-frameworks',
		13: 'issue-trackers',
		14: 'video-players',
		15: 'comment-systems',
		16: 'captchas',
		17: 'font-scripts',
		18: 'web-frameworks',
		19: 'miscellaneous',
		20: 'editors',
		21: 'lms',
		22: 'web-servers',
		23: 'cache-tools',
		24: 'rich-text editors',
		25: 'javascript-graphics',
		26: 'mobile-frameworks',
		27: 'programming-languages',
		28: 'operating-systems',
		29: 'search-engines',
		30: 'web-mail',
		31: 'cdn'
	};

	w.apps = {
		'1C-Bitrix': {
			cats: [ 1 ],
			headers: { 'X-Powered-CMS': /Bitrix Site Manager/, 'Set-Cookie': /BITRIX_/i },
			html: /<link[^>]+components\/bitrix|(src|href)=("|')\/bitrix\/(js|templates)/i,
			script: /1c\-bitrix/i,
			implies: [ 'PHP' ]
		},
		'1und1': {
			cats: [ 6 ],
			url: /\/shop\/catalog\/browse\?sessid\=/,
			implies: [ 'PHP' ]
		},
		'2z Project': {
			cats: [ 1 ],
			meta: { 'generator': /2z project/i }
		},
		'AddThis': {
			cats: [ 5 ],
			script: /addthis\.com\/js/,
			env: /^addthis$/
		},
		'Adobe CQ5': {
			cats: [ 1 ],
			url: /\/etc\/designs\//i,
			html: /<div class="[^"]*parbase/,
			implies: [ 'Java' ]
		},
		'Adobe GoLive': {
			cats: [ 20 ],
			meta: { 'generator': /Adobe GoLive/i }
		},
		'Advanced Web Stats': {
			cats: [ 10 ],
			html: /aws.src = [^<]+caphyon\-analytics/i,
			implies: [ 'Java' ]
		},
		'Alloy': {
			cats: [ 12 ],
			env: /^AUI$/
		},
		'Ametys': {
			cats: [ 1 ],
			meta: { 'generator': /(Ametys|Anyware Technologies)/i },
			script: /STools.js/,
			implies: [ 'Java' ]
		},
		'Amiro.CMS': {
			cats: [ 1 ],
			meta: { 'generator': /Amiro/i },
			html: /system_js\.php(\?|\-)script=/,
			implies: [ 'PHP' ]
		},
		'AMPcms': {
			cats: [ 1 ],
			headers: { 'X-AMP-Version': /.*/i, 'Set-Cookie': /AMP=/ },
			env: /amp_js_init/,
			implies: [ 'PHP' ]
		},
		'AOLserver': {
			cats: [ 22 ],
			headers: { 'Server': /AOLserver/i } },
		'Apache': {
			cats: [ 22 ],
			headers: { 'Server': /(Apache($|[^-])|HTTPD)/i } },
		'Apache JSPWiki': {
			cats: [ 8 ],
			url: /wiki\.jsp/,
			script: /jspwiki/,
			html: /<html[^>]* xmlns:jspwiki=/i
		},
		'Apache Tomcat': {
			cats: [ 22 ],
			headers: { 'Server': /Apache-Coyote/i } },
		'Apache Traffic Server': {
			cats: [ 22 ],
			headers: { 'Server': /YTS/i } },
		'Arc Forum': {
			cats: [ 2 ],
			html: /ping\.src = node\.href;/
		},
		'ATG Web Commerce': {
			cats: [ 6 ],
			headers: { 'X-ATG-Version': /ATG/i },
			html: /<[^>]+_DARGS/
		},
		'Atlassian Confluence': {
			cats: [ 8 ],
			html: /Powered by <a href=.http:\/\/www\.atlassian\.com\/software\/confluence/i,
			implies: [ 'Java' ]
		},
		'Atlassian Jira': {
			cats: [ 13 ],
			env: /^jira$/i,
			html: /Powered by <a href=.http:\/\/www\.atlassian\.com\/software\/jira/i,
			implies: [ 'Java' ]
		},
		'AWStats': {
			cats: [ 10 ],
			meta: { 'generator': /AWStats/i },
			implies: [ 'Perl' ]
		},
		'Backbone.js': {
			cats: [ 12 ],
			script: /backbone.*\.js/,
			env: /^Backbone$/,
			implies: [ 'Underscore.js' ]
		},
		'Banshee': {
			cats: [ 1, 18 ],
			html: /Built upon the <a href=("|')[^>]+banshee-php\.org/i,
			implies: [ 'PHP' ]
		},
		'BIGACE': {
			cats: [ 1 ],
			meta: { 'generator': /BIGACE/ },
			html: /Powered by <a href=("|')[^>]+BIGACE|<!--\s+Site is running BIGACE/i,
			implies: [ 'PHP' ]
		},
		'Bigcommerce': {
			cats: 	[ 6 ],
			url:    /.+\.mybigcommerce\.com/,
			html: 	/<link href="http\:\/\/cdn[0-9]+\.bigcommerce\.com\/v/,
			script: /^http\:\/\/cdn[0-9]+\.bigcommerce\.com\/v/,
			env: 	/compareProducts/
		},
		'BigDump': {
			cats: [ 3 ],
			html: /<!-- <h1>BigDump: Staggered MySQL Dump Importer/,
			implies: [ 'PHP' ]
		},
		'Bigware': {
			cats: [ 6 ],
			html: /Diese <a href=("|')http:\/\/www\.bigware\.de("|')|<center>[^<]+<a href="http:\/\/www\.bigware\.de[^"]*" target="_blank">\s*<u>Shopsoftware\s*<\/u>\s*<\/a>[^<]+<\/center>/i,
			url: /(\?|&)bigWAdminID=[a-z0-9]+(&|$)/i,
			headers: { 'Set-Cookie': /bigwareCsid|bigWAdminID/ },
			implies: [ 'PHP' ]
		},
		'Blip.tv': {
			cats: [ 14 ],
			html: /<(param|embed)[^>]+blip\.tv\/play/i
		},
		'Blogger': {
			cats: [ 11 ],
			meta: { 'generator': /blogger/i
		},
			url: /^(www.)?.+\.blogspot\.com/i
		},
		'BrowserCMS': {
			cats: [ 1 ],
			meta: { 'generator': /BrowserCMS/i },
			implies: [ 'Ruby' ]
		},
		'Bugzilla': {
			cats: [ 13 ],
			html: /href="enter_bug\.cgi">/,
			implies: [ 'Perl' ]
		},
		'Burning Board': {
			cats: [ 2 ],
			html: /<a href=('|")[^>]+woltlab\.com.+Burning Board/i,
			implies: [ 'PHP' ]
		},
		'Business Catalyst': {
			cats: [ 1 ],
			script: /CatalystScripts/,
			html: /<!-- BC_OBNW -->/
		},
		'CakePHP': {
			cats: [ 18 ],
			headers: { 'Set-Cookie': /cakephp=/i },
			meta: { 'application-name': /CakePHP/i },
			implies: [ 'PHP' ]
		},
		'Cargo': {
			cats: [ 1 ],
			meta: {'cargo_title': /.*/ },
			script: /\/cargo\./i,
			html: /<link [^>]+Cargo feed/,
			implies: [ 'PHP' ]
		},
		'CentOS': {
			cats: [ 28 ],
			headers: { 'Server': /CentOS/i, 'X-Powered-By': /CentOS/i }
		},
		'CFML': {
			cats: [ 27 ]
		},
		'Chameleon': {
			cats: [ 1 ],
			meta: { 'generator': /chameleon\-cms/i },
			implies: [ 'Apache', 'PHP' ]
		},
		'Chamilo': {
			cats: [ 21 ],
			meta: { 'generator': /Chamilo/i }, headers: { 'X-Powered-By': /Chamilo/i },
			implies: [ 'PHP' ]
		},
		'Chartbeat': {
			cats: [ 10 ],
			html: /function loadChartbeat\(\) {/i
		},
		'Cherokee': {
			cats: [ 22 ],
			headers: { 'Server': /Cherokee/i } },
		'CKEditor': {
			cats: [ 24 ],
			env: /^CKEDITOR$/i,
			implies: [ 'PHP' ]
		},
		'ClickHeat': {
			cats: [ 10 ],
			script: /clickheat.*\.js/i,
			env: /^clickHeatBrowser$/,
			implies: [ 'PHP' ]
		},
		'ClickTale': {
			cats: [ 10 ],
			html: /if\(typeof ClickTale(Tag)*==("|')function("|')\)/,
			env: /^ClickTale/i
		},
		'Clicky': {
			cats: [ 10 ],
			script: /static\.getclicky\.com/,
			env: /^clicky$/
		},
		'CloudFlare': {
			cats: [ 31 ],
			headers: { 'Server': /cloudflare/i }
		},
		'CMS Made Simple': {
			cats: [ 1 ],
			meta: { 'generator': /CMS Made Simple/i },
			implies: [ 'PHP' ]
		},
		'CO2Stats': {
			cats: [ 10 ],
			html: /src=("|')http:\/\/www\.co2stats\.com\/propres\.php/
		},
		'CodeIgniter': {
			cats: [ 18 ],
			headers: { 'Set-Cookie': /(exp_last_activity|exp_tracker|ci_session)/ },
			implies: [ 'PHP' ]
		},
		'Commerce Server': {
			cats: [ 6 ],
			headers: { 'COMMERCE-SERVER-SOFTWARE': /.+/ },
			implies: [ 'Microsoft ASP.NET', 'IIS', 'Windows Server' ]
		},
		'comScore': {
			cats: [ 10 ],
			html: /<i{1}frame[^>]* (id=("|')comscore("|')|scr=[^>]+comscore)/,
			env: /^_?COMSCORE$/i
		},
		'Concrete5': {
			cats: [ 1 ],
			script: /concrete\/js\//,
			meta: { 'generator': /concrete5/i },
			env: /CCM_IMAGE_PATH/,
			implies: [ 'PHP' ]
		},
		'Connect': {
			cats: [ 18 ],
			headers: { 'X-Powered-By': /^Connect$/i },
			implies: [ 'node.js' ]
		},
		'Contao': {
			cats: [ 1, 6 ],
			html: /(<!--\s+This website is powered by (TYPOlight|Contao)|<link[^>]+(typolight|contao).css)/i,
			implies: [ 'PHP' ]
		},
		'Contenido': {
			cats: [ 1 ],
			meta: { 'generator': /Contenido/i },
			implies: [ 'PHP' ]
		},
		'Contens': {
			cats: [ 1 ],
			meta: { 'generator': /contens/i },
			implies: [ 'Java', 'CFML' ]
		},
		'ConversionLab': {
			cats: [ 10 ],
			script: /conversionlab\.trackset\.com\/track\/tsend\.js/
		},
		'Coppermine': {
			cats: [ 7 ],
			html: /<!--Coppermine Photo Gallery/i,
			implies: [ 'PHP' ]
		},
		'Cosmoshop': {
			cats: [ 6 ],
			script: /cosmoshop_functions\.js/
		},
		'Cotonti': {
			cats: [ 1 ],
			meta: { 'generator': /Cotonti/i },
			implies: [ 'PHP' ]
		},
		'CouchDB': {
			cats: [ 22 ],
			headers: { 'Server': /CouchDB/i }
		},
		'cPanel': {
			cats: [ 9 ],
			headers: { 'Server': /cpsrvd/i },
			html: /<!-- cPanel/i
		},
		'CPG Dragonfly': {
			cats: [ 1 ],
			headers: { 'X-Powered-By': /Dragonfly CMS/i },
			meta: { 'generator': /CPG Dragonfly/i },
			implies: [ 'PHP' ]
		},
		'Crazy Egg': {
			cats: [ 10 ],
			env: /CE2/,
			script: /cetrk\.com\/pages\/scripts\/[0-9]+\/[0-9]+\.js/
		},
		'CS Cart': {
			cats: [ 6 ],
			env: /fn_compare_strings/i,
			html: /&nbsp;Powered by (<a href=.http:\/\/www\.cs\-cart\.com|CS\-Cart)/i,
			implies: [ 'PHP' ]
		},
		'CubeCart': {
			cats: [ 6 ],
			html: /(Powered by <a href=.http:\/\/www\.cubecart\.com|<p[^>]+>Powered by CubeCart)/i,
			meta: { 'generator': /cubecart/i },
			implies: [ 'PHP' ]
		},
		'Cufon': {
			cats: [ 17 ],
			script: /cufon\-yui\.js/,
			env: /^Cufon$/
		},
		'd3': {
			cats: [ 25 ],
			script: /d3(\.v2)(\.min)?\.js/
		},
		'Dancer': {
			cats: [ 18 ],
			headers: { 'X-Powered-By': /Perl Dancer/, 'Server': /Perl Dancer/ },
			implies: [ 'Perl' ]
		},
		'Danneo CMS': {
			cats: [ 1 ],
			headers: {'X-Powered-By': /CMS Danneo.*/i},
			meta: { 'generator': /Danneo/i },
			implies: [ 'Apache', 'PHP' ]
		},
		/*
		'dashCommerce': {
			cats: [ 6 ],
			implies: [ 'Microsoft ASP.NET', 'IIS', 'Windows Server' ]
		},
		*/
		'DataLife Engine': {
			cats: [ 1 ],
			env: /dle_root/i,
			meta: { 'generator': /DataLife Engine/i },
			implies: [ 'PHP', 'Apache' ]
		},
		'David Webbox': {
			cats: [ 22 ],
			headers: { 'Server': /David-WebBox/i }
		},
		'Debian': {
			cats: [ 28 ],
			headers: { 'Server': /Debian/i, 'X-Powered-By': /(Debian|dotdeb|etch|lenny|squeeze|wheezy)/i }
		},
		'DedeCMS': {
			cats: [ 1 ],
			env: /^Dede/,
			script: /dedeajax/,
			implies: [ 'PHP' ]
		},
		'Demandware': {
			cats: [ 6 ],
			headers: {'Server' : /Demandware eCommerce Server/i},
			html: /<[^>]+demandware.edgesuite/,
			env: /^dwAnalytics/
		},
		'DHTMLX': {
			cats: [ 12 ],
			script: /dhtmlxcommon\.js/
		},
		'DirectAdmin': {
			cats: [ 9 ],
			html: /<a[^>]+>DirectAdmin<\/a> Web Control Panel/i,
			implies: [ 'PHP', 'Apache' ]
		},
		'Disqus': {
			cats: [ 15 ],
			script: /disqus_url/,
			html: /<div[^>]+id=("|')disqus_thread("|')/,
			env: /^DISQUS/i
		},
		'Django': {
			cats: [ 18 ],
			html: /powered by <a[^>]+>Django/i,
			implies: [ 'Python' ]
		},
		'Django CMS': {
			cats: [ 1 ],
			script: /media\/cms\/js\/csrf\.js/,
			headers: { 'Set-Cookie': /django/ },
			implies: [ 'Django' ]
		},
		'Dojo': {
			cats: [ 12 ],
			script: /dojo(\.xd)?\.js/,
			env: /^dojo$/
		},
		'Dokeos': {
			cats: [ 21 ],
			meta: { 'generator': /Dokeos/i },
			html: /Portal <a[^>]+>Dokeos|@import "[^"]+dokeos_blue/i,
			headers: { 'X-Powered-By': /Dokeos/ },
			implies: [ 'PHP', 'xajax', 'jQuery', 'CKEditor' ]
		},
		'DokuWiki': {
			cats: [ 8 ],
			meta: { 'generator': /DokuWiki/i },
			implies: [ 'PHP' ]
		},
		'DotNetNuke': {
			cats: [ 1 ],
			meta: { 'generator': /DotNetNuke/i },
			html: /<!\-\- by DotNetNuke Corporation/i,
			env: /^DotNetNuke/i,
			implies: [ 'Microsoft ASP.NET' ]
		},
		'Doxygen': {
			cats: [ 4 ],
			html: /(<!-- Generated by Doxygen|<link[^>]+doxygen.css)/i
		},
		'DreamWeaver': {
			cats: [ 20 ],
			html: /(<!\-\-[^>]*(InstanceBeginEditable|Dreamweaver[^>]+target|DWLayoutDefaultTable)|function MM_preloadImages\(\) {)/
		},
		'Drupal': {
			cats: [ 1 ],
			script: /drupal\.js/,
			html: /(jQuery\.extend\(Drupal\.settings, \{|Drupal\.extend\(\{ settings: \{|<link[^>]+sites\/(default|all)\/themes\/|<style[^>]+sites\/(default|all)\/(themes|modules)\/)/i,
			headers: { 'X-Drupal-Cache': /.*/, 'X-Generator': /Drupal/, 'Expires': /19 Nov 1978/ },
			env: /^Drupal$/,
			implies: [ 'PHP' ]
		},
		'Drupal Commerce': {
			cats: [ 6 ],
			html: /id="block[_-]commerce[_-]cart[_-]cart|class="commerce[_-]product[_-]field/i,
			implies: [ 'PHP', 'Drupal' ]
		},
		'Dynamicweb': {
			cats: [ 1, 6, 10 ],
			meta: { 'generator': /Dynamicweb/i },
			headers: {'Set-Cookie': /Dynamicweb=/ },
			implies: [ 'Microsoft ASP.NET' ]
		},
		'e107': {
			cats: [ 1 ],
			script: /e107\.js/,
			implies: [ 'PHP']
		},
		/*
		'Ecodoo': {
			cats: [ 6 ],
			script: /addons\/lytebox\/lytebox\.js/
		},
		*/
		'EPiServer': {
			cats: [ 1 ],
			meta: { 'generator': /EPiServer/i },
			implies: [ 'Microsoft ASP.NET', 'IIS', 'Windows Server' ]
		},
		'Exhibit': {
			cats: [ 25 ],
			script: /exhibit.*\.js/,
			env: /^Exhibit$/
		},
		'Express': {
			cats: [ 18 ],
			headers: { 'X-Powered-By': /^Express$/i },
			implies: [ 'Connect', 'node.js' ]
		},
		'ExpressionEngine': {
			cats: [ 1 ],
			headers: { 'Set-Cookie': /(exp_last_activity|exp_tracker)/ },
			implies: [ 'PHP' ]
		},
		'ExtJS': {
			cats: [ 12 ],
			script: /ext\-base\.js/,
			env: /^Ext$/
		},
		'eZ Publish': {
			cats: [ 1, 6 ],
			meta: { 'generator': /eZ Publish/i },
			implies: [ 'PHP' ]
		},
		'Fact Finder': {
			cats: [ 29 ],
			html: /\/images\/fact-finder\.gif|ViewParametricSearch|factfinder|Suggest\.ff/i,
			url: /ViewParametricSearch|factfinder|ffsuggest/i
		},
		'FAST ESP': {
			cats: [ 29 ],
			html: /fastsearch|searchProfile\=|searchCategory\=/i,
			url: /esppublished|searchProfile\=|searchCategory\=/i
		},
		'FAST Search for SharePoint': {
			cats: [ 29 ],
			url: /Pages\/SearchResults\.aspx\?k\=/,
			implies: [ 'Microsoft SharePoint', 'Microsoft ASP.NET' ]
		},
		'FlexCMP': {
			cats: [ 1 ],
			meta: { 'generator': /FlexCMP/ },
			headers: { 'X-Powered-By': /FlexCMP/ }
		},
		'FluxBB': {
			cats: [ 2 ],
			html: /Powered by (<strong>)?<a href=("|')[^>]+fluxbb/i
		},
		'Flyspray': {
			cats: [ 13 ],
			html: /(<a[^>]+>Powered by Flyspray|<map id=("|')projectsearchform|Powered by <a href=("|')http:\/\/flyspray\.org\/("|'))/
		},
		'FreeBSD': {
			cats: [ 28 ],
			headers: { 'Server': /FreeBSD/i }
		},
		'FrontPage': {
			cats: [ 20 ],
			meta: { 'generator': /Microsoft FrontPage/ },
			html: /<html[^>]+urn:schemas\-microsoft\-com:office:office/i
		},
		'FWP': {
			cats: [ 6 ],
			meta: {'generator': /FWP Shop/ }
		},
		'Gallery': {
			cats: [ 7 ],
			env: /galleryAuthToken/,
			html: /<div id="gsNavBar" class="gcBorder1">/
		},
		'Gambio': {
			cats: [ 6 ],
			html: /<link+.*[^>] href="templates\/gambio\/|<a+.*[^>]content\.php\?coID=\d|<!-- gambio eof -->/,
			implies: [ 'PHP' ]
		},
		'Gauges': {
			cats: [ 10 ],
			html: /t\.src = '\/\/secure\.gaug\.es\/track\.js/,
			env: /^_gauges$/
		},
		'Gentoo' : {
			cats: [ 28 ],
			headers: { 'X-Powered-By': /-?gentoo/}
		},
		'Get Satisfaction': {
			cats: [ 13 ],
			html: /var feedback_widget = new GSFN\.feedback_widget\(feedback_widget_options\)/
		},
		'GetSimple CMS': {
			cats: [ 1 ],
			meta: {'generator': /GetSimple/ },
			implies: [ 'PHP' ]
		},
		'Google Analytics': {
			cats: [ 10 ],
			html: /_gaq\.push\(\['_setAccount/,
			script: /(\.google\-analytics\.com\/ga\.js|google-analytics\.com\/urchin\.js)/,
			headers: { 'Set-Cookie': /__utma/ },
			env: /^gaGlobal$/
		},
		'Google App Engine': {
			cats: [ 22 ],
			headers: { 'Server': /Google Frontend/i }
		},
		'Google Font API': {
			cats: [ 17 ],
			script: /googleapis.com\/.+webfont/,
			html: /<link[^>]* href=("|')http:\/\/fonts\.googleapis\.com/,
			env: /^WebFont/
		},
		'Google Maps': {
			cats: [ 5 ],
			script: /(maps\.google\.com\/maps\?file=api|maps\.google\.com\/maps\/api\/staticmap)/
		},
		'Google Sites': {
			cats: [ 1 ],
			url: /sites.google.com/
		},
		'GoStats': {
			cats: [ 10 ],
			env: /^_go(stats|_track)/i
		},
		'Graffiti CMS': {
			cats: [ 1 ],
			meta: { 'generator': /Graffiti CMS/i }
		},
		'Gravatar': {
			cats: [ 19 ],
			env: /^Gravatar$/
		},
		'Gravity Insights': {
			cats: [ 10 ],
			html: /gravityInsightsParams\.site_guid = '/,
			env: /^GravityInsights$/
		},
		'Handlebars': {
			cats: [ 12 ],
			env: /^Handlebars$/
		},
		'Hiawatha': {
			cats: [ 22 ],
			headers: { 'Server': /Hiawatha/i }
		},
		'Highcharts': {
			cats: [ 25 ],
			script: /highcharts.*\.js/,
			env: /^Highcharts$/
		},
		'Hotaru CMS': {
			cats: [ 1 ],
			meta: { 'generator': /Hotaru CMS/i }
		},
		'Hybris': {
			cats: [ 6 ],
			html: /\/sys_master\/|\/hybr\//,
			headers: { 'Set-Cookie': /_hybris/ },
			implies: [ 'Java' ]
		},
		'IBM HTTP Server': {
			cats: [ 22 ],
			headers: { 'Server': /IBM_HTTP_Server/i }
		},
		'IBM WebSphere Portal': {
			cats: [ 1 ],
			headers: { 'IBM-Web2-Location': /.*/ },
			url: /\/wps\//,
			implies: [ 'Java' ]
		},
		'IBM WebSphere Commerce': {
			cats: [ 6 ],
			url: /\/wcs\//,
			implies: [ 'Java' ]
		},
		'IIS': {
			cats: [ 22 ],
			headers: { 'Server': /IIS/i },
			implies: [ 'Windows Server' ]
		},
		'ImpressCMS': {
			cats: [ 1 ],
			script: /include\/linkexternal\.js/,
			meta: { 'generator': /ImpressCMS/ },
			headers: { 'X-Powered-By': /ImpressCMS/ },
			implies: [ 'PHP' ]
		},
		'ImpressPages': {
			cats: [ 1 ],
			meta: { 'generator': /ImpressPages/i },
			implies: [ 'PHP' ]
		},
		'Indexhibit': {
			cats: [ 1 ],
			html: /<(link|a href) [^>]+ndxz-studio/i,
			implies: [ 'PHP', 'Apache' ]
		},
		'InstantCMS': {
			cats: [ 1 ],
			meta: { 'generator': /InstantCMS/i }
		},
		'Intershop': {
			cats: [ 6 ],
			url: /is-bin|INTERSHOP/i,
			script: /is-bin|INTERSHOP/i
		},
		'IPB': {
			cats: [ 2 ],
			script: /jscripts\/ips_/,
			env: /^IPBoard/,
			html: /<link[^>]+ipb_[^>]+\.css/
		},
		'iWeb': {
			cats: [ 20 ],
			meta: { 'generator': /iWeb/i }
		},
		'Jalios': {
			cats: [ 1 ],
			meta: { 'generator': /Jalios/i }
		},
		'Java': {
			cats: [ 27 ],
			headers: { 'Set-Cookie': /JSESSIONID/ }
		},
		'Javascript Infovis Toolkit': {
			cats: [ 25 ],
			script: /jit.*\.js/,
			env: /^\$jit$/
		},
		'Jo': {
			cats: [ 26, 12 ],
			env: /^jo(Cache|DOM|Event)$/
		},
		'JobberBase': {
			cats: [ 19 ],
			meta: { 'generator': /Jobberbase/i },
			env: /^Jobber$/
		},
		'Joomla': {
			cats: [ 1 ],
			url: /option=com_/i,
			meta: { 'generator': /Joomla/i },
			html: /(<!\-\- JoomlaWorks "K2"|<[^>]+(feed|components)\/com_)/i,
			headers: { 'X-Content-Encoded-By': /Joomla/ },
			env: /^(jcomments)$/i
		},
		'jqPlot': {
			cats: [ 25 ],
			script: /jqplot.*\.js/,
			env: /^jQuery.jqplot$/
		},
		'jQTouch': {
			cats: [ 26 ],
			script: /jqtouch.*\.js/i,
			env:/^jQT$/
		},
		'jQuery': {
			cats: [ 12 ],
			script: /jquery.*.js/,
			env: /^jQuery$/
		},
		'jQuery Mobile': {
			cats: [ 26 ],
			script: /jquery\.mobile.*\.js/i
		},
		'jQuery Sparklines': {
			cats: [ 25 ],
			script: /jquery\.sparkline.*\.js/i
		},
		'jQuery UI': {
			cats: [ 12 ],
			script: /jquery\-ui.*\.js/,
			implies: [ 'jQuery' ]
		},
		'JS Charts': {
			cats: [ 25 ],
			script: /jscharts.*\.js/i,
			env: /^JSChart$/
		},
		'JTL Shop': {
			cats: [ 6 ],
			html: /(<input[^>]+name=('|")JTLSHOP|<a href=('|")jtl\.php)/i
		},
		'K2': {
			cats: [ 19 ],
			html: /<!\-\- JoomlaWorks "K2"/,
			env: /^K2RatingURL$/,
			implies: [ 'Joomla' ]
		},
		'Kampyle': {
			cats: [ 10, 13 ],
			script: /cf\.kampyle\.com\/k_button\.js/,
			headers: { 'Set-Cookie': /k_visit/ },
			env: /^k_track$/
		},
		'Kentico CMS': {
			cats: [ 1 ],
			meta: { 'generator': /Kentico CMS/i }
		},
		'Koego': {
			cats: [ 10 ],
			script: /tracking\.koego\.com\/end\/ego\.js/
		},
		'Kohana': {
			cats: [ 18 ],
			headers: { 'Set-Cookie': /kohanasession/i, 'X-Powered-By': /Kohana/ },
			implies: [ 'PHP' ]
		},
		'Kolibri CMS': {
			cats: [ 1 ],
			meta: { 'generator': /Kolibri/i }
		},
		'Koobi': {
			cats: [ 1 ],
			meta: { 'generator': /Koobi/i }
		},
		'LEPTON': {
			cats: [ 1 ],
			meta: { 'generator': /LEPTON/i },
			implies: [ 'PHP' ]
		},
		'Liferay': {
			cats: [ 1 ],
			env: /^Liferay$/,
			headers: { 'Liferay-Portal': /.*/i }
		},
		'LightMon Engine': {
			cats: [ 1 ],
			html: /<!-- Lightmon Engine Copyright Lightmon/i,
			implies: [ 'PHP' ]
		},
		'lighttpd': {
			cats: [ 22 ],
			headers: { 'Server': /lighttpd/i }
		},
		'LimeSurvey': {
			cats: [ 19 ],
			headers: { 'generator': /LimeSurvey/i }
		},
		'LiveJournal': {
			cats: [ 11 ],
			url: /^(www.)?.+\.livejournal\.com/i
		},
		'Lotus Domino': {
			cats: [ 22 ],
			headers: { 'Server': /Lotus\-Domino/i }
		},
		'Magento': {
			cats: [ 6 ],
			script: /\/(js\/mage|skin\/frontend\/(default|enterprise))\//,
			headers: { 'Set-Cookie': /frontend=/ },
			env: /^(Mage|VarienForm)$/,
			implies: [ 'PHP ']
		},
		'Mambo': {
			cats: [ 1 ],
			meta: { 'generator': /Mambo/i }
		},
		'MantisBT': {
			cats: [ 13 ],
			html: /<img[^>]+ alt=("|')Powered by Mantis Bugtracker/i
		},
		'MaxSite CMS': {
			cats: [ 1 ],
			meta: { 'generator': /MaxSite CMS/i }
		},
		'MediaWiki': {
			cats: [ 8 ],
			meta: { 'generator': /MediaWiki/i },
			html: /(<a[^>]+>Powered by MediaWiki<\/a>|<[^>]+id=("|')t\-specialpages)/i
		},
		'Meebo': {
			cats: [ 5 ],
			html: /(<iframe id=("|')meebo\-iframe("|')|Meebo\('domReady'\))/
		},
		'Microsoft ASP.NET': {
			cats: [ 18 ],
			html: /<input[^>]+name=("|')__VIEWSTATE/i,
			headers: { 'X-Powered-By': /ASP\.NET/, 'X-AspNet-Version': /.+/ },
			implies: [ 'IIS', 'Windows Server' ]
		},
		'Microsoft SharePoint': {
			cats: [ 1 ],
			meta: { 'generator': /Microsoft SharePoint/i },
			headers: { 'MicrosoftSharePointTeamServices': /.*/, 'X-SharePointHealthScore': /.*/, 'SPRequestGuid': /.*/, 'SharePointHealthScore': /.*/ }
		},
		'MiniBB': {
			cats: [ 2 ],
			html: /<a href=("|')[^>]+minibb.+\s+<!--End of copyright link/i
		},
		'Mint': {
			cats: [ 10 ],
			script: /mint\/\?js/,
			env: /^Mint$/
		},
		'Mixpanel': {
			cats: [ 10 ],
			script: /api\.mixpanel\.com\/track/,
			env: /^Mixpanel/
		},
		'MochiKit': {
			cats: [ 12 ],
			script: /MochiKit\.js/,
			env: /^MochiKit$/
		},
		'Modernizr': {
			cats: [ 12 ],
			script: /modernizr.*\.js/,
			env: /^Modernizr$/
		},
		'MODx': {
			cats: [ 1 ],
			html: /(<a[^>]+>Powered by MODx<\/a>|var el= \$\('modxhost'\);|<script type=("|')text\/javascript("|')>var MODX_MEDIA_PATH = "media";)|<(link|script)[^>]+assets\/snippets\//i
		},
		'Mojolicious': {
			cats: [ 18 ],
			headers: { 'x-powered-by': /mojolicious/ },
			implies: [ 'PERL' ]
		},
		'Mollom': {
			cats: [ 16 ],
			script: /mollom\.js/,
			html: /<img[^>]+\/.mollom\/.com/i
		},
		'Mondo Media': {
			cats: [ 6 ],
			meta: { 'generator': /Mondo Shop/ }
		},
		'Mongrel': {
			cats: [ 22 ],
			headers: { 'Server': /Mongrel/ },
			implies: [ 'Ruby' ]
		},
		'Moodle': {
			cats: [ 21 ],
			html: /(var moodleConfigFn = function\(me\)|<img[^>]+moodlelogo)/i,
			implies: [ 'PHP' ]
		},
		'Moogo': {
			cats: [ 1 ],
			script: /kotisivukone.js/
		},
		'MooTools': {
			cats: [ 12 ],
			script: /mootools.*\.js/,
			env: /^MooTools$/
		},
		'Movable Type': {
			cats: [ 1 ],
			meta: { 'generator': /Movable Type/i }
		},
		'Mustache': {
			cats: [ 12 ],
			env: /^Mustache$/
		},
		'MyBB': {
			cats: [ 2 ],
			html: /(<script [^>]+\s+<!--\s+lang\.no_new_posts|<a[^>]* title=("|')Powered By MyBB)/i,
			env: /^MyBB/
		},
		'MyBlogLog': {
			cats: [ 5 ],
			script: /pub\.mybloglog\.com/i
		},
		'Mynetcap': {
			cats: [ 1 ],
			meta: { 'generator': /Mynetcap/i }
		},
		'Nedstat': {
			cats: [ 10 ],
			html: /sitestat\(("|')http:\/\/nl\.sitestat\.com/
		},
		'Netmonitor': {
			cats: [ 10 ],
			script: /netmonitor\.fi\/nmtracker\.js/,
			env: /^netmonitor/
		},
		'Nginx': {
			cats: [ 22 ],
			headers: { 'Server': /nginx/i }
		},
		'node.js': {
			cats: [ 27 ],
		},
		'NOIX': {
			cats: [ 19 ],
			html: /<[^>]+(src|href)=[^>]*(\/media\/noix)|<!\-\- NOIX/i
		},
		'nopCommerce': {
			cats: [ 6 ],
			html: /(<!\-\-Powered by nopCommerce|Powered by: <a[^>]+nopcommerce)/i
		},
		'OneStat': {
			cats: [ 10 ],
			html: /var p=("|')http("|')\+\(d\.URL\.indexOf\('https:'\)==0\?'s':''\)\+("|'):\/\/stat\.onestat\.com\/stat\.aspx\?tagver/i
		},
		'OpenCart': {
			cats: [ 6 ],
			html: /(Powered By <a href=("|')[^>]+OpenCart|route = getURLVar\(("|')route)/i
		},
		'openEngine': {
			cats: [ 1 ],
			html: /<meta[^>]+openEngine/i
		},
		'OpenGSE': {
			cats: [ 22 ],
			headers: { 'Server': /GSE/i },
			implies: [ 'Java' ]
		},
		'OpenLayers': {
			cats: [ 5 ],
			script: /openlayers/,
			env:/^OpenLayers$/
		},
		'OpenNemas': {
			cats: [ 1 ],
			headers: { 'X-Powered-By': /OpenNemas/ }
		},
		'Open Web Analytics': {
			cats: [ 10 ],
			html: /<!-- (Start|End) Open Web Analytics Tracker -->/,
			env: /^_?owa_/i
		},
		'Optimizely': {
			cats: [ 10 ],
			env: /^optimizely/
		},
		'Oracle Recommendations On Demand': {
			cats: [ 10 ],
			script: /atgsvcs.+atgsvcs\.js/
		},
		'osCommerce': {
			cats: [ 6 ],
			html: /<a[^>]*osCsid/i
		},
		'osCSS': {
			cats: [ 6 ],
			html: /<body onload=("|')window\.defaultStatus='oscss templates';("|')/i
		},
		'Outbrain': { 
		    cats:    [ 5 ],
		    html: 	/var OB_langJS = 'http\:\/\/widgets\.outbrain\.com\/lang_/,
		    script: /http\:\/\/widgets\.outbrain\.com\/outbrain\.js/,
		    env:     /^OutbrainPermaLink$/
	    },
		'OXID eShop': {
			cats: [ 6 ],
			html: /<!--.*OXID eShop/,
			env: /^ox(TopMenu|ModalPopup|LoginBox|InputValidator)/
		},
		'PANSITE': {
			cats: [ 1 ],
			meta: { 'generator': /PANSITE/i }
		},
		'papaya CMS': {
			cats: [ 1 ],
			html: /<link[^>]*\/papaya-themes\//i
		},
		'Parse.ly': {
			cats: [ 10 ],
			env: /^PARSELY$/
		},
		'Percussion': {
			cats: [ 1 ],
			meta: { 'generator': /(Percussion|Rhythmyx)/i
		},
			html: /<[^>]+class="perc-region/
		},
		'Perl': {
			cats: [ 27 ]
		},
		'PHP': {
			cats: [ 27 ],
			headers: { 'Server': /php/i, 'X-Powered-By': /php/i, 'Set-Cookie': /PHPSESSID/ },
			url: /\.php$/
		},
		'phpBB': {
			cats: [ 2 ],
			meta: { 'copyright': /phpBB Group/ },
			html: /(Powered by <a[^>]+phpbb|<a[^>]+phpbb[^>]+class=.copyright|\tphpBB style name|<[^>]+styles\/(sub|pro)silver\/theme|<img[^>]+i_icon_mini|<table class="forumline)/i,
			env: /^(style_cookie_settings|phpbb_)/,
			headers: { 'Set-Cookie': /^phpbb/ },
			implies: [ 'PHP' ]
		},
		'phpCMS': {
			cats: [ 1 ],
			env: /^phpcms/
		},
		'phpDocumentor': {
			cats: [ 4 ],
			html: /<!-- Generated by phpDocumentor/,
			implies: [ 'PHP' ]
		},
		'PHP-Fusion': {
			cats: [ 1 ],
			html: /Powered by <a href=("|')[^>]+php-fusion/i
		},
		'phpMyAdmin': {
			cats: [ 3 ],
			html: /(var pma_absolute_uri = '|PMA_sendHeaderLocation\(|<title>phpMyAdmin<\/title>)/i,
			implies: [ 'PHP' ]
		},
		'PHP-Nuke': {
			cats: [ 2 ],
			meta: { 'generator': /PHP-Nuke/i },
			html: /<[^>]+Powered by PHP\-Nuke/i
		},
		'phpPgAdmin': {
			cats: [ 3 ],
			html: /(<title>phpPgAdmin<\/title>|<span class=("|')appname("|')>phpPgAdmin)/i
		},
		'Piwik': {
			cats: [ 10 ],
			html: /var piwikTracker = Piwik\.getTracker\(/i,
			env: /^Piwik$/i
		},
		'Plentymarkets': {
			cats: [ 6 ],
			meta: { 'generator': /www\.plentyMarkets\./i }
		},
		'Plesk': {
			cats: [ 9 ],
			headers: { 'X-Powered-By-Plesk': /Plesk/i, 'X-Powered-By': /PleskLin/i },
			script: /common\.js\?plesk/i
		},
		'Pligg': {
			cats: [ 1 ],
			meta: { 'generator': /Pligg/i },
			html: /<span[^>]+id="xvotes-0/,
			env: /pligg_/i
		},
		'Plone': {
			cats: [ 1 ],
			meta: { 'generator': /Plone/i },
			implies: [ 'Python' ]
		},
		'Plura': {
			cats: [ 19 ],
			html: /<iframe src="http:\/\/pluraserver\.com/
		},
		'Posterous': {
			cats: [ 1, 11 ],
			html: /<div class=("|')posterous/i,
			env: /^Posterous/i
		},
		'Powergap': {
			cats: [ 6 ],
			html: /(s\d\d)\.php\?shopid=\1/
		},
		'Prestashop': {
			cats: [ 6 ],
			meta: { 'generator': /PrestaShop/i },
			html: /Powered by <a href=("|')[^>]+PrestaShop/i
		},
		'Prototype': {
			cats: [ 12 ],
			script: /(prototype|protoaculous)\.js/,
			env: /^Prototype$/
		},
		'Protovis': {
			cats: [ 25 ],
			script: /protovis.*\.js/,
			env: /^protovis$/
		},
		'punBB': {
			cats: [ 2 ],
			html: /Powered by <a href=("|')[^>]+punbb/i
		},
		'Python': {
			cats: [ 27 ]
		},
		'Quantcast': {
			cats: [ 10 ],
			script: /edge\.quantserve\.com\/quant\.js/,
			env: /^quantserve$/
		},
		'Quick.Cart': {
			cats: [ 6 ],
			html: /<a href="[^>]+opensolution\.org\/">Powered by/i
		},
		'Raphael': {
			cats: [ 25 ],
			script: /raphael.*\.js/,
			env: /^Raphael$/
		},
		'RBS Change': {
			cats: [ 1, 6 ],
			html: /<html[^>]+xmlns:change=/,
			meta: { 'generator': /RBS Change/i },
			implies: [ 'PHP' ]
		},
		'ReallyCMS': {
			cats: [ 1 ],
			meta: { 'generator': /ReallyCMS/ }
		},
		'reCAPTCHA': {
			cats: [ 16 ],
			script: /(api\-secure\.recaptcha\.net|recaptcha_ajax\.js)/,
			html: /<div[^>]+id=("|')recaptcha_image/,
			env: /^Recaptcha$/
		},
		'Red Hat': {
			cats: [ 28 ],
			headers: { 'Server': /(Red Hat|rhel[0-9]+)/i, 'X-Powered-By': /Red Hat/i }
		},
		'Reddit': {
			cats: [ 2 ],
			html: /(<script[^>]+>var reddit = {|<a[^>]+Powered by Reddit|powered by <a[^>]+>reddit<)/i,
			url: /^(www\.)?reddit\.com/,
			env: /^reddit$/,
			implies: [ 'Python' ]
		},
		'Redmine': {
			cats: [ 13 ],
			meta: { 'description': /Redmine/i },
			html: /Powered by <a href=("|')[^>]+Redmine/i,
			implies: [ 'Ruby' ]
		},
		'Reinvigorate': {
			cats: [ 10 ],
			html: /reinvigorate\.track\("/
		},
		'RequireJS': {
			cats: [ 12 ],
			script: /require.*\.js/,
			env: /^requirejs$/
		},
		'RoundCube': {
			cats: [ 30 ],
			html: /<title>RoundCube/,
			env: /(rcmail|rcube_|roundcube)/i
		},
		'Ruby': {
			cats: [ 27 ],
			headers: { 'Server': /(Mongrel|WEBrick|Ruby)/i }
		},
		'Ruby on Rails': {
			cats: [ 18 ],
			script: /\/assets\/application\-[a-z0-9]{32}\/\.js/,
			meta: { 'csrf-param': /authenticity_token/ },
			headers: { 'Server': /(mod_rails|mod_rack|Phusion.Passenger)/i, 'X-Powered-By': /(mod_rails|mod_rack|Phusion.Passenger)/i },
			implies: [ 'Ruby' ]
		},
		'S.Builder': {
			cats: [ 1 ],
			meta: { 'generator': /S\.Builder/i }
		},
		's9y': {
			cats: [ 1 ],
			meta: { 'generator': /Serendipity/i, 'Powered-By': /Serendipity/i }
		},
		'script.aculo.us': {
			cats: [ 12 ],
			script: /(scriptaculous|protoaculous)\.js/,
			env: /^Scriptaculous$/
		},
		'Sencha Touch': {
			cats: [ 26, 12 ],
			script: /sencha\-touch.*\.js/
		},
		'Seoshop': {
			cats: [ 6 ],
			html: /http:\/\/www\.getseoshop\.com/
		},
		'ShareThis': {
			cats: [ 5 ],
			script: /w\.sharethis\.com\//,
			env: /^SHARETHIS$/
		},
		'Shopify': {
			cats: [ 6 ],
			html: /<link[^>]+=cdn\.shopify\.com/,
			env: /^Shopify$/
		},
		'Shopware': {
			cats: [ 6 ],
			meta: { 'application-name': /Shopware/ },
			script: /shopware\.js/,
			env: /^Shopify$/,
			implies: [ 'PHP' ]
		},
		'sIFR': {
			cats: [ 17 ],
			script: /sifr\.js/
		},
		'SilverStripe': {
			cats: [ 1 ],
			meta: { 'generator': /SilverStripe/ },
			html: /Powered by <a href="[^>]+SilverStripe/i
		},
		'Site Meter': {
			cats: [ 10 ],
			script: /sitemeter.com\/js\/counter\.js\?site=/
		},
		'SiteCatalyst': {
			cats: [ 10 ],
			html: /var s_code=s\.t\(\);if\(s_code\)document\.write\(s_code\)/i,
			env: /^s_account$/
		},
		'SiteEdit': {
			cats: [ 1 ],
			meta: { 'generator': /SiteEdit/i }
		},
		'Smartstore': {
			cats: [ 6 ],
			script: /smjslib\.js/
		},
		'SMF': {
			cats: [ 2 ],
			html: /<script [^>]+\s+var smf_/i,
			env: /^smf_/
		},
		'sNews': {
			cats: [ 1 ],
			meta: { 'generator': /sNews/ }
		},
		'Snoobi': {
			cats: [ 10 ],
			script: /snoobi\.com\/snoop\.php/
		},
		'SOBI 2': {
			cats: [ 19 ],
			html: /(<!\-\- start of Sigsiu Online Business Index|<div[^>]* class=("|')sobi2)/i
		},
		'SoundManager': {
			cats: [ 12 ],
			env: /^(SoundManager|BaconPlayer)$/
		},
		'SPDY': {
			cats: [ 19 ],
			headers: {
				'X-Firefox-Spdy': /.*/ }
		},
		'SPIP': {
			cats: [ 1 ],
			meta: { 'generator': /SPIP/i },
			headers: {
				'X-Spip-Cache': /.*/ }
		},
		'SQL Buddy': {
			cats: [ 3 ],
			html: /(<title>SQL Buddy<\/title>|<[^>]+onclick=("|')sideMainClick\(("|')home\.php)/i
		},
		'Squarespace': {
			cats: [ 1 ],
			html: /Squarespace\.Constants\.CURRENT_MODULE_ID/i
		},
		'Squiz Matrix': {
			cats: [ 1 ],
			meta: { 'generator': /Squiz Matrix/ },
			html: /  Running (MySource|Squiz) Matrix/i, 'X-Powered-By': /Squiz Matrix/
		},
		'StatCounter': {
			cats: [ 10 ],
			script: /statcounter\.com\/counter\/counter/
		},
		'Store Systems': {
			cats: [ 6 ],
			html: /Shopsystem von <a href="http:\/\/www\.store-systems\.de"|\.mws_boxTop/
		},
		'SublimeVideo': { 
		    cats:    [ 14, 31 ],
		    script:  /http\:\/\/cdn\.sublimevideo\.net\/js\/[a-z0-9]+\.js/,
		    env:     /^sublimevideo$/
	    },
		'SWFObject': {
			cats: [ 19 ],
			script: /swfobject.*\.js/i,
			env: /^SWFObject$/
		},
		'swift.engine': {
			cats: [ 1 ],
			headers: { 'X-Powered-By': /swift\.engine/ }
		},
		'Swiftlet': {
			cats: [ 18 ],
			meta: { 'generator': /Swiftlet/i },
			html: /Powered by <a href=("|')[^>]+Swiftlet/i,
			headers: { 'X-Swiftlet-Cache': /.*/, 'X-Powered-By': /Swiftlet/, 'X-Generator': /Swiftlet/ },
			implies: [ 'PHP' ]
		},
		'Textpattern CMS': {
			cats: [ 1 ],
			meta: { 'generator': /Textpattern/i }
		},
		'three.js': {
			cats: [ 25 ],
			script: /three.js/i,
			env: /^THREE$/
		},
		'Tiki Wiki CMS Groupware': {
			cats: [ 1, 2, 8, 11, 13 ],
			script: /(\/|_)tiki/,
			meta: { 'generator': /^Tiki/i }
		},
		'Timeplot': {
			cats: [ 25 ],
			script: /timeplot.*\.js/,
			env: /^Timeplot$/
		},
		'TinyMCE': {
			cats: [ 24 ],
			env: /^tinyMCE$/
		},
		'TomatoCart': {
			cats: [ 6 ],
			meta: { 'generator': /TomatoCart/i }
		},
		'Trac': {
			cats: [ 13 ],
			html: /(<a id=("|')tracpowered)/i,
			implies: [ 'Python' ]
		},
		'Tumblr': {
			cats: [ 11 ],
			html: /<iframe src=("|')http:\/\/www\.tumblr\.com/i,
			url: /^(www.)?.+\.tumblr\.com/i,
			headers: { 'X-Tumblr-Usec': /.*/ }
		},
		'Twilight CMS': {
			cats: [ 1 ],
			headers: { 'X-Powered-CMS': /Twilight CMS/ }
		},
		'Twitter Bootstrap': {
			cats: [ 18 ],
			script: /twitter\.github\.com\/bootstrap/,
			html: /<link[^>]+bootstrap[^>]+css/,
			env: /^Twipsy$/
		},
		'Typekit': {
			cats: [ 17 ],
			script: /use.typekit.com/,
			env: /^Typekit$/
		},
		'TypePad': {
			cats: [ 11 ],
			meta: { 'generator': /typepad/i },
			url: /^(www.)?.+\.typepad\.com/i
		},
		'TYPO3': {
			cats: [ 1 ],
			headers: { 'Set-Cookie': /fe_typo_user/ },
			meta: { 'generator': /TYPO3/i },
			html: /(<(script[^>]* src|link[^>]* href)=[^>]*fileadmin|<!--TYPO3SEARCH)/i,
			url: /\/typo3\//i
		},
		'Ubercart': {
			cats: [ 6 ],
			script: /uc_cart\/uc_cart_block\.js/
		},
		'Ubuntu': {
			cats: [ 28 ],
			headers: { 'Server': /Ubuntu/i, 'X-Powered-By': /Ubuntu/i }
		},
		'Umbraco': {
			cats: [ 1 ],
			meta: { 'generator': /umbraco/i },
			headers: { 'X-Umbraco-Version': /.+/ },
			html: /powered by <a href=[^>]+umbraco/i,
			implies: [ 'Microsoft ASP.NET' ]
		},
		'Underscore.js': {
			cats: [ 12 ],
			script: /underscore.*\.js/
		},
		'UNIX': {
			cats: [ 28 ],
			headers: { 'Server': /Unix/i }
		},
		'UserRules': {
			cats: [ 13 ],
			html: /var _usrp =/ ,
			env: /^\_usrp$/
		},
		'UserVoice': {
			cats: [ 13 ],
			env: /^UserVoice$/
		},
		'Vanilla': {
			cats: [ 2 ],
			html: /<body id=("|')(DiscussionsPage|vanilla)/i,
			headers: { 'X-Powered-By': /Vanilla/ }
		},
		'Varnish': {
			cats: [ 22 ],
			headers: { 'X-Varnish': /.+/, 'X-Varnish-Age': /.+/, 'X-Varnish-Cache': /.+/, 'X-Varnish-Action': /.+/, 'X-Varnish-Hostname': /.+/, 'Via': /Varnish/i }
		},
		'vBulletin': {
			cats: [ 2 ],
			meta: { 'generator': /vBulletin/i },
			env: /^(vBulletin|vB_)/
		},
		'viennaCMS': {
			cats: [ 1 ],
			html: /powered by <a href=("|')[^>]+viennacms/i
		},
		'Vignette': {
			cats: [ 1 ],
			html: /<[^>]+?=("|')(vgn\-ext|vgnext)/i
		},
		'Vimeo': {
			cats: [ 14 ],
			html: /<(param|embed)[^>]+vimeo\.com\/moogaloop/i
		},
		'VirtueMart': {
			cats: [ 6 ],
			html: /<div id=("|')vmMainPage/
		},
		'VisualPath': {
			cats: [ 10 ],
			script: /visualpath[^\/]*\.trackset\.it\/[^\/]+\/track\/include\.js/
		},
		'VIVVO': {
			cats: [ 1 ],
			headers: { 'Set-Cookie': /VivvoSessionId/,
			env: /^vivvo/i }
		},
		'Volusion': {
			cats: [ 6 ],
			html: /\/v\/vspfiles(\/.)*\/css\/.+\.css/
		},
		'Vox': {
			cats: [ 11 ],
			url: /^(www.)?.+\.vox\.com/i
		},
		'VP-ASP': {
			cats: [ 6 ],
			script: /vs350\.js/,
			html: /<a[^>]+>Powered By VP\-ASP Shopping Cart<\/a>/,
			implies: [ 'Microsoft ASP.NET' ]
		},
		'W3Counter': {
			cats: [ 10 ],
			script: /w3counter\.com\/tracker\.js/
		},
		'W3 Total Cache': {
			cats: [ 23 ],
			html: /<!\-\-[^>]+W3 Total Cache/i,
			implies: [ 'WordPress' ]
		},
		'Web Optimizer': {
			cats: [ 10 ],
			html: /<title [^>]*lang=("|')wo("|')>/
		},
		'webEdition': {
			cats: [ 1 ],
			meta: { 'generator': /webEdition/i, 'DC.title': /webEdition/i }
		},
		'WebGUI': {
			cats: [ 1 ],
			meta: { 'generator': /WebGUI/i }
		},
		'WebPublisher': {
			cats: [ 1 ],
			meta: { 'generator': /WEB\|Publisher/i }
		},
		'Websale': {
			cats: [ 6 ],
			url: /\/websale7\//
		},
		'WebsiteBaker': {
			cats: [ 1 ],
			meta: { 'generator': /WebsiteBaker/i }
		},
		'Webtrekk': {
			cats: [ 10 ],
			html: /var webtrekk = new Object/
		},
		'Webtrends': {
			cats: [ 10 ],
			html: /<img[^>]+id=("|')DCSIMG("|')[^>]+webtrends/i,
			env: /^(WTOptimize|WebTrends)/i
		},
		'Weebly': {
			cats: [ 1 ],
			html: /<[^>]+class=("|')weebly/i
		},
		'WikkaWiki': {
			cats: [ 8 ],
			meta: { 'generator': /WikkaWiki/
		},
			html: /Powered by <a href=("|')[^>]+WikkaWiki/i
		},
		'Windows Server': {
			cats: [ 28 ],
			headers: { 'Server': /Win32/i }
		},
		'Wink': {
			cats: [ 26, 12 ],
			script: /(\_base\/js\/base|wink).*\.js/i,
			env: /^wink$/
		},
		'Wolf CMS': {
			cats: [ 1 ],
			html: /(<a href=("|')[^>]+wolfcms.org.+Wolf CMS.+inside|Thank you for using <a[^>]+>Wolf CMS)/i
		},
		'Woopra': {
			cats: [ 10 ],
			script: /static\.woopra\.com/
		},
		'WordPress': {
			cats: [ 1, 11 ],
			meta: { 'generator': /WordPress/i },
			html: /<link rel=("|')stylesheet("|') [^>]+wp-content/i,
			env: /^wp_username$/,
			implies: [ 'PHP' ]
		},
		'WordPress Super Cache': {
			cats: [ 23 ],
			html: /<!\-\-[^>]+WP\-Super\-Cache/i,
			implies: [ 'WordPress' ]
		},
		'Xajax': {
			cats: [ 12 ],
			script: /xajax_core.*\.js/i
		},
		'Xanario': {
			cats: [ 6 ],
			meta: { 'generator': /xanario shopsoftware/i }
		},
		'XenForo': {
			cats: [ 2 ],
			html: /(jQuery\.extend\(true, XenForo|Forum software by XenForo&trade;|<!\-\-XF:branding)/
		},
		'XiTi': {
			cats: [ 10 ],
			html: /<[^>]+src=("|')[^>]+xiti.com\/hit.xiti/i,
			env: /^Xt_/
		},
		'XMB': {
			cats: [ 2 ],
			html: /<!-- Powered by XMB/i
		},
		'XOOPS': {
			cats: [ 1 ],
			meta: { 'generator': /XOOPS/i },
			env: /^xoops/g,
			implies: [ 'PHP' ]
		},
		'xtCommerce': {
			cats: [ 6 ],
			meta: { 'generator': /xt:Commerce/ },
			html: /<div class=("|')copyright("|')>.+<a[^>]+>xt:Commerce/i
		},
		'xui': {
			cats: [ 26, 12 ],
			script: /[^a-zA-Z]xui.*\.js/i,
			env: /^xui$/
		},
		'YaBB': {
			cats: [ 2 ],
			html: /Powered by <a href=("|')[^>]+yabbforum/i
		},
		'Yahoo! Web Analytics': {
			cats: [ 10 ],
			script: /d\.yimg\.com\/mi\/ywa\.js/
		},
		'Yandex.Metrika': {
			cats: [ 10 ],
			script: /mc\.yandex\.ru\/metrika\/watch\.js/
		},
		'YouTube': {
			cats: [ 14 ],
			html: /<(param|embed|iframe)[^>]+youtube(-nocookie)?\.com\/(v|embed)/i
		},
		'YUI Doc': {
			cats: [ 4 ],
			html: /<html[^>]* yuilibrary\.com\/rdf\/[0-9.]+\/yui\.rdf/i
		},
		'YUI': {
			cats: [ 12 ],
			script: /\/yui\/|yui\.yahooapis\.com/,
			env: /^YAHOO$/
		},
		'Zen Cart': {
			cats: [ 6 ],
			meta: { 'generator': /Zen Cart/i }
		},
		'Zend': {
			cats: [ 22 ],
			headers: { 'X-Powered-By': /Zend/ }
		},
		'Zepto': {
			cats: [ 12 ],
			script: /zepto.*.js/,
			env: /^Zepto$/
		},
		'Zinnia': {
			cats: [ 11 ],
			meta: { 'generator': /Zinnia/i },
			implies: [ 'Django' ]
		}
	};
})();
