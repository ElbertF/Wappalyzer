# Wappalyzer [![Travis](https://img.shields.io/travis/AliasIO/Wappalyzer.svg?style=flat-square)](https://travis-ci.org/AliasIO/Wappalyzer/)

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

This section describes how to set up a development environment. Everything you
need is contained in a [Docker image](https://registry.hub.docker.com/u/wappalyzer/dev/)
which is managed by Vagrant.

Running this environment optional but recommended as it provides some helpful tools.

First, install [Docker](https://www.docker.com/) and [Vagrant](https://www.vagrantup.com/)
on your system.

Clone the Wappalyzer repository and open the newly created directory in a
terminal. Run `vagrant up` to start the environment.

Run `vagrant ssh` to access the environment and read usage instructions.

```shell
$ git clone https://github.com/AliasIO/Wappalyzer.git wappalyzer
$ cd wappalyzer
$ vagrant up
$ vagrant ssh
```

To stop the environment, run `vagrant halt`.

If a new Docker image becomes available, rebuild the environment with
`vagrant destroy -y && vagrant up`.
