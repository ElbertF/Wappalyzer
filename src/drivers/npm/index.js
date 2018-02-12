'use strict';

const Wappalyzer = require('./driver');

const args = process.argv.slice(2);

const url = args.shift() || '';

if ( !url ) {
  process.stderr.write('No URL specified\n');

  process.exit(1);
}

var options = {};
var arg;

while ( arg = args.shift() ) {
  var matches = /--([^=]+)=(.+)/.exec(arg);

  if ( matches ) {
    var key = matches[1].replace(/-\w/g, matches => matches[1].toUpperCase());
    var value = matches[2];

    options[key] = value;
  }
}

const wappalyzer = new Wappalyzer(url, options);

setTimeout(() => {
  console.log('force quit');

  process.exit(1);
}, 10000);

wappalyzer.analyze()
  .then(json => {
    process.stdout.write(JSON.stringify(json) + '\n')

    process.exit(0);
  })
  .catch(error => {
    process.stderr.write(error + '\n')

    process.exit(1);
  });
