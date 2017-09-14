# Wappalyzer

[Wappalyzer](https://wappalyzer.com/) is a
[cross-platform](https://github.com/AliasIO/Wappalyzer/wiki/Drivers) utility that uncovers the
technologies used on websites. It detects
[content management systems](https://wappalyzer.com/categories/cms),
[eCommerce platforms](https://wappalyzer.com/categories/ecommerce),
[web servers](https://wappalyzer.com/categories/web-servers),
[JavaScript frameworks](https://wappalyzer.com/categories/javascript-frameworks),
[analytics tools](https://wappalyzer.com/categories/analytics) and
[many more](https://wappalyzer.com/applications).


## Installation

```shell
$ npm i wappalyzer
```


## Run from the command line

```shell
$ node index.js https://wappalyzer.com
```


## Run from a script

```javascript
const wappalyzer = require('wappalyzer');

wappalyzer.analyze('https://wappalyzer.com')
  .then(json => {
    console.log(JSON.stringify(json, null, 2));
  })
  .catch(error => {
    console.error(error);
  });
```

## By default Wppalyzer uses Zombie.js, as a headless browser, if you want to use your own, you can pass the content gathered from your favorite headless browser instead.  Simply add an object as the second argument, with the properties url,headers,env,and content;

```javascript
const wappalyzer = require('wappalyzer');

wappalyzer.analyze('https://wappalyzer.com',{
  url:'https://wappalyzer.com',
  headers: {
  'Upgrade-Insecure-Requests':  '1',
  'User-Agent' : 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1' },
  env: [ 'Object',
  'Function',
  'Array',
  'Number',
  'parseFloat',
  'parseInt',
  'Infinity',
  'NaN',
  'undefined',
  'Boolean',
  'String'
    /** Will have many more **/
  ],
  content: '<!doctype html><html><head><title>Page Title</title><meta charset="utf-8" /></head><body></body></html>'
})
  .then(json => {
    console.log(JSON.stringify(json, null, 2));
  })
  .catch(error => {
    console.error(error);
  });
```
