#!/bin/bash

cd "$(dirname $0)"

if [[ -z "$(which docker)" ]]; then
	echo "Please install Docker from https://www.docker.com"

	exit 1
fi

cmd="docker run --rm -v "$(pwd):/opt/wappalyzer" -it wappalyzer/dev"

$cmd sh -c "\
	npm i; \
	npm shrinkwrap; \
	cd src/drivers/webextension; \
	npm i; \
	npm shrinkwrap; \
	cd ../npm; \
	npm i; \
	npm shrinkwrap"

$cmd sh -c "cat patches/*.patch | patch -p0"

$cmd ./bin/run links
$cmd ./bin/run $@
