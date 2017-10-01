/** global: chrome */
/** global: browser */

var func = tabs => {
  ( chrome || browser ).runtime.sendMessage({
    id: 'get_apps',
    tab: tabs[0],
    source: 'popup.js'
  }, response => {
    replaceDomWhenReady(appsToDomTemplate(response));
  });
};

try {
  // Chrome, Firefox
  browser.tabs.query({ active: true, currentWindow: true })
    .then(func)
    .catch(console.error);
} catch ( e ) {
  // Edge
  browser.tabs.query({ active: true, currentWindow: true }, func);
}

function replaceDomWhenReady(dom) {
  if ( /complete|interactive|loaded/.test(document.readyState) ) {
    replaceDom(dom);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      replaceDom(dom);
    });
  }
}

function replaceDom(domTemplate) {
  var container = document.getElementsByClassName('container')[0];

  while ( container.firstChild ) {
    container.removeChild(container.firstChild);
  }

  container.appendChild(jsonToDOM(domTemplate, document, {}));

  var nodes = document.querySelectorAll('[data-i18n]');

  Array.prototype.forEach.call(nodes, node => {
    node.childNodes[0].nodeValue = browser.i18n.getMessage(node.dataset.i18n);
  });
}

function appsToDomTemplate(response) {
  var
    appName, confidence, version, categories,
    template = [];

  if ( response.tabCache && Object.keys(response.tabCache.detected).length > 0 ) {
    const categories = {};

    // Group apps by category
    for ( appName in response.tabCache.detected ) {
      response.apps[appName].cats.forEach(cat => {
        categories[cat] = categories[cat] || { apps: [] };

        categories[cat].apps[appName] = appName;
      });
    }

    for ( cat in categories ) {
      const apps = [];

      for ( appName in categories[cat].apps ) {
        confidence = response.tabCache.detected[appName].confidenceTotal;
        version    = response.tabCache.detected[appName].version;

        apps.push(
          [
            'a', {
              class: 'detected__app',
              target: '_blank',
              href: 'https://wappalyzer.com/applications/' + slugify(appName)
            }, [
              'img', {
                class: 'detected__app-icon',
                src: '../images/icons/' + ( response.apps[appName].icon || 'default.svg' )
              },
            ], [
              'span', {
                class: 'detected__app-name'
              },
              appName + ( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' )
            ]
          ]
        );
      }

      template.push(
        [
          'div', {
            class: 'detected__category'
          }, [
            'a', {
              class: 'detected__category-link',
              target: '_blank',
              href: 'https://wappalyzer.com/categories/' + slugify(response.categories[cat].name)
            }, [
              'span', {
                class: 'detected__category-name'
              },
              browser.i18n.getMessage('categoryName' + cat)
            ]
          ], [
            'div', {
              class: 'detected__apps'
            },
            apps
          ]
        ]
      );
    }

    template = [
      'div', {
        class: 'detected'
      },
      template
    ];
  } else {
    template = [
      'div', {
        class: 'empty'
      },
      [
        'span', {
          class: 'empty__text'
        },
        browser.i18n.getMessage('noAppsDetected')
      ],
    ];
  }

  return template;
}

function slugify(string) {
  return string.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/(?:^-|-$)/, '');
}
