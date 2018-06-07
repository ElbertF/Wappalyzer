'use strict';

const Wappalyzer = require('./wappalyzer');
const request = require('request');
const url = require('url');
const fs = require('fs');
const Browser = require('zombie');

const json = JSON.parse(fs.readFileSync(__dirname + '/apps.json'));

const extensions = /^([^.]+$|\.(asp|aspx|cgi|htm|html|jsp|php)$)/;

class Driver {
  constructor(pageUrl, options) {
    this.options = Object.assign({}, {
      chunkSize: 5,
      debug: false,
      delay: 500,
      maxDepth: 3,
      maxUrls: 10,
      maxWait: 5000,
			proxy: null,
      recursive: false,
      userAgent: 'Mozilla/5.0 (compatible; Wappalyzer)',
      htmlMaxCols: 2000,
      htmlMaxRows: 3000,
    }, options || {});

    this.options.debug = Boolean(+this.options.debug);
    this.options.recursive = Boolean(+this.options.recursive);
    this.options.delay = this.options.recursive ? parseInt(this.options.delay, 10) : 0;
    this.options.maxDepth = parseInt(this.options.maxDepth, 10);
    this.options.maxUrls = parseInt(this.options.maxUrls, 10);
    this.options.maxWait = parseInt(this.options.maxWait, 10);
    this.options.htmlMaxCols = parseInt(this.options.htmlMaxCols, 10);
    this.options.htmlMaxRows = parseInt(this.options.htmlMaxRows, 10);

    this.origPageUrl = url.parse(pageUrl);
    this.analyzedPageUrls = [];
    this.apps = [];
    this.meta = {};

    this.wappalyzer = new Wappalyzer();

    this.wappalyzer.apps = json.apps;
    this.wappalyzer.categories = json.categories;

    this.wappalyzer.parseJsPatterns();

    this.wappalyzer.driver.log = (message, source, type) => this.log(message, source, type);
    this.wappalyzer.driver.displayApps = (detected, meta, context) => this.displayApps(detected, meta, context);

    process.on('uncaughtException', e => this.wappalyzer.log('Uncaught exception: ' + e.message, 'driver', 'error'));
  }

  analyze() {
    this.time = {
      start: new Date().getTime(),
      last: new Date().getTime(),
    }

    return this.crawl(this.origPageUrl);
  }

  log(message, source, type) {
    this.options.debug && console.log('[wappalyzer ' + type + ']', '[' + source + ']', message);
  }

  displayApps(detected, meta) {
    this.meta = meta;

    Object.keys(detected).forEach(appName => {
      const app = detected[appName];

      var categories = [];

      app.props.cats.forEach(id => {
        var category = {};

        category[id] = json.categories[id].name;

        categories.push(category)
      });

      if ( !this.apps.some(detectedApp => detectedApp.name === app.name) ) {
        this.apps.push({
          name: app.name,
          confidence: app.confidenceTotal.toString(),
          version: app.version,
          icon: app.props.icon || 'default.svg',
          website: app.props.website,
          categories
        });
      }
    });
  }

  fetch(pageUrl, index, depth) {
    // Return when the URL is a duplicate or maxUrls has been reached
    if ( this.analyzedPageUrls.indexOf(pageUrl.href) !== -1 || this.analyzedPageUrls.length >= this.options.maxUrls ) {
      return Promise.resolve();
    }

    this.analyzedPageUrls.push(pageUrl.href);

    const timerScope = {
      last: new Date().getTime()
    };

    this.timer('fetch; url: ' + pageUrl.href + '; depth: ' + depth + '; delay: ' + ( this.options.delay * index ) + 'ms', timerScope);

    return new Promise(resolve => this.sleep(this.options.delay * index).then(() => this.visit(pageUrl, timerScope, resolve)));
  }

  visit(pageUrl, timerScope, resolve) {
    const browser = new Browser({
			proxy: this.options.proxy,
      silent: true,
      strictSSL: false,
      userAgent: this.options.userAgent,
      waitDuration: this.options.maxWait,
    });

    this.timer('browser.visit start; url: ' + pageUrl.href, timerScope);

    browser.visit(pageUrl.href, () => {
      this.timer('browser.visit end; url: ' + pageUrl.href, timerScope);

      if ( !this.responseOk(browser, pageUrl) ) {
        return resolve();
      }

      const headers = this.getHeaders(browser);
      const html = this.getHtml(browser);
      const scripts = this.getScripts(browser);
      const js = this.getJs(browser);
      const cookies = this.getCookies(browser);

      this.wappalyzer.analyze(pageUrl, {
        headers,
        html,
        scripts,
        js,
        cookies,
      })
        .then(() => {
          const links = Array.prototype.reduce.call(
            browser.document.getElementsByTagName('a'), (results, link) => {
              if ( link.protocol.match(/https?:/) && link.hostname === this.origPageUrl.hostname && extensions.test(link.pathname) ) {
                link.hash = '';

                results.push(url.parse(link.href));
              }

              return results;
            }, []
          );

          return resolve(links);
        });
    });
  }

