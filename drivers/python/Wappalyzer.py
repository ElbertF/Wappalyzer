import os
import re
import json
import requests
from random import choice
from BeautifulSoup import BeautifulSoup

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.57 Safari/536.11',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.168 Safari/535.19',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:2.0.1) Gecko/20110506 Firefox/4.0.1',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2',
]

class Wappalyzer(object):
    def __init__(self):
        driver_path = os.path.abspath(os.path.dirname(__file__))
        apps_file_path = os.path.join(driver_path, '../../share/apps.json')
        
        try:
            with open(apps_file_path) as apps_file:
                self._apps_json = json.load(apps_file)
                
                self.apps = self._apps_json['apps']
                self.categories = self._apps_json['categories']
                
                # Pre-compile some regex
                for app_name,app_data in self.apps.iteritems():
                    new_app_data = app_data.copy()
                    
                    for k,v in app_data.iteritems():
                        if k in ('url', 'html', 'script'):
                            new_app_data[k + '_regex'] = re.compile(v, re.I)
                    
                    self.apps[app_name] = new_app_data
                
        except IOError as e:
            print "Error opening apps.json: %s" % e
    
    def analyze(self, url):
        self.response = requests.get(url, headers={'User-Agent': choice(USER_AGENTS)})
        
        self.parse_document()
        
        detected_apps = {}
        
        for app_name,app_data in self.apps.iteritems():
            for flag_type, flag_data in app_data.iteritems():
                if flag_type == 'url':
                    match = (app_data['url_regex'].search(url) != None) 
                    
                    if match:
                        detected_apps[app_name] = True
                        continue
                elif flag_type == 'html':
                    match = (app_data['html_regex'].search(self.response.text) != None) 
                    
                    if match:
                        detected_apps[app_name] = True
                        continue
                elif flag_type == 'script':
                    match = self.find_script(app_data['script_regex'])
                    
                    if match:
                        detected_apps[app_name] = True
                        continue
                elif flag_type == 'meta':
                    match = self.find_meta(flag_data)
                    
                    if match:
                        detected_apps[app_name] = True
                        continue
                elif flag_type == 'headers':
                    match = self.find_headers(flag_data)
                    
                    if match:
                        detected_apps[app_name] = True
                        continue
                    
        return detected_apps
                    
    def parse_document(self):
        self.script_tags = []
        self.meta_tags = []
        
        soup = BeautifulSoup(self.response.text)
        
        for s in soup.findAll('script'):
            self.script_tags.append(s)
        
        for m in soup.findAll('meta'):
            self.meta_tags.append(m)
             
    def find_script(self, regex):
        for s in self.script_tags:
            match = (regex.search(s.get('src', '')) != None)
            
            if match:
                return True
        
        return False
            
    def find_meta(self, meta_attrs):
        for name,content in meta_attrs.iteritems():
            for m in self.meta_tags:
                if m.get('name', '').strip() == name:
                    match = (re.search(content, m.get('src', ''), re.I) != None)
                
                    if match:
                        return True
        
        return False
    
    def find_headers(self, header_attrs):
        for k,v in header_attrs.iteritems():
            if k in self.response.headers:
                match = (re.search(v, self.response.headers[k], re.I) != None)
                
                if match:
                    return True
            
        return False
