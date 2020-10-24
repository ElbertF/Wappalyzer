const { chain, mapValues } = require('lodash')
const { JSDOM, VirtualConsole } = require('jsdom')
const { technologies, categories } = require('../src/technologies.json');
const { setTechnologies, setCategories, analyze } = require('../src/wappalyzer');

beforeAll(() => {
    setTechnologies(technologies);
    setCategories(categories);
});

const parseCookie = str => Cookie.parse(str).toJSON()

const getCookies = str =>
  chain(str)
    .castArray()
    .compact()
    .map(parseCookie)
    .map(({ key: name, ...props }) => ({ name, ...props }))
    .value()

const getHeaders = headers => mapValues(headers, value => [value])

const getScripts = scripts =>
  chain(scripts)
    .map('src')
    .compact()
    .uniq()
    .value()

const getMeta = document =>
  Array.from(document.querySelectorAll('meta')).reduce((acc, meta) => {
    const key = meta.getAttribute('name') || meta.getAttribute('property')
    if (key) acc[key.toLowerCase()] = [meta.getAttribute('content')]
    return acc
  }, {})


Object.keys(technologies).forEach(technology => {
    if (technologies[technology].examples?.length) {
        describe(technology, () => {
            technologies[technology].examples.forEach((example, i) => {
                test(`example: ${example.name || (i + 1)}`, () => {
                    const { headers = {}, url = undefined, html = "" } = example;
                    const dom = new JSDOM(html, { url, virtualConsole: new VirtualConsole() });
                    const results = analyze({
                        url: example.url,
                        meta: getMeta(dom.window.document),
                        headers: getHeaders(headers),
                        scripts: getScripts(dom.window.document.scripts),
                        cookies: getCookies(headers['set-cookie']),
                        html: dom.serialize()
                    });
                    let version = undefined;
                    for (const result of results) {
                        if (version === undefined) {
                            version = result.version;
                        }
                        version = result.version || version;
                    }
                    expect(version).toEqual(example.version);
                })
            });
        });
    }
});