  responseOk(browser, pageUrl) {
    // Validate response
    const resource = browser.resources.length ? browser.resources.filter(resource => resource.response).shift() : null;

    if ( !resource ) {
      this.wappalyzer.log('No response from server; url: ' + pageUrl.href, 'driver', 'error');

      return false;
    }

    if ( resource.response.status !== 200 ) {
      this.wappalyzer.log('Response was not OK; status: ' + resource.response.status + ' ' + resource.response.statusText + '; url: ' + pageUrl.href, 'driver', 'error');

      return false;
    }

    const headers = this.getHeaders(browser);

    // Validate content type
    const contentType = headers.hasOwnProperty('content-type') ? headers['content-type'].shift() : null;

    if ( !contentType || !/\btext\/html\b/.test(contentType) ) {
      this.wappalyzer.log('Skipping; url: ' + pageUrl.href + '; content type: ' + contentType, 'driver');

      this.analyzedPageUrls.splice(this.analyzedPageUrls.indexOf(pageUrl.href), 1);

      return false;
    }

    // Validate document
    if ( !browser.document || !browser.document.documentElement ) {
      this.wappalyzer.log('No HTML document; url: ' + pageUrl.href, 'driver', 'error');

      return false;
    }

    return true;
  }

  getHeaders(browser) {
    const headers = {};

    const resource = browser.resources.length ? browser.resources.filter(resource => resource.response).shift() : null;

    if ( resource ) {
      resource.response.headers._headers.forEach(header => {
        if ( !headers[header[0]] ){
          headers[header[0]] = [];
        }

        headers[header[0]].push(header[1]);
      });
    }

    return headers;
  }

  getHtml(browser) {
    let html = '';

    try {
      html = browser.html()
        .split('\n')
        .slice(0, this.options.htmlMaxRows / 2).concat(html.slice(html.length - this.options.htmlMaxRows / 2))
        .map(line => line.substring(0, this.options.htmlMaxCols))
        .join('\n');
    } catch ( error ) {
      this.wappalyzer.log(error.message, 'browser', 'error');
    }

    return html;
  }

  getScripts(browser) {
    if ( !browser.document || !browser.document.scripts ) {
      return [];
    }

    const scripts = Array.prototype.slice
      .apply(browser.document.scripts)
      .filter(script => script.src)
      .map(script => script.src);

    return scripts;
  }

  getJs(browser) {
    const patterns = this.wappalyzer.jsPatterns;
    const js = {};

    Object.keys(patterns).forEach(appName => {
      js[appName] = {};

      Object.keys(patterns[appName]).forEach(chain => {
        js[appName][chain] = {};

        patterns[appName][chain].forEach((pattern, index) => {
          const properties = chain.split('.');

          let value = properties.reduce((parent, property) => {
            return parent && parent.hasOwnProperty(property) ? parent[property] : null;
          }, browser.window);

          value = typeof value === 'string' || typeof value === 'number' ? value : !!value;

          if ( value ) {
            js[appName][chain][index] = value;
          }
        });
      });
    });

    return js;
  }

  getCookies(browser) {
    const cookies = [];

    if ( browser.cookies ) {
      browser.cookies.forEach(cookie => cookies.push({
        name: cookie.key,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
      }));
    }

    return cookies;
  }

  crawl(pageUrl, index = 1, depth = 1) {
    pageUrl.canonical = pageUrl.protocol + '//' + pageUrl.host + pageUrl.pathname;

    return new Promise(resolve => {
      this.fetch(pageUrl, index, depth)
        .catch(() => {})
        .then(links => {
          if ( links && this.options.recursive && depth < this.options.maxDepth ) {
            return this.chunk(links.slice(0, this.options.maxUrls), depth + 1);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          resolve({
            urls: this.analyzedPageUrls,
            applications: this.apps,
            meta: this.meta
          });
        });
    });
  }

  chunk(links, depth, chunk = 0) {
    if ( links.length === 0 ) {
      return Promise.resolve();
    }

    const chunked = links.splice(0, this.options.chunkSize);

    return new Promise(resolve => {
      Promise.all(chunked.map((link, index) => this.crawl(link, index, depth)))
        .then(() => this.chunk(links, depth, chunk + 1))
        .then(() => resolve());
    });
  }

  sleep(ms) {
    return ms ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
  }

  timer(message, scope) {
    const time = new Date().getTime();
    const sinceStart = ( Math.round(( time - this.time.start ) / 10) / 100) + 's';
    const sinceLast = ( Math.round(( time - scope.last ) / 10) / 100) + 's';

    this.wappalyzer.log('[timer] ' + message + '; lapsed: ' + sinceLast + ' / ' + sinceStart, 'driver');

    scope.last = time;
  }
};

module.exports = Driver;
