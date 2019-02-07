/** global: browser */
/** global: XMLSerializer */

/* global browser, chrome */
/* eslint-env browser */

function sendMessage(id, subject, callback) {
  (chrome || browser).runtime.sendMessage({
    id,
    subject,
    source: 'content.js',
  }, callback || (() => {}));
}

if (typeof browser !== 'undefined' && typeof document.body !== 'undefined') {
  try {
    sendMessage('init', {});

    // HTML
    let html = new XMLSerializer().serializeToString(document);

    const chunks = [];
    const maxCols = 2000;
    const maxRows = 3000;
    const rows = html.length / maxCols;

    let i;

    for (i = 0; i < rows; i += 1) {
      if (i < maxRows / 2 || i > rows - maxRows / 2) {
        chunks.push(html.slice(i * maxCols, (i + 1) * maxCols));
      }
    }

    html = chunks.join('\n');

    // Scripts
    const scripts = Array.prototype.slice
      .apply(document.scripts)
      .filter(script => script.src)
      .map(script => script.src)
      .filter(script => script.indexOf('data:text/javascript;') !== 0);

    sendMessage('analyze', { html, scripts });

    // JavaScript variables
    const script = document.createElement('script');

    script.onload = () => {
      const onMessage = (event) => {
        if (event.data.id !== 'js') {
          return;
        }

        window.removeEventListener('message', onMessage);

        sendMessage('analyze', { js: event.data.js });

        script.remove();
      };

      window.addEventListener('message', onMessage);

      sendMessage('get_js_patterns', {}, (response) => {
        if (response) {
          postMessage({
            id: 'patterns',
            patterns: response.patterns,
          }, window.location.href);
        }
      });
    };

    script.setAttribute('src', browser.extension.getURL('js/inject.js'));

    document.body.appendChild(script);
  } catch (e) {
    sendMessage('log', e);
  }
}

// https://stackoverflow.com/a/44774834
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/executeScript#Return_value
undefined; // eslint-disable-line no-unused-expressions
