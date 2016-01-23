'use strict';

(function(win) {

var exports = {};

(function(exports) {

	var utils = {
		getReferrer: function() {

			return this.hashUrl(document.referrer) || null;

		},

		getPageUrl: function() {

			return this.hashUrl(window.location.href) || null;

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
			var result = {
				doc: this.pageMeta,
				event: event,
				assets: opt_assets || [],
				version: '3',
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

	var VALID_AD_SIZES = [
		[160, 600],

		[300, 250],
		[300, 600],
		[300, 1050],

		[336, 280],
		[336, 850],
		[468, 60],
		[728, 90],
		[728, 270],
		[970, 66],
		[970, 90],
		[970, 125],
		[970, 250],
		[970, 400],
		[970, 415],
		[1280, 100]
	];

	var PX_SIZE_TOL = 10;
	var MIN_WINDOW_PX = 10;
	var MAX_SEARCHES_PER_WINDOW = 10;
	var MAX_SEARCHES_PER_ELEMENT = 2;

	function makeSizeSet(validAdSizes, sizeTol) {
		var set = {};
		var i;
		var xfuz;
		var yfuz;
		var size;
		var width;
		var height;

		for ( i = 0; i < validAdSizes.length; i++ ) {
			for ( xfuz = -sizeTol; xfuz <= sizeTol; xfuz++ ) {
				for ( yfuz = -sizeTol; yfuz <= sizeTol; yfuz++ ) {
					size = validAdSizes[i];
					width = size[0] + xfuz;
					height = size[1] + yfuz;
					set[width + 'x' + height] = size;
				}
			}
		}
		return set;
	}

	var SIZE_SET = makeSizeSet(VALID_AD_SIZES, PX_SIZE_TOL);

	function elementIsAd(el) {
		if ( typeof el.searches !== 'number' ) {
			el.searches = 0;
		}

		if ( el.searches >= MAX_SEARCHES_PER_ELEMENT ) {
			return false;
		}

		el.searches += 1;

		var isImgWithoutSrc = el.tagName === 'IMG' && !el.src;
		var isImgWithoutAnchor = el.tagName === 'IMG' && !(el.parentNode.tagName === 'A' || el.getAttribute('onclick'));

		return elementIsAdShaped(el) && !isImgWithoutSrc && !isImgWithoutAnchor;
	}

	function isNewAd(el, win) {
		return !el.mp_adFound && (win === win.top || !win.mp_adFound);
	}

	function getFriendlyIframes(win) {
		var iframes = win.document.querySelectorAll('iframe');
		iframes = exports.utils.realArray(iframes);
		var friendlyIframes = iframes.filter(function(ifr) {
			return exports.utils.isFriendlyWindow(ifr.contentWindow);
		});
		return friendlyIframes;
	}

	function getMatchedAdSize(width, height) {
		return SIZE_SET[width + 'x' + height];
	}

	function elementIsAdShaped(el) {
		return !!getMatchedAdSizeForElement(el);
	}

	function getMatchedAdSizeForElement(el) {
		var rect = el.getBoundingClientRect();
		return getMatchedAdSize(rect.width, rect.height);
	}

	function containsLargeIframes(win) {
		var iframes = win.document.querySelectorAll('iframe');
		var rect;
		var i;
		for ( i = 0; i < iframes.length; i++ ) {
			rect = iframes[i].getBoundingClientRect();
			if ( rect.width > 10 || rect.height > 10 ) {
				return true;
			}
		}
		return false;
	}

	function isValidHTML5Div(div, winSize) {
		var elSize = getMatchedAdSizeForElement(div);

		if ( typeof div.checks !== 'number' ) {
			div.checks = 1;
		} else {
			div.checks += 1;
		}

		return (elSize &&
				elSize[0] === winSize[0] && elSize[1] === winSize[1] &&
				div.checks > 1);
	}

	var HTML5_SIGNAL_ELEMENTS = 'canvas, button, video, svg, img';
	function iframeGetHTMLAd(win) {
		var body = win.document.body,
			elements, i, el, divs, div, numElements,
			winSize, elSize;

		if ( !body ) {
			return null;
		}
		winSize = getMatchedAdSize(win.innerWidth, win.innerHeight);

		if ( !winSize ) {
			return null;
		}

		elements = body.querySelectorAll(HTML5_SIGNAL_ELEMENTS);

		for ( i = 0; i < elements.length; i++ ) {
			el = elements[i];
			elSize = getMatchedAdSizeForElement(el);
			if ( elSize && elSize[0] === winSize[0] && elSize[1] === winSize[1] ) {
				return el;
			}
		}

		numElements = body.querySelectorAll('*').length;
		if ( numElements < 5 ) {
			return null;
		}

		divs = body.querySelectorAll('div');

		for ( i = 0; i < divs.length; i++ ) {
			div = divs[i];
			if ( isValidHTML5Div(div, winSize) ) {
				return div;
			}
		}

		return null;
	}

	function jumpedOut(el) {
		var siblings, ifrs;
		siblings = exports.utils.realArray(el.parentNode.children);
		ifrs = siblings.filter(function(el) {
			return el.tagName === 'IFRAME' && el.offsetWidth === 0 && el.offsetHeight === 0;
		});
		return ifrs.length > 0;
	}

	function mainGetHTMLAd(win) {
		var styles = win.document.querySelectorAll('div > style, div > link[rel="stylesheet"]'),
			i, div;
		for ( i = 0; i < styles.length; i++ ) {
			div = styles[i].parentNode;
			if ( elementIsAdShaped(div) && jumpedOut(div) ) {
				return div;
			}
		}
	}

	function findAds(win, opt_ads) {

		if ( typeof win.searches !== 'number' ) {
			win.searches = 0;
		}

		var ads = opt_ads || [];
		var adsFound = 0;

		if ( win.innerWidth <= MIN_WINDOW_PX || win.innerHeight <= MIN_WINDOW_PX ) {
			win.searches++;
			return ads;
		}

		if ( exports.utils.SCRIPT_IN_WINDOW_TOP || win.searches < MAX_SEARCHES_PER_WINDOW ) {
			var adCandidates = win.document.querySelectorAll('img, object, embed');
			adCandidates = exports.utils.realArray(adCandidates);

			adCandidates.forEach(function(el) {
				if ( elementIsAd(el) && isNewAd(el, win) ) {
					el.mp_adFound = true;
					el.inIframe = win !== win.top;
					win.mp_adFound = true;
					ads.push(el);
					adsFound += 1;
				}
			});

			var htmlAd, adSizeMeta;
			if ( win === win.top ) {
				htmlAd = mainGetHTMLAd(win);
			} else {
				if ( adsFound === 0 && !containsLargeIframes(win) ) {
					htmlAd = iframeGetHTMLAd(win);
				}
			}

			if ( htmlAd && isNewAd(htmlAd, win) ) {
				htmlAd.html5 = true;
				htmlAd.inIframe = win !== win.top;
				if ( htmlAd.inIframe ) {
					adSizeMeta = win.document.querySelectorAll('meta[name="ad.size"]');
					if ( adSizeMeta.length > 0 ) {
						htmlAd.adSizeMeta = adSizeMeta[0].content;
					}
					if ( win.clickTag ) {
						htmlAd.winClickTag = win.clickTag;
					}
				}
				htmlAd.mp_adFound = true;
				win.mp_adFound = true;
				ads.push(htmlAd);
			}

			win.searches += 1;
		}

		var iframes = getFriendlyIframes(win);
		iframes.forEach(function(ifr) {
			findAds(ifr.contentWindow, ads);
		});

		return ads;
	}

	exports.adfinder = {
		getMatchedAdSize: getMatchedAdSize,
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
				width: rect.width,
				height: rect.height,
				left: rect.left + win.pageXOffset,
				top: rect.top + win.pageYOffset
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
				if ( this.isValidContainer(parentContainer) ) {
					curContainer = parentContainer;
				} else {
					return curContainer;
				}
			}
		}
	};

	var tagfinder = {

		prepToSend: function(adData) {
			adData.matchedSize = exports.adfinder.getMatchedAdSize(adData.width, adData.height);
			delete adData.width;
			delete adData.height;
		},

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

		adData.dummyId = true;

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
			exports.tagfinder.prepToSend(adData);

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
		setTimeout(function() {
			extractAdsWrapper();
		}, INIT_MS_BW_SEARCHES);
	}

	function extractAds() {
		var ads = exports.adfinder.findAds(window);

		if ( !ads ) {
			return;
		}

		ads.forEach(function(ad) {

			var startTime = new Date().getTime();
			var adId = startTime + '-' + Math.floor(Math.random() * 10e12);

			var adData = {
				width: ad.offsetWidth,
				height: ad.offsetHeight,
				startTime: startTime,
				adId: adId,
				html5: ad.html5 || false,
				inIframe: ad.inIframe
			};

			if ( ad.html5 && ad.inIframe ) {
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

		if ( adData.dummyId ) {

			delete adData.dummyId;

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

	exports.coordinator = {
		init: function(onAdFound) {

			if ( exports.utils.SCRIPT_IN_FRIENDLY_IFRAME ) {
				return false;
			}

			_onAdFound = onAdFound;

			if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {
				var log = _logGen.log('page');
				onAdFound(log);
			}

			window.addEventListener('message', onPostMessage, false);
			if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {
				window.addEventListener('beforeunload', function(event) {
					var log = _logGen.log('unload');
					log.timing = window.performance.timing;
					onAdFound(log);
				});
			}

			exports.utils.onDocLoaded(document, extractAdsWrapper);
		}
	};

})(exports);

if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {
	window.adparser = {
		init: exports.coordinator.init,
	};
} else {
	exports.coordinator.init(function() {});
}

})(window);
(function(adparser) {
	function sendToBackground(event, message) {
		if ( window.self.port ) {
			window.self.port.emit(event, message);
		} else if ( typeof chrome !== 'undefined' ) {
			chrome.extension.sendRequest(message);
		}
	}

	function onAdFound(log) {
		sendToBackground('ad_log', { id: 'ad_log', subject: log });
	}

	if ( window === window.top ) {
		adparser.init(onAdFound);
	}
})(window.adparser);
