'use strict';

const wappalyzer = require('./driver');

const args = process.argv.slice(2);

const url = args[0] || '';

if ( !url ) {
  process.stderr.write('No URL specified\n');

  process.exit(1);
}

wappalyzer.analyze(url)
  .then(json => {
    process.stdout.write(JSON.stringify(json) + '\n')

    process.exit();
  })
  .catch(error => {
    throw error
  });
