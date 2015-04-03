'use strict';

var request = require('request');
var fs = require('fs');
var path = require('path');

//TODO
exports.detectFromHTML = function(options) {};

exports.detectFromUrl = function(options, cb) {

	var url = options.url;

	if (options.debug) {
		console.log('Fetching the page');
	}

	getHTMLFromUrl(url, function(err, data) {
		if (err || data === null) {
			cb(err, null);
		} else {
			runWrappalyer(options, data, function(err, detected, appInfo) {
				cb(null, detected, appInfo);
			});
		}
	});
};

function getHTMLFromUrl(url, cb) {
	request(url, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var data = {
				html: body,
				url: url,
				headers: response
			};
			cb(null, data);
		} else {
			cb(error, null);
		}
	});
}

function getAppsJson(cb) {
	fs.readFile(path.resolve(__dirname, 'apps.json'), 'utf8', function(err, data) {
		if (err) throw err;
		return cb(null, JSON.parse(data));
	});
}

function runWrappalyer(options, data, cb) {
	var debug = options.debug || false;

	var wappalyzer = require('./wappalyzer').wappalyzer;
	getAppsJson(function(err, apps) {
		var w = wappalyzer;
		w.driver = {
			log: function(args) {
				if (debug) {
					console.log(args.message);
				}
			},

			init: function() {
				w.categories = apps.categories;
				w.apps = apps.apps;
			},
			displayApps: function() {
				var app, url = Object.keys(w.detected)[0];
				var detectedApps = [];

				for (app in w.detected[url]) {
					detectedApps.push(app);

					if (debug) {
						console.log(app);
					}
				}
				cb(null, detectedApps, w.detected[url]);
			}
		};
		w.init();
		w.detected = [];
		w.analyze(options.hostname, options.url, data);
	});
}
