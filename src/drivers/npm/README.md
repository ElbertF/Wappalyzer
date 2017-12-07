# Wappalyzer

[Wappalyzer](https://www.wappalyzer.com/) is a
[cross-platform](https://github.com/AliasIO/Wappalyzer/wiki/Drivers) utility that uncovers the
technologies used on websites. It detects
[content management systems](https://www.wappalyzer.com/categories/cms),
[eCommerce platforms](https://www.wappalyzer.com/categories/ecommerce),
[web servers](https://www.wappalyzer.com/categories/web-servers),
[JavaScript frameworks](https://www.wappalyzer.com/categories/javascript-frameworks),
[analytics tools](https://www.wappalyzer.com/categories/analytics) and
[many more](https://www.wappalyzer.com/applications).


## Installation

```shell
$ npm i wappalyzer
```


## Run from the command line

```
node index.js [url] [options]
```

### Options

```
  --debug=0|1             Output debug messages.
  --delay=ms              Wait for ms milliseconds between requests.
  --max-depth=num         Don't analyze pages more than num levels deep.
  --max-urls=num          Exit when num URLs have been analyzed.
  --max-wait=ms           Wait no more than ms milliseconds for page resources to load.
  --recursive=0|1         Follow links on pages (crawler).
  --request-timeout=ms    Wait no more than ms millisecond for the page to load.
  --user-agent=str        Set the user agent string.
```


## Run from a script

```javascript
const options = {
  debug: false,
  delay: 500,
  maxDepth: 3,
  maxUrls: 10,
  maxWait: 1000,
  recursive: true,
  requestTimeout: 3000,
  userAgent: 'Wappalyzer',
};

const wappalyzer = new Wappalyzer('https://www.wappalyzer.com', options);

wappalyzer.analyze()
  .then(json => {
    process.stdout.write(JSON.stringify(json, null, 2) + '\n')

    process.exit(0);
  })
  .catch(error => {
    process.stderr.write(error + '\n')

    process.exit(1);
});
```
