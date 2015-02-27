# Wappalyzer

This is npm module for wappalyzer

    npm install wappalyzer


    var wappalyzer = require("wappalyzer");


    var options={
      url : "http://codelanka.github.io/Presentation-Engines",
      hostname:"codelanka.github.io",
      debug:false
    }

    wappalyzer.detectFromUrl(options,function  (err,apps,appInfo) {
      console.log(err,apps,appInfo);
    })


####Output


    null [ 'AngularJS',
      'Font Awesome',
      'Google Font API',
      'jQuery',
      'Twitter Bootstrap' ] { AngularJS:
       { app: 'AngularJS',
         confidence:
          { 'script //([\\d.]+(\\-?rc[.\\d]*)*)/angular(\\.min)?\\.js/i': 100,
            'script /angular.*\\.js/i': 100 },
         confidenceTotal: 100,
         detected: true,
         excludes: [],
         version: '1.3.5',
         versions: [ '1.3.5' ] },
      'Font Awesome':
       { app: 'Font Awesome',
         confidence: { 'html /<link[^>]* href=[^>]+font-awesome(?:\\.min)?\\.css/i': 100 },
         confidenceTotal: 100,
         detected: true,
         excludes: [],
         version: '',
         versions: [] },
      'Google Font API':
       { app: 'Google Font API',
         confidence: { 'html /<link[^>]* href=[^>]+fonts\\.(?:googleapis|google)\\.com/i': 100 },
         confidenceTotal: 100,
         detected: true,
         excludes: [],
         version: '',
         versions: [] },
      jQuery:
       { app: 'jQuery',
         confidence: { 'script /jquery.*\\.js/i': 100 },
         confidenceTotal: 100,
         detected: true,
         excludes: [],
         version: '',
         versions: [] },
      'Twitter Bootstrap':
       { app: 'Twitter Bootstrap',
         confidence:
          { 'script /(?:twitter\\.github\\.com/bootstrap|bootstrap(?:\\.js|\\.min\\.js))/i': 100,
            'html /<link.+?href="[^"]+bootstrap(?:\\.min)?\\.css/i': 100 },
         confidenceTotal: 100,
         detected: true,
         excludes: [],
         version: '',
         versions: [] } }


Wappalyzer Author - Elbert Alias

[Wappalyzer](https://wappalyzer.com/) is a
[cross-platform](https://github.com/AliasIO/Wappalyzer/wiki/Drivers) utility that uncovers the
technologies used on websites.  It detects
[content management systems](https://wappalyzer.com/categories/cms),
[eCommerce platforms](https://wappalyzer.com/categories/ecommerce),
[web servers](https://wappalyzer.com/categories/web-servers),
[JavaScript frameworks](https://wappalyzer.com/categories/javascript-frameworks),
[analytics tools](https://wappalyzer.com/categories/analytics) and
[many more](https://wappalyzer.com/applications).

Refer to the [wiki](https://github.com/AliasIO/Wappalyzer/wiki) for
[screenshots](https://github.com/AliasIO/Wappalyzer/wiki/Screenshots), information on how to
[contribute](https://github.com/AliasIO/Wappalyzer/wiki/Contributing) and
[more](https://github.com/AliasIO/Wappalyzer/wiki/_pages).

*Licensed under the [GPL](https://github.com/AliasIO/Wappalyzer/blob/master/LICENSE).*

Donate Bitcoin: 16gb4uGDAjaeRJwKVmKr2EXa8x2fmvT8EQ - *Thanks!*

![QR Code](https://wappalyzer.com/sites/default/themes/wappalyzer/images/bitcoinqrcode.png)
