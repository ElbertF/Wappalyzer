/* eslint-env browser */

;(function () {
  try {
    const onMessage = ({ data }) => {
      if (!data.wappalyzer || !data.wappalyzer.technologies) {
        return
      }

      const { technologies } = data.wappalyzer

      removeEventListener('message', onMessage)

      postMessage({
        wappalyzer: {
          js: technologies.reduce((technologies, { name, chains }) => {
            chains.forEach((chain) => {
              const value = chain
                .split('.')
                .reduce(
                  (value, method) =>
                    value &&
                    value instanceof Object &&
                    Object.prototype.hasOwnProperty.call(value, method)
                      ? value[method]
                      : undefined,
                  window
                )

              if (value !== undefined) {
                technologies.push({
                  name,
                  chain,
                  value:
                    typeof value === 'string' || typeof value === 'number'
                      ? value
                      : !!value,
                })
              }
            })

            return technologies
          }, []),
        },
      })
    }

    addEventListener('message', onMessage)
  } catch (e) {
    // Fail quietly
  }
})()
