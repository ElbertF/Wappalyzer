'use strict';

const options = {
  userAgent: null,
  maxWait: 3000,
  debug: false
};

const args = process.argv.slice(2);

const url = args.shift() || '';

if ( !url ) {
  process.stderr.write('No URL specified\n');

  process.exit(1);
}

var arg;

while ( arg = args.shift() ) {
  var matches = /--([^=]+)=(.+)/.exec(arg);

  if ( matches ) {
    var key = matches[1].replace(/-\w/g, matches => matches[1].toUpperCase());
    var value = matches[2];

    options.hasOwnProperty(key) && ( options[key] = value );
  }
}

const wappalyzer = require('./driver')(options);

wappalyzer.analyze(url)
  .then(json => {
    process.stdout.write(JSON.stringify(json) + '\n')

    process.exit(0);
  })
  .catch(error => {
    process.stderr.write(error + '\n')

    process.exit(1);
  });
