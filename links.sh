#!/bin/sh

ln -f share/images/icons/*.png    drivers/firefox-xul/skin/images/icons
ln -f share/apps.json             drivers/firefox-xul/content
ln -f share/js/wappalyzer.js      drivers/firefox-xul/content/js

ln -f share/images/icons/*.png    drivers/firefox/data/images/icons
ln -f share/apps.json             drivers/firefox/data
ln -f share/js/wappalyzer.js      drivers/firefox/lib

ln -f share/images/icons/*.png    drivers/chrome/images/icons
ln -f share/apps.json             drivers/chrome
ln -f share/js/wappalyzer.js      drivers/chrome/js

ln -f share/images/icons/*.png    drivers/bookmarklet/images/icons
ln -f share/apps.json             drivers/bookmarklet/json
ln -f share/js/wappalyzer.js      drivers/bookmarklet/js

ln -f share/images/icons/*.png    drivers/html/images/icons
ln -f share/apps.json             drivers/html
ln -f share/js/wappalyzer.js      drivers/html/js

ln -f share/apps.json             drivers/php
ln -f share/js/wappalyzer.js      drivers/php/js

ln -f share/apps.json             drivers/python
ln -f share/js/wappalyzer.js      drivers/python/js
