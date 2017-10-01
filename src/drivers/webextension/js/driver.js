/**
 * WebExtension driver
 */

/** global: browser */
/** global: Wappalyzer */

const wappalyzer = new Wappalyzer();

var tabCache = {};
var headersCache = {};
var categoryOrder = [];

browser.tabs.onRemoved.addListener(tabId => {
  tabCache[tabId] = null;
});

/**
 * Get a value from localStorage
 */
function getOption(name, defaultValue) {
  return new Promise((resolve, reject) => {
    const callback = item => {
      resolve(item.hasOwnProperty(name) ? item[name] : defaultValue);
    };

    try {
      // Chrome, Firefox
      browser.storage.local.get(name)
        .then(callback)
        .catch(error => wappalyzer.log(error, 'driver', 'error'));
    } catch ( e ) {
      // Edge
      browser.storage.local.get(name, callback);
    }
  });
}

/**
 * Set a value in localStorage
 */
function setOption(name, value) {
  var option = {};

  option[name] = value;

  browser.storage.local.set(option);
}

/**
 * Open a tab
 */
function openTab(args) {
  browser.tabs.create({
    url: args.url,
    active: args.background === undefined || !args.background
  });
}

/**
 * Make a POST request
 */
function post(url, body) {
  fetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  })
    .then(response => {
      wappalyzer.log('POST ' + url + ': ' + response.status, 'driver');
    })
    .catch(error => {
      wappalyzer.log('POST ' + url + ': ' + error, 'driver', 'error');
    });
}

fetch('../apps.json')
  .then(response => {
    return response.json();
  })
  .then(json => {
    wappalyzer.apps = json.apps;
    wappalyzer.categories = json.categories;

    categoryOrder = Object.keys(wappalyzer.categories).sort((a, b) => wappalyzer.categories[a].priority - wappalyzer.categories[b].priority);
  })
  .catch(error => {
    wappalyzer.log('GET apps.json: ' + error, 'driver', 'error');
  });

// Version check
var version = browser.runtime.getManifest().version;

getOption('version')
  .then(previousVersion => {
    if ( previousVersion === null ) {
      openTab({
        url: wappalyzer.config.websiteURL + 'installed'
      });
    } else if ( version !== previousVersion ) {
      getOption('upgradeMessage', true)
        .then(upgradeMessage => {
          if ( upgradeMessage ) {
            openTab({
              url: wappalyzer.config.websiteURL + 'upgraded',
              background: true
            });
          }
        });
    }

    setOption('version', version);
  });

