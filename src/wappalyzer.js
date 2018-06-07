/**
 * Wappalyzer v5
 *
 * Created by Elbert Alias <elbert@alias.io>
 *
 * License: GPLv3 http://www.gnu.org/licenses/gpl-3.0.txt
 */

'use strict';

const validation = {
  hostname: /(www.)?((.+?)\.(([a-z]{2,3}\.)?[a-z]{2,6}))$/,
  hostnameBlacklist: /((local|dev(elopment)?|stag(e|ing)?|test(ing)?|demo(shop)?|admin|google|cache)\.|\/admin|\.local)/
};

class Wappalyzer {
  constructor() {
    this.apps = {};
    this.categories = {};
    this.driver = {};
    this.jsPatterns = {};
    this.detected = {};
    this.hostnameCache = {};
    this.adCache = [];

    this.config = {
      websiteURL: 'https://www.wappalyzer.com/',
      twitterURL: 'https://twitter.com/Wappalyzer',
      githubURL: 'https://github.com/AliasIO/Wappalyzer',
    };
  }

  /**
   * Log messages to console
   */
  log(message, source, type) {
    this.driver.log(message, source || '', type || 'debug');
  }

  asyncForEach(iterable, iterator) {
    return Promise.all(( iterable || [] ).map(item => new Promise(resolve => setTimeout(() => resolve(iterator(item)), 1))));
  }

