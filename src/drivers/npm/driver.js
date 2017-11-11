'use strict';

const driver = options => {
  const Wappalyzer = require('./wappalyzer');
  const request = require('request');
  const fs = require('fs');
  const Browser = require('zombie', {
    userAgent: options.userAgent
  });

  const json = JSON.parse(fs.readFileSync(__dirname + '/apps.json'));

  return {
    analyze: url => {
      const wappalyzer = new Wappalyzer();

      wappalyzer.apps = json.apps;
      wappalyzer.categories = json.categories;

      return new Promise((resolve, reject) => {
        wappalyzer.driver.log = (message, source, type) => {
          if ( type === 'error' ) {
            return reject(message);
          }

          if ( Boolean(options.debug) ) {
            console.log('[wappalyzer ' + type + ']', '[' + source + ']', message);
          }
        };

        wappalyzer.driver.displayApps = detected => {
          var apps = [];

          Object.keys(detected).forEach(appName => {
            const app = detected[appName];

            var categories = [];

            app.props.cats.forEach(id => {
              var category = {};

              category[id] = wappalyzer.categories[id].name;

              categories.push(category)
            });

            apps.push({
              name: app.name,
              confidence: app.confidenceTotal.toString(),
              version: app.version,
              icon: app.props.icon || 'default.svg',
              website: app.props.website,
              categories
            });
          });

          resolve(apps);
        };

        const browser = new Browser();

        browser.visit(url, error => {
          if ( !browser.resources['0'].response ) {
            return wappalyzer.log('No response from server', 'driver', 'error');
          }

          browser.wait(options.maxWait)
            .catch(error => wappalyzer.log(error.message, 'browser'))
            .finally(() => {
              wappalyzer.driver.document = browser.document;

              const headers = {};

              browser.resources['0'].response.headers._headers.forEach(header => {
                if ( !headers[header[0]] ){
                  headers[header[0]] = [];
                }
                headers[header[0]].push(header[1]);
              });

              const vars = Object.getOwnPropertyNames(browser.window);
              const html = browser.html();
              const scripts = Array.prototype.slice
                .apply(browser.document.scripts)
                .filter(s => s.src)
                .map(s => s.src);

            const hostname = wappalyzer.parseUrl(url).hostname;

              wappalyzer.analyze(hostname, url, {
                headers,
                html,
                env: vars,
                scripts
              });
            });
        });
      });
    }
  };
};

module.exports = driver;
