/** global: browser */
/** global: XMLSerializer */

if ( typeof browser !== 'undefined' && typeof document.body !== 'undefined' ) {
  try {
    var html = new XMLSerializer().serializeToString(document).split('\n');

    html = html
      .slice(0, 1000).concat(html.slice(html.length - 1000))
      .map(line => line.substring(0, 1000))
      .join('\n');

    const scripts = Array.prototype.slice
      .apply(document.scripts)
      .filter(script => script.src)
      .map(script => script.src)
      .filter(script => script.indexOf("data:text/javascript;") != 0);;

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
