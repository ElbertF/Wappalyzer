# Wappalyzer

[Wappalyzer](http://wappalyzer.com/) is a 
[browser extension](http://wappalyzer.com/download) that uncovers the 
technologies used on websites.  It detects
[content management systems](http://wappalyzer.com/categories/cms),
[web shops](http://wappalyzer.com/categories/web-shops),
[web servers](http://wappalyzer.com/categories/web-servers), 
[JavaScript frameworks](http://wappalyzer.com/categories/javascript-frameworks),
[analytics tools](http://wappalyzer.com/categories/analytics) and
[many more](http://wappalyzer.com/applications).

*Licensed under the [GPL](https://github.com/ElbertF/Wappalyzer/blob/master/LICENSE).*

## Contributing

### Adding a new application

* Edit `share/apps.json` (use a JSON 
  [validator](http://jsonformatter.curiousconcept.com)).
* Add a 16x16 PNG image to `share/images/icons` matching the application name 
  (use [Smush.it](http://www.smushit.com) or 
	[OptiPNG](http://optipng.sourceforge.net) for compression).
* Provide the URL to the application's website when submitting a pull request.


### Adding a new category

Please open an issue to discuss first. Adding a category involves updating `apps.json`,
preference pages, locales and [wappalyzer.com](http://wappalyzer.com).


### Adding a new translation

#### Mozilla Firefox

Copy `drivers/firefox/locale/en-US`.


#### Google Chrome

Copy `drivers/chrome/_locales/en`.


## apps.json

#### Example

```javascript
"Application Name": { 
	"cats":       [ 1 ], 
	"headers":    { "X-Powered-By": "Application Name" },
	"url":        ".+\\.application-name\\.com",
	"html":       "<link[^>]application-name\\.css", 
	"meta":       { "generator": "Application Name" },
	"script":     "application-name\\.js",
	"env":        "ApplicationName",
	"implies":    [ "PHP" ],
	"confidence": { "html": 50, "script": 50 }
	}
```

### JSON fields

field      | type   | description
-----------|--------|-----------------------
cats       | array  | List of category IDs. See [apps.json](https://github.com/ElbertF/Wappalyzer/blob/master/share/apps.json) for the complete list.
confidence | object | Indicates less reliable patterns that may cause false positives. The aim is to achieve a combined confidence of 100%. Defaults to 100% for unspecified fields.
env        | string | Global JavaScript variables, e.g. `jQuery`.
headers    | object | HTTP Response headers, e.g. `X-Powered-By`.
html       | string | Full HTML response body.
implies    | array  | The presence of one application can imply the presence of another, e.g. Drupal means PHP is also in use.
url        | string | URL of the page, e.g. `http://wordpress.com/index.php`.
meta       | object | HTML meta tags, e.g. `generator`.
script     | string | `src` attribute of HTML script tags, e.g. `jquery.js`.

Except `cats`, all fields are optional.


## Drivers

Wappalyzer is multi-platform. The main code lives in the `share/` directory and
platform specific code in `drivers/`. The sections below describe how to set up
a development environment for the various existing drivers.

To keep files synchronised between drivers, run `links.sh` (UNIX-like systems)
or `links.cmd` (Windows).


### Mozilla Firefox

* Place a file called `wappalyzer@crunchlabz.com` in the extensions directory in
  your [profile folder](http://kb.mozillazine.org/Profile_folder_-_Firefox) 
	(`~/.mozilla/firefox/xxxxx.default/extensions/` on Linux) containing the full
	path to `drivers/firefox`.
* Restart Firefox
* Navigate to `about:config` and set `extensions.wappalyzer.debug` to `true`.
* Ctrl+Shift+J brings up a console for debugging.


### Google Chrome

* Navigate to `about:extensions`
* Check "Developer mode"
* Click "Load unpacked extension..."
* Select `drivers/chrome/`


### Bookmarklet

Beta version available for testing at 
[wappalyzer.com/bookmarklet](http://wappalyzer.com/bookmarklet).


### HTML

The HTML driver serves purely as an example. It's a good starting point if you
want to port Wappalyzer to a new platform.

* Navigate to `drivers/html/`


### PHP

The PHP driver requires the [V8js](http://php.net/manual/en/book.v8js.php) 
class. Installing V8js using [PECL](http://pecl.php.net/) on Debian Linux or 
Ubuntu should be very straight forward:

* `# aptitude install php5-dev php-pear libv8-dev`
* `# pecl install channel://pecl.php.net/v8js-0.1.3`
* `# echo "extension=v8js.so" > /etc/php5/conf.d/v8js.ini`

Runnning Wappalyzer from the command line:

`$ php drivers/php/index.php wappalyzer.com`

Running Wappalyzer inside a PHP script:

```php
require('WappalyzerException.php');
require('Wappalyzer.php');

$wappalyzer = new Wappalyzer($url);

$detectedApps = $wappalyzer->analyze();
```


### Mozilla Jetpack

Work in progress, experimental. See https://wiki.mozilla.org/Jetpack.


## Unofficial drivers and ports

### Python

A Python driver by [@ebradbury](https://github.com/ebradbury).

https://github.com/ebradbury/Wappalyzer/tree/master/drivers/python


### Ruby

A Ruby port by [@skroutz](https://github.com/skroutz).

https://github.com/skroutz/wappalyzer-ruby


## Screenshot

Wappalyzer on Firefox:

![A screenshot of Wappalyzer on Firefox](http://wappalyzer.com/sites/default/themes/wappalyzer/images/installed.png)