/** global: browser */

if ( typeof browser !== 'undefined' && typeof document.body !== 'undefined' ) {
  var html = document.documentElement.outerHTML;

  if ( html.length > 50000 ) {
    html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
  }

  try {
    browser.runtime.sendMessage({
      id: 'analyze',
      subject: { html },
      source: 'content.js'
    });

    var container = document.createElement('wappalyzerData');

    container.setAttribute('id',    'wappalyzerData');
    container.setAttribute('style', 'display: none');

    var script = document.createElement('script');

    script.setAttribute('id', 'wappalyzerEnvDetection');
    script.setAttribute('src', browser.extension.getURL('js/inject.js'));

    container.addEventListener('wappalyzerEvent', (event => {
      var env = event.target.childNodes[0].nodeValue;

      document.documentElement.removeChild(container);
      document.documentElement.removeChild(script);

      env = env.split(' ').slice(0, 500);

      browser.runtime.sendMessage({
        id: 'analyze',
        subject: { env },
        source: 'content.js'
      });
    }), true);

    document.documentElement.appendChild(container);
    document.documentElement.appendChild(script);
  } catch(e) {
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
