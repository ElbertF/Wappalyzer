/**
 * WebExtension driver
 */

/* eslint-env browser */
/* global browser, fetch, Wappalyzer */

/** global: browser */
/** global: fetch */
/** global: Wappalyzer */

const wappalyzer = new Wappalyzer();

const tabCache = {};
const robotsTxtQueue = {};

let categoryOrder = [];

browser.tabs.onRemoved.addListener((tabId) => {
  tabCache[tabId] = null;
});

/**
 * Get a value from localStorage
 */
function getOption(name, defaultValue = null) {
  return new Promise(async (resolve, reject) => {
    let value = defaultValue;

    try {
      const option = await browser.storage.local.get(name);

      if (option[name] !== undefined) {
        value = option[name];
      }
    } catch (error) {
      wappalyzer.log(error.message, 'driver', 'error');

      return reject(error.message);
    }

    return resolve(value);
  });
}

/**
 * Set a value in localStorage
 */
function setOption(name, value) {
  return new Promise(async (resolve, reject) => {
    try {
      await browser.storage.local.set({ [name]: value });
    } catch (error) {
      wappalyzer.log(error.message, 'driver', 'error');

      return reject(error.message);
    }

    return resolve();
  });
}

/**
 * Open a tab
 */
function openTab(args) {
  browser.tabs.create({
    url: args.url,
    active: args.background === undefined || !args.background,
  });
}

/**
 * Make a POST request
 */
async function post(url, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    wappalyzer.log(`POST ${url}: ${response.status}`, 'driver');
  } catch (error) {
    wappalyzer.log(`POST ${url}: ${error}`, 'driver', 'error');
  }
}

// Capture response headers
browser.webRequest.onCompleted.addListener(async (request) => {
  const headers = {};

  if (request.responseHeaders) {
    const url = wappalyzer.parseUrl(request.url);

    let tab;

    try {
      [tab] = await browser.tabs.query({ url: [url.href] });
    } catch (error) {
      wappalyzer.log(error, 'driver', 'error');
    }

    if (tab) {
      request.responseHeaders.forEach((header) => {
        const name = header.name.toLowerCase();

        headers[name] = headers[name] || [];

        headers[name].push((header.value || header.binaryValue || '').toString());
      });

      if (headers['content-type'] && /\/x?html/.test(headers['content-type'][0])) {
        wappalyzer.analyze(url, { headers }, { tab });
      }
    }
  }
}, { urls: ['http://*/*', 'https://*/*'], types: ['main_frame'] }, ['responseHeaders']);

// Listen for messages
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.id === undefined) {
    return Promise.resolve();
  }

  if (message.id !== 'log') {
    wappalyzer.log(`Message${message.source ? ` from ${message.source}` : ''}: ${message.id}`, 'driver');
  }

  const pinnedCategory = await getOption('pinnedCategory');

  const url = wappalyzer.parseUrl(sender.tab ? sender.tab.url : '');

  const cookies = await browser.cookies.getAll({ domain: `.${url.hostname}` });

  let response;

  switch (message.id) {
    case 'log':
      wappalyzer.log(message.subject, message.source);

      break;
    case 'init':
      wappalyzer.analyze(url, { cookies }, { tab: sender.tab });

      break;
    case 'analyze':
      wappalyzer.analyze(url, message.subject, { tab: sender.tab });

      await setOption('hostnameCache', wappalyzer.hostnameCache);

      break;
    case 'ad_log':
      wappalyzer.cacheDetectedAds(message.subject);

      break;
    case 'get_apps':
      response = {
        tabCache: tabCache[message.tab.id],
        apps: wappalyzer.apps,
        categories: wappalyzer.categories,
        pinnedCategory,
      };

      break;
    case 'set_option':
      await setOption(message.key, message.value);

      break;
    case 'get_js_patterns':
      response = {
        patterns: wappalyzer.jsPatterns,
      };

      break;
    default:
  }

  return Promise.resolve(response);
});

wappalyzer.driver.document = document;

/**
 * Log messages to console
 */
wappalyzer.driver.log = (message, source, type) => {
  const log = ['warn', 'error'].indexOf(type) !== -1 ? type : 'log';

  console[log](`[wappalyzer ${type}]`, `[${source}]`, message);
};

/**
 * Display apps
 */
