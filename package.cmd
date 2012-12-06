::	package.cmd
::	Copyright (c) 2012 q-- <https://github.com/q-->
::	
::	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
::	
::	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
::	
::	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
@echo off

::Detect HTA host
if exist %windir%\SysWOW64\mshta.exe goto hta64
if exist %windir%\System32\mshta.exe goto hta32
:hta32
set hta=%windir%\System32\mshta.exe 
goto endDetection
:hta64
set hta=%windir%\SysWOW64\mshta.exe 
goto endDetection
:endDetection

::Links
call links.cmd

::Remove old packages
if exist wappalyzer-chrome.zip del wappalyzer-chrome.zip
if exist wappalyzer-firefox.xpi del wappalyzer-firefox.xpi


::Prompt to download 7-Zip if necessary
set dl7zfile=.windows_zip\Download 7-Zip.hta
:retry
if not exist .windows_zip\7za.exe cd .windows_zip&%hta% "%cd%\%dl7zfile%"&cd ..&goto retry


::Pack Chrome extension
cd drivers\chrome&&..\..\.windows_zip\7za.exe a -tzip -mx9 ..\..\wappalyzer-chrome.zip *
cd..\..

::Pack Firefox extension
cd drivers\firefox&&..\..\.windows_zip\7za.exe a -tzip -mx9 ..\..\wappalyzer-firefox.xpi *
cd..\..


:end
@echo on