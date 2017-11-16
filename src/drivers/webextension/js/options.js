/** global: browser */
/** global: wappalyzer */

function getOption(name, defaultValue, callback) {
  browser.storage.local.get(name)
    .then(item => {
      callback(item.hasOwnProperty(name) ? item[name] : defaultValue);
    });
}

function setOption(name, value) {
  var option = {};

  option[name] = value;

  browser.storage.local.set(option);
}

document.addEventListener('DOMContentLoaded', () => {
  var nodes = document.querySelectorAll('[data-i18n]');

  Array.prototype.forEach.call(nodes, node => {
    node.childNodes[0].nodeValue = browser.i18n.getMessage(node.dataset.i18n);
  });

  document.querySelector('#github').addEventListener('click', () => {
    open(wappalyzer.config.githubURL);
  });

  document.querySelector('#twitter').addEventListener('click', () => {
    open(wappalyzer.config.twitterURL);
  });

  document.querySelector('#wappalyzer').addEventListener('click', () => {
    open(wappalyzer.config.websiteURL);
  });

  getOption('upgradeMessage', true, value => {
    const el = document.querySelector('#option-upgrade-message');

    el.checked = value;

    el.addEventListener('change', () => {
      setOption('upgradeMessage', el.checked);
    });
  });

  getOption('dynamicIcon', true, value => {
    const el = document.querySelector('#option-dynamic-icon');

    el.checked = value;

    el.addEventListener('change', () => {
      setOption('dynamicIcon', el.checked);
    });
  });

  getOption('tracking', true, value => {
    const el = document.querySelector('#option-tracking');

    el.checked = value;

    el.addEventListener('change', () => {
      setOption('tracking', el.checked);
    });
  });
});
