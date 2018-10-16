

(function (win) {
  const exports = {};

  (function (exports) {
    const utils = {
      normalizeUrl(url) {
        return this.hashUrl(url) || null;
      },

      getReferrer() {
        return this.normalizeUrl(document.referrer);
      },

      getPageUrl() {
        return this.normalizeUrl(window.location.href);
      },
      hashUrl(url) {
        let a,
          result;

        if (!url || url.indexOf('http') !== 0) {
          return null;
        }

        a = document.createElement('a');
        a.href = url;

        result = `${a.protocol}//${a.hostname}/`;

        if (a.pathname && a.pathname !== '/') {
          result += this.hashCode(a.pathname);
        }

        if (a.search) {
          result += `?${this.hashCode(a.search)}`;
        }

        if (a.hash) {
          result += `#${this.hashCode(a.hash)}`;
        }

        return result;
      },

      hashCode(str) {
        let hash = 0,
          kar,
          i;

        if (str.length === 0) {
          return hash;
        }

        for (i = 0; i < str.length; i++) {
          kar = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + kar;
          hash &= hash;
        }

        return hash + Math.pow(2, 32);
      },

      realArray(a) {
        return Array.prototype.slice.apply(a);
      },

      onDocLoaded(doc, callback) {
        if (doc.readyState === 'loading') {
          doc.addEventListener('DOMContentLoaded', callback);
        } else {
          callback();
        }
      },

      SCRIPT_IN_WINDOW_TOP: window === window.top,

      isFriendlyWindow(win) {
        let href;
        try {
          href = win.location.href;
        } catch (e) {
          return false;
        }
        return true;
      },

      elementWindow(el) {
        return el.ownerDocument.defaultView;
      },

      viewport(win) {
        return { width: win.innerWidth, height: win.innerHeight };
      },

      parseQS(qs) {
        if (qs.indexOf('http') === 0) {
          qs = qs.split('?')[1];
        }
        let i,
          kvs,
          key,
          val;
        const dict = {};
        qs = qs.split('&');
        for (i = 0; i < qs.length; i++) {
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
      sendToBackground(message, event, responseMessage, onResponse) {
        if (typeof browser !== 'undefined') {
          const response = browser.runtime.sendMessage(message);
          response.then(onResponse);
        } else if (typeof chrome !== 'undefined') {
          chrome.runtime.sendMessage(message, onResponse);
        } else if (window.self.port) {
          window.self.port.on(responseMessage, onResponse);
          window.self.port.emit(event, message);
        }
      },

      askIfTrackingEnabled(callback, elseCallback) {
        this.sendToBackground(
          'is_tracking_enabled',
          '',
          'tracking_enabled_response',
          (message) => {
            if (message && message.tracking_enabled) {
              callback();
            } else {
              elseCallback();
            }
          }
        );
      },
    };

    utils.SCRIPT_IN_FRIENDLY_IFRAME = !utils.SCRIPT_IN_WINDOW_TOP && utils.isFriendlyWindow(window.parent);
    utils.SCRIPT_IN_HOSTILE_IFRAME = !utils.SCRIPT_IN_WINDOW_TOP && !utils.SCRIPT_IN_FRIENDLY_IFRAME;

    function LogGenerator() {
      this.msgNum = 0;
      this.pageMeta = {
        url: utils.getPageUrl(),
        isHP: window.location.pathname === '/',
        referrer: utils.getReferrer(),
        rand: Math.floor(Math.random() * 10e12),
        startTime: new Date().getTime(),
      };
    }

    LogGenerator.prototype = {
      log(event, opt_assets, opt_pageTags) {
        let opt_video_assets;
        if (event === 'video' || event === 'invalid-video') {
          opt_video_assets = opt_assets || [];
          opt_assets = [];
        } else {
          opt_video_assets = [];
          opt_assets = opt_assets || [];
        }
        const result = {
          doc: this.pageMeta,
          event,
          video_assets: opt_video_assets,
          assets: opt_assets,
          version: '3',
          mrev: 'fe20291-c',
          msgNum: this.msgNum,
          timestamp: new Date().getTime(),
          pageVis: document.visibilityState,
          pageFoc: document.hasFocus(),
          pageTags: opt_pageTags || [],
        };
        this.msgNum++;
        return result;
      },
    };

    utils.LogGenerator = LogGenerator;

    exports.utils = utils;
  }(exports));

  (function (exports) {
    const SizeMatcher = {
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
        [1280, 100],
      ],

      PX_SIZE_TOL: 10,

      getMatchedAdSize(width, height) {
        if (!this.set) {
          this.set = this._makeSizeSet();
        }

        return this.set[`${Math.round(width)}x${Math.round(height)}`];
      },

      elementIsAdShaped(el) {
        return !!this.getMatchedAdSizeForElement(el);
      },

      getMatchedAdSizeForElement(el) {
        const rect = el.getBoundingClientRect();
        return this.getMatchedAdSize(rect.width, rect.height);
      },

      _makeSizeSet() {
        const set = {};
        let i;
        let xfuz;
        let yfuz;
        let size;
        let width;
        let height;

        for (i = 0; i < this.VALID_AD_SIZES.length; i++) {
          for (xfuz = -this.PX_SIZE_TOL; xfuz <= this.PX_SIZE_TOL; xfuz++) {
            for (yfuz = -this.PX_SIZE_TOL; yfuz <= this.PX_SIZE_TOL; yfuz++) {
              size = this.VALID_AD_SIZES[i];
              width = size[0] + xfuz;
              height = size[1] + yfuz;
              set[`${width}x${height}`] = size;
            }
          }
        }
        return set;
      },
    };

    const Throttler = {
      MAX_SEARCHES_PER_WINDOW: 10,
      MAX_SEARCHES_PER_ELEMENT: 2,

      countSearch(el) {
        if (typeof el.searches !== 'number') {
          el.searches = 0;
        }

        el.searches += 1;
      },

      throttle(el, max) {
        if (typeof el.searches === 'number' && el.searches >= max) {
          return true;
        }
        return false;
      },

      throttleElement(el) {
        return this.throttle(el, this.MAX_SEARCHES_PER_ELEMENT);
      },

      throttleWin(win) {
        return this.throttle(win, this.MAX_SEARCHES_PER_WINDOW);
      },

      getCount(el) {
        return el.searches || 0;
      },
    };

    function TopSearcher(win) {
      this.win = win;
      this.doc = win.document;
    }

    TopSearcher.prototype.search = function () {
      let candidates = exports.utils.realArray(this.doc.querySelectorAll('img, object, embed')),
        html5Ad,
        ads = [];

      ads = ads.concat(candidates.filter((el) => {
        if (!el.mpAdFound && !Throttler.throttleElement(el)) {
          Throttler.countSearch(el);
          if ((el.tagName !== 'IMG' || isStandardImage(el)) && SizeMatcher.elementIsAdShaped(el)) {
            el.mpAdFound = true;
            return true;
          }
        }
        return false;
      }));

      html5Ad = this._mainGetHTMLAd();
      if (html5Ad) {
        html5Ad.html5 = true;
        html5Ad.mpAdFound = true;
        ads.push(html5Ad);
      }

      return ads;
    };

    TopSearcher.prototype._mainGetHTMLAd = function () {
      let styles = this.doc.querySelectorAll('div > style, div > link[rel="stylesheet"]'),
        i,
        div;
      for (i = 0; i < styles.length; i++) {
        div = styles[i].parentNode;
        if (!div.mpAdFound && SizeMatcher.elementIsAdShaped(div) && this._jumpedOut(div)) {
          return div;
        }
      }
    };

    TopSearcher.prototype._jumpedOut = function (el) {
      let siblings,
        ifrs;
      siblings = exports.utils.realArray(el.parentNode.children);
      ifrs = siblings.filter(el => el.tagName === 'IFRAME' && el.offsetWidth === 0 && el.offsetHeight === 0);
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
      if (!this.win.mpAdFound && this.body && !Throttler.throttleWin(this.win)) {
        this.winWidth = this.win.innerWidth;
        this.winHeight = this.win.innerHeight;
        if (this._meetsMinAdSize(this.winWidth, this.winHeight) && !this._containsLargeIframes()) {
          this.shouldSearchWindow = true;
        }
      }
    }

    IframeSearcher.prototype.search = function () {
      let ad;

      if (this.shouldSearchWindow) {
        ad = this._search();
        if (ad) {
          ad.mpAdFound = true;
          win.mpAdFound = true;
          return ad;
        }
        Throttler.countSearch(this.win);
      }

      return null;
    };

    IframeSearcher.prototype._search = function () {
      let _this = this,
        stdCandidates,
        html5Candidates,
        stdEl,
        html5El;

      stdCandidates = this.body.querySelectorAll('img, object, embed');

      stdEl = getFirst(stdCandidates, (el) => {
        if (!el.mpAdFound
				&& !Throttler.throttleElement(el)
				&& (el.tagName !== 'IMG' || isStandardImage(el))
				&& _this._elementIsAtLeastAsBigAsWindow(el)) {
          return true;
        }
        Throttler.countSearch(el);
        return false;
      });

      if (stdEl) {
        return stdEl;
      }

      if (this._isHTML5Iframe()) {
        html5Candidates = this.doc.querySelectorAll('body, canvas, button, video, svg, div');
        html5El = getFirst(html5Candidates, (el) => {
          if (_this._elementIsAtLeastAsBigAsWindow(el)) {
            return true;
          }
          Throttler.countSearch(el);
          return false;
        });
      }

      if (html5El) {
        html5El.html5 = true;
        html5El.winClickTag = this.winClickTag;
        html5El.adSizeMeta = this.adSizeMeta;
        return html5El;
      }

      return null;
    };

    IframeSearcher.prototype._isHTML5Iframe = function () {
      if (this.winClickTag || this.adSizeMeta) {
        return true;
      }

      if (this.doc.querySelectorAll('canvas', 'button', 'video', 'svg').length > 0) {
        return true;
      }

      if (this.numElementsInBody >= 5 && Throttler.getCount(this.win) > 0 && this.doc.querySelectorAll('div').length > 0) {
        return true;
      }

      return false;
    };

    IframeSearcher.prototype._elementIsAtLeastAsBigAsWindow = function (el) {
      let rect = el.getBoundingClientRect(),
        tol = 0.95;

      return rect.width >= (tol * this.winWidth) && rect.height >= (tol * this.winHeight);
    };

    IframeSearcher.prototype._meetsMinAdSize = function (width, height) {
      return (width * height) >= this.MIN_AD_AREA;
    };

    IframeSearcher.prototype._containsLargeIframes = function () {
      const iframes = this.doc.querySelectorAll('iframe');
      let rect;
      let i;
      for (i = 0; i < iframes.length; i++) {
        rect = iframes[i].getBoundingClientRect();
        if (rect.width > this.MIN_WINDOW_PX || rect.height > this.MIN_WINDOW_PX) {
          return true;
        }
      }
      return false;
    };

    IframeSearcher.prototype._getAdSizeMeta = function () {
      const adSizeMeta = this.doc.querySelectorAll('meta[name="ad.size"]');
      if (adSizeMeta.length > 0) {
        return adSizeMeta[0].content;
      }
      return null;
    };

    function getFirst(arr, testFn) {
      let i,
        el;
      for (i = 0; i < arr.length; i++) {
        el = arr[i];
        if (testFn(el)) {
          return el;
        }
      }
      return null;
    }

    function isStandardImage(img) {
      return img.src && (img.parentNode.tagName === 'A' || img.getAttribute('onclick'));
    }

    function getFriendlyIframes(win) {
      let iframes = win.document.querySelectorAll('iframe');
      iframes = exports.utils.realArray(iframes);
      const friendlyIframes = iframes.filter(ifr => exports.utils.isFriendlyWindow(ifr.contentWindow));
      return friendlyIframes;
    }

    function findAds(win) {
      let i,
        iframes,
        searcher,
        ad,
        ads = [];

      if (win === win.top) {
        searcher = new TopSearcher(win);
        ads = ads.concat(searcher.search());
      } else {
        searcher = new IframeSearcher(win);
        ad = searcher.search();
        if (ad) {
          ads.push(ad);
        }
      }

      iframes = getFriendlyIframes(win);
      for (i = 0; i < iframes.length; i++) {
        ads = ads.concat(findAds(iframes[i].contentWindow));
      }

      return ads;
    }

    exports.adfinder = {
      getMatchedAdSize: SizeMatcher.getMatchedAdSize.bind(SizeMatcher),
      findAds,
    };
  }(exports));

  (function (exports) {
    const parser = {
      TAGS_WITH_SRC_ATTR: {
        IMG: true,
        SCRIPT: true,
        IFRAME: true,
        EMBED: true,
      },

      MAX_ATTR_LEN: 100,

      getUrl(el, params) {
        let url;

        if (this.TAGS_WITH_SRC_ATTR.hasOwnProperty(el.tagName)) {
          url = el.src;
        } else if (el.tagName === 'OBJECT') {
          url = el.data || (params && params.movie) || null;
        } else if (el.tagName === 'A') {
          url = el.href;
        }

        if (url && url.indexOf('http') === 0) {
          return url;
        }
        return null;
      },

      getParams(el) {
        if (el.tagName !== 'OBJECT') {
          return null;
        }

        let i,
          child;
        const params = {};
        const children = el.children;
        for (i = 0; i < children.length; i++) {
          child = children[i];
          if (child.tagName === 'PARAM' && child.name) {
            params[child.name.toLowerCase()] = child.value;
          }
        }
        return params;
      },

      getPosition(el) {
        const rect = el.getBoundingClientRect();
        const win = exports.utils.elementWindow(el);

        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          left: Math.round(rect.left + win.pageXOffset),
          top: Math.round(rect.top + win.pageYOffset),
        };
      },

      getFlashvars(el, params, url) {
        let flashvars;
        const urlQS = url && url.split('?')[1];

        if (el.tagName === 'EMBED') {
          flashvars = el.getAttribute('flashvars') || urlQS;
        } else if (el.tagName === 'OBJECT') {
          flashvars = params.flashvars || el.getAttribute('flashvars') || urlQS;
        }

        return (flashvars && exports.utils.parseQS(flashvars)) || null;
      },

      findClickThru(el, flashvars) {
        let key;
        if (el.tagName === 'IMG' && el.parentElement.tagName === 'A') {
          return el.parentElement.href;
        } if (flashvars) {
          for (key in flashvars) {
            if (flashvars.hasOwnProperty(key)) {
              if (key.toLowerCase().indexOf('clicktag') === 0) {
                return flashvars[key];
              }
            }
          }
        }
        return null;
      },

      getAttr(el, name) {
        const val = el.getAttribute(name);

        if (val && val.slice && val.toString) {
          return val.slice(0, this.MAX_ATTR_LEN).toString();
        }
        return null;
      },

      putPropIfExists(obj, name, val) {
        if (val) {
          obj[name] = val;
        }
      },

      putAttrIfExists(obj, el, name) {
        const val = this.getAttr(el, name);
        this.putPropIfExists(obj, name, val);
      },

      elementToJSON(el, opt_findClickThru) {
        const pos = this.getPosition(el);
        const params = this.getParams(el);
        const url = this.getUrl(el, params);
        const flashvars = this.getFlashvars(el, params, url);
        const clickThru = opt_findClickThru && this.findClickThru(el, flashvars);
        const json = {
          tagName: el.tagName,
          width: pos.width,
          height: pos.height,
          left: pos.left,
          top: pos.top,
          children: [],
        };

        if (params) {
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
      },
    };

    exports.parser = { elementToJSON: parser.elementToJSON.bind(parser) };
  }(exports));

  (function (exports) {
    const ContextManager = function (adData) {
      this.adData = adData;
    };

    ContextManager.prototype = {
      CONTAINER_SIZE_TOL: 0.4,
      ASPECT_RATIO_FOR_LEADERBOARDS: 2,

      isValidContainer(el, opt_curWin) {
        const cWidth = el.clientWidth;
        const cHeight = el.clientHeight;

        const adWidth = this.adData.width;
        const adHeight = this.adData.height;

        const winWidth = opt_curWin && opt_curWin.innerWidth;
        const winHeight = opt_curWin && opt_curWin.innerHeight;
        const similarWin = opt_curWin && this.withinTol(adWidth, winWidth) && this.withinTol(adHeight, winHeight);

        const similarSizeX = this.withinTol(adWidth, cWidth);
        const similarSizeY = this.withinTol(adHeight, cHeight);
        const adAspect = adWidth / adHeight;

        return similarWin || el.tagName === 'A' || (adAspect >= this.ASPECT_RATIO_FOR_LEADERBOARDS && similarSizeY) || (similarSizeX && similarSizeY);
      },

      withinTol(adlen, conlen) {
        const pct = (conlen - adlen) / adlen;

        return pct <= this.CONTAINER_SIZE_TOL;
      },

      serializeElements(el) {
        if (!el) {
          return;
        }
        let i;
        let ifrWin;
        const adId = this.adData.adId;
        let elIsAd = false;

        if (adId && el[adId] && el[adId].isAd === true) {
          elIsAd = true;
        }

        const json = exports.parser.elementToJSON(el, elIsAd);
        let childJSON;

        if (elIsAd) {
          json.adId = adId;
          this.adData.element = {};

          const keys = Object.keys(json);
          for (i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key !== 'children' && key !== 'contents') {
              this.adData.element[key] = json[key];
            }
          }
        }

        const children = exports.utils.realArray(el.children).filter((el) => {
          const param = el.tagName === 'PARAM';
          const inlineScript = el.tagName === 'SCRIPT' && !(el.src && el.src.indexOf('http') >= 0);
          const noScript = el.tagName === 'NOSCRIPT';
          return !(param || inlineScript || noScript);
        });

        for (i = 0; i < children.length; i++) {
          childJSON = this.serializeElements(children[i]);
          if (childJSON) {
            json.children.push(childJSON);
          }
        }

        if (el.tagName === 'IFRAME') {
          ifrWin = el.contentWindow;

          if (adId && el[adId] && el[adId].needsWindow) {
            json.contents = this.adData.serializedIframeContents;
            el[adId].needsWindow = false;
            delete this.adData.serializedIframeContents;
          } else if (exports.utils.isFriendlyWindow(ifrWin)) {
            childJSON = this.serializeElements(ifrWin.document.documentElement);
            if (childJSON) {
              json.contents = childJSON;
            }
          }
        }

        if (json.children.length > 0 || json.adId || json.tagName === 'IFRAME' || json.url) {
          return json;
        }
        return null;
      },

      captureHTML(containerEl) {
        this.adData.context = this.serializeElements(containerEl);
      },

      nodeCount(el) {
        return el.getElementsByTagName('*').length + 1;
      },

      highestContainer(curWin, referenceElement) {
        let curContainer = referenceElement;
        const docEl = curWin.document.documentElement;
        let parentContainer;

        if (curWin !== curWin.top && this.isValidContainer(docEl, curWin)) {
          return docEl;
        }

        while (true) {
          parentContainer = curContainer.parentElement;
          if (parentContainer && this.isValidContainer(parentContainer)) {
            curContainer = parentContainer;
          } else {
            return curContainer;
          }
        }
      },
    };

    const tagfinder = {

      setPositions(adData, opt_el, opt_winPos) {
        const el = opt_el || adData.context;
        const winPos = opt_winPos || { left: 0, top: 0 };
        let ifrPos;

        el.left += winPos.left;
        el.top += winPos.top;

        if (el.children) {
          el.children.forEach(function (child) {
            this.setPositions(adData, child, winPos);
          }, this);
        }

        if (el.contents) {
          ifrPos = { left: el.left, top: el.top };
          this.setPositions(adData, el.contents, ifrPos);
        }

        if (el.adId === adData.adId) {
          adData.element.left = el.left;
          adData.element.top = el.top;
        }
      },

      appendTags(adData, referenceElement) {
        const mgr = new ContextManager(adData);
        let curWin = exports.utils.elementWindow(referenceElement);
        let highestContainer;

        while (true) {
          highestContainer = mgr.highestContainer(curWin, referenceElement);
          mgr.captureHTML(highestContainer);
          if (curWin === curWin.top) {
            break;
          } else {
            curWin.mpAdFound = true;

            mgr.adData.serializedIframeContents = mgr.adData.context;

            if (exports.utils.isFriendlyWindow(curWin.parent)) {
              referenceElement = curWin.frameElement;
              referenceElement[mgr.adData.adId] = { needsWindow: true };
              curWin = curWin.parent;
            } else {
              break;
            }
          }
        }
        return {
          referenceElement,
          highestContainer,
        };
      },
    };

    exports.tagfinder = tagfinder;
  }(exports));

  (function (exports) {
    let _onAdFound;
    const _logGen = new exports.utils.LogGenerator();
    let _pageTags;
    const INIT_MS_BW_SEARCHES = 2000;
    const PAGE_TAG_RE = new RegExp('gpt|oascentral');
    const POST_MSG_ID = '1532387537-31575-24732-11173-32339';
    const AD_SERVER_RE = new RegExp('^(google_ads_iframe|oas_frame|atwAdFrame)');

    function getPageTags(doc) {
      let scripts = doc.getElementsByTagName('script');
      const pageTags = [];
      scripts = exports.utils.realArray(scripts);
      scripts.forEach((script) => {
        if (PAGE_TAG_RE.exec(script.src)) {
          pageTags.push({ tagName: 'SCRIPT', url: script.src });
        }
      });
      return pageTags;
    }

    function messageAllParentFrames(adData) {
      adData.postMessageId = POST_MSG_ID;

      adData = JSON.stringify(adData);

      let win = window;
      while (win !== win.top) {
        win = win.parent;
        win.postMessage(adData, '*');
      }
    }

    function appendTagsAndSendToParent(adData, referenceElement) {
      const results = exports.tagfinder.appendTags(adData, referenceElement);
      if (exports.utils.SCRIPT_IN_HOSTILE_IFRAME) {
        messageAllParentFrames(adData);
      } else if (exports.utils.SCRIPT_IN_WINDOW_TOP) {
        exports.tagfinder.setPositions(adData);

        adData.matchedSize = exports.adfinder.getMatchedAdSize(adData.width, adData.height);
        if (!adData.matchedSize) {
          if (AD_SERVER_RE.exec(results.referenceElement.id)) {
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
        const log = _logGen.log('ad', [adData], _pageTags);

        if (_onAdFound) {
          _onAdFound(log, results.referenceElement);
        }
      }
    }

    function extractAdsWrapper() {
      if (exports.utils.SCRIPT_IN_WINDOW_TOP || document.readyState === 'complete') {
        extractAds();
      }
      setTimeout(
        () => { extractAdsWrapper(); }, INIT_MS_BW_SEARCHES,
      );
    }

    function extractAds() {
      const ads = exports.adfinder.findAds(window);
      ads.forEach((ad) => {
        const startTime = new Date().getTime();
        const adId = `${startTime}-${Math.floor(Math.random() * 10e12)}`;

        const adData = {
          width: Math.round(ad.offsetWidth),
          height: Math.round(ad.offsetHeight),
          startTime,
          adId,
          html5: ad.html5 || false,
        };

        if (ad.html5) {
          adData.adSizeMeta = ad.adSizeMeta || null;
          adData.winClickTag = ad.winClickTag || null;
        }

        ad[adId] = { isAd: true };

        appendTagsAndSendToParent(adData, ad);
      });
    }

    function isChildWin(myWin, otherWin) {
      let parentWin = otherWin.parent;
      while (parentWin !== otherWin) {
        if (parentWin === myWin) {
          return true;
        }
        otherWin = parentWin;
        parentWin = parentWin.parent;
      }
      return false;
    }

    function iframeFromWindow(win, winToMatch) {
      let i,
        ifr,
        ifrWin,
        iframes = win.document.querySelectorAll('iframe');

      for (i = 0; i < iframes.length; i++) {
        ifr = iframes[i];
        if (ifr.contentWindow === winToMatch) {
          return ifr;
        }
      }

      for (i = 0; i < iframes.length; i++) {
        ifrWin = iframes[i].contentWindow;
        if (exports.utils.isFriendlyWindow(ifrWin)) {
          ifr = iframeFromWindow(ifrWin, winToMatch);
          if (ifr) {
            return ifr;
          }
        }
      }
    }

    function onPostMessage(event) {
      let adData,
        ifrWin = event.source,

        myWin = window.document.defaultView,
        ifrTag;

      try {
        adData = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      if (!adData) return;
      
      if (adData.postMessageId === POST_MSG_ID) {
        delete adData.postMessageId;

        event.stopImmediatePropagation();

        if (isChildWin(myWin, ifrWin)) {
          if (exports.utils.isFriendlyWindow(ifrWin)) {
            ifrTag = ifrWin.frameElement;
          } else {
            ifrTag = iframeFromWindow(myWin, ifrWin);
          }

          if (ifrTag) {
            ifrTag[adData.adId] = { needsWindow: true };
            appendTagsAndSendToParent(adData, ifrTag);
          }
        }
      }
    }

    function onVideoMessage(msg, sender, callback) {
      let log;
      if (msg.event === 'new-video-ad') {
        msg.assets.forEach((asset) => {

        });
        log = _logGen.log('video', msg.assets);
      } else {
        log = _logGen.log('invalid-video', msg.assets);
      }

      msg.assets.forEach((a) => { delete a.isVideo; });
      log.displayAdFound = msg.displayAdFound;
      log.requests = msg.requests;
      log.data = msg.event_data;

      log.doc.finalPageUrl = log.doc.url;
      log.doc.url = exports.utils.normalizeUrl(msg.origUrl);

      _onAdFound(log);
    }

    function addBackgroundListener(event, callback) {
      if (typeof browser !== 'undefined') {
        browser.runtime.onMessage.addListener((msg) => {
          if (msg.event === event) {
            callback(msg);
          }
        });
      } else if (typeof chrome !== 'undefined') {
        chrome.runtime.onMessage.addListener((msg) => {
          if (msg.event === event) {
            callback(msg);
          }
        });
      } else if (window.self.port) {
        window.self.port.on(event, callback);
      }
    }

    exports.coordinator = {
      addPostMessageListener() {
        if (!exports.utils.SCRIPT_IN_FRIENDLY_IFRAME) {
          window.addEventListener('message', onPostMessage, false);
        }
      },

      blockedRobotsMsgGen(sendFcn, origUrl) {
        if (origUrl.indexOf('google.com/_/chrome/newtab') === -1) {
          const onBlockedRobotsMessage = function () {
            let log;
            log = _logGen.log('invalid-robotstxt', []);
            log.doc.finalPageUrl = log.doc.url;
            log.doc.url = exports.utils.normalizeUrl(origUrl);

            sendFcn(log);
          };
          return onBlockedRobotsMessage;
        }
        return function () {};
      },

      init(onAdFound) {
        if (exports.utils.SCRIPT_IN_FRIENDLY_IFRAME) {
          return false;
        }

        _onAdFound = onAdFound;
        if (exports.utils.SCRIPT_IN_WINDOW_TOP) {
          const log = _logGen.log('page');
          onAdFound(log);

          window.addEventListener('beforeunload', (event) => {
            const log = _logGen.log('unload');
            log.timing = window.performance.timing;
            onAdFound(log);
          });

          addBackgroundListener('new-video-ad', onVideoMessage);
          addBackgroundListener('new-invalid-video-ad', onVideoMessage);
        }

        exports.utils.onDocLoaded(document, extractAdsWrapper);
      },
    };
  }(exports));

  if (exports.utils.SCRIPT_IN_WINDOW_TOP) {
    window.adparser = {
      init: exports.coordinator.init,
      addPostMessageListener: exports.coordinator.addPostMessageListener,
      askIfTrackingEnabled: exports.utils.askIfTrackingEnabled,
      blockedRobotsMsgGen: exports.coordinator.blockedRobotsMsgGen,
      inWindowTop: exports.utils.SCRIPT_IN_WINDOW_TOP,
      sendToBackground: exports.utils.sendToBackground,
    };
  } else {
    exports.coordinator.addPostMessageListener();
    exports.utils.askIfTrackingEnabled(
      () => {
        exports.coordinator.init(() => {});
      },
      () => {},
    );
  }
}(window));
(function (adparser, pageUrl) {
  function onAdFound(log) {
    adparser.sendToBackground({ id: 'ad_log', subject: log }, 'ad_log', '', () => {});
  }

  if (adparser && adparser.inWindowTop) {
    adparser.addPostMessageListener();
    adparser.askIfTrackingEnabled(
      () => {
        adparser.init(onAdFound);
      },
      adparser.blockedRobotsMsgGen(onAdFound, pageUrl),
    );
  }
}(window.adparser, window.location.href));