// Run content script
var callback = tabs => {
  tabs.forEach(tab => {
    if ( tab.url.match(/^https?:\/\//) ) {
      browser.tabs.executeScript(tab.id, {
        file: 'js/content.js'
      });
    }
  })
};

try {
  browser.tabs.query({})
    .then(callback)
    .catch(error => wappalyzer.log(error, 'driver', 'error'));
} catch ( e ) {
  browser.tabs.query({}, callback);
}

// Capture response headers
browser.webRequest.onCompleted.addListener(request => {
  var responseHeaders = {};

  if ( request.responseHeaders ) {
    var url = wappalyzer.parseUrl(request.url);

    request.responseHeaders.forEach(function(header) {
      responseHeaders[header.name.toLowerCase()] = header.value || '' + header.binaryValue;
    });

    if ( headersCache.length > 50 ) {
      headersCache = {};
    }

    if ( /text\/html/.test(responseHeaders['content-type']) ) {
      if ( headersCache[url.canonical] === undefined ) {
        headersCache[url.canonical] = {};
      }

      Object.keys(responseHeaders).forEach(header => {
        headersCache[url.canonical][header] = responseHeaders[header];
      });
    }
  }
}, { urls: [ 'http://*/*', 'https://*/*' ], types: [ 'main_frame' ] }, [ 'responseHeaders' ]);

// Listen for messages
( chrome || browser ).runtime.onMessage.addListener((message, sender, sendResponse) => {
  if ( typeof message.id != 'undefined' ) {
    if ( message.id !== 'log' ) {
      wappalyzer.log('Message received from ' + message.source + ': ' + message.id, 'driver');
    }

    var response;

    switch ( message.id ) {
      case 'log':
        wappalyzer.log(message.message, message.source);

        break;
      case 'analyze':
        var url = wappalyzer.parseUrl(sender.tab.url);

        if ( headersCache[url.canonical] !== undefined ) {
          message.subject.headers = headersCache[url.canonical];
        }

        wappalyzer.analyze(url.hostname, url.canonical, message.subject, {
          tab: sender.tab
        });

        break;
      case 'ad_log':
        wappalyzer.cacheDetectedAds(message.subject);

        break;
      case 'get_apps':
        response = {
          tabCache:   tabCache[message.tab.id],
          apps:       wappalyzer.apps,
          categories: wappalyzer.categories
        };

        break;
      default:
    }

    sendResponse(response);
  }
});

wappalyzer.driver.document = document;

/**
 * Log messages to console
 */
wappalyzer.driver.log = (message, source, type) => {
  console.log('[wappalyzer ' + type + ']', '[' + source + ']', message);
};

/**
 * Display apps
 */
wappalyzer.driver.displayApps = (detected, context) => {
  var tab = context.tab;

  tabCache[tab.id] = tabCache[tab.id] || { detected: [] };

  tabCache[tab.id].detected = detected;

  if ( Object.keys(detected).length ) {
    getOption('dynamicIcon', true)
      .then(dynamicIcon => {
        var appName, found = false;

        // Find the main application to display
        categoryOrder.forEach(match => {
          Object.keys(detected).forEach(appName => {
            var app = detected[appName];

            app.props.cats.forEach(category => {
              if ( category === match && !found ) {
                var icon = app.props.icon || 'default.svg';

                if ( !dynamicIcon ) {
                  icon = 'default.svg';
                }

                if ( /\.svg$/i.test(icon) ) {
                  icon = 'converted/' + icon.replace(/\.svg$/, '.png');
                }

                browser.pageAction.setIcon({
                  tabId: tab.id,
                  path: '../images/icons/' + icon
                });

                found = true;
              }
            });
          });
        });

        if ( typeof chrome !== 'undefined' ) {
          // Browser polyfill doesn't seem to work here
          chrome.pageAction.show(tab.id);
        } else {
          browser.pageAction.show(tab.id);
        }
      });
  }
};

/**
 * Fetch and cache robots.txt for host
 */
wappalyzer.driver.getRobotsTxt = (host, secure = false) => {
  return new Promise((resolve, reject) => {
    getOption('robotsTxtCache')
      .then(robotsTxtCache => {
        robotsTxtCache = robotsTxtCache || {};

        if ( host in robotsTxtCache ) {
          resolve(robotsTxtCache[host]);
        } else {
          var url = 'http' + ( secure ? 's' : '' ) + '://' + host + '/robots.txt';

          fetch('http' + ( secure ? 's' : '' ) + '://' + host + '/robots.txt')
            .then(response => {
              if ( !response.ok ) {
                if ( response.status === 404 ) {
                  return '';
                } else {
                  throw 'GET ' + response.url + ' was not ok';
                }
              }

              return response.text();
            })
            .then(robotsTxt => {
              robotsTxtCache[host] = wappalyzer.parseRobotsTxt(robotsTxt);

              setOption('robotsTxtCache', robotsTxtCache);

              resolve(robotsTxtCache[host]);

              var hostname = host.replace(/:[0-9]+$/, '')
            })
            .catch(reject);
        }
      });
  });
};

/**
 * Anonymously track detected applications for research purposes
 */
wappalyzer.driver.ping = (hostnameCache, adCache) => {
  getOption('tracking', true)
    .then(tracking => {
      if ( tracking ) {
        if ( Object.keys(hostnameCache).length ) {
          post('http://ping.wappalyzer.com/v2/', hostnameCache);
        }

        if ( adCache.length ) {
          post('https://ad.wappalyzer.com/log/wp/', adCache);
        }

        setOption('robotsTxtCache', {});
      }
    });
};
