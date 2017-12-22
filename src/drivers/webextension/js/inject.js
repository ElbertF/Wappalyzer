(function() {
	try {
    addEventListener('message', (event => {
      if ( event.data.id !== 'patterns' ) {
        return;
      }

      const patterns = event.data.patterns || {};

      const js = {};

      Object.keys(patterns).forEach(appName => {
        js[appName] = {};

        Object.keys(patterns[appName]).forEach(chain => {
          js[appName][chain] = {};

          patterns[appName][chain].forEach((pattern, index) => {
            const value = detectJs(chain);

            if ( value ) {
              js[appName][chain][index] = value;
            }
          });
        });
      });

      postMessage({ id: 'js', js }, '*');
    }), false);
  } catch(e) {
    // Fail quietly
  }
}());

function detectJs(chain) {
  const properties = chain.split('.');

  const value = properties.reduce((parent, property) => {
    return parent && parent.hasOwnProperty(property) ? parent[property] : null;
  }, window);

  return typeof value === 'string' ? value : !!value;
}
