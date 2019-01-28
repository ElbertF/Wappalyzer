#!/usr/bin/env node

const Wappalyzer = require('./driver');
const Browser = require('./browsers/zombie');

const args = process.argv.slice(2);

const url = args.shift() || '';

if (!url) {
  process.stderr.write('No URL specified\n');

  process.exit(1);
}

const options = {};

let arg;

do {
  arg = args.shift();

  const matches = /--([^=]+)=(.+)/.exec(arg);

  if (matches) {
    const key = matches[1].replace(/-\w/g, _matches => _matches[1].toUpperCase());
    const value = matches[2];

    options[key] = value;
  }
} while (arg);

const wappalyzer = new Wappalyzer(Browser, url, options);

wappalyzer.analyze()
  .then((json) => {
    process.stdout.write(`${JSON.stringify(json)}\n`);

    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${error}\n`);

    process.exit(1);
  });
