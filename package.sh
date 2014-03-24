#!/bin/sh

path=`pwd`

./links.sh

rm -f wappalyzer-chrome.zip wappalyzer-firefox.xpi

cd $path/drivers/chrome  && zip -r $path/wappalyzer-chrome.zip  .
cd $path/drivers/firefox && zip -r $path/wappalyzer-firefox.xpi .
