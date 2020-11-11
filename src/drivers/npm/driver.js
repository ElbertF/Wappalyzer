const { URL } = require('url')
const fs = require('fs')
const dns = require('dns').promises
const path = require('path')
const http = require('http')
const https = require('https')
const Wappalyzer = require('./wappalyzer')

const {
  setTechnologies,
  setCategories,
  analyze,
  analyzeManyToMany,
  resolve,
} = Wappalyzer

const {
  AWS_LAMBDA_FUNCTION_NAME,
  CHROMIUM_BIN,
  CHROMIUM_DATA_DIR,
} = process.env

let puppeteer
let chromiumArgs = [
  '--no-sandbox',
  '--disable-gpu',
  '--ignore-certificate-errors',
  '--allow-running-insecure-content',
  '--disable-web-security',
  `--user-data-dir=${CHROMIUM_DATA_DIR || '/tmp/chromium'}`,
]
let chromiumBin = CHROMIUM_BIN

if (AWS_LAMBDA_FUNCTION_NAME) {
  const chromium = require('chrome-aws-lambda')

  ;({ puppeteer } = chromium)

  chromiumArgs = chromiumArgs.concat(chromium.args)
  chromiumBin = chromium.executablePath
} else {
  puppeteer = require('puppeteer')
}

const extensions = /^([^.]+$|\.(asp|aspx|cgi|htm|html|jsp|php)$)/

const { technologies, categories } = JSON.parse(
  fs.readFileSync(path.resolve(`${__dirname}/technologies.json`))
)

setTechnologies(technologies)
setCategories(categories)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function analyzeJs(js) {
  return Array.prototype.concat.apply(
    [],
    js.map(({ name, chain, value }) =>
      analyzeManyToMany(
        Wappalyzer.technologies.find(({ name: _name }) => name === _name),
        'js',
        { [chain]: [value] }
      )
    )
  )
}

function analyzeDom(dom) {
  return Array.prototype.concat.apply(
    [],
    dom.map(({ name, selector, text, property, attribute, value }) => {
      const technology = Wappalyzer.technologies.find(
        ({ name: _name }) => name === _name
      )

      if (text) {
        return analyzeManyToMany(technology, 'dom.text', { [selector]: [text] })
      }

      if (property) {
        return analyzeManyToMany(technology, `dom.properties.${property}`, {
          [selector]: [value],
        })
      }

      if (attribute) {
        return analyzeManyToMany(technology, `dom.attributes.${attribute}`, {
          [selector]: [value],
        })
      }

      return []
    })
  )
}

function get(url) {
  if (['http:', 'https:'].includes(url.protocol)) {
    const { get } = url.protocol === 'http:' ? http : https

    return new Promise((resolve, reject) =>
      get(url, { rejectUnauthorized: false }, (response) => {
        if (response.statusCode >= 400) {
          return reject(
            new Error(`${response.statusCode} ${response.statusMessage}`)
          )
        }

        response.setEncoding('utf8')

        let body = ''

        response.on('data', (data) => (body += data))
        response.on('error', (error) => reject(new Error(error.message)))
        response.on('end', () => resolve(body))
      }).on('error', (error) => reject(new Error(error.message)))
    )
  } else {
    throw new Error(`Invalid protocol: ${url.protocol}`)
  }
}

class Driver {
  constructor(options = {}) {
    this.options = {
      batchSize: 5,
      debug: false,
      delay: 500,
      htmlMaxCols: 2000,
      htmlMaxRows: 3000,
      maxDepth: 3,
      maxUrls: 10,
      maxWait: 30000,
      recursive: false,
      probe: false,
      ...options,
    }

    this.options.debug = Boolean(+this.options.debug)
    this.options.recursive = Boolean(+this.options.recursive)
    this.options.probe = Boolean(+this.options.probe)
    this.options.delay = parseInt(this.options.delay, 10)
    this.options.maxDepth = parseInt(this.options.maxDepth, 10)
    this.options.maxUrls = parseInt(this.options.maxUrls, 10)
    this.options.maxWait = parseInt(this.options.maxWait, 10)
    this.options.htmlMaxCols = parseInt(this.options.htmlMaxCols, 10)
    this.options.htmlMaxRows = parseInt(this.options.htmlMaxRows, 10)

    this.destroyed = false
  }

  async init() {
    this.log('Launching browser...')

    try {
      this.browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        acceptInsecureCerts: true,
        args: chromiumArgs,
        executablePath: await chromiumBin,
      })

