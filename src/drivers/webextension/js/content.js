/** global: browser */

if ( typeof browser !== 'undefined' && typeof document.body !== 'undefined' ) {
  try {
    var html = new XMLSerializer().serializeToString(document);

    if ( html.length > 50000 ) {
      html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
    }

    const scripts = Array.prototype.slice
      .apply(document.scripts)
      .filter(script => script.src)
      .map(script => script.src);

    browser.runtime.sendMessage({
      id: 'analyze',
      subject: { html, scripts },
      source: 'content.js'
    });

    const script = document.createElement('script');

    script.onload = () => {
      addEventListener('message', event => {
        if ( event.data.id !== 'js' ) {
          return;
        }

        browser.runtime.sendMessage({
          id: 'analyze',
          subject: {
            js: event.data.js
          },
          source: 'content.js'
        });
      }, true);

      ( chrome || browser ).runtime.sendMessage({
        id: 'init_js',
        subject: {},
        source: 'content.js'
      }, response => {
        if ( response ) {
          postMessage({
            id: 'patterns',
            patterns: response.patterns
          }, '*');
        }
      });
    };

    script.setAttribute('id', 'wappalyzer');
    script.setAttribute('src', browser.extension.getURL('js/inject.js'));

    document.body.appendChild(script);
  } catch (e) {
    log(e);
  }
}

function log(message) {
  browser.runtime.sendMessage({
    id: 'log',
    message,
    source: 'content.js'
  });
}
