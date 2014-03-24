/**
 * Jetpack driver
 */

(function() {
	'use strict';

	var
		{ Cc, Ci } = require('chrome'),
		tabs       = require('tabs'),
		self       = require('self'),
		main       = require('wappalyzer'),
		w          = main.wappalyzer
		;

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			console.log(args.message);
		},

		/**
		 * Initialize
		 */
		init: function(callback) {
		}
	}

	w.init();
})();
