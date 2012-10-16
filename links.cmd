:: ln == mklink /h
:: hard link folders (dir junction) = mklink /j dir1 dir2
:: hard link files = mklink /h
:: ln -f for folder: if exist FOLDER_TO_REPLACE_WITH_LINK rmdir /s FOLDER_TO_REPLACE_WITH_LINK&&mklink /j FOLDER_TO_REPLACE_WITH_LINK FOLDER_TO_LINK_TO
:: ln -f for file: if exist FILE_TO_REPLACE_WITH_LINK del FILE_TO_REPLACE_WITH_LINK&&mklink /h FILE_TO_REPLACE_WITH_LINK FILE_TO_LINK_TO


::	FIREFOX ADD-ON
::
::Sync icons folder
::ln -f share\images\icons\*       drivers\firefox\skin\images\icons
if exist drivers\firefox\skin\images\icons rmdir /q /s drivers\firefox\skin\images\icons
mklink /j drivers\firefox\skin\images\icons share\images\icons\

::Sync lib folder
::ln -f share\js\lib\jquery.min.js drivers\firefox\content\js\lib
if exist drivers\firefox\content\js\lib rmdir /q /s drivers\firefox\content\js\lib
mklink /j drivers\firefox\content\js\lib share\js\lib\

::Sync apps JSON
::ln -f share\apps.json            drivers\firefox\content
if exist drivers\firefox\content\apps.json del drivers\firefox\content\apps.json
mklink /h drivers\firefox\content\apps.json share\apps.json

::Sync Wappalyzer.js
::ln -f share\js\wappalyzer.js     drivers\firefox\content\js
if exist drivers\firefox\content\js\wappalyzer.js del drivers\firefox\content\js\wappalyzer.js
mklink /h drivers\firefox\content\js\wappalyzer.js share\js\wappalyzer.js



::	FIREFOX JETPACK
::
::Sync icons folder
::ln -f share\images\icons\*       drivers\firefox-jetpack\images\icons
if exist drivers\firefox-jetpack\images\icons rmdir /q /s drivers\firefox-jetpack\images\icons
mklink /j drivers\firefox-jetpack\images\icons share\images\icons

::Sync apps JSON
::ln -f share\apps.json            drivers\firefox-jetpack\data
if exist drivers\firefox-jetpack\data\apps.json del drivers\firefox-jetpack\data\apps.json
mklink /h drivers\firefox-jetpack\data\apps.json share\apps.json

::Sync Wappalyzer.js
::ln -f share\js\wappalyzer.js     drivers\firefox-jetpack\lib
if exist drivers\firefox-jetpack\lib\wappalyzer.js del drivers\firefox-jetpack\lib\wappalyzer.js
mklink /h drivers\firefox-jetpack\lib\wappalyzer.js share\js\wappalyzer.js



::	CHROME EXTENSION
::
::Sync icons folder
::ln -f share\images\icons\*       drivers\chrome\images\icons
if exist drivers\chrome\images\icons rmdir /q /s drivers\chrome\images\icons
mklink /j drivers\chrome\images\icons share\images\icons

::Sync lib folder
::ln -f share\js\lib\jquery.min.js drivers\chrome\js\lib
if exist drivers\chrome\js\lib rmdir /q /s drivers\chrome\js\lib
mklink /j drivers\chrome\js\lib share\js\lib

::Sync apps JSON
::ln -f share\apps.json            drivers\chrome
if exist drivers\chrome\apps.json del drivers\chrome\apps.json
mklink /h drivers\chrome\apps.json share\apps.json

::Sync Wappalyzer.js
::ln -f share\js\wappalyzer.js     drivers\chrome\js
if exist drivers\chrome\js\wappalyzer.js del drivers\chrome\js\wappalyzer.js
mklink /h drivers\chrome\js\wappalyzer.js share\js\wappalyzer.js



::	BOOKMARKLET
::
::Sync icons folder
::ln -f share\images\icons\*       drivers\bookmarklet\images\icons
if exist drivers\bookmarklet\images\icons rmdir /q /s drivers\bookmarklet\images\icons
mklink /j drivers\bookmarklet\images\icons share\images\icons

::Sync lib folder
::ln -f share\js\lib\jquery.min.js drivers\bookmarklet\js\lib
if exist drivers\bookmarklet\js\lib rmdir /q /s drivers\bookmarklet\js\lib
mklink /j drivers\bookmarklet\js\lib share\js\lib

::Sync apps JSON
::ln -f share\apps.json            drivers\bookmarklet\json
if exist drivers\bookmarklet\json del drivers\bookmarklet\json
mklink /h drivers\bookmarklet\json share\apps.json

::Sync Wappalyzer.js
::ln -f share\js\wappalyzer.js     drivers\bookmarklet\js
if exist drivers\bookmarklet\js\wappalyzer.js del drivers\bookmarklet\js\wappalyzer.js
mklink /h drivers\bookmarklet\js\wappalyzer.js share\js\wappalyzer.js



::	HTML DRIVER
::
::Sync icons folder
::ln -f share\images\icons\*       drivers\html\images\icons
if exist drivers\html\images\icons rmdir /q /s drivers\html\images\icons
mklink /j drivers\html\images\icons share\images\icons

::Sync lib folder
::ln -f share\js\lib\jquery.min.js drivers\html\js\lib
if exist drivers\html\js\lib rmdir /q /s drivers\html\js\lib
mklink /j drivers\html\js\lib share\js\lib

::Sync apps JSON
::ln -f share\apps.json            drivers\html
if exist drivers\html\apps.json del drivers\html\apps.json
mklink /h drivers\html\apps.json share\apps.json

::Sync Wappalyzer.js
::ln -f share\js\wappalyzer.js     drivers\html\js
if exist drivers\html\js\wappalyzer.js del drivers\html\js\wappalyzer.js
mklink /h drivers\html\js\wappalyzer.js share\js\wappalyzer.js



::	PHP DRIVER
::
::Sync apps JSON
::ln -f share\apps.json            drivers\php
if exist drivers\php\apps.json del drivers\php\apps.json
mklink /h drivers\php\apps.json share\apps.json

::Sync Wappalyzer.js
::ln -f share\js\wappalyzer.js     drivers\php\js
if exist drivers\php\js\wappalyzer.js del drivers\php\js\wappalyzer.js
mklink /h drivers\php\js\wappalyzer.js share\js\wappalyzer.js