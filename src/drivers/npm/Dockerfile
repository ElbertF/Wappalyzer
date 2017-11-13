FROM alpine

MAINTAINER Elbert Alias <elbert@alias.io>

ENV WAPPALYZER_ROOT /opt/wappalyzer

RUN apk update && apk add --no-cache \
	nodejs \
	nodejs-npm

RUN mkdir -p "$WAPPALYZER_ROOT"

WORKDIR "$WAPPALYZER_ROOT"

ADD apps.json .
ADD driver.js .
ADD index.js .
ADD package.json .
ADD wappalyzer.js .

RUN npm i

ENTRYPOINT ["node", "index.js"]
