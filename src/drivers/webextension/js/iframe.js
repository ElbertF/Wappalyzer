'use strict';

(function(win) {

var exports = {};

(function(exports) {

	var utils = {
		normalizeUrl: function(url) {

			return this.hashUrl(url) || null;

		},

		getReferrer: function() {
			return this.normalizeUrl(document.referrer);
		},

		getPageUrl: function() {
			return this.normalizeUrl(window.location.href);
		},
		hashUrl: function(url) {
			var a,
				result;

			if ( !url || url.indexOf('http') !== 0 ) {
				return null;
			}

			a = document.createElement('a');
			a.href = url;

			result = a.protocol + '//' + a.hostname + '/';

			if ( a.pathname && a.pathname !== '/' ) {
				result += this.hashCode(a.pathname);
			}

			if ( a.search ) {
				result += '?' + this.hashCode(a.search);
			}

			if ( a.hash ) {
				result += '#' + this.hashCode(a.hash);
			}

			return result;
		},

		hashCode: function(str) {
			var hash = 0,
				kar,
				i;

			if ( str.length === 0 ) {
				return hash;
			}

			for ( i = 0; i < str.length; i++ ) {
				kar = str.charCodeAt(i);
				hash = ((hash << 5) - hash) + kar;
				hash = hash & hash;
			}

			return hash + Math.pow(2, 32);
		},

		realArray: function(a) {
			return Array.prototype.slice.apply(a);
		},

		onDocLoaded: function(doc, callback) {
			if ( doc.readyState === 'loading' ) {
				doc.addEventListener('DOMContentLoaded', callback);
			} else {
				callback();
			}
		},

		SCRIPT_IN_WINDOW_TOP: window === window.top,

		isFriendlyWindow: function(win) {

			var href;
			try {
				href = win.location.href;
			} catch(e) {
				return false;
			}
			return true;
		},

		elementWindow: function(el) {
			return el.ownerDocument.defaultView;
		},

		viewport: function(win) {
			return {width: win.innerWidth, height: win.innerHeight};
		},

		parseQS: function(qs) {
			if ( qs.indexOf('http') === 0 ) {
				qs = qs.split('?')[1];
			}
			var i, kvs, key, val;
			var dict = {};
			qs = qs.split('&');
			for ( i = 0; i < qs.length; i++ ) {
				kvs = qs[i].split('=');
				key = kvs[0];
				val = kvs.slice(1).join('=');
				try {
					dict[key] = window.decodeURIComponent(val);
				} catch (e) {

					continue;
				}
			}
			return dict;
		},
		sendToBackground: function(message, event, responseMessage, onResponse) {
			if ( typeof browser !== 'undefined' ) {
				var response = browser.runtime.sendMessage(message);
				response.then(onResponse);
			} else if ( typeof chrome !== 'undefined' ) {
				chrome.runtime.sendMessage(message, onResponse);
			} else if ( window.self.port ) {
				window.self.port.on(responseMessage, onResponse);
				window.self.port.emit(event, message);
			}
		},

		askIfTrackingEnabled: function(callback, elseCallback) {

			this.sendToBackground(
				'is_tracking_enabled',
				'',
				'tracking_enabled_response',
				function(message) {
					if ( message && message.tracking_enabled ) {

						callback();
					} else {

						elseCallback();
					}
				}
			);

		}
	};

	utils.SCRIPT_IN_FRIENDLY_IFRAME = !utils.SCRIPT_IN_WINDOW_TOP && utils.isFriendlyWindow(window.parent);
	utils.SCRIPT_IN_HOSTILE_IFRAME = !utils.SCRIPT_IN_WINDOW_TOP && !utils.SCRIPT_IN_FRIENDLY_IFRAME;

	function LogGenerator() {
		this.msgNum = 0;
		this.pageMeta = {
			'url': utils.getPageUrl(),
			'isHP': window.location.pathname === '/',
			'referrer': utils.getReferrer(),
			'rand': Math.floor(Math.random() * 10e12),
			'startTime': new Date().getTime()
		};
	}

	LogGenerator.prototype = {
		log: function(event, opt_assets, opt_pageTags) {
			var opt_video_assets;
			if ( event === 'video' || event === 'invalid-video' ) {
				opt_video_assets = opt_assets || [];
				opt_assets = [];
			} else {
				opt_video_assets = [];
				opt_assets = opt_assets || [];
			}
			var result = {
				doc: this.pageMeta,
				event: event,
				video_assets: opt_video_assets,
				assets: opt_assets,
				version: '3',
				mrev: '6f3a97b-c',
				msgNum: this.msgNum,
				timestamp: new Date().getTime(),
				pageVis: document.visibilityState,
				pageFoc: document.hasFocus(),
				pageTags: opt_pageTags || []
			};
			this.msgNum++;
			return result;
		}
	};

	utils.LogGenerator = LogGenerator;

	exports.utils = utils;
})(exports);

(function(exports) {

	var SizeMatcher = {
		VALID_AD_SIZES: [
			[300, 50],
			[320, 50],
			[160, 600],
			[300, 250],
			[300, 600],
			[300, 1050],
			[336, 280],
			[336, 850],
			[468, 60],
			[728, 90],
			[728, 250],
			[728, 270],
			[970, 66],
			[970, 90],
			[970, 125],
			[970, 250],
			[970, 400],
			[970, 415],
			[1280, 100]
		],

		PX_SIZE_TOL: 10,

		getMatchedAdSize: function(width, height) {

			if ( !this.set ) {
				this.set = this._makeSizeSet();
			}

			return this.set[Math.round(width) + 'x' + Math.round(height)];
		},

		elementIsAdShaped: function(el) {
			return !!this.getMatchedAdSizeForElement(el);
		},

		getMatchedAdSizeForElement: function(el) {
			var rect = el.getBoundingClientRect();
			return this.getMatchedAdSize(rect.width, rect.height);
		},

		_makeSizeSet: function() {
			var set = {};
			var i;
			var xfuz;
			var yfuz;
			var size;
			var width;
			var height;

			for ( i = 0; i < this.VALID_AD_SIZES.length; i++ ) {
				for ( xfuz = -this.PX_SIZE_TOL; xfuz <= this.PX_SIZE_TOL; xfuz++ ) {
					for ( yfuz = -this.PX_SIZE_TOL; yfuz <= this.PX_SIZE_TOL; yfuz++ ) {
						size = this.VALID_AD_SIZES[i];
						width = size[0] + xfuz;
						height = size[1] + yfuz;
						set[width + 'x' + height] = size;
					}
				}
			}
			return set;
		}
	};

	var Throttler = {
		MAX_SEARCHES_PER_WINDOW: 10,
		MAX_SEARCHES_PER_ELEMENT: 2,

		countSearch: function(el) {
			if ( typeof el.searches !== 'number' ) {
				el.searches = 0;
			}

			el.searches += 1;
		},

		throttle: function(el, max) {
			if ( typeof el.searches === 'number' && el.searches >= max ) {
				return true;
			}
			return false;
		},

		throttleElement: function(el) {
			return this.throttle(el, this.MAX_SEARCHES_PER_ELEMENT);
		},

		throttleWin: function(win) {
			return this.throttle(win, this.MAX_SEARCHES_PER_WINDOW);
		},

		getCount: function(el) {
			return el.searches || 0;
		}
	};

	function TopSearcher(win) {
		this.win = win;
		this.doc = win.document;
	}

	TopSearcher.prototype.search = function() {
		var candidates = exports.utils.realArray(this.doc.querySelectorAll('img, object, embed')),
			html5Ad,
			ads = [];

		ads = ads.concat(candidates.filter(function(el) {
			if ( !el.mpAdFound && !Throttler.throttleElement(el) ) {
				Throttler.countSearch(el);
				if ( (el.tagName !== 'IMG' || isStandardImage(el)) && SizeMatcher.elementIsAdShaped(el) ) {
					el.mpAdFound = true;
					return true;
				}
			}
			return false;
		}));

		html5Ad = this._mainGetHTMLAd();
		if ( html5Ad ) {
			html5Ad.html5 = true;
			html5Ad.mpAdFound = true;
			ads.push(html5Ad);
		}

		return ads;
	};

	TopSearcher.prototype._mainGetHTMLAd = function() {
		var styles = this.doc.querySelectorAll('div > style, div > link[rel="stylesheet"]'),
			i, div;
		for ( i = 0; i < styles.length; i++ ) {
			div = styles[i].parentNode;
			if ( !div.mpAdFound && SizeMatcher.elementIsAdShaped(div) && this._jumpedOut(div) ) {
				return div;
			}
		}
	};

	TopSearcher.prototype._jumpedOut = function(el) {
		var siblings, ifrs;
		siblings = exports.utils.realArray(el.parentNode.children);
		ifrs = siblings.filter(function(el) {
			return el.tagName === 'IFRAME' && el.offsetWidth === 0 && el.offsetHeight === 0;
		});
		return ifrs.length > 0;
	};

	function IframeSearcher(win) {
		this.MIN_AD_AREA = 14000;
		this.MIN_WINDOW_PX = 10;

		this.win = win;
		this.doc = win.document;
		this.body = win.document.body;
		this.winClickTag = win.clickTag;
		this.adSizeMeta = this._getAdSizeMeta();
		this.numElementsInBody = (this.body && this.body.querySelectorAll('*').length) || 0;

		this.shouldSearchWindow = false;
		if ( !this.win.mpAdFound && this.body && !Throttler.throttleWin(this.win) ) {
			this.winWidth = this.win.innerWidth;
			this.winHeight = this.win.innerHeight;
			if ( this._meetsMinAdSize(this.winWidth, this.winHeight) && !this._containsLargeIframes() ) {
				this.shouldSearchWindow = true;
			}
		}

	}

	IframeSearcher.prototype.search = function() {
		var ad;

		if ( this.shouldSearchWindow ) {
			ad = this._search();
			if ( ad ) {
				ad.mpAdFound = true;
				win.mpAdFound = true;
				return ad;
			}
			Throttler.countSearch(this.win);
		}

		return null;
	};

	IframeSearcher.prototype._search = function() {
		var _this = this,
			stdCandidates,
			html5Candidates,
			stdEl,
			html5El;

		stdCandidates = this.body.querySelectorAll('img, object, embed');

		stdEl = getFirst(stdCandidates, function(el) {
			if ( !el.mpAdFound &&
				!Throttler.throttleElement(el) &&
				(el.tagName !== 'IMG' || isStandardImage(el)) &&
				_this._elementIsAtLeastAsBigAsWindow(el))
			{
				return true;
			}
			Throttler.countSearch(el);
			return false;
		});

		if ( stdEl ) {
			return stdEl;
		}

		if ( this._isHTML5Iframe() ) {
			html5Candidates = this.doc.querySelectorAll('body, canvas, button, video, svg, div');
			html5El = getFirst(html5Candidates, function(el) {

				if ( _this._elementIsAtLeastAsBigAsWindow(el) ) {
					return true;
				}
				Throttler.countSearch(el);
				return false;
			});
		}

		if ( html5El ) {
			html5El.html5 = true;
			html5El.winClickTag = this.winClickTag;
			html5El.adSizeMeta = this.adSizeMeta;
			return html5El;
		}

		return null;
	};

	IframeSearcher.prototype._isHTML5Iframe = function() {
		if ( this.winClickTag || this.adSizeMeta ) {
			return true;
		}

		if ( this.doc.querySelectorAll('canvas', 'button', 'video', 'svg').length > 0 ) {
			return true;
		}

		if ( this.numElementsInBody >= 5 && Throttler.getCount(this.win) > 0 && this.doc.querySelectorAll('div').length > 0 ) {
			return true;
		}

		return false;
	};

	IframeSearcher.prototype._elementIsAtLeastAsBigAsWindow = function(el) {
		var rect = el.getBoundingClientRect(),
			tol = 0.95;

		return rect.width >= (tol * this.winWidth) && rect.height >= (tol * this.winHeight);
	};

	IframeSearcher.prototype._meetsMinAdSize = function(width, height) {
		return (width * height) >= this.MIN_AD_AREA;
	};

	IframeSearcher.prototype._containsLargeIframes = function() {
		var iframes = this.doc.querySelectorAll('iframe');
		var rect;
		var i;
		for ( i = 0; i < iframes.length; i++ ) {
			rect = iframes[i].getBoundingClientRect();
			if ( rect.width > this.MIN_WINDOW_PX || rect.height > this.MIN_WINDOW_PX ) {
				return true;
			}
		}
		return false;
	};

	IframeSearcher.prototype._getAdSizeMeta = function() {
		var adSizeMeta = this.doc.querySelectorAll('meta[name="ad.size"]');
		if ( adSizeMeta.length > 0 ) {
			return adSizeMeta[0].content;
		} else {
			return null;
		}
	};

	function getFirst(arr, testFn) {
		var i, el;
		for ( i = 0; i < arr.length; i++ ) {
			el = arr[i];
			if ( testFn(el) ) {
				return el;
			}
		}
		return null;
	}

	function isStandardImage(img) {

		return img.src && (img.parentNode.tagName === 'A' || img.getAttribute('onclick'));
	}

	function getFriendlyIframes(win) {
		var iframes = win.document.querySelectorAll('iframe');
		iframes = exports.utils.realArray(iframes);
		var friendlyIframes = iframes.filter(function(ifr) {
			return exports.utils.isFriendlyWindow(ifr.contentWindow);
		});
		return friendlyIframes;
	}

	function findAds(win) {
		var i,
			iframes,
			searcher,
			ad,
			ads = [];

		if ( win === win.top ) {
			searcher = new TopSearcher(win);
			ads = ads.concat(searcher.search());
		} else {
			searcher = new IframeSearcher(win);
			ad = searcher.search();
			if ( ad ) {
				ads.push(ad);
			}
		}

		iframes = getFriendlyIframes(win);
		for ( i = 0; i < iframes.length; i++ ) {
			ads = ads.concat(findAds(iframes[i].contentWindow));
		}

		return ads;
	}

	exports.adfinder = {
		getMatchedAdSize: SizeMatcher.getMatchedAdSize.bind(SizeMatcher),
		findAds: findAds
	};
})(exports);

(function(exports) {

	var parser = {
		TAGS_WITH_SRC_ATTR: {
			'IMG': true,
			'SCRIPT': true,
			'IFRAME': true,
			'EMBED': true
		},

		MAX_ATTR_LEN: 100,

		getUrl: function(el, params) {
			var url;

			if ( this.TAGS_WITH_SRC_ATTR.hasOwnProperty(el.tagName) ) {
				url = el.src;

			} else if ( el.tagName === 'OBJECT' ) {
				url = el.data || (params && params.movie) || null;

			} else if ( el.tagName === 'A' ) {
				url = el.href;
			}

			if ( url && url.indexOf('http') === 0 ) {
				return url;
			} else {
				return null;
			}
		},

		getParams: function(el) {
			if ( el.tagName !== 'OBJECT' ) {
				return null;
			}

			var i, child;
			var params = {};
			var children = el.children;
			for ( i = 0; i < children.length; i++ ) {
				child = children[i];
				if ( child.tagName === 'PARAM' && child.name ) {

					params[child.name.toLowerCase()] = child.value;
				}
			}
			return params;
		},

		getPosition: function(el) {
			var rect = el.getBoundingClientRect();
			var win = exports.utils.elementWindow(el);

			return {
				width: Math.round(rect.width),
				height: Math.round(rect.height),
				left: Math.round(rect.left + win.pageXOffset),
				top: Math.round(rect.top + win.pageYOffset)
			};
		},

		getFlashvars: function(el, params, url) {
			var flashvars;
			var urlQS = url && url.split('?')[1];

			if ( el.tagName === 'EMBED' ) {
				flashvars = el.getAttribute('flashvars') || urlQS;

			} else if ( el.tagName === 'OBJECT' ) {
				flashvars = params.flashvars || el.getAttribute('flashvars') || urlQS;
			}

			return (flashvars && exports.utils.parseQS(flashvars)) || null;
		},

		findClickThru: function(el, flashvars) {
			var key;
			if ( el.tagName === 'IMG' && el.parentElement.tagName === 'A' ) {
				return el.parentElement.href;
			} else if ( flashvars ) {
				for ( key in flashvars ) {
					if ( flashvars.hasOwnProperty(key) ) {

						if ( key.toLowerCase().indexOf('clicktag') === 0 ) {
							return flashvars[key];
						}
					}
				}
			}
			return null;
		},

		getAttr: function(el, name) {
			var val = el.getAttribute(name);

			if ( val && val.slice && val.toString ) {

				return val.slice(0, this.MAX_ATTR_LEN).toString();
			} else {
				return null;
			}
		},

		putPropIfExists: function(obj, name, val) {
			if ( val ) {
				obj[name] = val;
			}
		},

		putAttrIfExists: function(obj, el, name) {
			var val = this.getAttr(el, name);
			this.putPropIfExists(obj, name, val);
		},

		elementToJSON: function(el, opt_findClickThru) {
			var pos = this.getPosition(el);
			var params = this.getParams(el);
			var url = this.getUrl(el, params);
			var flashvars = this.getFlashvars(el, params, url);
			var clickThru = opt_findClickThru && this.findClickThru(el, flashvars);
			var json = {
				tagName: el.tagName,
				width: pos.width,
				height: pos.height,
				left: pos.left,
				top: pos.top,
				children: []
			};

			if ( params ) {

				delete params.flashvars;
			}

			this.putAttrIfExists(json, el, 'id');
			this.putAttrIfExists(json, el, 'class');
			this.putAttrIfExists(json, el, 'name');

			this.putPropIfExists(json, 'flashvars', flashvars);
			this.putPropIfExists(json, 'url', url);
			this.putPropIfExists(json, 'params', params);
			this.putPropIfExists(json, 'clickThru', clickThru);

			return json;
		}
	};

	exports.parser = { elementToJSON: parser.elementToJSON.bind(parser) };
})(exports);

(function(exports) {

	var ContextManager = function(adData) {
		this.adData = adData;
	};

	ContextManager.prototype = {
		CONTAINER_SIZE_TOL: 0.4,
		ASPECT_RATIO_FOR_LEADERBOARDS: 2,

		isValidContainer: function(el, opt_curWin) {

			var cWidth = el.clientWidth;
			var cHeight = el.clientHeight;

			var adWidth = this.adData.width;
			var adHeight = this.adData.height;

			var winWidth = opt_curWin && opt_curWin.innerWidth;
			var winHeight = opt_curWin && opt_curWin.innerHeight;
			var similarWin = opt_curWin && this.withinTol(adWidth, winWidth) && this.withinTol(adHeight, winHeight);

			var similarSizeX = this.withinTol(adWidth, cWidth);
			var similarSizeY = this.withinTol(adHeight, cHeight);
			var adAspect = adWidth / adHeight;

			return similarWin || el.tagName === 'A' || (adAspect >= this.ASPECT_RATIO_FOR_LEADERBOARDS && similarSizeY) || (similarSizeX && similarSizeY);
		},

		withinTol: function(adlen, conlen) {
			var pct = (conlen - adlen) / adlen;

			return pct <= this.CONTAINER_SIZE_TOL;
		},

		serializeElements: function(el) {
			if ( !el ) {
				return;
			}
			var i;
			var ifrWin;
			var adId = this.adData.adId;
			var elIsAd = false;

			if ( adId && el[adId] && el[adId].isAd === true ) {
				elIsAd = true;
			}

			var json = exports.parser.elementToJSON(el, elIsAd);
			var childJSON;

			if ( elIsAd ) {
				json.adId = adId;
				this.adData.element = {};

				var keys = Object.keys(json);
				for ( i = 0; i < keys.length; i++ ) {
					var key = keys[i];
					if ( key !== 'children' && key !== 'contents' ) {
						this.adData.element[key] = json[key];
					}
				}
			}

			var children = exports.utils.realArray(el.children).filter(function(el) {
				var param = el.tagName === 'PARAM';
				var inlineScript = el.tagName === 'SCRIPT' && !(el.src && el.src.indexOf('http') >= 0);
				var noScript = el.tagName === 'NOSCRIPT';
				return !(param || inlineScript || noScript);
			});

			for ( i = 0; i < children.length; i++ ) {
				childJSON = this.serializeElements(children[i]);
				if ( childJSON ) {
					json.children.push(childJSON);
				}
			}

			if ( el.tagName === 'IFRAME' ) {
				ifrWin = el.contentWindow;

				if ( adId && el[adId] && el[adId].needsWindow ) {

					json.contents = this.adData.serializedIframeContents;
					el[adId].needsWindow = false;
					delete this.adData.serializedIframeContents;

				} else if ( exports.utils.isFriendlyWindow(ifrWin) ) {

					childJSON = this.serializeElements(ifrWin.document.documentElement);
					if ( childJSON ) {
						json.contents = childJSON;
					}
				}
			}

			if ( json.children.length > 0 || json.adId || json.tagName === 'IFRAME' || json.url ) {
				return json;
			} else {
				return null;
			}
		},

		captureHTML: function(containerEl) {
			this.adData.context = this.serializeElements(containerEl);
		},

		nodeCount: function(el) {
			return el.getElementsByTagName('*').length + 1;
		},

		highestContainer: function(curWin, referenceElement) {
			var curContainer = referenceElement;
			var docEl = curWin.document.documentElement;
			var parentContainer;

			if ( curWin !== curWin.top && this.isValidContainer(docEl, curWin) ) {
				return docEl;
			}

			while ( true ) {
				parentContainer = curContainer.parentElement;
				if ( parentContainer && this.isValidContainer(parentContainer) ) {
					curContainer = parentContainer;
				} else {
					return curContainer;
				}
			}
		}
	};

	var tagfinder = {

		setPositions: function(adData, opt_el, opt_winPos) {
			var el = opt_el || adData.context;
			var winPos = opt_winPos || {left: 0, top: 0};
			var ifrPos;

			el.left += winPos.left;
			el.top += winPos.top;

			if ( el.children ) {
				el.children.forEach(function(child) {
					this.setPositions(adData, child, winPos);
				}, this);
			}

			if ( el.contents ) {
				ifrPos = {left: el.left, top: el.top};
				this.setPositions(adData, el.contents, ifrPos);
			}

			if ( el.adId === adData.adId ) {
				adData.element.left = el.left;
				adData.element.top = el.top;
			}
		},

		appendTags: function(adData, referenceElement) {
			var mgr = new ContextManager(adData);
			var curWin = exports.utils.elementWindow(referenceElement);
			var highestContainer;

			while ( true ) {
				highestContainer = mgr.highestContainer(curWin, referenceElement);
				mgr.captureHTML(highestContainer);
				if ( curWin === curWin.top ) {
					break;
				} else {

					curWin.mpAdFound = true;

					mgr.adData.serializedIframeContents = mgr.adData.context;

					if ( exports.utils.isFriendlyWindow(curWin.parent) ) {
						referenceElement = curWin.frameElement;
						referenceElement[mgr.adData.adId] = {needsWindow: true};
						curWin = curWin.parent;
					} else {
						break;
					}
				}
			}
			return {
				referenceElement:referenceElement,
				highestContainer: highestContainer
			};
		}
	};

	exports.tagfinder = tagfinder;
})(exports);

(function(exports) {
	var _onAdFound;
	var _logGen = new exports.utils.LogGenerator();
	var _pageTags;
	var INIT_MS_BW_SEARCHES = 2000;
	var PAGE_TAG_RE = new RegExp('gpt|oascentral');
	var POST_MSG_ID = '1503946945-8336-24876-10613-9147';
	var AD_SERVER_RE = new RegExp('^(google_ads_iframe|oas_frame|atwAdFrame)');

	function getPageTags(doc) {
		var scripts = doc.getElementsByTagName('script');
		var pageTags = [];
		scripts = exports.utils.realArray(scripts);
		scripts.forEach(function(script) {
			if ( PAGE_TAG_RE.exec(script.src) ) {
				pageTags.push({'tagName': 'SCRIPT', 'url': script.src});
			}
		});
		return pageTags;
	}

	function messageAllParentFrames(adData) {

		adData.postMessageId = POST_MSG_ID;

		adData = JSON.stringify(adData);

		var win = window;
		while ( win !== win.top ) {
			win = win.parent;
			win.postMessage(adData, '*');
		}
	}

	function appendTagsAndSendToParent(adData, referenceElement) {
		var results = exports.tagfinder.appendTags(adData, referenceElement);
		if ( exports.utils.SCRIPT_IN_HOSTILE_IFRAME ) {
			messageAllParentFrames(adData);

		} else if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {

			exports.tagfinder.setPositions(adData);

			adData.matchedSize = exports.adfinder.getMatchedAdSize(adData.width, adData.height);
			if ( !adData.matchedSize ) {

				if ( AD_SERVER_RE.exec(results.referenceElement.id) ) {
					adData.matchedSize = [adData.width, adData.height];
					adData.oddSize = true;
				} else {

					return;
				}
			}
			delete adData.width;
			delete adData.height;
			adData.curPageUrl = exports.utils.getPageUrl();
			_pageTags = _pageTags || getPageTags(document);
			var log = _logGen.log('ad', [adData], _pageTags);

			if ( _onAdFound ) {

					_onAdFound(log, results.referenceElement);

			}
		}
	}

	function extractAdsWrapper() {
		if ( exports.utils.SCRIPT_IN_WINDOW_TOP || document.readyState === 'complete' ) {
			extractAds();
		}
		setTimeout(
			function() { extractAdsWrapper(); }, INIT_MS_BW_SEARCHES
		);
	}

	function extractAds() {
		var ads = exports.adfinder.findAds(window);
		ads.forEach(function(ad) {

			var startTime = new Date().getTime();
			var adId = startTime + '-' + Math.floor(Math.random() * 10e12);

			var adData = {
				width: Math.round(ad.offsetWidth),
				height: Math.round(ad.offsetHeight),
				startTime: startTime,
				adId: adId,
				html5: ad.html5 || false
			};

			if ( ad.html5 ) {
				adData.adSizeMeta = ad.adSizeMeta || null;
				adData.winClickTag = ad.winClickTag || null;
			}

			ad[adId] = { isAd: true };

			appendTagsAndSendToParent(adData, ad);
		});
	}

	function isChildWin(myWin, otherWin) {
		var parentWin = otherWin.parent;
		while ( parentWin !== otherWin ) {
			if ( parentWin === myWin ) {
				return true;
			}
			otherWin = parentWin;
			parentWin = parentWin.parent;
		}
		return false;
	}

	function iframeFromWindow(win, winToMatch) {
		var i, ifr, ifrWin,
			iframes = win.document.querySelectorAll('iframe');

		for ( i = 0; i < iframes.length; i++ ) {
			ifr = iframes[i];
			if ( ifr.contentWindow === winToMatch ) {
				return ifr;
			}
		}

		for ( i = 0; i < iframes.length; i++ ) {
			ifrWin = iframes[i].contentWindow;
			if ( exports.utils.isFriendlyWindow(ifrWin) ) {
				ifr = iframeFromWindow(ifrWin, winToMatch);
				if ( ifr ) {
					return ifr;
				}
			}
		}
	}

	function onPostMessage(event) {
		var adData,
			ifrWin = event.source,

			myWin = window.document.defaultView,
			ifrTag;

		try {

			adData = JSON.parse(event.data);
		} catch(e) {

			return;
		}

		if ( adData.postMessageId === POST_MSG_ID ) {

			delete adData.postMessageId;

			event.stopImmediatePropagation();

			if ( isChildWin(myWin, ifrWin) ) {
				if ( exports.utils.isFriendlyWindow(ifrWin) ) {
					ifrTag = ifrWin.frameElement;
				} else {
					ifrTag = iframeFromWindow(myWin, ifrWin);
				}

				if ( ifrTag ) {
					ifrTag[adData.adId] = {needsWindow: true};
					appendTagsAndSendToParent(adData, ifrTag);
				}
			}
		}
	}

	function onVideoMessage(msg, sender, callback) {
		var log;
		if ( msg.event === 'new-video-ad' ) {
			msg.assets.forEach(function(asset) {

			});
			log = _logGen.log('video', msg.assets);
		} else {
			log = _logGen.log('invalid-video', msg.assets);
		}

		msg.assets.forEach(function(a) {delete a.isVideo;});
		log.displayAdFound = msg.displayAdFound;
		log.requests = msg.requests;
		log.data = msg.event_data;

		log.doc.finalPageUrl = log.doc.url;
		log.doc.url = exports.utils.normalizeUrl(msg.origUrl);

		_onAdFound(log);
	}

	function addBackgroundListener(event, callback) {
		if ( typeof browser !== 'undefined' ) {
			browser.runtime.onMessage.addListener(function(msg) {
				if ( msg.event === event ) {
					callback(msg);
				}
			});
		} else if ( typeof chrome !== 'undefined' ) {
			chrome.runtime.onMessage.addListener(function(msg) {
				if ( msg.event === event ) {
					callback(msg);
				}
			});
		} else if ( window.self.port ) {
			window.self.port.on(event, callback);
		}
	}

	exports.coordinator = {
		addPostMessageListener: function() {
			if ( !exports.utils.SCRIPT_IN_FRIENDLY_IFRAME ) {
				window.addEventListener('message', onPostMessage, false);
			}
		},

		blockedRobotsMsgGen: function(sendFcn, origUrl) {

			if ( origUrl.indexOf('google.com/_/chrome/newtab') === -1 ) {
				var onBlockedRobotsMessage = function() {
					var log;
					log = _logGen.log('invalid-robotstxt', []);
					log.doc.finalPageUrl = log.doc.url;
					log.doc.url = exports.utils.normalizeUrl(origUrl);

					sendFcn(log);
				};
				return onBlockedRobotsMessage;
			} else {
				return function() {};
			}
		},

		init: function(onAdFound) {

			if ( exports.utils.SCRIPT_IN_FRIENDLY_IFRAME ) {
				return false;
			}

			_onAdFound = onAdFound;
			if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {
				var log = _logGen.log('page');
				onAdFound(log);

				window.addEventListener('beforeunload', function(event) {
					var log = _logGen.log('unload');
					log.timing = window.performance.timing;
					onAdFound(log);
				});

				addBackgroundListener('new-video-ad', onVideoMessage);
				addBackgroundListener('new-invalid-video-ad', onVideoMessage);

			}

			exports.utils.onDocLoaded(document, extractAdsWrapper);
		}
	};

})(exports);

if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {
	window.adparser = {
		init: exports.coordinator.init,
		addPostMessageListener: exports.coordinator.addPostMessageListener,
		askIfTrackingEnabled: exports.utils.askIfTrackingEnabled,
		blockedRobotsMsgGen: exports.coordinator.blockedRobotsMsgGen,
		inWindowTop: exports.utils.SCRIPT_IN_WINDOW_TOP,
		sendToBackground: exports.utils.sendToBackground
	};
} else {
	exports.coordinator.addPostMessageListener();
	exports.utils.askIfTrackingEnabled(
		function() {
			exports.coordinator.init(function() {});
		},
		function() {}
	);
}
})(window);
(function(adparser, pageUrl) {
	function onAdFound(log) {
		adparser.sendToBackground({ id: 'ad_log', subject: log }, 'ad_log', '', function(){});
	}

	if (  adparser && adparser.inWindowTop  ) {
		adparser.addPostMessageListener();
		adparser.askIfTrackingEnabled(
			function() {
				adparser.init(onAdFound);
			},
			adparser.blockedRobotsMsgGen(onAdFound, pageUrl)
		)
	}
})(window.adparser, window.location.href);
