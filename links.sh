#!/bin/sh

mkdir -p                          drivers/firefox-xul/skin/images/icons
mkdir -p                          drivers/firefox-xul/content/js
ln -f share/images/icons/*.png    drivers/firefox-xul/skin/images/icons
ln -f share/apps.json             drivers/firefox-xul/content
ln -f share/js/wappalyzer.js      drivers/firefox-xul/content/js

mkdir -p                          drivers/firefox/data/images/icons
mkdir -p                          drivers/firefox/data
mkdir -p                          drivers/firefox/lib
ln -f share/images/icons/*.png    drivers/firefox/data/images/icons
ln -f share/apps.json             drivers/firefox/data
ln -f share/js/wappalyzer.js      drivers/firefox/lib

mkdir -p                          drivers/chrome/images/icons
mkdir -p                          drivers/chrome/js
ln -f share/images/icons/*.png    drivers/chrome/images/icons
ln -f share/apps.json             drivers/chrome
ln -f share/js/wappalyzer.js      drivers/chrome/js

mkdir -p                          drivers/bookmarklet/images/icons
mkdir -p                          drivers/bookmarklet/json
mkdir -p                          drivers/bookmarklet/js
ln -f share/images/icons/*.png    drivers/bookmarklet/images/icons
ln -f share/apps.json             drivers/bookmarklet/json
ln -f share/js/wappalyzer.js      drivers/bookmarklet/js

mkdir -p                          drivers/html/images/icons
mkdir -p                          drivers/html/js
ln -f share/images/icons/*.png    drivers/html/images/icons
ln -f share/apps.json             drivers/html
ln -f share/js/wappalyzer.js      drivers/html/js

mkdir -p                          drivers/php/js
ln -f share/apps.json             drivers/php
ln -f share/js/wappalyzer.js      drivers/php/js

mkdir -p                          drivers/python/js
ln -f share/apps.json             drivers/python
if [ ! -d "drivers/python/js" ];then
  mkdir drivers/python/js/
fi
ln -f share/js/wappalyzer.js      drivers/python/js