      this.browser.on('disconnected', async () => {
        this.log('Browser disconnected')

        if (!this.destroyed) {
          try {
            await this.init()
          } catch (error) {
            this.log(error.toString())
          }
        }
      })
    } catch (error) {
      throw new Error(error.toString())
    }
  }

  async destroy() {
    this.destroyed = true

    if (this.browser) {
      try {
        await sleep(1)

        await this.browser.close()

        this.log('Browser closed')
      } catch (error) {
        throw new Error(error.toString())
      }
    }
  }

  open(url, headers = {}) {
    return new Site(url.split('#')[0], headers, this)
  }

  log(message, source = 'driver') {
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.log(`wappalyzer | log | ${source} |`, message)
    }
  }
}

class Site {
  constructor(url, headers = {}, driver) {
    ;({
      options: this.options,
      browser: this.browser,
      init: this.initDriver,
    } = driver)

    this.options.headers = {
      ...this.options.headers,
      ...headers,
    }

    this.driver = driver

    try {
      this.originalUrl = new URL(url)
    } catch (error) {
      throw new Error(error.toString())
    }

    this.analyzedUrls = {}
    this.detections = []

    this.listeners = {}

    this.pages = []

    this.dns = []
  }

  log(message, source = 'driver', type = 'log') {
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console[type](`wappalyzer | ${type} | ${source} |`, message)
    }

