#!/usr/bin/env node

const Wappalyzer = require('./driver')

const args = process.argv.slice(2)

const options = {}

let url
let arg

const aliases = {
  a: 'userAgent',
  b: 'batchSize',
  d: 'debug',
  t: 'delay',
  h: 'help',
  D: 'maxDepth',
  m: 'maxUrls',
  P: 'pretty',
  r: 'recursive',
  w: 'maxWait',
}

while (true) {
  // eslint-disable-line no-constant-condition
  arg = args.shift()

  if (!arg) {
    break
  }

  const matches = /^-?-([^=]+)(?:=(.+)?)?/.exec(arg)

  if (matches) {
    const key =
      aliases[matches[1]] ||
      matches[1].replace(/-\w/g, (_matches) => _matches[1].toUpperCase())
    // eslint-disable-next-line no-nested-ternary
    const value = matches[2]
      ? matches[2]
      : args[0] && !args[0].startsWith('-')
      ? args.shift()
      : true

    options[key] = value
  } else {
    url = arg
  }
}

if (!url || options.help) {
  process.stdout.write(`Usage:
  wappalyzer <url> [options]

Examples:
  wappalyzer https://www.example.com
  node cli.js https://www.example.com -r -D 3 -m 50
  docker wappalyzer/cli https://www.example.com --pretty

Options:
  -b, --batch-size=...     Process links in batches
  -d, --debug              Output debug messages
  -t, --delay=ms           Wait for ms milliseconds between requests
  -h, --help               This text
  --html-max-cols=...      Limit the number of HTML characters per line processed
  --html-max-rows=...      Limit the number of HTML lines processed
  -D, --max-depth=...      Don't analyse pages more than num levels deep
  -m, --max-urls=...       Exit when num URLs have been analysed
  -w, --max-wait=...       Wait no more than ms milliseconds for page resources to load
  -P, --pretty             Pretty-print JSON output
  -r, --recursive          Follow links on pages (crawler)
  -a, --user-agent=...     Set the user agent string
`)

  process.exit(1)
}

;(async function () {
  const wappalyzer = new Wappalyzer(options)

  try {
    await wappalyzer.init()

    const site = await wappalyzer.open(url)

    const results = await site.analyze()

    process.stdout.write(
      `${JSON.stringify(results, null, options.pretty ? 2 : null)}\n`
    )

    await wappalyzer.destroy()

    process.exit(0)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)

    await wappalyzer.destroy()

    process.exit(1)
  }
})()
