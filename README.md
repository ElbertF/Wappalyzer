# Wappalyzer [![Travis](https://img.shields.io/travis/AliasIO/Wappalyzer.svg)](https://travis-ci.org/AliasIO/Wappalyzer/) [![Scrutinizer](https://scrutinizer-ci.com/g/AliasIO/Wappalyzer/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/AliasIO/Wappalyzer/?branch=master)

[Wappalyzer](https://wappalyzer.com/) is a
[cross-platform](https://github.com/AliasIO/Wappalyzer/wiki/Drivers) utility that uncovers the
technologies used on websites. It detects
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


## Getting Started

Install [Docker](https://www.docker.com/) on your system first.

```shell
$ git clone https://github.com/AliasIO/Wappalyzer.git
$ cd Wappalyzer
$ ./run links
```

The	`links` command creates symlinks for files that shared between the various
drivers (i.e. different platforms). If your file system does not support
symlinks, you need to manually copy these files (see [`bin/links`](https://github.com/AliasIO/Wappalyzer/blob/master/bin/links)).

Please run `./run validate` before submitting a pull request.
