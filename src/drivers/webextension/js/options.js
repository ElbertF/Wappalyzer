/** global: browser */
/** global: Wappalyzer */
/* globals browser Wappalyzer */
/* eslint-env browser */

const wappalyzer = new Wappalyzer();

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

document.addEventListener('DOMContentLoaded', async () => {
  const nodes = document.querySelectorAll('[data-i18n]');

  Array.prototype.forEach.call(nodes, (node) => {
    node.childNodes[0].nodeValue = browser.i18n.getMessage(node.dataset.i18n);
  });

  document.querySelector('#github').addEventListener('click', () => {
    window.open(wappalyzer.config.githubURL);
  });

  document.querySelector('#twitter').addEventListener('click', () => {
    window.open(wappalyzer.config.twitterURL);
  });

  document.querySelector('#wappalyzer').addEventListener('click', () => {
    window.open(wappalyzer.config.websiteURL);
  });

  let el;
  let value;

  // Upgrade message
  value = await getOption('upgradeMessage', true);

  el = document.querySelector('#option-upgrade-message');

  el.checked = value;

  el.addEventListener('change', e => setOption('upgradeMessage', e.target.checked));

  // Dynamic icon
  value = await getOption('dynamicIcon', true);

  el = document.querySelector('#option-dynamic-icon');

  el.checked = value;

  el.addEventListener('change', e => setOption('dynamicIcon', e.target.checked));

  // Tracking
  value = await getOption('tracking', true);

  el = document.querySelector('#option-tracking');

  el.checked = value;

  el.addEventListener('change', e => setOption('tracking', e.target.checked));

  // Theme Mode
  value = await getOption('themeMode', false);

  el = document.querySelector('#option-theme-mode');

  el.checked = value;

  el.addEventListener('change', e => setOption('themeMode', e.target.checked));
});