wappalyzer.driver.displayApps = async (detected, meta, context) => {
  const { tab } = context;

  if (tab === undefined) {
    return;
  }

  tabCache[tab.id] = tabCache[tab.id] || {
    detected: [],
  };

  tabCache[tab.id].detected = detected;

  const pinnedCategory = await getOption('pinnedCategory');
  const dynamicIcon = await getOption('dynamicIcon', true);

  let found = false;

  // Find the main application to display
  [pinnedCategory].concat(categoryOrder).forEach((match) => {
    Object.keys(detected).forEach((appName) => {
      const app = detected[appName];

      app.props.cats.forEach((category) => {
        if (category === match && !found) {
          let icon = app.props.icon && dynamicIcon ? app.props.icon : 'default.svg';

          if (/\.svg$/i.test(icon)) {
            icon = `converted/${icon.replace(/\.svg$/, '.png')}`;
          }

          try {
            browser.pageAction.setIcon({
              tabId: tab.id,
              path: `../images/icons/${icon}`,
            });
          } catch (e) {
            // Firefox for Android does not support setIcon see https://bugzilla.mozilla.org/show_bug.cgi?id=1331746
          }

          found = true;
        }
      });
    });
  });

  browser.pageAction.show(tab.id);
};

/**
 * Fetch and cache robots.txt for host
 */
wappalyzer.driver.getRobotsTxt = async (host, secure = false) => {
  if (robotsTxtQueue[host]) {
    return robotsTxtQueue[host];
  }

  const tracking = await getOption('tracking', true);
  const robotsTxtCache = await getOption('robotsTxtCache', {});

  robotsTxtQueue[host] = new Promise(async (resolve) => {
    if (!tracking) {
      return resolve([]);
    }

    if (host in robotsTxtCache) {
      return resolve(robotsTxtCache[host]);
    }

    const timeout = setTimeout(() => resolve([]), 3000);

    let response;

    try {
      response = await fetch(`http${secure ? 's' : ''}://${host}/robots.txt`, { redirect: 'follow' });
    } catch (error) {
      wappalyzer.log(error, 'driver', 'error');

      return resolve([]);
    }

    clearTimeout(timeout);

    const robotsTxt = response.ok ? await response.text() : '';

    robotsTxtCache[host] = Wappalyzer.parseRobotsTxt(robotsTxt);

    await setOption('robotsTxtCache', robotsTxtCache);

    delete robotsTxtQueue[host];

    return resolve(robotsTxtCache[host]);
  });

  return robotsTxtQueue[host];
};

/**
 * Anonymously track detected applications for research purposes
 */
wappalyzer.driver.ping = async (hostnameCache = {}, adCache = []) => {
  const tracking = await getOption('tracking', true);

  if (tracking) {
    if (Object.keys(hostnameCache).length) {
      post('https://api.wappalyzer.com/ping/v1/', hostnameCache);
    }

    if (adCache.length) {
      post('https://ad.wappalyzer.com/log/wp/', adCache);
    }

    await setOption('robotsTxtCache', {});
  }
};

// Init
(async () => {
  // Technologies
  try {
    const response = await fetch('../apps.json');
    const json = await response.json();

    wappalyzer.apps = json.apps;
    wappalyzer.categories = json.categories;
  } catch (error) {
    wappalyzer.log(`GET apps.json: ${error.message}`, 'driver', 'error');
  }

  wappalyzer.parseJsPatterns();

  categoryOrder = Object.keys(wappalyzer.categories)
    .map(categoryId => parseInt(categoryId, 10))
    .sort((a, b) => wappalyzer.categories[a].priority - wappalyzer.categories[b].priority);

  // Version check
  const { version } = browser.runtime.getManifest();
  const previousVersion = await getOption('version');
  const upgradeMessage = await getOption('upgradeMessage', true);

  if (previousVersion === null) {
    openTab({
      url: `${wappalyzer.config.websiteURL}installed`,
    });
  } else if (version !== previousVersion && upgradeMessage) {
    openTab({
      url: `${wappalyzer.config.websiteURL}upgraded?v${version}`,
      background: true,
    });
  }

  await setOption('version', version);

  // Hostname cache
  wappalyzer.hostnameCache = await getOption('hostnameCache', {});

  // Run content script on all tabs
  try {
    const tabs = await browser.tabs.query({ url: ['http://*/*', 'https://*/*'] });

    tabs.forEach((tab) => {
      browser.tabs.executeScript(tab.id, {
        file: '../js/content.js',
      });
    });
  } catch (error) {
    wappalyzer.log(error, 'driver', 'error');
  }
})();
