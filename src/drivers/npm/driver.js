const { URL } = require('url')
const fs = require('fs')
const path = require('path')
const LanguageDetect = require('languagedetect')
const Wappalyzer = require('./wappalyzer')

const {
  setTechnologies,
  setCategories,
  analyze,
  analyzeManyToMany,
  resolve
} = Wappalyzer

const { AWS_LAMBDA_FUNCTION_NAME, CHROMIUM_BIN } = process.env

let puppeteer
let chromiumArgs = [
  '--no-sandbox',
  '--headless',
  '--disable-gpu',
  '--ignore-certificate-errors'
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

const languageDetect = new LanguageDetect()

languageDetect.setLanguageType('iso2')

const extensions = /^([^.]+$|\.(asp|aspx|cgi|htm|html|jsp|php)$)/

const errorTypes = {
  RESPONSE_NOT_OK: 'Response was not ok',
  NO_RESPONSE: 'No response from server',
  NO_HTML_DOCUMENT: 'No HTML document'
}

const { apps: technologies, categories } = JSON.parse(
  fs.readFileSync(path.resolve(`${__dirname}/apps.json`))
)

setTechnologies(technologies)
setCategories(categories)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getJs() {
  const dereference = (obj, level = 0) => {
    try {
      // eslint-disable-next-line no-undef
      if (level > 5 || (level && obj === window)) {
        return '[Removed]'
      }

      if (Array.isArray(obj)) {
        obj = obj.map((item) => dereference(item, level + 1))
      }

      if (
        typeof obj === 'function' ||
        (typeof obj === 'object' && obj !== null)
      ) {
        const newObj = {}

        Object.keys(obj)
          .filter((key) => obj.hasOwnProperty(key))
          .forEach((key) => {
            newObj[key] = dereference(obj[key], level + 1)
          })

        return newObj
      }

      return obj
    } catch (error) {
      return undefined
    }
  }

  // eslint-disable-next-line no-undef
  return dereference(window)
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
      maxWait: 5000,
      recursive: false,
      ...options
    }

    this.options.debug = Boolean(+this.options.debug)
    this.options.recursive = Boolean(+this.options.recursive)
    this.options.delay = this.options.recursive
      ? parseInt(this.options.delay, 10)
      : 0
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
        args: chromiumArgs,
        executablePath: await chromiumBin
      })

      this.browser.on('disconnected', async () => {
        this.log('Browser disconnected')

        if (!this.destroyed) {
          await this.init()
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

  open(url) {
    return new Site(url, this)
  }

  log(message, source = 'driver') {
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.log(`wappalyzer | log | ${source} |`, message)
    }
  }
}

class Site {
  constructor(url, driver) {
    ;({ options: this.options, browser: this.browser } = driver)

    this.driver = driver

    try {
      this.originalUrl = new URL(url)
    } catch (error) {
      throw new Error(error.message || error.toString())
    }

    this.analyzedUrls = {}
    this.detections = []
    this.language = ''

    this.listeners = {}

    this.pages = []
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
      this.listeners[event].forEach((listener) => listener(params))
    }
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
      status: 0
    }

    if (!this.browser) {
      throw new Error('Browser closed')
    }

    const page = await this.browser.newPage()

    this.pages.push(page)

    page.setDefaultTimeout(this.options.maxWait)

    await page.setRequestInterception(true)

    page.on('error', (error) => this.error(error))

    let responseReceived = false

    page.on('request', (request) => {
      try {
        if (
          (responseReceived && request.isNavigationRequest()) ||
          request.frame() !== page.mainFrame() ||
          !['document', 'script'].includes(request.resourceType())
        ) {
          request.abort('blockedbyclient')
        } else {
          request.continue()
        }
      } catch (error) {
        this.error(error)
      }
    })

    page.on('response', (response) => {
      try {
        if (response.url() === url.href) {
          this.analyzedUrls[url.href] = {
            status: response.status()
          }

          const rawHeaders = response.headers()
          const headers = {}

          Object.keys(rawHeaders).forEach((key) => {
            headers[key] = [
              ...(headers[key] || []),
              ...(Array.isArray(rawHeaders[key])
                ? rawHeaders[key]
                : [rawHeaders[key]])
            ]
          })

          this.contentType = headers['content-type'] || null

          if (response.status() >= 300 && response.status() < 400) {
            if (headers.location) {
              url = new URL(headers.location.slice(-1), url)
            }
          } else {
            responseReceived = true

            this.onDetect(analyze({ headers }))
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
      await Promise.race([
        page.goto(url.href, { waitUntil: 'domcontentloaded' }),
        new Promise((resolve, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.options.maxWait)
        )
      ])
    } catch (error) {
      this.error(error)
    }

    await sleep(1000)

    // Links
    const links = await (
      await page.evaluateHandle(() =>
        Array.from(document.getElementsByTagName('a')).map(
          ({ hash, hostname, href, pathname, protocol, rel }) => ({
            hash,
            hostname,
            href,
            pathname,
            protocol,
            rel
          })
        )
      )
    ).jsonValue()

    // Script tags
    const scripts = await (
      await page.evaluateHandle(() =>
        Array.from(document.getElementsByTagName('script'))
          .map(({ src }) => src)
          .filter((src) => src)
      )
    ).jsonValue()

    // Meta tags
    const meta = await (
      await page.evaluateHandle(() =>
        Array.from(document.querySelectorAll('meta')).reduce((metas, meta) => {
          const key = meta.getAttribute('name') || meta.getAttribute('property')

          if (key) {
            metas[key.toLowerCase()] = [meta.getAttribute('content')]
          }

          return metas
        }, {})
      )
    ).jsonValue()

    // JavaScript
    const win = await Promise.race([
      page.evaluate(getJs),
      new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error('Timeout')), this.options.maxWait)
      )
    ])

    const js = Wappalyzer.technologies
      .filter(({ js }) => Object.keys(js).length)
      .map(({ name, js }) => ({ name, chains: Object.keys(js) }))
      .reduce((technologies, { name, chains }) => {
        chains.forEach((chain) => {
          const value = chain
            .split('.')
            .reduce(
              (value, method) =>
                value && value.hasOwnProperty(method)
                  ? value[method]
                  : undefined,
              win
            )

          if (typeof value !== 'undefined') {
            technologies.push({
              name,
              chain,
              value:
                typeof value === 'string' || typeof value === 'number'
                  ? value
                  : !!value
            })
          }
        })

        return technologies
      }, [])

    // Cookies
    const cookies = (await page.cookies()).reduce(
      (cookies, { name, value }) => ({
        ...cookies,
        [name]: [value]
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

    // Validate response
    if (!this.analyzedUrls[url.href].status) {
      await page.close()

      this.log('Page closed')

      throw new Error('NO_RESPONSE')
    }

    if (!this.language) {
      this.language = await (
        await page.evaluateHandle(
          () =>
            document.documentElement.getAttribute('lang') ||
            document.documentElement.getAttribute('xml:lang')
        )
      ).jsonValue()
    }

    if (!this.language) {
      try {
        const [attrs] = languageDetect.detect(
          html.replace(/<\/?[^>]+(>|$)/gs, ' '),
          1
        )

        if (attrs) {
          ;[this.language] = attrs
        }
      } catch (error) {
        this.error(error)
      }
    }

    this.onDetect(analyzeJs(js))

    this.onDetect(
      analyze({
        url,
        cookies,
        html,
        scripts,
        meta
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
          link.rel !== 'nofollow' &&
          link.hostname === url.hostname &&
          extensions.test(link.pathname)
        ) {
          results.push(new URL(link.href.split('#')[0]))
        }

        return results
      },
      []
    )

    await page.close()

    this.log('Page closed')

    this.emit('goto', url)

    return reducedLinks
  }

  async analyze(url = this.originalUrl, index = 1, depth = 1) {
    try {
      await sleep(this.options.delay * index)

      const links = await this.goto(url)

      if (links && this.options.recursive && depth < this.options.maxDepth) {
        await this.batch(links.slice(0, this.options.maxUrls), depth + 1)
      }
    } catch (error) {
      const type =
        error.message && errorTypes[error.message]
          ? error.message
          : 'UNKNOWN_ERROR'
      const message =
        error.message && errorTypes[error.message]
          ? errorTypes[error.message]
          : 'Unknown error'

      this.analyzedUrls[url.href] = {
        status: 0,
        error: {
          type,
          message
        }
      }

      this.error(error)
    }

    return {
      urls: this.analyzedUrls,
      applications: resolve(this.detections).map(
        ({ name, confidence, version, icon, website, categories }) => ({
          name,
          confidence,
          version,
          icon,
          website,
          categories: categories.reduce(
            (categories, { id, name }) => ({
              ...categories,
              [id]: name
            }),
            {}
          )
        })
      ),
      meta: {
        language: this.language
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

  onDetect(detections = [], language) {
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
