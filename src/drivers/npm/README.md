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

```shell
$ node index.js https://www.wappalyzer.com
```


## Run from a script

```javascript
const options = {
  userAgent: 'Wappalyzer',
  maxWait: 3000,
  debug: false
};

const wappalyzer = require('wappalyzer')(options);

wappalyzer.analyze('https://www.wappalyzer.com')
  .then(json => {
    console.log(JSON.stringify(json, null, 2));
  })
  .catch(error => {
    console.error(error);
  });
```
