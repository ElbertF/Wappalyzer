'use strict';

const Wappalyzer = require('./wappalyzer');
const request = require('request');
const fs = require('fs');
const Browser = require('zombie');

const json = JSON.parse(fs.readFileSync(__dirname + '/apps.json'));

const driver = {
  quiet: true,

  analyze: (url,content) => {
    const wappalyzer = new Wappalyzer();

    wappalyzer.apps = json.apps;
    wappalyzer.categories = json.categories;

    return new Promise((resolve, reject) => {
      wappalyzer.driver.log = (message, source, type) => {
        if ( type === 'error' ) {
          return reject(message);
        }

        if ( !driver.quiet ) {
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

      const hostname = wappalyzer.parseUrl(url).hostname;

      if (!content) {
           const browser = new Browser();
           browser.visit(url, error => {
                wappalyzer.driver.document = browser.document;

                const headers = browser.resources['0'].response.headers;
                const vars = Object.getOwnPropertyNames(browser.window);
                const html = browser.html();

                wappalyzer.analyze(hostname, url, {
                     headers,
                     html,
                     env: vars
                });

           });
      } else {
           wappalyzer.analyze(hostname, content.url, {
                headers: content.headers,
                content: content.html,
                env: content.env
           });
      }

    });
  }
}

module.exports = driver;
