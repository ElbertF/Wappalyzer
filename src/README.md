# Wappalyzer core

[Wappalyzer](https://www.wappalyzer.com/) indentifies technologies on websites. 

## Installation

```shell
$ npm i wappalyzer-core
```

## Usage

```javascript
#!/usr/bin/env node

const fs = require('fs')
const Wappalyzer = require('./wappalyzer')

// See https://www.wappalyzer.com/docs/dev/specification or use
// https://raw.githubusercontent.com/AliasIO/wappalyzer/master/src/technologies.json
const { technologies, categories } = JSON.parse(
  fs.readFileSync('./technologies.json')
)

Wappalyzer.setTechnologies(technologies)
Wappalyzer.setCategories(categories)

Wappalyzer.analyze({
  url: 'https://example.github.io/',
  meta: { generator: ['WordPress'] },
  headers: { server: ['Nginx'] },
  scripts: ['jquery-3.0.0.js'],
  cookies: { awselb: [''] },
  html: '<div ng-app="">'
}).then((detections) => {
  const results = Wappalyzer.resolve(detections)

  console.log(results)
})
```
