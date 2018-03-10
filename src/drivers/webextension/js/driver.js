/**
 * WebExtension driver
 */

/** global: browser */
/** global: Wappalyzer */

const wappalyzer = new Wappalyzer();

var tabCache = {};
var headersCache = {};
var categoryOrder = [];
var options = {};
var robotsTxtQueue = {};

browser.tabs.onRemoved.addListener(tabId => {
  tabCache[tabId] = null;
});

/**
 * Get a value from localStorage
 */
function getOption(name, defaultValue = null) {
  return new Promise((resolve, reject) => {
    const callback = item => {
      options[name] = item.hasOwnProperty(name) ? item[name] : defaultValue;

      resolve(options[name]);
    };

    browser.storage.local.get(name)
      .then(callback)
      .catch(error => wappalyzer.log(error, 'driver', 'error'));
  });
}

/**
 * Set a value in localStorage
 */
function setOption(name, value) {
  var option = {};

  option[name] = value;

  browser.storage.local.set(option);

  options[name] = value;
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

    wappalyzer.parseJsPatterns();

    categoryOrder = Object.keys(wappalyzer.categories)
      .map(categoryId => parseInt(categoryId, 10))
      .sort((a, b) => wappalyzer.categories[a].priority - wappalyzer.categories[b].priority);
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
              url: wappalyzer.config.websiteURL + 'upgraded?v' + version,
              background: true
            });
          }
        });
    }

    setOption('version', version);
  });

getOption('dynamicIcon', true);
getOption('pinnedCategory');

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

browser.tabs.query({})
  .then(callback)
  .catch(error => wappalyzer.log(error, 'driver', 'error'));

// Capture response headers
browser.webRequest.onCompleted.addListener(request => {
  var responseHeaders = {};

  if ( request.responseHeaders ) {
    var url = wappalyzer.parseUrl(request.url);

    request.responseHeaders.forEach(function(header) {
      if ( !responseHeaders[header.name.toLowerCase()] ) {
        responseHeaders[header.name.toLowerCase()] = []
      }
      responseHeaders[header.name.toLowerCase()].push(header.value || '' + header.binaryValue);
    });

    if ( headersCache.length > 50 ) {
      headersCache = {};
    }

    if ( /text\/html/.test(responseHeaders['content-type'][0]) ) {
      if ( headersCache[url.canonical] === undefined ) {
        headersCache[url.canonical] = {};
      }

      Object.keys(responseHeaders).forEach(header => {
        headersCache[url.canonical][header] = responseHeaders[header].slice();
      });
    }
  }
}, { urls: [ 'http://*/*', 'https://*/*' ], types: [ 'main_frame' ] }, [ 'responseHeaders' ]);

// Listen for messages
( chrome || browser ).runtime.onMessage.addListener((message, sender, sendResponse) => {
  if ( typeof message.id != 'undefined' ) {
    if ( message.id !== 'log' ) {
      wappalyzer.log('Message received' + ( message.source ? ' from ' + message.source : '' ) + ': ' + message.id, 'driver');
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

        wappalyzer.analyze(url, message.subject, {
          tab: sender.tab
        });

        break;
      case 'ad_log':
        wappalyzer.cacheDetectedAds(message.subject);

        break;
      case 'get_apps':
        response = {
          tabCache: tabCache[message.tab.id],
          apps: wappalyzer.apps,
          categories: wappalyzer.categories,
          pinnedCategory: options.pinnedCategory,
        };

        break;
      case 'set_option':
        setOption(message.key, message.value);

        break;
      case 'init_js':
        response = {
          patterns: wappalyzer.jsPatterns
        };

        break;
      default:
    }

    sendResponse(response);
  }

  return true;
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
wappalyzer.driver.displayApps = (detected, meta, context) => {
  var tab = context.tab;

  tabCache[tab.id] = tabCache[tab.id] || { detected: [] };

  tabCache[tab.id].detected = detected;

  if ( Object.keys(detected).length ) {
    var appName, found = false;

    // Find the main application to display
    [ options.pinnedCategory ].concat(categoryOrder).forEach(match => {
      Object.keys(detected).forEach(appName => {
        var app = detected[appName];

        app.props.cats.forEach(category => {
          if ( category === match && !found ) {
            var icon = app.props.icon || 'default.svg';

            if ( !options.dynamicIcon ) {
              icon = 'default.svg';
            }

            if ( /\.svg$/i.test(icon) ) {
              icon = 'converted/' + icon.replace(/\.svg$/, '.png');
            }

            try {
              browser.pageAction.setIcon({
                tabId: tab.id,
                path: '../images/icons/' + icon
              });
            } catch(e) {
              // Firefox for Android does not support setIcon see https://bugzilla.mozilla.org/show_bug.cgi?id=1331746
            }

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
  }
};

/**
 * Fetch and cache robots.txt for host
 */
wappalyzer.driver.getRobotsTxt = (host, secure = false) => {
  if ( robotsTxtQueue.hasOwnProperty(host) ) {
    wappalyzer.log('robotTxt fetch already in queue');

    return robotsTxtQueue[host];
  }

  robotsTxtQueue[host] = new Promise((resolve, reject) => {
    getOption('tracking', true)
      .then(tracking => {
        if ( !tracking ) {
          return resolve([]);
        }

        getOption('robotsTxtCache')
          .then(robotsTxtCache => {
            robotsTxtCache = robotsTxtCache || {};

            if ( host in robotsTxtCache ) {
              return resolve(robotsTxtCache[host]);
            }

            const timeout = setTimeout(() => resolve([]), 3000);

            fetch('http' + ( secure ? 's' : '' ) + '://' + host + '/robots.txt', { redirect: 'follow' })
              .then(response => {
                clearTimeout(timeout);

                return response.ok ? response.text() : '';
              })
              .then(robotsTxt => {
                robotsTxtCache[host] = wappalyzer.parseRobotsTxt(robotsTxt);

                setOption('robotsTxtCache', robotsTxtCache);

                resolve(robotsTxtCache[host]);
              })
              .catch(err => resolve([]));
          });
      });
  })
  .finally(() => delete robotsTxtQueue[host]);

  return robotsTxtQueue[host];
};

/**
 * Anonymously track detected applications for research purposes
 */
wappalyzer.driver.ping = (hostnameCache, adCache) => {
  getOption('tracking', true)
    .then(tracking => {
      if ( tracking ) {
        if ( Object.keys(hostnameCache).length ) {
          post('https://api.wappalyzer.com/ping/v1/', hostnameCache);
        }

        if ( adCache.length ) {
          post('https://ad.wappalyzer.com/log/wp/', adCache);
        }

        setOption('robotsTxtCache', {});
      }
    });
};
