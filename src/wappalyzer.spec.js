/* eslint-env mocha */

const { assert, expect } = require('chai');
const Wappalyzer = require('../src/wappalyzer');

const appsJson = {
  appUrl: {
    url: 'test',
  },
  appCookies: {
    cookies: {
      test: 'test',
    },
  },
  appUppercaseCookies: {
    cookies: {
      Test: 'Test',
    },
  },
  appHeaders: {
    headers: {
      'X-Powered-By': 'test',
    },
  },
  appHtml: {
    html: 'test v(\\d)\\;confidence:50\\;version:\\1',
    implies: 'appImplies',
    excludes: 'appExcludes',
  },
  appMeta: {
    meta: {
      generator: 'test',
    },
  },
  appScript: {
    script: 'test',
  },
  appJs: {
    js: {
      key: 'value',
    },
  },
  appImplies: {
  },
  appExcludes: {
    html: 'test',
  },
};

const driverData = {
  cookies: [
    {
      name: 'test',
      value: 'test',
      domain: '',
      path: '',
    },
  ],
  headers: {
    'x-powered-by': [
      'test',
    ],
  },
  html: '<meta name="generator" content="test"> html test v1',
  scripts: [
    'test',
  ],
  js: {
    appJs: {
      key: [
        'value',
      ],
    },
  },
};

describe('Wappalyzer', () => {
  describe('#analyze()', () => {
    let apps;

    before(async () => {
      const wappalyzer = new Wappalyzer();

      wappalyzer.apps = appsJson;

      wappalyzer.parseJsPatterns();

      wappalyzer.driver.displayApps = (detected) => {
        apps = detected;
      };

      await wappalyzer.analyze({ canonical: 'test' }, driverData);
    });

    it('should identify technologies using URLs', () => {
      expect(apps).to.have.any.keys('appUrl');
    });

    it('should identify technologies using HTML', () => {
      expect(apps).to.have.any.keys('appHtml');
    });

    it('should identify technologies using meta tags', () => {
      expect(apps).to.have.any.keys('appMeta');
    });

    it('should identify technologies using script URLs', () => {
      expect(apps).to.have.any.keys('appScript');
    });

    it('should identify technologies using headers', () => {
      expect(apps).to.have.any.keys('appHeaders');
    });

    it('should identify technologies using cookies', () => {
      expect(apps).to.have.any.keys('appCookies');
    });

    it('should identify technologies using uppercase named cookies', () => {
      expect(apps).to.have.any.keys('appUppercaseCookies');
    });

    it('should identify technologies using JavaScript', () => {
      expect(apps).to.have.any.keys('appJs');
    });

    it('should return the implied technology', () => {
      expect(apps).to.have.any.keys('appImplies');
    });

    it('should not return the excluded technology', () => {
      expect(apps).to.not.have.any.keys('appExcludes');
    });

    it('should return the confidence value', () => {
      assert.equal(apps.appHtml.confidenceTotal, 50);
    });

    it('should return the version number', () => {
      assert.equal(apps.appHtml.version, '1');
    });
  });
});
