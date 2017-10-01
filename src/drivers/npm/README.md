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
