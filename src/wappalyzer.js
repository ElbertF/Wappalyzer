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

  analyze(hostname, url, data, context) {
    var apps = {};

    // Remove hash from URL
    data.url = url = url.split('#')[0];

    if ( typeof data.html !== 'string' ) {
      data.html = '';
    }

    if ( this.detected[url] === undefined ) {
      this.detected[url] = {};
    }

    Object.keys(this.apps).forEach(appName => {
      apps[appName] = this.detected[url] && this.detected[url][appName] ? this.detected[url][appName] : new Application(appName, this.apps[appName]);

      var app = apps[appName];

      if ( url ) {
        this.analyzeUrl(app, url);
      }

      if ( data.html ) {
        this.analyzeHtml(app, data.html);
        this.analyzeMeta(app, data.html);
      }

      if ( data.scripts ) {
        this.analyzeScripts(app, data.scripts);
      }
      
      if ( data.headers ) {
        this.analyzeHeaders(app, data.headers);
      }

      if ( data.env ) {
        this.analyzeEnv(app, data.env);
      }

      if ( data.robotsTxt ) {
        this.analyzeRobotsTxt(app, data.robotsTxt);
      }
    })

    Object.keys(apps).forEach(appName => {
      var app = apps[appName];

      if ( !app.detected || !app.getConfidence() ) {
        delete apps[app.name];
      }
    });

    this.resolveExcludes(apps);
    this.resolveImplies(apps, url);

    this.cacheDetectedApps(apps, url);
    this.trackDetectedApps(apps, url, hostname, data.html);

    if ( Object.keys(apps).length ) {
      this.log(Object.keys(apps).length + ' apps detected: ' + Object.keys(apps).join(', ') + ' on ' + url, 'core');
    }

    this.driver.displayApps(this.detected[url], context);
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

      this.driver.getRobotsTxt(parsed.host, parsed.protocol === 'https:')
        .then(robotsTxt => {
          robotsTxt.forEach(disallow => parsed.pathname.indexOf(disallow) === 0 && reject());

          resolve();
        });
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
    if ( Object.keys(this.hostnameCache).length + this.adCache.length > 200 ) {
      this.driver.ping(this.hostnameCache, this.adCache);

      this.hostnameCache = {};
      this.adCache = [];
    }
  }

  /**
   * Enclose string in array
   */
  asArray(value) {
    return typeof value === 'string' ? [ value ] : value;
  }

  /**
   * Parse apps.json patterns
   */
  parsePatterns(patterns) {
    var parsed = {};

    // Convert string to object containing array containing string
    if ( typeof patterns === 'string' || patterns instanceof Array ) {
      patterns = {
        main: this.asArray(patterns)
      };
    }

    for ( var key in patterns ) {
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
    }

    // Convert back to array if the original pattern list was an array (or string)
    if ( 'main' in parsed ) {
      parsed = parsed.main;
    }

    return parsed;
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
      if ( excludes.indexOf(appName) !== -1 ) {
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
              apps[implied.string].confidence[id + ' implied by ' + appName] = app.confidence[id] * ( implied.confidence ? implied.confidence / 100 : 1 );
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
  trackDetectedApps(apps, url, hostname, html) {
    if ( !( this.driver.ping instanceof Function ) ) {
      return;
    }

    Object.keys(apps).forEach(appName => {
      var app = apps[appName];

      if ( this.detected[url][appName].getConfidence() >= 100 ) {
        if ( validation.hostname.test(hostname) && !validation.hostnameBlacklist.test(url) ) {
          this.robotsTxtAllows(url)
            .then(() => {
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
            })
          .catch(() => this.log('Disallowed in robots.txt: ' + url), 'core')
        }
      }
    });

    // Additional information
    if ( hostname in this.hostnameCache ) {
      var match = html.match(/<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"/i);

      if ( match && match.length ) {
        this.hostnameCache[hostname].meta['language'] = match[1];
      }
    }

    this.ping();
  }

  /**
   * Analyze URL
   */
  analyzeUrl(app, url) {
    var patterns = this.parsePatterns(app.props.url);

    if ( patterns.length ) {
      patterns.forEach(pattern => {
        if ( pattern.regex.test(url) ) {
          this.addDetected(app, pattern, 'url', url);
        }
      });
    }
  }

  /**
   * Analyze HTML
   */
  analyzeHtml(app, html) {
    var patterns = this.parsePatterns(app.props.html);

    if ( patterns.length ) {
      patterns.forEach(pattern => {
        if ( pattern.regex.test(html) ) {
          this.addDetected(app, pattern, 'html', html);
        }
      });
    }
  }

  /**
   * Analyze script tag
   */
  analyzeScripts(app, scripts) {
    var patterns = this.parsePatterns(app.props.script);

    if ( patterns.length ) {
      patterns.forEach(pattern => {
        var match;

        scripts.forEach(uri => {
          if ( pattern.regex.test(uri) ) {
            this.addDetected(app, pattern, 'script', uri);
          }
        });
      });
    }
  }

  /**
   * Analyze meta tag
   */
  analyzeMeta(app, html) {
    var regex = /<meta[^>]+>/ig;
    var patterns = this.parsePatterns(app.props.meta);
    var content;
    var match;

    while ( patterns && ( match = regex.exec(html) ) ) {
      for ( var meta in patterns ) {
        if ( new RegExp('(name|property)=["\']' + meta + '["\']', 'i').test(match) ) {
          content = match.toString().match(/content=("|')([^"']+)("|')/i);

          patterns[meta].forEach(pattern => {
            if ( content && content.length === 4 && pattern.regex.test(content[2]) ) {
              this.addDetected(app, pattern, 'meta', content[2], meta);
            }
          });
        }
      }
    }
  }

  /**
   * analyze response headers
   */
  analyzeHeaders(app, headers) {
    var patterns = this.parsePatterns(app.props.headers);

    if ( headers ) {
      Object.keys(patterns).forEach(headerName => {
        patterns[headerName].forEach(pattern => {
          headerName = headerName.toLowerCase();

          if ( headerName in headers ) {
            headers[headerName].forEach(headerValue => {
              if ( pattern.regex.test(headerValue) ) {
                this.addDetected(app, pattern, 'headers', headerValue, headerName);
              }
            });
          }
        });
      });
    }
  }

  /**
   * Analyze environment variables
   */
  analyzeEnv(app, envs) {
    var patterns = this.parsePatterns(app.props.env);

    if ( patterns.length ) {
      patterns.forEach(pattern => {
        Object.keys(envs).forEach(env => {
          if ( pattern.regex.test(envs[env]) ) {
            this.addDetected(app, pattern, 'env', envs[env]);
          }
        })
      });
    }
  }

  /**
   * Analyze robots.txt
   */
  analyzeRobotsTxt(app, robotsTxt) {
    var patterns = this.parsePatterns(app.props.robotsTxt);

    if ( patterns.length ) {
      patterns.forEach(pattern => {
        if ( pattern.regex.test(robotsTxt) ) {
          this.addDetected(app, pattern, 'robotsTxt', robotsTxt);
        }
      });
    }
  }

  /**
   * Mark application as detected, set confidence and version
   */
  addDetected(app, pattern, type, value, key) {
    app.detected = true;

    // Set confidence level
    app.confidence[type + ' ' + ( key ? key + ' ' : '' ) + pattern.regex] = pattern.confidence || 100;

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
          version = version.replace(new RegExp('\\\\' + i, 'g'), match || '');
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
