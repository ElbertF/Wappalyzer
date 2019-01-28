const Zombie = require('zombie');
const Browser = require('../browser');

class ZombieBrowser extends Browser {
  constructor(options) {
    super(options);

    this.browser = new Zombie({
      proxy: options.proxy,
      silent: true,
      strictSSL: false,
      userAgent: options.userAgent,
      waitDuration: options.maxWait,
    });

    this.browser.on('authenticate', (auth) => {
      auth.username = this.options.username;
      auth.password = this.options.password;
    });
  }

  visit(url) {
    return new Promise((resolve) => {
      this.browser.visit(url, () => {
        const resource = this.browser.resources.length
          ? this.browser.resources.filter(_resource => _resource.response).shift() : null;

        this.window = this.browser.window;
        this.document = this.browser.document;
        this.headers = this.getHeaders();
        this.statusCode = resource ? resource.response.status : 0;
        this.contentType = this.headers['content-type'] ? this.headers['content-type'].shift() : null;
        this.html = this.getHtml();
        this.js = this.getJs();
        this.links = this.getLinks();
        this.scripts = this.getScripts();
        this.cookies = this.getCookies();

        resolve();
      });
    });
  }

  getHeaders() {
    const headers = {};

    const resource = this.browser.resources.length
      ? this.browser.resources.filter(_resource => _resource.response).shift() : null;

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

  getHtml() {
    let html = '';

    if (this.browser.document && this.browser.document.documentElement) {
      try {
        html = this.browser.html();
      } catch (error) {
        this.log(error.message, 'error');
      }
    }

    return html;
  }

  getScripts() {
    let scripts = [];

    if (this.browser.document && this.browser.document.scripts) {
      scripts = Array.prototype.slice
        .apply(this.browser.document.scripts)
        .filter(script => script.src)
        .map(script => script.src);
    }

    return scripts;
  }

  getJs() {
    return this.browser.window;
  }

  getLinks() {
    let links = [];

    if (this.browser.document) {
      links = Array.from(this.browser.document.getElementsByTagName('a'));
    }

    return links;
  }

  getCookies() {
    const cookies = [];

    if (this.browser.cookies) {
      this.browser.cookies.forEach(cookie => cookies.push({
        name: cookie.key,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
      }));
    }

    return cookies;
  }
}

module.exports = ZombieBrowser;
