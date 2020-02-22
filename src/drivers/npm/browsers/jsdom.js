'use strict'

const { Cookie } = require('tough-cookie')
const jsdom = require('jsdom')

const { JSDOM, VirtualConsole } = jsdom

const uniq = arr => [...new Set(arr)]

const parseCookie = str => Cookie.parse(str).toJSON()

const getCookies = str =>
  []
    .concat(str)
    .map(parseCookie)
    .map(({ key: name, ...props }) => ({ name, ...props }))

function Browser (opts) {
  if (!(this instanceof Browser)) return new Browser(opts)

  const { url, html, statusCode = 200, headers } = opts

  const userAgent = headers['user-agent'] || null
  const contentType = headers['content-type'] || null
  const dom = new JSDOM(html, {
    url,
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole()
  })

  const cookies = getCookies(headers['set-cookie'])

  return {
    visit: () => {},
    userAgent,
    cookies,
    html,
    statusCode,
    contentType,
    document: dom.window.document,
    window: dom.window,
    headers,
    js: dom.window,
    scripts: uniq(
      Array.prototype.slice
        .apply(dom.window.document.scripts)
        .filter(({ src }) => src)
        .map(({ src }) => src)
    ),
    links: uniq(
      Array.from(dom.window.document.getElementsByTagName('a')).map(
        ({ href }) => href
      )
    )
  }
}

module.exports = Browser
