'use strict'
/* eslint-env browser */
/* globals chrome, Wappalyzer, Utils */

const {
  setTechnologies,
  setCategories,
  analyze,
  analyzeManyToMany,
  resolve,
  getTechnology,
} = Wappalyzer
const { agent, promisify, getOption, setOption, open, globEscape } = Utils

const expiry = 1000 * 60 * 60 * 24

const hostnameIgnoreList = /((local|dev(elop(ment)?)?|stag(e|ing)?|preprod|preview|test(ing)?|demo(shop)?|admin|cache)[.-]|localhost|wappalyzer|google|facebook|twitter|reddit|yahoo|wikipedia|amazon|youtube|\/admin|\.local|\.test|\.dev|^[0-9.]$)/

const Driver = {
  lastPing: Date.now(),

  /**
   * Initialise driver
   */
  async init() {
    await Driver.loadTechnologies()

    const hostnameCache = await getOption('hostnames', {})

    Driver.cache = {
      hostnames: Object.keys(hostnameCache).reduce(
        (cache, hostname) => ({
          ...cache,
          [hostname]: {
            ...hostnameCache[hostname],
            detections: hostnameCache[hostname].detections.map(
              ({
                technology: name,
                pattern: { regex, confidence },
                version,
              }) => ({
                technology: Wappalyzer.technologies.find(
                  ({ name: _name }) => name === _name
                ),
                pattern: {
                  regex: new RegExp(regex, 'i'),
                  confidence,
                },
                version,
              })
            ),
          },
        }),
        {}
      ),
      tabs: {},
      robots: await getOption('robots', {}),
      ads: [],
    }

    chrome.browserAction.setBadgeBackgroundColor({ color: '#6B39BD' }, () => {})

    chrome.webRequest.onCompleted.addListener(
      Driver.onWebRequestComplete,
      { urls: ['http://*/*', 'https://*/*'], types: ['main_frame'] },
      ['responseHeaders']
    )

    chrome.tabs.onRemoved.addListener((id) => (Driver.cache.tabs[id] = null))

    // Enable messaging between scripts
    chrome.runtime.onMessage.addListener(Driver.onMessage)

    const { version } = chrome.runtime.getManifest()
    const previous = await getOption('version')
    const upgradeMessage = await getOption('upgradeMessage', true)

    if (previous === null) {
      open(
        'https://www.wappalyzer.com/installed/?utm_source=installed&utm_medium=extension&utm_campaign=wappalyzer'
      )
    } else if (version !== previous && upgradeMessage) {
      // open(
      //   `https://www.wappalyzer.com/upgraded/?utm_source=upgraded&utm_medium=extension&utm_campaign=wappalyzer`,
      //   false
      // )
    }

    await setOption('version', version)
  },

  /**
   * Log debug messages to the console
   * @param {String} message
   * @param {String} source
   * @param {String} type
   */
  log(message, source = 'driver', type = 'log') {
    // eslint-disable-next-line no-console
    console[type](`wappalyzer | ${source} |`, message)
  },

  /**
   * Log errors to the console
   * @param {String} error
   * @param {String} source
   */
  error(error, source = 'driver') {
    Driver.log(error, source, 'error')
  },

  /**
   * Load technologies and categories into memory
   */
  async loadTechnologies() {
    try {
      const { technologies, categories } = await (
        await fetch(chrome.extension.getURL('technologies.json'))
      ).json()

      setTechnologies(technologies)
      setCategories(categories)
    } catch (error) {
      Driver.error(error)
    }
  },

  /**
   * Perform a HTTP POST request
   * @param {String} url
   * @param {String} body
   */
  post(url, body) {
    try {
      return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  },

  /**
   * Wrapper for analyze
   */
  analyze(...args) {
    return analyze(...args)
  },

  /**
   * Analyse JavaScript variables
   * @param {String} url
   * @param {Array} js
   */
  analyzeJs(url, js) {
    return Driver.onDetect(
      url,
      Array.prototype.concat.apply(
        [],
        js.map(({ name, chain, value }) =>
          analyzeManyToMany(
            Wappalyzer.technologies.find(({ name: _name }) => name === _name),
            'js',
            { [chain]: [value] }
          )
        )
      )
    )
  },

  /**
   * Analyse DOM nodes
   * @param {String} url
   * @param {Array} dom
   */
  analyzeDom(url, dom) {
    return Driver.onDetect(
      url,
      Array.prototype.concat.apply(
        [],
        dom.map(({ name, selector, text, property, attribute, value }) => {
          const technology = Wappalyzer.technologies.find(
            ({ name: _name }) => name === _name
          )

          if (text) {
            return analyzeManyToMany(technology, 'dom.text', {
              [selector]: [text],
            })
          }

          if (property) {
            return analyzeManyToMany(technology, `dom.properties.${property}`, {
              [selector]: [value],
            })
          }

          if (attribute) {
            return analyzeManyToMany(
              technology,
              `dom.attributes.${attribute}`,
              {
                [selector]: [value],
              }
            )
          }

          return []
        })
      )
    )
  },

  /**
   * Force a technology detection by URL and technology name
   * @param {String} url
   * @param {String} name
   */
  detectTechnology(url, name) {
    const technology = getTechnology(name)

    return Driver.onDetect(url, [
      { technology, pattern: { regex: '', confidence: 100 }, version: '' },
    ])
  },

  /**
   * Enable scripts to call Driver functions through messaging
   * @param {Object} message
   * @param {Object} sender
   * @param {Function} callback
   */
  onMessage({ source, func, args }, sender, callback) {
    if (!func) {
      return
    }

    Driver.log({ source, func, args })

    if (!Driver[func]) {
      Driver.error(new Error(`Method does not exist: Driver.${func}`))

      return
    }

    Promise.resolve(Driver[func].call(Driver[func], ...(args || [])))
      .then(callback)
      .catch(Driver.error)

    return !!callback
  },

  /**
   * Analyse response headers
   * @param {Object} request
   */
  async onWebRequestComplete(request) {
    if (await Driver.isDisabledDomain(request.url)) {
      return
    }

    if (request.responseHeaders) {
      const headers = {}

      try {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const [tab] = await promisify(chrome.tabs, 'query', {
          url: [globEscape(request.url)],
        })

        if (tab) {
          request.responseHeaders.forEach((header) => {
            const name = header.name.toLowerCase()

            headers[name] = headers[name] || []

            headers[name].push(
              (header.value || header.binaryValue || '').toString()
            )
          })

          await Driver.onDetect(request.url, analyze({ headers }))
        }
      } catch (error) {
        Driver.error(error)
      }
    }
  },

  /**
   * Process return values from content.js
   * @param {String} url
   * @param {Object} items
   * @param {String} language
   */
  async onContentLoad(url, items, language) {
    try {
      const { hostname } = new URL(url)

      items.cookies = (
        await promisify(chrome.cookies, 'getAll', {
          domain: `.${hostname}`,
        })
      ).reduce(
        (cookies, { name, value }) => ({
          ...cookies,
          [name.toLowerCase()]: [value],
        }),
        {}
      )

      await Driver.onDetect(url, analyze({ url, ...items }), language, true)
    } catch (error) {
      Driver.error(error)
    }
  },

  /**
   * Get all technologies
   */
  getTechnologies() {
    return Wappalyzer.technologies
  },

  /**
   * Check if Wappalyzer has been disabled for the domain
   */
  async isDisabledDomain(url) {
    try {
      const { hostname } = new URL(url)

      return (await getOption('disabledDomains', [])).includes(hostname)
    } catch (error) {
      return false
    }
  },

  /**
   * Callback for detections
   * @param {String} url
   * @param {Array} detections
   * @param {String} language
   * @param {Boolean} incrementHits
   */
  async onDetect(url, detections = [], language, incrementHits = false) {
    if (!url || !detections.length) {
      return
    }

    const { protocol, hostname } = new URL(url)

    // Cache detections
    const cache = (Driver.cache.hostnames[hostname] = {
      ...(Driver.cache.hostnames[hostname] || {
        url: `${protocol}//${hostname}`,
        detections: [],
        hits: incrementHits ? 0 : 1,
      }),
      dateTime: Date.now(),
    })

    // Remove duplicates
    cache.detections = cache.detections
      .concat(detections)
      .filter(({ technology }) => technology)

    cache.detections.filter(
      ({ technology: { name }, pattern: { regex } }, index) =>
        cache.detections.findIndex(
          ({ technology: { name: _name }, pattern: { regex: _regex } }) =>
            name === _name && (!regex || regex.toString() === _regex.toString())
        ) === index
    )

    cache.hits += incrementHits ? 1 : 0
    cache.language = cache.language || language

    // Expire cache
    Driver.cache.hostnames = Object.keys(Driver.cache.hostnames).reduce(
      (hostnames, hostname) => {
        const cache = Driver.cache.hostnames[hostname]

        if (cache.dateTime > Date.now() - expiry) {
          hostnames[hostname] = cache
        }

        return hostnames
      },
      {}
    )

    await setOption(
      'hostnames',
      Object.keys(Driver.cache.hostnames).reduce(
        (cache, hostname) => ({
          ...cache,
          [hostname]: {
            ...Driver.cache.hostnames[hostname],
            detections: Driver.cache.hostnames[hostname].detections
              .filter(({ technology }) => technology)
              .map(
                ({
                  technology: { name: technology },
                  pattern: { regex, confidence },
                  version,
                }) => ({
                  technology,
                  pattern: {
                    regex: regex.source,
                    confidence,
                  },
                  version,
                })
              ),
          },
        }),
        {}
      )
    )

    const resolved = resolve(Driver.cache.hostnames[hostname].detections)

    await Driver.setIcon(url, resolved)

    if (url) {
      let tabs = []

      try {
        tabs = await promisify(chrome.tabs, 'query', {
          url: globEscape(url),
        })
      } catch (error) {
        // Continue
      }

      tabs.forEach(({ id }) => (Driver.cache.tabs[id] = resolved))
    }

    Driver.log({ hostname, technologies: resolved })

    await Driver.ping()
  },

  /**
   * Callback for onAd listener
   * @param {Object} ad
   */
  onAd(ad) {
    Driver.cache.ads.push(ad)
  },

  /**
   * Update the extension icon
   * @param {String} url
   * @param {Object} technologies
   */
  async setIcon(url, technologies = []) {
    const dynamicIcon = await getOption('dynamicIcon', false)
    const badge = await getOption('badge', true)

    let icon = 'default.svg'

    if (dynamicIcon) {
      const pinnedCategory = parseInt(await getOption('pinnedCategory'), 10)

      const pinned = technologies.find(({ categories }) =>
        categories.some(({ id }) => id === pinnedCategory)
      )

      ;({ icon } = pinned || technologies[0] || { icon })
    }

    if (!url) {
      return
    }

    let tabs = []

    try {
      tabs = await promisify(chrome.tabs, 'query', {
        url: globEscape(url),
      })
    } catch (error) {
      // Continue
    }

    tabs.forEach(({ id: tabId }) => {
      chrome.browserAction.setBadgeText(
        {
          tabId,
          text:
            badge && technologies.length ? technologies.length.toString() : '',
        },
        () => {}
      )

      chrome.browserAction.setIcon(
        {
          tabId,
          path: chrome.extension.getURL(
            `../images/icons/${
              /\.svg$/i.test(icon)
                ? `converted/${icon.replace(/\.svg$/, '.png')}`
                : icon
            }`
          ),
        },
        () => {}
      )
    })
  },

  /**
   * Get the detected technologies for the current tab
   */
  async getDetections() {
    const [{ id, url }] = await promisify(chrome.tabs, 'query', {
      active: true,
      currentWindow: true,
    })

    if (await Driver.isDisabledDomain(url)) {
      await Driver.setIcon(url, [])

      return
    }

    const resolved = Driver.cache.tabs[id]

    await Driver.setIcon(url, resolved)

    return resolved
  },

  /**
   * Fetch the website's robots.txt rules
   * @param {String} hostname
   * @param {Boolean} secure
   */
  async getRobots(hostname, secure = false) {
    if (
      !(await getOption('tracking', true)) ||
      hostnameIgnoreList.test(hostname)
    ) {
      return []
    }

    if (typeof Driver.cache.robots[hostname] !== 'undefined') {
      return Driver.cache.robots[hostname]
    }

    try {
      Driver.cache.robots[hostname] = await Promise.race([
        // eslint-disable-next-line no-async-promise-executor
        new Promise(async (resolve) => {
          const response = await fetch(
            `http${secure ? 's' : ''}://${hostname}/robots.txt`,
            {
              redirect: 'follow',
              mode: 'no-cors',
            }
          )

          if (!response.ok) {
            Driver.error(new Error(response.statusText))

            resolve('')
          }

          let agent

          resolve(
            (await response.text()).split('\n').reduce((disallows, line) => {
              let matches = /^User-agent:\s*(.+)$/i.exec(line.trim())

              if (matches) {
                agent = matches[1].toLowerCase()
              } else if (agent === '*' || agent === 'wappalyzer') {
                matches = /^Disallow:\s*(.+)$/i.exec(line.trim())

                if (matches) {
                  disallows.push(matches[1])
                }
              }

              return disallows
            }, [])
          )
        }),
        new Promise((resolve) => setTimeout(() => resolve(''), 5000)),
      ])

      Driver.cache.robots = Object.keys(Driver.cache.robots)
        .slice(-50)
        .reduce(
          (cache, hostname) => ({
            ...cache,
            [hostname]: Driver.cache.robots[hostname],
          }),
          {}
        )

      await setOption('robots', Driver.cache.robots)

      return Driver.cache.robots[hostname]
    } catch (error) {
      Driver.error(error)
    }
  },

  /**
   * Check if the website allows indexing of a URL
   * @param {String} href
   */
  async checkRobots(href) {
    const url = new URL(href)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid protocol')
    }

    const robots = await Driver.getRobots(
      url.hostname,
      url.protocol === 'https:'
    )

    if (robots.some((disallowed) => url.pathname.indexOf(disallowed) === 0)) {
      throw new Error('Disallowed')
    }
  },

  /**
   * Clear caches
   */
  async clearCache() {
    Driver.cache.hostnames = {}
    Driver.cache.tabs = {}

    await setOption('hostnames', {})
  },

  /**
   * Anonymously send identified technologies to wappalyzer.com
   * This function can be disabled in the extension settings
   */
  async ping() {
    const tracking = await getOption('tracking', true)
    const termsAccepted =
      agent === 'chrome' || (await getOption('termsAccepted', false))

    if (tracking && termsAccepted) {
      const hostnames = Object.keys(Driver.cache.hostnames).reduce(
        (hostnames, hostname) => {
          // eslint-disable-next-line standard/computed-property-even-spacing
          const { url, language, detections, hits } = Driver.cache.hostnames[
            hostname
          ]

          if (!hostnameIgnoreList.test(hostname) && hits >= 3) {
            hostnames[url] = hostnames[url] || {
              applications: resolve(detections).reduce(
                (technologies, { name, confidence, version }) => {
                  if (confidence === 100) {
                    technologies[name] = {
                      version,
                      hits,
                    }
                  }

                  return technologies
                },
                {}
              ),
              meta: {
                language,
              },
            }
          }

          return hostnames
        },
        {}
      )

      const count = Object.keys(hostnames).length

      if (count && (count >= 25 || Driver.lastPing < Date.now() - expiry)) {
        await Driver.post('https://api.wappalyzer.com/ping/v2/', hostnames)

        await setOption('hostnames', (Driver.cache.hostnames = {}))

        Driver.lastPing = Date.now()
      }

      if (Driver.cache.ads.length > 25) {
        await Driver.post('https://ad.wappalyzer.com/log/wp/', Driver.cache.ads)

        Driver.cache.ads = []
      }
    }
  },
}

Driver.init()
