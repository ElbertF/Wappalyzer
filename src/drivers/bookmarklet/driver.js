/**
 * Bookmarklet driver
 */

/** global: wappalyzer */
/** global: XMLHttpRequest */

(function () {
  wappalyzer.driver.document = document;

  const container = document.getElementById('wappalyzer-container');
  const url = wappalyzer.parseUrl(window.top.location.href);
  const hasOwn = Object.prototype.hasOwnProperty;

  /**
   * Log messages to console
   */
  wappalyzer.driver.log = (message, source, type) => {
    console.log(`[wappalyzer ${type}]`, `[${source}]`, message);
  };

  function getPageContent() {
    wappalyzer.log('func: getPageContent', 'driver');

    const scripts = Array.prototype.slice
      .apply(document.scripts)
      .filter(s => s.src)
      .map(s => s.src);

    let html = new window.XMLSerializer().serializeToString(document).split('\n');

    html = html
      .slice(0, 1000).concat(html.slice(html.length - 1000))
      .map(line => line.substring(0, 1000))
      .join('\n');

    wappalyzer.analyze(url, {
      html,
      scripts,
    });
  }

  function getResponseHeaders() {
    wappalyzer.log('func: getResponseHeaders', 'driver');

    const xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status) {
        const headers = xhr.getAllResponseHeaders().split('\n');

        if (headers.length > 0 && headers[0] != '') {
          wappalyzer.log(`responseHeaders: ${xhr.getAllResponseHeaders()}`, 'driver');

          const responseHeaders = {};

          headers.forEach((line) => {
            let name,
              value;

            if (line) {
              name = line.substring(0, line.indexOf(': '));
              value = line.substring(line.indexOf(': ') + 2, line.length - 1);

              if (!responseHeaders[name.toLowerCase()]) {
                responseHeaders[name.toLowerCase()] = [];
              }
              responseHeaders[name.toLowerCase()].push(value);
            }
          });

          wappalyzer.analyze(url, {
            headers: responseHeaders,
          });
        }
      }
    };

    xhr.send();
  }

  /**
   * Display apps
   */
  wappalyzer.driver.displayApps = (detected) => {
    wappalyzer.log('func: diplayApps', 'driver');

    let first = true;
    let app;
    let category;
    let html;

    html = '<a id="wappalyzer-close" href="javascript: document.body.removeChild(document.getElementById(\'wappalyzer-container\')); void(0);">'
        + 'Close'
      + '</a>'
      + '<div id="wappalyzer-apps">';

    if (detected != null && Object.keys(detected).length) {
      for (app in detected) {
        if (!hasOwn.call(detected, app)) {
          continue;
        }

        let version = detected[app].version,
          confidence = detected[app].confidence;

        html
          += `<div class="wappalyzer-app${first ? ' wappalyzer-first' : ''}">`
            + `<a target="_blank" class="wappalyzer-application" href="${wappalyzer.config.websiteURL}applications/${app.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}">`
              + '<strong>'
                + `<img src="${wappalyzer.config.websiteURL}images/icons/${wappalyzer.apps[app].icon || 'default.svg'}" width="16" height="16"/> ${app
                }</strong>${
                  version ? ` ${version}` : ''}${confidence < 100 ? ` (${confidence}% sure)` : ''
                }</a>`;

        for (const i in wappalyzer.apps[app].cats) {
          if (!hasOwn.call(wappalyzer.apps[app].cats, i)) {
            continue;
          }

          category = wappalyzer.categories[wappalyzer.apps[app].cats[i]].name;

          html += `<a target="_blank" class="wappalyzer-category" href="${wappalyzer.config.websiteURL}categories/${slugify(category)}">${category}</a>`;
        }

        html += '</div>';

        first = false;
      }
    } else {
      html += '<div id="wappalyzer-empty">No applications detected</div>';
    }

    html += '</div>';

    container.innerHTML = html;
  },

  /**
   * Open a tab
   */
  function openTab(args) {
    open(args.url);
  };

  function slugify(string) {
    return string.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/(?:^-|-$)/, '');
  }

  getPageContent();
  getResponseHeaders();
}());
