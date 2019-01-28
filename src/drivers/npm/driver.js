const url = require('url');
const fs = require('fs');
const path = require('path');
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

class Driver {
  constructor(Browser, pageUrl, options) {
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
    this.listeners = {};

    this.Browser = Browser;

    this.wappalyzer = new Wappalyzer();

    this.wappalyzer.apps = json.apps;
    this.wappalyzer.categories = json.categories;

    this.wappalyzer.parseJsPatterns();

    this.wappalyzer.driver.log = (message, source, type) => this.log(message, source, type);
    this.wappalyzer.driver
      .displayApps = (detected, meta, context) => this.displayApps(detected, meta, context);

    process.on('uncaughtException', e => this.wappalyzer.log(`Uncaught exception: ${e.message}`, 'driver', 'error'));
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  emit(event, params) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(params));
    }
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

    this.emit('log', { message, source, type });
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

    return new Promise(async (resolve, reject) => {
      await sleep(this.options.delay * index);

      this.visit(pageUrl, timerScope, resolve, reject);
    });
  }

  async visit(pageUrl, timerScope, resolve, reject) {
    const browser = new this.Browser(this.options);

    browser.log = (message, type) => this.wappalyzer.log(message, 'browser', type);

    this.timer(`visit start; url: ${pageUrl.href}`, timerScope);

    await browser.visit(pageUrl.href);

    this.timer(`visit end; url: ${pageUrl.href}`, timerScope);

    this.analyzedPageUrls[pageUrl.href].status = browser.statusCode;

    // Validate response
    if (!browser.statusCode) {
      return reject(new Error('NO_RESPONSE'));
    }

    if (browser.statusCode !== 200) {
      return reject(new Error('RESPONSE_NOT_OK'));
    }

    if (!browser.contentType || !/\btext\/html\b/.test(browser.contentType)) {
      this.wappalyzer.log(`Skipping; url: ${pageUrl.href}; content type: ${browser.contentType}`, 'driver');

      delete this.analyzedPageUrls[pageUrl.href];
    }

    const { cookies, headers, scripts } = browser;

    const html = this.processHtml(browser.html);
    const js = this.processJs(browser.js);

    await this.wappalyzer.analyze(pageUrl, {
      cookies,
      headers,
      html,
      js,
      scripts,
    });

    const reducedLinks = Array.prototype.reduce.call(
      browser.links, (results, link) => {
        if (link.protocol.match(/https?:/) && link.hostname === this.origPageUrl.hostname && extensions.test(link.pathname)) {
          link.hash = '';

          results.push(url.parse(link.href));
        }

        return results;
      }, [],
    );

    this.emit('visit', { browser, pageUrl });

    return resolve(reducedLinks);
  }

  processHtml(html) {
    if (this.options.htmlMaxCols || this.options.htmlMaxRows) {
      const chunks = [];
      const maxCols = this.options.htmlMaxCols;
      const maxRows = this.options.htmlMaxRows;
      const rows = html.length / maxCols;

      let i;

      for (i = 0; i < rows; i += 1) {
        if (i < maxRows / 2 || i > rows - maxRows / 2) {
          chunks.push(html.slice(i * maxCols, (i + 1) * maxCols));
        }
      }

      html = chunks.join('\n');
    }

    return html;
  }

  processJs(window) {
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
              ? parent[property] : null), window);

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

    return new Promise(async (resolve) => {
      let links;

      try {
        links = await this.fetch(pageUrl, index, depth);
      } catch (error) {
        const type = error.message && errorTypes[error.message] ? error.message : 'UNKNOWN_ERROR';
        const message = error.message && errorTypes[error.message] ? errorTypes[error.message] : 'Unknown error';

        this.analyzedPageUrls[pageUrl.href].error = {
          type,
          message,
        };

        this.wappalyzer.log(`${message}; url: ${pageUrl.href}`, 'driver', 'error');
      }

      if (links && this.options.recursive && depth < this.options.maxDepth) {
        await this.chunk(links.slice(0, this.options.maxUrls), depth + 1);
      }

      return resolve({
        urls: this.analyzedPageUrls,
        applications: this.apps,
        meta: this.meta,
      });
    });
  }

  chunk(links, depth, chunk = 0) {
    if (links.length === 0) {
      return Promise.resolve();
    }

    const chunked = links.splice(0, this.options.chunkSize);

    return new Promise(async (resolve) => {
      await Promise.all(chunked.map((link, index) => this.crawl(link, index, depth)));

      await this.chunk(links, depth, chunk + 1);

      resolve();
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
