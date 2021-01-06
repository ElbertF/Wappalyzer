# Wappalyzer

[Wappalyzer](https://www.wappalyzer.com/) indentifies technologies on websites. 

*Note:* The [wappalyzer-core](https://www.npmjs.com/package/wappalyzer-core) package provides a low-level API without dependencies.

## Command line

### Installation

```shell
$ npm i -g wappalyzer
```

### Usage

```
wappalyzer <url> [options]
```

#### Options

```
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
-p, --probe              Perform a deeper scan by requesting common files
-r, --recursive          Follow links on pages (crawler)
-a, --user-agent=...     Set the user agent string
```


## Dependency

### Installation

```shell
$ npm i wappalyzer
```

### Usage

```javascript
const Wappalyzer = require('wappalyzer');

const url = 'https://www.wappalyzer.com';

const options = {
  debug: false,
  delay: 500,
  headers: {},
  maxDepth: 3,
  maxUrls: 10,
  maxWait: 5000,
  recursive: true,
  probe: true,
  userAgent: 'Wappalyzer',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
};

;(async function() {
  const wappalyzer = new Wappalyzer(options)

  try {
    await wappalyzer.init()

    // Optionally set additional request headers
    const headers = {}

    const site = await wappalyzer.open(url, headers)

    // Optionally capture and output errors
    site.on('error', console.error)

    const results = await site.analyze()

    console.log(JSON.stringify(results, null, 2))
  } catch (error) {
    console.error(error)
  }

  await wappalyzer.destroy()
})()
```

Multiple URLs can be processed in parallel:

```javascript
const Wappalyzer = require('wappalyzer');

const urls = ['https://www.wappalyzer.com', 'https://www.example.com']

;(async function() {
  const wappalyzer = await new Wappalyzer()

  try {
    await wappalyzer.init()

    const results = await Promise.all(
      urls.map(async (url) => ({
        url,
        results: await wappalyzer.open(url).analyze()
      }))
    )

    console.log(JSON.stringify(results, null, 2))
  } catch (error) {
    console.error(error)
  }

  await wappalyzer.destroy()
})()
```

### Events

Listen to events with `site.on(eventName, callback)`. Use the `page` parameter to access the Puppeteer page instance ([reference](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-page)).

| Event       | Parameters                     | Description                              |
|-------------|--------------------------------|------------------------------------------|
| `log`       | `message`, `source`            | Debug messages                           |
| `error`     | `message`, `source`            | Error messages                           |
| `request`   | `page`, `request`              | Emitted at the start of a request        |
| `response`  | `page`, `request`              | Emitted upon receiving a server response |
| `goto`      | `page`, `url`, `html`, `cookies`, `scripts`, `meta`, `js`, `language` `links` | Emitted after a page has been analysed |
| `analyze`   | `urls`, `technologies`, `meta` | Emitted when the site has been analysed |
