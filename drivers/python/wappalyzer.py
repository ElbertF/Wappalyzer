#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import PyV8
import urllib
from urlparse import urlparse

try:
    import json
except ImportError:
    import simplejson as json


class Wappalyzer(object):

    def __init__(self, url):
        self.file_dir = os.path.dirname(__file__)

        f = open(os.path.join(self.file_dir, '../../share/apps.json'))
        data = json.loads(f.read())
        f.close()

        self.categories = data['categories']
        self.apps = data['apps']
        self.url = url

    def analyze(self):
        ctxt = PyV8.JSContext()
        ctxt.enter()

        f1 = open(os.path.join(self.file_dir, '../php/js/wappalyzer.js'))
        f2 = open(os.path.join(self.file_dir, '../php/js/driver.js'))
        ctxt.eval(f1.read())
        ctxt.eval(f2.read())
        f1.close()
        f2.close()

        host = urlparse(self.url).hostname
        html = urllib.urlopen(self.url).read()

        data = {'host': host, 'url': self.url, 'html': html, 'headers': {}}
        apps = json.dumps(self.apps)
        categories = json.dumps(self.categories)
        return ctxt.eval("w.apps = %s; w.categories = %s; w.driver.data = %s; w.driver.init();" % (apps, categories, json.dumps(data)))

if __name__ == '__main__':
    try:
        w = Wappalyzer(sys.argv[1])
        print w.analyze()
    except IndexError:
        print ('Usage: python %s <url>' % sys.argv[0])
