'use strict'
/* eslint-env browser */
/* globals chrome */

const Content = {
  /**
   * Initialise content script
   */
  async init() {
    if (await Content.driver('isDisabledDomain', location.href)) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      // HTML
      let html = new XMLSerializer().serializeToString(document)

      // Discard the middle portion of HTML to avoid performance degradation on large pages
      const chunks = []
      const maxCols = 2000
      const maxRows = 3000
      const rows = html.length / maxCols

      for (let i = 0; i < rows; i += 1) {
        if (i < maxRows / 2 || i > rows - maxRows / 2) {
          chunks.push(html.slice(i * maxCols, (i + 1) * maxCols))
        }
      }

      html = chunks.join('\n')

      // Determine language based on the HTML lang attribute or content
      const language =
        document.documentElement.getAttribute('lang') ||
        document.documentElement.getAttribute('xml:lang') ||
        (await new Promise((resolve) =>
          chrome.i18n.detectLanguage
            ? chrome.i18n.detectLanguage(html, ({ languages }) =>
                resolve(
                  languages
                    .filter(({ percentage }) => percentage >= 75)
                    .map(({ language: lang }) => lang)[0]
                )
              )
            : resolve()
        ))

      // CSS rules
      let css = []

      try {
        for (const sheet of Array.from(document.styleSheets)) {
          for (const rules of Array.from(sheet.cssRules)) {
            css.push(rules.cssText)

            if (css.length >= 3000) {
              break
            }
          }
        }
      } catch (error) {
        // Continue
      }

      css = css.join('\n')

      // Script tags
      const scripts = Array.from(document.scripts)
        .filter(({ src }) => src)
        .map(({ src }) => src)
        .filter((script) => script.indexOf('data:text/javascript;') !== 0)

      // Meta tags
      const meta = Array.from(document.querySelectorAll('meta')).reduce(
        (metas, meta) => {
          const key = meta.getAttribute('name') || meta.getAttribute('property')

          if (key) {
            metas[key.toLowerCase()] = [meta.getAttribute('content')]
          }

          return metas
        },
        {}
      )

      Content.driver('onContentLoad', [
        location.href,
        { html, css, scripts, meta },
        language,
      ])

      const technologies = await Content.driver('getTechnologies')

      Content.onGetTechnologies(technologies)

      // Delayed second pass to capture async JS
      await new Promise((resolve) => setTimeout(resolve, 5000))

      Content.onGetTechnologies(technologies)
    } catch (error) {
      Content.driver('error', error)
    }
  },

  driver(func, args) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          source: 'content.js',
          func,
          args: args ? (Array.isArray(args) ? args : [args]) : [],
        },
        (response) => {
          chrome.runtime.lastError
            ? reject(new Error(chrome.runtime.lastError.message))
            : resolve(response)
        }
      )
    })
  },

  /**
   * Callback for getTechnologies
   * @param {Array} technologies
   */
  onGetTechnologies(technologies = []) {
    // Inject a script tag into the page to access methods of the window object
    const script = document.createElement('script')

    script.onload = () => {
      const onMessage = ({ data }) => {
        if (!data.wappalyzer || !data.wappalyzer.js) {
          return
        }

        window.removeEventListener('message', onMessage)

        chrome.runtime.sendMessage({
          source: 'content.js',
          func: 'analyzeJs',
          args: [location.href.split('#')[0], data.wappalyzer.js],
        })

        script.remove()
      }

      window.addEventListener('message', onMessage)

      window.postMessage({
        wappalyzer: {
          technologies: technologies
            .filter(({ js }) => Object.keys(js).length)
            .map(({ name, js }) => ({ name, chains: Object.keys(js) })),
        },
      })
    }

    script.setAttribute('src', chrome.extension.getURL('js/inject.js'))

    document.body.appendChild(script)

    // DOM
    const dom = technologies
      .filter(({ dom }) => dom)
      .map(({ name, dom }) => ({ name, dom }))
      .reduce((technologies, { name, dom }) => {
        const toScalar = (value) =>
          typeof value === 'string' || typeof value === 'number'
            ? value
            : !!value

        Object.keys(dom).forEach((selector) => {
          const nodes = document.querySelectorAll(selector)

          if (!nodes.length) {
            return
          }

          dom[selector].forEach(({ text, properties, attributes }) => {
            nodes.forEach((node) => {
              if (text) {
                const value = node.textContent.trim()

                if (value) {
                  technologies.push({
                    name,
                    selector,
                    text: value,
                  })
                }
              }

              if (properties) {
                Object.keys(properties).forEach((property) => {
                  if (Object.prototype.hasOwnProperty.call(node, property)) {
                    const value = node[property]

                    if (typeof value !== 'undefined') {
                      technologies.push({
                        name,
                        selector,
                        property,
                        value: toScalar(value),
                      })
                    }
                  }
                })
              }

              if (attributes) {
                Object.keys(attributes).forEach((attribute) => {
                  if (node.hasAttribute(attribute)) {
                    const value = node.getAttribute(attribute)

                    technologies.push({
                      name,
                      selector,
                      attribute,
                      value: toScalar(value),
                    })
                  }
                })
              }
            })
          })
        })

        return technologies
      }, [])

    // Detect Google Ads
    if (/^(www\.)?google(\.[a-z]{2,3}){1,2}$/.test(location.hostname)) {
      const ads = document.querySelectorAll('#tads [data-text-ad] a[data-pcu]')

      for (const ad of ads) {
        Content.driver('detectTechnology', [ad.href, 'Google Ads'])
      }
    }

    // Detect Microsoft Ads
    if (/^(www\.)?bing\.com$/.test(location.hostname)) {
      const ads = document.querySelectorAll('.b_ad .b_adurl cite')

      for (const ad of ads) {
        const url = ad.textContent.split(' ')[0].trim()

        Content.driver('detectTechnology', [
          url.startsWith('http') ? url : `http://${url}`,
          'Microsoft Advertising',
        ])
      }
    }

    Content.driver('analyzeDom', [location.href, dom])
  },
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  Content.init()
} else {
  document.addEventListener('DOMContentLoaded', Content.init)
}
