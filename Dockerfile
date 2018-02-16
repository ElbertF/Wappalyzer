FROM alpine

MAINTAINER Elbert Alias <elbert@alias.io>

ENV WAPPALYZER_DIR=/opt/wappalyzer

RUN apk add --no-cache \
	bash \
	curl \
	fontconfig \
	nodejs \
	optipng \
	zip

RUN mkdir -p /usr/share && \
  cd /usr/share \
  && curl -L https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 | tar xj \
  && ln -s /usr/share/phantomjs/phantomjs /usr/bin/phantomjs

RUN apk del \
	curl

RUN npm i -g \
	jsonlint-cli \
	manifoldjs \
	svg2png-many

RUN mkdir -p $WAPPALYZER_DIR

WORKDIR $WAPPALYZER_DIR

CMD [ "./bin/run" ]
