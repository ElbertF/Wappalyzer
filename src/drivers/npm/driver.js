'use strict';

const Wappalyzer = require('./wappalyzer');
const request = require('request');
const url = require('url');
const fs = require('fs');
const Browser = require('zombie');

const json = JSON.parse(fs.readFileSync(__dirname + '/apps.json'));

class Driver {
  constructor(pageUrl, options) {
    this.options = Object.assign({}, {
      debug: false,
      delay: 500,
      maxDepth: 3,
      maxUrls: 10,
      maxWait: 1000,
      recursive: false,
      requestTimeout: 3000,
      userAgent: 'Mozilla/5.0 (compatible; Wappalyzer)',
    }, options || {});

    this.options.debug = Boolean(this.options.debug);
    this.options.recursive = Boolean(this.options.recursive);
    this.options.delay = this.options.recursive ? parseInt(this.options.delay, 10) : 0;
    this.options.maxDepth = parseInt(this.options.maxDepth, 10);
    this.options.maxUrls = parseInt(this.options.maxUrls, 10);
    this.options.maxWait = parseInt(this.options.maxWait, 10);

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
    this.timer('displayApps');

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
    this.timer('fetch');

    return new Promise(resolve => {
      // Return when the URL is a duplicate or maxUrls has been reached
      if ( this.analyzedPageUrls.indexOf(pageUrl.href) !== -1 || this.analyzedPageUrls.length >= this.options.maxUrls ) {
        return resolve();
      }

      this.analyzedPageUrls.push(pageUrl.href);

      this.wappalyzer.log('depth: ' + depth + '; delay: ' + ( this.options.delay * index ) + 'ms; url: ' + pageUrl.href, 'driver');

      const browser = new Browser({
        silent: true,
        userAgent: this.options.userAgent,
        waitDuration: this.options.maxWait + 'ms',
      });

      this.sleep(this.options.delay * index)
        .then(() => {
          this.timer('browser.visit start');

          browser.visit(pageUrl.href, this.options.requestTimeout, error => {
            this.timer('browser.visit end');

            if ( !browser.resources['0'] || !browser.resources['0'].response ) {
              this.wappalyzer.log('No response from server', 'browser', 'error');

              return resolve();
            }

            browser.wait(this.options.maxWait)
              .catch(error => this.wappalyzer.log(error.message, 'browser', 'error'))
              .finally(() => {
                this.timer('browser.wait end');

                const headers = this.getHeaders(browser);
                const html    = this.getHtml(browser);
                const scripts = this.getScripts(browser);
                const js      = this.getJs(browser);

                this.wappalyzer.analyze(pageUrl.hostname, pageUrl.href, {
                  headers,
                  html,
                  js,
                  scripts
                });

                const links = browser.body.getElementsByTagName('a');

                resolve(links);
              });
          });
        });
    });
  }

  getHeaders(browser) {
    const headers = {};

    browser.resources['0'].response.headers._headers.forEach(header => {
      if ( !headers[header[0]] ){
        headers[header[0]] = [];
      }

      headers[header[0]].push(header[1]);
    });

    return headers;
  }

  getHtml(browser) {
    let html = '';

    try {
      html = browser.html();
    } catch ( e ) {
      this.wappalyzer.log(error.message, 'browser', 'error');
    }

    return html;
  }

  getScripts(browser) {
    const scripts = Array.prototype.slice
      .apply(browser.document.scripts)
      .filter(s => s.src)
      .map(s => s.src);

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

          value = typeof value === 'string' ? value : !!value;

          if ( value ) {
            js[appName][chain][index] = value;
          }
        });
      });
    });

    return js;
  }

  crawl(pageUrl, index = 1, depth = 1) {
    this.timer('crawl');

    return new Promise(resolve => {
      this.fetch(pageUrl, index, depth)
        .then(links => {
          if ( links && Boolean(this.options.recursive) && depth < this.options.maxDepth ) {
            links = Array.from(links)
              .filter(link => link.hostname === this.origPageUrl.hostname)
              .map(link => { link.hash = ''; return link });

            return Promise.all(links.map((link, index) => this.crawl(link, index + 1, depth + 1)));
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          this.timer('done');

          resolve({
            applications: this.apps,
            meta: this.meta
          });
        });
    });
  }

  sleep(ms) {
    return ms ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
  }

  timer(step) {
    const time = new Date().getTime();
    const sinceStart = ( Math.round(( time - this.time.start ) / 10) / 100) + 's';
    const sinceLast = ( Math.round(( time - this.time.last ) / 10) / 100) + 's';

    this.wappalyzer.log('[' + step + '] Time lapsed: ' + sinceLast + ' / ' + sinceStart, 'driver');

    this.time.last = time;
  }
};

module.exports = Driver;