  analyze(url, data, context) {
    const startTime = new Date();

    const promises = [];

    var apps = {};

    if ( this.detected[url.canonical] === undefined ) {
      this.detected[url.canonical] = {};
    }

    // Additional information
    var language = null;

    if ( data.html ) {
      if ( typeof data.html !== 'string' ) {
        data.html = '';
      }

      const matches = data.html.match(/<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"/i);

      language = matches && matches.length ? matches[1] : null;
    }

    Object.keys(this.apps).forEach(appName => {
      apps[appName] = this.detected[url.canonical] && this.detected[url.canonical][appName] ? this.detected[url.canonical][appName] : new Application(appName, this.apps[appName]);

      var app = apps[appName];

      this.analyzeUrl(app, url);

      if ( data.html ) {
        promises.push(this.analyzeHtml(app, data.html));
        promises.push(this.analyzeMeta(app, data.html));
      }

      if ( data.scripts ) {
        promises.push(this.analyzeScripts(app, data.scripts));
      }

      if ( data.cookies ) {
        promises.push(this.analyzeCookies(app, data.cookies));
      }

      if ( data.headers ) {
        promises.push(this.analyzeHeaders(app, data.headers));
      }
    });

    if ( data.js ) {
      Object.keys(data.js).forEach(appName => {
        if (typeof data.js[appName] != 'function') {
          promises.push(this.analyzeJs(apps[appName], data.js[appName]));
        }
      });
    }

    return new Promise(resolve => {
      Promise.all(promises)
        .then(() => {
          Object.keys(apps).forEach(appName => {
            var app = apps[appName];

            if ( !app.detected || !app.getConfidence() ) {
              delete apps[app.name];
            }
          });

          this.resolveExcludes(apps);
          this.resolveImplies(apps, url.canonical);

          this.cacheDetectedApps(apps, url.canonical);
          this.trackDetectedApps(apps, url, language);

          this.log('Processing ' + Object.keys(data).join(', ') + ' took ' + (( new Date() - startTime ) / 1000).toFixed(2) + 's (' + url.hostname + ')', 'core');

          if ( Object.keys(apps).length ) {
            this.log('Identified ' + Object.keys(apps).join(', ') + ' (' + url.hostname + ')', 'core');
          }

          this.driver.displayApps(this.detected[url.canonical], { language }, context);

          resolve();
        });
    });
  }

  /**
   * Cache detected ads
   */
  cacheDetectedAds(ad) {
    this.adCache.push(ad);
  }

  /**
   *
   */
  robotsTxtAllows(url) {
    return new Promise((resolve, reject) => {
      var parsed = this.parseUrl(url);

      if ( parsed.protocol !== 'http:' && parsed.protocol !== 'https:' ) {
        return reject();
      }

      this.driver.getRobotsTxt(parsed.host, parsed.protocol === 'https:')
        .then(robotsTxt => {
          if ( robotsTxt.some(disallowedPath => parsed.pathname.indexOf(disallowedPath) === 0) ) {
            return reject();
          }

          return resolve();
        }, () => resolve());
    });
  };

  /**
   * Parse a URL
   */
  parseUrl(url) {
    var a = this.driver.document.createElement('a');

    a.href = url;

    a.canonical = a.protocol + '//' + a.host + a.pathname;

    return a;
  }

  /**
   *
   */
  parseRobotsTxt(robotsTxt) {
    var userAgent;
    var disallow = [];

    robotsTxt.split('\n').forEach(line => {
      var matches = /^User-agent:\s*(.+)$/i.exec(line);

      if ( matches ) {
        userAgent = matches[1].toLowerCase();
      } else {
        if ( userAgent === '*' || userAgent === 'wappalyzer' ) {
          matches = /^Disallow:\s*(.+)$/i.exec(line);

          if ( matches ) {
            disallow.push(matches[1]);
          }
        }
      }
    });

    return disallow;
  }

  /**
   *
   */
  ping() {
    if ( Object.keys(this.hostnameCache).length + this.adCache.length > 50 ) {
      this.driver.ping(this.hostnameCache, this.adCache);

      this.hostnameCache = {};
      this.adCache = [];
    }
  }

  /**
   * Enclose string in array
   */
  asArray(value) {
    return value instanceof Array ? value : [ value ];
  }

  /**
   * Parse apps.json patterns
   */
  parsePatterns(patterns) {
    if ( !patterns ) {
      return [];
    }

    var parsed = {};

    // Convert string to object containing array containing string
    if ( typeof patterns === 'string' || patterns instanceof Array ) {
      patterns = {
        main: this.asArray(patterns)
      };
    }

    Object.keys(patterns).forEach(key => {
      parsed[key] = [];

      this.asArray(patterns[key]).forEach(pattern => {
        var attrs = {};

        pattern.split('\\;').forEach((attr, i) => {
          if ( i ) {
            // Key value pairs
            attr = attr.split(':');

            if ( attr.length > 1 ) {
              attrs[attr.shift()] = attr.join(':');
            }
          } else {
            attrs.string = attr;

            try {
              attrs.regex = new RegExp(attr.replace('/', '\/'), 'i'); // Escape slashes in regular expression
            } catch (e) {
              attrs.regex = new RegExp();

              this.log(e + ': ' + attr, 'error', 'core');
            }
          }
        });

        parsed[key].push(attrs);
      });
    });

    // Convert back to array if the original pattern list was an array (or string)
    if ( 'main' in parsed ) {
      parsed = parsed.main;
    }

    return parsed;
  }

  /**
   * Parse JavaScript patterns
   */
  parseJsPatterns() {
    Object.keys(this.apps).forEach(appName => {
      if ( this.apps[appName].js ) {
        this.jsPatterns[appName] = this.parsePatterns(this.apps[appName].js);
      }
    });
  }

  resolveExcludes(apps) {
    var excludes = [];

    // Exclude app in detected apps only
    Object.keys(apps).forEach(appName => {
      var app = apps[appName];

      if ( app.props.excludes ) {
        this.asArray(app.props.excludes).forEach(excluded => {
          excludes.push(excluded);
        });
      }
    })

    // Remove excluded applications
    Object.keys(apps).forEach(appName => {
      if ( excludes.indexOf(appName) > -1 ) {
        delete apps[appName];
      }
    })
  }

  resolveImplies(apps, url) {
    var checkImplies = true;

    // Implied applications
    // Run several passes as implied apps may imply other apps
    while ( checkImplies ) {
      checkImplies = false;

      Object.keys(apps).forEach(appName => {
        var app = apps[appName];

        if ( app && app.props.implies ) {
          this.asArray(app.props.implies).forEach(implied => {
            implied = this.parsePatterns(implied)[0];

            if ( !this.apps[implied.string] ) {
              this.log('Implied application ' + implied.string + ' does not exist', 'core', 'warn');

              return;
            }

            if ( !( implied.string in apps ) ) {
              apps[implied.string] = this.detected[url] && this.detected[url][implied.string] ? this.detected[url][implied.string] : new Application(implied.string, this.apps[implied.string], true);

              checkImplies = true;
            }

            // Apply app confidence to implied app
            Object.keys(app.confidence).forEach(id => {
              apps[implied.string].confidence[id + ' implied by ' + appName] = app.confidence[id] * ( implied.confidence === undefined ? 1 : implied.confidence / 100 );
            });
          });
        }
      });
    }
  }

  /**
   * Cache detected applications
   */
  cacheDetectedApps(apps, url) {
    Object.keys(apps).forEach(appName => {
      var app = apps[appName];

      // Per URL
      this.detected[url][appName] = app;

      Object.keys(app.confidence).forEach(id => {
        this.detected[url][appName].confidence[id] = app.confidence[id];
      });
    })

    if ( this.driver.ping instanceof Function ) {
      this.ping();
    }
  }

  /**
   * Track detected applications
   */
  trackDetectedApps(apps, url, language) {
    if ( !( this.driver.ping instanceof Function ) ) {
      return;
    }

    const hostname = url.protocol + '//' + url.hostname;

    Object.keys(apps).forEach(appName => {
      const app = apps[appName];

      if ( this.detected[url.canonical][appName].getConfidence() >= 100 ) {
        if ( validation.hostname.test(url.hostname) && !validation.hostnameBlacklist.test(url.hostname) ) {
          if ( !( hostname in this.hostnameCache ) ) {
            this.hostnameCache[hostname] = {
              applications: {},
              meta: {}
            };
          }

          if ( !( appName in this.hostnameCache[hostname].applications ) ) {
            this.hostnameCache[hostname].applications[appName] = {
              hits: 0
            };
          }

          this.hostnameCache[hostname].applications[appName].hits ++;

          if ( apps[appName].version ) {
            this.hostnameCache[hostname].applications[appName].version = app.version;
          }
        }
      }
    });

    if ( hostname in this.hostnameCache ) {
      this.hostnameCache[hostname].meta['language'] = language;
    }

    this.ping();
  }

  /**
   * Analyze URL
   */
  analyzeUrl(app, url) {
    var patterns = this.parsePatterns(app.props.url);

    if ( !patterns.length ) {
      return Promise.resolve();
    }

    return this.asyncForEach(patterns, pattern => {
      if ( pattern.regex.test(url.canonical) ) {
        this.addDetected(app, pattern, 'url', url.canonical);
      }
    });
  }

  /**
   * Analyze HTML
   */
  analyzeHtml(app, html) {
    var patterns = this.parsePatterns(app.props.html);

    if ( !patterns.length ) {
      return Promise.resolve();
    }

    return this.asyncForEach(patterns, pattern => {
      if ( pattern.regex.test(html) ) {
        this.addDetected(app, pattern, 'html', html);
      }
    });
  }

  /**
   * Analyze script tag
   */
  analyzeScripts(app, scripts) {
    var patterns = this.parsePatterns(app.props.script);

    if ( !patterns.length ) {
      return Promise.resolve();
    }

    return this.asyncForEach(patterns, pattern => {
      var match;

      scripts.forEach(uri => {
        if ( pattern.regex.test(uri) ) {
          this.addDetected(app, pattern, 'script', uri);
        }
      });
    });
  }

  /**
   * Analyze meta tag
   */
  analyzeMeta(app, html) {
    const regex = /<meta[^>]+>/ig;
    const patterns = this.parsePatterns(app.props.meta);
    const promises = [];

    var matches = [];

    while ( patterns && ( matches = regex.exec(html) ) ) {
      for ( var meta in patterns ) {
        const r = new RegExp('(?:name|property)=["\']' + meta + '["\']', 'i');

        if ( r.test(matches[0]) ) {
          let content = matches[0].match(/content=("|')([^"']+)("|')/i);

          promises.push(this.asyncForEach(patterns[meta], pattern => {
            if ( content && content.length === 4 && pattern.regex.test(content[2]) ) {
              this.addDetected(app, pattern, 'meta', content[2], meta);
            }
          }));
        }
      }
    }

    return promises ? Promise.all(promises) : Promise.resolve();
  }

  /**
   * Analyze response headers
   */
  analyzeHeaders(app, headers) {
    const patterns = this.parsePatterns(app.props.headers);
    const promises = [];

    Object.keys(patterns).forEach(headerName => {
      if (typeof patterns[headerName] != 'function') {
        promises.push(this.asyncForEach(patterns[headerName], pattern => {
          headerName = headerName.toLowerCase();

          if ( headerName in headers ) {
            headers[headerName].forEach(headerValue => {
              if ( pattern.regex.test(headerValue) ) {
                this.addDetected(app, pattern, 'headers', headerValue, headerName);
              }
            });
          }
        }));
      }
    });

    return promises ? Promise.all(promises) : Promise.resolve();
  }

  /**
   * Analyze cookies
   */
  analyzeCookies(app, cookies) {
    const patterns = this.parsePatterns(app.props.cookies);
    const promises = [];

    Object.keys(patterns).forEach(cookieName => {
      if (typeof patterns[cookieName] != 'function') {
        cookieName = cookieName.toLowerCase();

        promises.push(this.asyncForEach(patterns[cookieName], pattern => {
          const cookie = cookies.find(cookie => cookie.name.toLowerCase() === cookieName);

          if ( cookie && pattern.regex.test(cookie.value) ) {
            this.addDetected(app, pattern, 'cookies', cookie.value, cookieName);
          }
        }));
      }
    });

    return promises ? Promise.all(promises) : Promise.resolve();
  }

  /**
   * Analyze JavaScript variables
   */
  analyzeJs(app, results) {
    const promises = [];

    Object.keys(results).forEach(string => {
      if (typeof results[string] != 'function') {
        promises.push(this.asyncForEach(Object.keys(results[string]), index => {
          const pattern = this.jsPatterns[app.name][string][index];
          const value = results[string][index];

          if ( pattern && pattern.regex.test(value) ) {
            this.addDetected(app, pattern, 'js', value);
          }
        }));
      }
    });

    return promises ? Promise.all(promises) : Promise.resolve();
  }

  /**
   * Mark application as detected, set confidence and version
   */
  addDetected(app, pattern, type, value, key) {
    app.detected = true;

    // Set confidence level
    app.confidence[type + ' ' + ( key ? key + ' ' : '' ) + pattern.regex] = pattern.confidence === undefined ? 100 : pattern.confidence;

    // Detect version number
    if ( pattern.version ) {
      var versions = [];
      var version  = pattern.version;
      var matches  = pattern.regex.exec(value);

      if ( matches ) {
        matches.forEach((match, i) => {
          // Parse ternary operator
          var ternary = new RegExp('\\\\' + i + '\\?([^:]+):(.*)$').exec(version);

          if ( ternary && ternary.length === 3 ) {
            version = version.replace(ternary[0], match ? ternary[1] : ternary[2]);
          }

          // Replace back references
          version = version.trim().replace(new RegExp('\\\\' + i, 'g'), match || '');
        });

        if ( version && versions.indexOf(version) === -1 ) {
          versions.push(version);
        }

        if ( versions.length ) {
          // Use the longest detected version number
          app.version = versions.reduce((a, b) => a.length > b.length ? a : b);
        }
      }
    }
  }
}

/**
 * Application class
 */
class Application {
  constructor(name, props, detected) {
    this.confidence      = {};
    this.confidenceTotal = 0;
    this.detected        = Boolean(detected);
    this.excludes        = [];
    this.name            = name;
    this.props           = props;
    this.version         = '';
  }

  /**
   * Calculate confidence total
   */
  getConfidence() {
    var total = 0;

    for ( var id in this.confidence ) {
      total += this.confidence[id];
    }

    return this.confidenceTotal = Math.min(total, 100);
  }
}

if ( typeof module === 'object' ) {
  module.exports = Wappalyzer;
}
