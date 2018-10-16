

const url = require('url');
const fs = require('fs');
const path = require('path');
const Browser = require('zombie');
const Wappalyzer = require('./wappalyzer');

const json = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/apps.json`)));

const extensions = /^([^.]+$|\.(asp|aspx|cgi|htm|html|jsp|php)$)/;

const errorTypes = {
  RESPONSE_NOT_OK: 'Response was not ok',
  NO_RESPONSE: 'No response from server',
  NO_HTML_DOCUMENT: 'No HTML document',
};

function sleep(ms) {
  return ms ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
}

function getHeaders(browser) {
  const headers = {};

  const resource = browser.resources.length
    ? browser.resources.filter(_resource => _resource.response).shift() : null;

  if (resource) {
    // eslint-disable-next-line no-underscore-dangle
    resource.response.headers._headers.forEach((header) => {
      if (!headers[header[0]]) {
        headers[header[0]] = [];
      }

      headers[header[0]].push(header[1]);
    });
  }

  return headers;
}

function getScripts(browser) {
  if (!browser.document || !browser.document.scripts) {
    return [];
  }

  const scripts = Array.prototype.slice
    .apply(browser.document.scripts)
    .filter(script => script.src)
    .map(script => script.src);

  return scripts;
}

function getCookies(browser) {
  const cookies = [];

  if (browser.cookies) {
    browser.cookies.forEach(cookie => cookies.push({
      name: cookie.key,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
    }));
  }

  return cookies;
}

class Driver {
  constructor(pageUrl, options) {
    this.options = Object.assign({}, {
      password: '',
      proxy: null,
      username: '',
      chunkSize: 5,
      debug: false,
      delay: 500,
      htmlMaxCols: 2000,
      htmlMaxRows: 3000,
      maxDepth: 3,
      maxUrls: 10,
      maxWait: 5000,
      recursive: false,
      userAgent: 'Mozilla/5.0 (compatible; Wappalyzer)',
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
    this.analyzedPageUrls = {};
    this.apps = [];
    this.meta = {};

    this.wappalyzer = new Wappalyzer();

    this.wappalyzer.apps = json.apps;
    this.wappalyzer.categories = json.categories;

    this.wappalyzer.parseJsPatterns();

    this.wappalyzer.driver.log = (message, source, type) => this.log(message, source, type);
    this.wappalyzer.driver.displayApps = (detected, meta, context) => this.displayApps(detected, meta, context);

    process.on('uncaughtException', e => this.wappalyzer.log(`Uncaught exception: ${e.message}`, 'driver', 'error'));
  }

  analyze() {
    this.time = {
      start: new Date().getTime(),
      last: new Date().getTime(),
    };

    return this.crawl(this.origPageUrl);
  }

  log(message, source, type) {
    if (this.options.debug) {
      console.log(`[wappalyzer ${type}]`, `[${source}]`, message);
    }
  }

  displayApps(detected, meta) {
    this.meta = meta;

    Object.keys(detected).forEach((appName) => {
      const app = detected[appName];

      const categories = [];

      app.props.cats.forEach((id) => {
        const category = {};

        category[id] = json.categories[id].name;

        categories.push(category);
      });

      if (!this.apps.some(detectedApp => detectedApp.name === app.name)) {
        this.apps.push({
          name: app.name,
          confidence: app.confidenceTotal.toString(),
          version: app.version || null,
          icon: app.props.icon || 'default.svg',
          website: app.props.website,
          categories,
        });
      }
    });
  }

  fetch(pageUrl, index, depth) {
    // Return when the URL is a duplicate or maxUrls has been reached
    if (
      this.analyzedPageUrls[pageUrl.href]
      || this.analyzedPageUrls.length >= this.options.maxUrls
    ) {
      return Promise.resolve();
    }

    this.analyzedPageUrls[pageUrl.href] = {
      status: 0,
    };

    const timerScope = {
      last: new Date().getTime(),
    };

    this.timer(`fetch; url: ${pageUrl.href}; depth: ${depth}; delay: ${this.options.delay * index}ms`, timerScope);

    return new Promise((resolve, reject) => {
      sleep(this.options.delay * index)
        .then(() => this.visit(pageUrl, timerScope, resolve, reject));
    });
  }

  visit(pageUrl, timerScope, resolve, reject) {
    const browser = new Browser({
      proxy: this.options.proxy,
      silent: true,
      strictSSL: false,
      userAgent: this.options.userAgent,
      waitDuration: this.options.maxWait,
    });

    browser.on('authenticate', (auth) => {
      auth.username = this.options.username;
      auth.password = this.options.password;
    });

    this.timer(`browser.visit start; url: ${pageUrl.href}`, timerScope);

    browser.visit(pageUrl.href, () => {
      this.timer(`browser.visit end; url: ${pageUrl.href}`, timerScope);

      try {
        if (!this.checkResponse(browser, pageUrl)) {
          resolve();

          return;
        }
      } catch (error) {
        reject(error);

        return;
      }

      const headers = getHeaders(browser);
      const html = this.getHtml(browser);
      const scripts = getScripts(browser);
      const js = this.getJs(browser);
      const cookies = getCookies(browser);

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
              if (link.protocol.match(/https?:/) && link.hostname === this.origPageUrl.hostname && extensions.test(link.pathname)) {
                link.hash = '';

                results.push(url.parse(link.href));
              }

              return results;
            }, [],
          );

          return resolve(links);
        });
    });
  }

  checkResponse(browser, pageUrl) {
    // Validate response
    const resource = browser.resources.length
      ? browser.resources.filter(_resource => _resource.response).shift() : null;

    if (!resource) {
      throw new Error('NO_RESPONSE');
    }

    this.analyzedPageUrls[pageUrl.href].status = resource.response.status;

    if (resource.response.status !== 200) {
      throw new Error('RESPONSE_NOT_OK');
    }

    const headers = getHeaders(browser);

    // Validate content type
    const contentType = headers['content-type'] ? headers['content-type'].shift() : null;

    if (!contentType || !/\btext\/html\b/.test(contentType)) {
      this.wappalyzer.log(`Skipping; url: ${pageUrl.href}; content type: ${contentType}`, 'driver');

      delete this.analyzedPageUrls[pageUrl.href];

      return false;
    }

    // Validate document
    if (!browser.document || !browser.document.documentElement) {
      throw new Error('NO_HTML_DOCUMENT');
    }

    return true;
  }

  getHtml(browser) {
    let html = '';

    try {
      html = browser.html()
        .split('\n')
        .slice(0, this.options.htmlMaxRows / 2)
        .concat(html.slice(html.length - this.options.htmlMaxRows / 2))
        .map(line => line.substring(0, this.options.htmlMaxCols))
        .join('\n');
    } catch (error) {
      this.wappalyzer.log(error.message, 'browser', 'error');
    }

    return html;
  }

  getJs(browser) {
    const patterns = this.wappalyzer.jsPatterns;
    const js = {};

    Object.keys(patterns).forEach((appName) => {
      js[appName] = {};

      Object.keys(patterns[appName]).forEach((chain) => {
        js[appName][chain] = {};

        patterns[appName][chain].forEach((pattern, index) => {
          const properties = chain.split('.');

          let value = properties
            .reduce((parent, property) => (parent && parent[property]
              ? parent[property] : null), browser.window);

          value = typeof value === 'string' || typeof value === 'number' ? value : !!value;

          if (value) {
            js[appName][chain][index] = value;
          }
        });
      });
    });

    return js;
  }

  crawl(pageUrl, index = 1, depth = 1) {
    pageUrl.canonical = `${pageUrl.protocol}//${pageUrl.host}${pageUrl.pathname}`;

    return new Promise((resolve) => {
      this.fetch(pageUrl, index, depth)
        .catch((error) => {
          const type = error.message && errorTypes[error.message] ? error.message : 'UNKNOWN_ERROR';
          const message = error.message && errorTypes[error.message] ? errorTypes[error.message] : 'Unknown error';

          this.analyzedPageUrls[pageUrl.href].error = {
            type,
            message,
          };

          this.wappalyzer.log(`${message}; url: ${pageUrl.href}`, 'driver', 'error');
        })
        .then((links) => {
          if (links && this.options.recursive && depth < this.options.maxDepth) {
            return this.chunk(links.slice(0, this.options.maxUrls), depth + 1);
          }
          return Promise.resolve();
        })
        .then(() => {
          resolve({
            urls: this.analyzedPageUrls,
            applications: this.apps,
            meta: this.meta,
          });
        });
    });
  }

  chunk(links, depth, chunk = 0) {
    if (links.length === 0) {
      return Promise.resolve();
    }

    const chunked = links.splice(0, this.options.chunkSize);

    return new Promise((resolve) => {
      Promise.all(chunked.map((link, index) => this.crawl(link, index, depth)))
        .then(() => this.chunk(links, depth, chunk + 1))
        .then(() => resolve());
    });
  }

  timer(message, scope) {
    const time = new Date().getTime();
    const sinceStart = `${Math.round((time - this.time.start) / 10) / 100}s`;
    const sinceLast = `${Math.round((time - scope.last) / 10) / 100}s`;

    this.wappalyzer.log(`[timer] ${message}; lapsed: ${sinceLast} / ${sinceStart}`, 'driver');

    scope.last = time;
  }
}

module.exports = Driver;
