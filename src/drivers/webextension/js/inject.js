(() => {
	try {
    addEventListener('message', onMessage);

    function onMessage(event) {
      if ( event.data.id !== 'patterns' ) {
        return;
      }

      removeEventListener('message', onMessage);

      const patterns = event.data.patterns || {};

      const js = {};

      for ( let appName in patterns ) {
        if ( patterns.hasOwnProperty(appName) ) {
          js[appName] = {};

          for ( let chain in patterns[appName] ) {
            if ( patterns[appName].hasOwnProperty(chain) ) {
              js[appName][chain] = {};

              for ( let index in patterns[appName][chain] ) {
                const value = detectJs(chain);

                if ( value && patterns[appName][chain].hasOwnProperty(index) ) {
                  js[appName][chain][index] = value;
                }
              }
            }
          }
        }
      }

      postMessage({ id: 'js', js }, '*');
    }

    function detectJs(chain) {
      const properties = chain.split('.');

      var value = properties.length ? window : null;

      for ( let i = 0; i < properties.length; i ++ ) {
        var property = properties[i];

        if ( value && value.hasOwnProperty(property) ) {
          value = value[property];
        } else {
          value = null;

          break;
        }
      }

      return typeof value === 'string' || typeof value === 'number' ? value : !!value;
    }
  } catch(e) {
    // Fail quietly
  }
})();