    this.emit(type, { message, source })
  }

  error(error, source = 'driver') {
    this.log(error, source, 'error')
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    this.listeners[event].push(callback)
  }

  emit(event, params) {
    if (this.listeners[event]) {
      return Promise.all(
        this.listeners[event].map((listener) => listener(params))
      )
    }
  }

  promiseTimeout(
    promise,
    errorMessage = 'The website took too long to respond'
  ) {
    let timeout = null

    return Promise.race([
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          clearTimeout(timeout)

          reject(new Error(errorMessage))
        }, this.options.maxWait)
      }),
      promise.then((value) => {
        clearTimeout(timeout)

        return value
      }),
    ])
  }

  async goto(url) {
    // Return when the URL is a duplicate or maxUrls has been reached
    if (
      this.analyzedUrls[url.href] ||
      Object.keys(this.analyzedUrls).length >= this.options.maxUrls
    ) {
      return
    }

    this.log(`Navigate to ${url}`, 'page')

    this.analyzedUrls[url.href] = {
      status: 0,
    }

    if (!this.browser) {
      await this.initDriver()

      if (!this.browser) {
        throw new Error('Browser closed')
      }
    }

    const page = await this.browser.newPage()

    this.pages.push(page)

    page.setDefaultTimeout(this.options.maxWait)

    await page.setRequestInterception(true)

    page.on('dialog', (dialog) => dialog.dismiss())

    page.on('error', (error) => this.error(error))

    let responseReceived = false

    page.on('request', async (request) => {
      try {
        if (
          (responseReceived && request.isNavigationRequest()) ||
          request.frame() !== page.mainFrame() ||
          !['document', 'script'].includes(request.resourceType())
        ) {
          request.abort('blockedbyclient')
        } else {
          const headers = {
            ...request.headers(),
            ...this.options.headers,
          }

          await this.emit('request', { page, request })

          request.continue({ headers })
        }
      } catch (error) {
        this.error(error)
      }
    })

    page.on('response', async (response) => {
      try {
        if (response.url() === url.href) {
          this.analyzedUrls[url.href] = {
            status: response.status(),
          }

          const rawHeaders = response.headers()
          const headers = {}

          Object.keys(rawHeaders).forEach((key) => {
            headers[key] = [
              ...(headers[key] || []),
              ...(Array.isArray(rawHeaders[key])
                ? rawHeaders[key]
                : [rawHeaders[key]]),
            ]
          })

          this.contentType = headers['content-type'] || null

          if (response.status() >= 300 && response.status() < 400) {
            if (headers.location) {
              url = new URL(headers.location.slice(-1), url)
            }
          } else {
            responseReceived = true

            const certIssuer = response.securityDetails()
              ? response.securityDetails().issuer()
              : ''

            this.onDetect(analyze({ headers, certIssuer }))

            await this.emit('response', { page, response, headers, certIssuer })
          }
        }
      } catch (error) {
        this.error(error)
      }
    })

    await page.setUserAgent(
      this.options.userAgent ||
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36'
    )

    try {
      await this.promiseTimeout(
        page.goto(url.href, { waitUntil: 'domcontentloaded' })
      )

      await sleep(1000)

      // page.on('console', (message) => this.log(message.text()))

      // Links
      const links = await this.promiseTimeout(
        (
          await this.promiseTimeout(
            page.evaluateHandle(() =>
              Array.from(document.getElementsByTagName('a')).map(
                ({ hash, hostname, href, pathname, protocol, rel }) => ({
                  hash,
                  hostname,
                  href,
                  pathname,
                  protocol,
                  rel,
                })
              )
            )
          )
        ).jsonValue()
      )

      // CSS
      const css = await this.promiseTimeout(
        (
          await this.promiseTimeout(
            page.evaluateHandle((maxRows) => {
              const css = []

              try {
                if (!document.styleSheets.length) {
                  return ''
                }

                for (const sheet of Array.from(document.styleSheets)) {
                  for (const rules of Array.from(sheet.cssRules)) {
                    css.push(rules.cssText)

                    if (css.length >= maxRows) {
                      break
                    }
                  }
                }
              } catch (error) {
                return ''
              }

              return css.join('\n')
            }, this.options.htmlMaxRows)
          )
        ).jsonValue()
      )

      // Script tags
      const scripts = await this.promiseTimeout(
        (
          await this.promiseTimeout(
            page.evaluateHandle(() =>
              Array.from(document.getElementsByTagName('script'))
                .map(({ src }) => src)
                .filter((src) => src)
            )
          )
        ).jsonValue()
      )

      // Meta tags
      const meta = await this.promiseTimeout(
        (
          await this.promiseTimeout(
            page.evaluateHandle(() =>
              Array.from(document.querySelectorAll('meta')).reduce(
                (metas, meta) => {
                  const key =
                    meta.getAttribute('name') || meta.getAttribute('property')

                  if (key) {
                    metas[key.toLowerCase()] = [meta.getAttribute('content')]
                  }

                  return metas
                },
                {}
              )
            )
          )
        ).jsonValue()
      )

      // JavaScript
      const js = await this.promiseTimeout(
        page.evaluate(
          (technologies) => {
            return technologies.reduce((technologies, { name, chains }) => {
              chains.forEach((chain) => {
                chain = chain.replace(/\[([^\]]+)\]/g, '.$1')

                const value = chain
                  .split('.')
                  .reduce(
                    (value, method) => (value ? value[method] : undefined),
                    window
                  )

                if (typeof value !== 'undefined') {
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
            }, [])
          },
          Wappalyzer.technologies
            .filter(({ js }) => Object.keys(js).length)
            .map(({ name, js }) => ({ name, chains: Object.keys(js) }))
        )
      )

      // DOM
      const dom = await this.promiseTimeout(
        page.evaluate(
          (technologies) => {
            return technologies.reduce((technologies, { name, dom }) => {
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
                        if (
                          Object.prototype.hasOwnProperty.call(node, property)
                        ) {
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
          },
          Wappalyzer.technologies
            .filter(({ dom }) => dom)
            .map(({ name, dom }) => ({ name, dom }))
        )
      )

      // Cookies
      const cookies = (await page.cookies()).reduce(
        (cookies, { name, value }) => ({
          ...cookies,
          [name.toLowerCase()]: [value],
        }),
        {}
      )

      // HTML
      let html = await page.content()

      if (this.options.htmlMaxCols && this.options.htmlMaxRows) {
        const batches = []
        const rows = html.length / this.options.htmlMaxCols

        for (let i = 0; i < rows; i += 1) {
          if (
            i < this.options.htmlMaxRows / 2 ||
            i > rows - this.options.htmlMaxRows / 2
          ) {
            batches.push(
              html.slice(
                i * this.options.htmlMaxCols,
                (i + 1) * this.options.htmlMaxCols
              )
            )
          }
        }

        html = batches.join('\n')
      }

      // DNS
      if (!Object.keys(this.dns).length) {
        const records = {}
        const resolve = (func, hostname) => {
          return this.promiseTimeout(
            func(hostname).catch((error) => {
              if (error.code !== 'ENODATA') {
                this.error(error)
              }

              return []
            })
          )
        }

        const domain = url.hostname.replace(/^www\./, '')

        ;[
          records.cname,
          records.ns,
          records.mx,
          records.txt,
          records.soa,
        ] = await Promise.all([
          resolve(dns.resolveCname, url.hostname),
          resolve(dns.resolveNs, domain),
          resolve(dns.resolveMx, domain),
          resolve(dns.resolveTxt, domain),
          resolve(dns.resolveSoa, domain),
        ])

        this.dns = Object.keys(records).reduce((dns, type) => {
          dns[type] = dns[type] || []

          Array.prototype.push.apply(
            dns[type],
            Array.isArray(records[type])
              ? records[type].map((value) => {
                  return typeof value === 'object'
                    ? Object.values(value).join(' ')
                    : value
                })
              : [Object.values(records[type]).join(' ')]
          )

          return dns
        }, {})

        this.onDetect(analyze({ dns: this.dns }))
      }

      // Validate response
      if (url.protocol !== 'file:' && !this.analyzedUrls[url.href].status) {
        await page.close()

        this.log('Page closed')

        throw new Error('No response from server')
      }

      this.onDetect(analyzeDom(dom))
      this.onDetect(analyzeJs(js))
      this.onDetect(
        analyze({
          url,
          cookies,
          html,
          css,
          scripts,
          meta,
        })
      )

      const reducedLinks = Array.prototype.reduce.call(
        links,
        (results, link) => {
          if (
            results &&
            Object.prototype.hasOwnProperty.call(
              Object.getPrototypeOf(results),
              'push'
            ) &&
            link.protocol &&
            link.protocol.match(/https?:/) &&
            link.hostname === url.hostname &&
            extensions.test(link.pathname.slice(-5))
          ) {
            results.push(new URL(link.href.split('#')[0]))
          }

          return results
        },
        []
      )

      await this.emit('goto', {
        page,
        url,
        html,
        cookies,
        scripts,
        meta,
        js,
        links: reducedLinks,
        dns: this.dns,
      })

      await page.close()

      this.log('Page closed')

      return reducedLinks
    } catch (error) {
      if (error.constructor.name === 'TimeoutError') {
        throw new Error('The website took too long to respond')
      }

      throw new Error(error.message)
    }
  }

  async analyze(url = this.originalUrl, index = 1, depth = 1) {
    try {
      if (this.options.recursive) {
        await sleep(this.options.delay * index)
      }

      if (this.options.probe) {
        await this.probe(url)
      }

      const links = await this.goto(url)

      if (links && this.options.recursive && depth < this.options.maxDepth) {
        await this.batch(links.slice(0, this.options.maxUrls), depth + 1)
      }
    } catch (error) {
      this.analyzedUrls[url.href] = {
        status: 0,
        error: error.message || error.toString(),
      }

      this.error(error)
    }

    const results = {
      urls: this.analyzedUrls,
      technologies: resolve(this.detections).map(
        ({
          slug,
          name,
          confidence,
          version,
          icon,
          website,
          cpe,
          categories,
        }) => ({
          slug,
          name,
          confidence,
          version: version || null,
          icon,
          website,
          cpe,
          categories: categories.map(({ id, slug, name }) => ({
            id,
            slug,
            name,
          })),
        })
      ),
    }

    await this.emit('analyze', results)

    return results
  }

  async probe(url) {
    const files = {
      robots: '/robots.txt',
    }

    for (const file of Object.keys(files)) {
      const path = files[file]

      try {
        await sleep(this.options.delay)

        const body = await get(new URL(path, url.href))

        this.log(`get ${path}: ok`)

        this.onDetect(analyze({ [file]: body }))
      } catch (error) {
        this.error(`get ${path}: ${error.message || error}`)
      }
    }
  }

  async batch(links, depth, batch = 0) {
    if (links.length === 0) {
      return
    }

    const batched = links.splice(0, this.options.batchSize)

    await Promise.all(
      batched.map((link, index) => this.analyze(link, index, depth))
    )

    await this.batch(links, depth, batch + 1)
  }

  onDetect(detections = []) {
    this.detections = this.detections.concat(detections)

    this.detections.filter(
      ({ technology: { name }, pattern: { regex } }, index) =>
        this.detections.findIndex(
          ({ technology: { name: _name }, pattern: { regex: _regex } }) =>
            name === _name && (!regex || regex.toString() === _regex.toString())
        ) === index
    )
  }

  async destroy() {
    await Promise.all(
      this.pages.map(async (page) => {
        if (page) {
          try {
            await page.close()

            this.log('Page closed')
          } catch (error) {
            // Continue
          }
        }
      })
    )

    this.log('Site closed')
  }
}

module.exports = Driver
