FROM ubuntu:latest

MAINTAINER Elbert Alias <elbert@alias.io>

ENV DEBIAN_FRONTEND noninteractive

ENV WAPPALYZER_ROOT /usr/local/wappalyzer

RUN sed -i 's/archive\.ubuntu\.com/au.archive.ubuntu.com/g' /etc/apt/sources.list

RUN \
	apt-get update && apt-get install -y \
	libfreetype6 \
	libfontconfig \
	nodejs \
	npm \
	&& apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN ln -s $(which nodejs) /usr/bin/node

RUN mkdir "$WAPPALYZER_ROOT"

WORKDIR "$WAPPALYZER_ROOT"

ADD apps.json .
ADD driver.js .
ADD index.js .
ADD package.json .
ADD wappalyzer.js .

RUN npm i

ENTRYPOINT ["node", "index.js"]
