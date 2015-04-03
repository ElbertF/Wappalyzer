FROM phusion/baseimage

MAINTAINER Elbert Alias <elbert@alias.io>

ENV DEBIAN_FRONTEND noninteractive

RUN \
	apt-get update && apt-get install -y \
	libfreetype6 \
	libfontconfig \
	&& apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /usr/local

# PhantomJS
RUN \
	mkdir phantomjs && \
	curl -L https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-x86_64.tar.bz2 | tar xvjC phantomjs --strip 1

# Wappalyzer
RUN \
	mkdir wappalyzer && \
	curl -sSL https://github.com/AliasIO/Wappalyzer/archive/master.tar.gz | tar xzC wappalyzer --strip 1

RUN wappalyzer/bin/wappalyzer-links wappalyzer

WORKDIR wappalyzer/src/drivers/phantomjs

ENTRYPOINT ["/usr/local/phantomjs/bin/phantomjs", "--load-images=false", "--ignore-ssl-errors=yes", "driver.js"]
