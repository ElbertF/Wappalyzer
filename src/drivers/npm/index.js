'use strict';

const
	path      = require('path'),
	spawn     = require('child_process').spawn,
	phantomjs = require('phantomjs-prebuilt');

exports.run = function(args, callback) {
	args.unshift.apply(args, [path.join(__dirname, 'driver.js'), '--web-security=false', '--load-images=false', '--ignore-ssl-errors=yes', '--ssl-protocol=any']);

	var driver = phantomjs.exec.apply(this, args);

	driver.stdout.on('data', (data) => {
		callback(`${data}`, null);
	});

	driver.stderr.on('data', (data) => {
		callback(null, `${data}`);
	});
}

if ( !module.parent ) {
	exports.run(process.argv.slice(2), function(stdout, stderr) {
		if ( stdout ) {
			process.stdout.write(stdout);
		}

		if ( stderr ) {
			process.stderr.write(stderr);
		}
	});
}
