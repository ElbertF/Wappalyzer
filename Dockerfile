FROM alpine

LABEL maintainer="elbert@alias.io"

ENV WAPPALYZER_DIR=/opt/wappalyzer

RUN apk update && apk add --no-cache \
	bash \
	curl \
	fontconfig \
	nodejs-npm \
	optipng \
	zip

# Fixes PhantomJS
# https://github.com/dustinblackman/phantomized
RUN curl -Ls "https://github.com/dustinblackman/phantomized/releases/download/2.1.1a/dockerized-phantomjs.tar.gz" | tar xz -C /

RUN apk del curl

RUN npm i -g n npm@latest

RUN n stable

RUN npm i --unsafe-perm --silent -g \
	jsonlint-cli \
	svg2png-many

RUN mkdir -p $WAPPALYZER_DIR

WORKDIR $WAPPALYZER_DIR

CMD [ "./bin/run" ]
