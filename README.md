# Wappalyzer [![Travis](https://travis-ci.org/aliasio/wappalyzer.svg?branch=master)](https://travis-ci.org/aliasio/wappalyzer/)

[Wappalyzer](https://www.wappalyzer.com) identifies technologies on websites, including content management systems, ecommerce platforms, JavaScript frameworks, analytics tools and [much more](https://www.wappalyzer.com/technologies).

* [wappalyzer on NPM](https://www.npmjs.com/package/wappalyzer)
* [wappalyzer-core on NPM](https://www.npmjs.com/package/wappalyzer-core)
* [Chrome extension](https://chrome.google.com/webstore/detail/wappalyzer/gppongmhjkpfnbhagpmjfkannfbllamg)
* [Firefox add-on](https://addons.mozilla.org/en-US/firefox/addon/wappalyzer/)
* [Edge extension](https://microsoftedge.microsoft.com/addons/detail/mnbndgmknlpdjdnjfmfcdjoegcckoikn)
* [Safari extension](https://apps.apple.com/app/wappalyzer/id1520333300)
* [All apps and integrations](https://www.wappalyzer.com/api/download)
* [Wappalyzer REST APIs](https://www.wappalyzer.com/api/)

## Prerequisites

-   [Git](https://git-scm.com)
-   [Node.js](https://nodejs.org) version 12 or higher
-   [Yarn](https://yarnpkg.com)

## Quick start

```sh
git clone https://github.com/aliasio/wappalyzer
cd wappalyzer
yarn install
yarn run link
```

## Usage

### Command line

```sh
node src/drivers/npm/cli.js https://example.com
```

### Chrome extension

* Go go `about:extensions`
* Enable 'Developer mode'
* Click 'Load unpacked'
* Select `src/drivers/webextension`

### Firefox extension

* Go go `about:debugging#/runtime/this-firefox`
* Click 'Load Temporary Add-on'
* Select `src/drivers/webextension/manifest.json`

## Specification

A long list of [regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) is used to identify technologies on web pages. Wappalyzer inspects HTML code, as well as JavaScript variables, response headers and more.

Patterns (regular expressions) are kept in [`src/technologies.json`](https://github.com/aliasio/wappalyzer/blob/master/src/technologies.json). The following is an example of an application fingerprint.

#### Example

```json
"Example": {
  "description": "A short description of the technology.",
  "cats": [
    "1"
  ],
  "cookies": {
    "cookie_name": "Example"
  },
  "dom": {
    "#example-id": {
      "attributes": {
        "class": "example-class"
      },
      "properties": {
        "example-property": ""
      },
      "text": "Example text content"
    }
  },
  "dns": {
    "MX": [
      "example\\.com"
    ]
  },
  "js": {
    "Example.method": ""
  },
  "excludes": "Example",
  "headers": {
    "X-Powered-By": "Example"
  },
  "html": "<link[^>]example\\.css",
  "css": "\\.example-class",
  "robots": "Disallow: /unique-path/",
  "implies": "PHP\\;confidence:50",
  "meta": {
    "generator": "(?:Example|Another Example)"
  },
  "script": "example-([0-9.]+)\\.js\\;confidence:50\\;version:\\1",
  "url": ".+\\.example\\.com",
  "oss": true,
  "saas": true,
  "pricing": ["low", "medium", "high", "freemium", "onetime", "recurring", "poa"],
  "website": "https://example.com",
}
```

## JSON fields

Find the JSON schema at [`schema.json`](https://github.com/aliasio/wappalyzer/blob/master/schema.json).

### Required properties

<table>
  <thead>
    <tr>
      <th>Field</th>
      <th>Type</th>
      <th>Description</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>cats</code></td>
      <td>Array</td>
      <td>
        One or more category IDs.
      </td>
      <td><code>[1, 6]</code></td>
    </tr>
    <tr>
      <td><code>website</code></td>
      <td>String</td>
      <td>URL of the application's website.</td>
      <td>
        <code>"https://example.com"</code>
      </td>
    </tr>
  </tbody>
</table>

### Optional properties

<table>
  <thead>
    <tr>
      <th>Field</th>
      <th>Type</th>
      <th>Description</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>description</code></td>
      <td>String</td>
      <td>
        A short description of the technology in British English (max.
        250 characters). Write in a neutral, factual tone; not like an
        ad.
      </td>
      <td><code>"A short description."</code></td>
    </tr>
    <tr>
      <td><code>icon</code></td>
      <td>String</td>
      <td>Application icon filename.</td>
      <td><code>"WordPress.svg"</code></td>
    </tr>
    <tr>
      <td><code>cpe</code></td>
      <td>String</td>
      <td>
        The
        <a href="https://cpe.mitre.org/about/" target="_blank">CPE</a>
        is a structured naming scheme for applications, see the
        <a href="https://cpe.mitre.org/specification/" target="_blank"
          >specification</a
        >.
      </td>
      <td><code>"cpe:/a:apache:http_server"</code></td>
    </tr>
    <tr>
      <td><code>saas</code></td>
      <td>Boolean</td>
      <td>
        The technology is offered as a Software-as-a-Service (SaaS), i.e. hosted or cloud-based.
      </td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>oss</code></td>
      <td>Boolean</td>
      <td>
        The technology has an open-source license.
      </td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>pricing</code></td>
      <td>Array</td>
      <td>
Cost indicator (based on a typical plan or average monthly price) and available pricing models. For paid products only.

One of:
<ul>
  <li><code>low</code> Up to US 100 / mo</li>
  <li><code>mid</code> Up US 1,000 / mo</li>
  <li><code>high</code> More than 10,000 / mo</li>
</ul>

Plus any of:
<ul>
  <li><code>freemium</code> Free plan available</li>
  <li><code>onetime</code> One-time payments accepted</li>
  <li><code>recurring</code> Subscriptions available</li>
  <li><code>poa</code> Price on asking</li>
  <li><code>payg</code> Pay as you go (e.g. commissions or usage-based fees)</li>
</ul>
      </td>
      <td><code>["low", "freemium"]</code></td>
    </tr>
  </tbody>
</table>

### Implies and excludes (optional)


<table>
  <thead>
    <tr>
      <th>Field</th>
      <th>Type</th>
      <th>Description</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>implies</code></td>
      <td>String | Array</td>
      <td>
        The presence of one application can imply the presence of
        another, e.g. WordpPress means PHP is also in use.
      </td>
      <td><code>"PHP"</code></td>
    </tr>
    <tr>
      <td><code>excludes</code></td>
      <td>String | Array</td>
      <td>
        Opposite of implies. The presence of one application can exclude
        the presence of another.
      </td>
      <td><code>"Apache"</code></td>
    </tr>
  </tbody>
</table>

### Patterns (optional)

<table>
  <thead>
    <tr>
      <th>Field</th>
      <th>Type</th>
      <th>Description</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>cookies</code></td>
      <td>Object</td>
      <td>Cookies.</td>
      <td><code>{ "cookie_name": "Cookie value" }</code></td>
    </tr>
    <tr>
      <td><code>dom</code></td>
      <td>Object</td>
      <td>
        Uses a
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll"
          target="_blank"
          noopener
          >query selector</a
        >
        to inspect element properties, attributes and text content.
      </td>
      <td>
        <code
          >{ "#example-id": { "property": { "example-prop": "" } }
          }</code
        >
      </td>
    </tr>
    <tr>
      <td><code>dns</code></td>
      <td>Object</td>
      <td>
        DNS records: supports MX, TXT, SOA and NS (NPM driver only).
      </td>
      <td>
        <code>{ "MX": "example\\.com" }</code>
      </td>
    </tr>
    <tr>
      <td><code>js</code></td>
      <td>Object</td>
      <td>
        JavaScript properties (case sensitive). Avoid short property
        names to prevent matching minified code.
      </td>
      <td><code>{ "jQuery.fn.jquery": "" }</code></td>
    </tr>
    <tr>
      <td><code>headers</code></td>
      <td>Object</td>
      <td>HTTP response headers.</td>
      <td><code>{ "X-Powered-By": "^WordPress$" }</code></td>
    </tr>
    <tr>
      <td><code>html</code></td>
      <td>String | Array</td>
      <td>
        HTML source code. Patterns must include an HTML opening tag to
        avoid matching plain text. For performance reasons, avoid
        <code>html</code> where possible and use
        <code>dom</code> instead.
      </td>
      <td><code>"&lt;a [^&gt;]*href=\"index.html"</code></td>
    </tr>
    <tr>
      <td><code>css</code></td>
      <td>String | Array</td>
      <td>
        CSS rules. Unavailable when a website enforces a same-origin
        policy. For performance reasons, only a portion of the available
        CSS rules are used to find matches.
      </td>
      <td><code>"\\.example-class"</code></td>
    </tr>
    <tr>
      <td><code>robots</code></td>
      <td>String | Array</td>
      <td>
        Robots.txt contents.
      </td>
      <td><code>"Disallow: /unique-path/"</code></td>
    </tr>
    <tr>
      <td><code>url</code></td>
      <td>String</td>
      <td>Full URL of the page.</td>
      <td><code>"^https?//.+\\.wordpress\\.com"</code></td>
    </tr>
    <tr>
      <td><code>meta</code></td>
      <td>Object</td>
      <td>HTML meta tags, e.g. generator.</td>
      <td><code>{ "generator": "^WordPress$" }</code></td>
    </tr>
    <tr>
      <td><code>scripts</code></td>
      <td>String | Array</td>
      <td>
        URLs of JavaScript files included on the page.
      </td>
      <td><code>"jquery\\.js"</code></td>
    </tr>
  </tbody>
</table>

## Patterns

Patterns are essentially JavaScript regular expressions written as strings, but with some additions.

### Quirks and pitfalls

-   Because of the string format, the escape character itself must be escaped when using special characters such as the dot (`\\.`). Double quotes must be escaped only once (`\"`). Slashes do not need to be escaped (`/`).
-   Flags are not supported. Regular expressions are treated as case-insensitive.
-   Capture groups (`()`) are used for version detection. In other cases, use non-capturing groups (`(?:)`).
-   Use start and end of string anchors (`^` and `$`) where possible for optimal performance.
-   Short or generic patterns can cause applications to be identified incorrectly. Try to find unique strings to match.

### Tags

Tags (a non-standard syntax) can be appended to patterns (and implies and excludes, separated by `\\;`) to store additional information.


<table>
  <thead>
    <tr>
      <th>Tag</th>
      <th>Description</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>confidence</code></td>
      <td>
        Indicates a less reliable pattern that may cause false
        positives. The aim is to achieve a combined confidence of 100%.
        Defaults to 100% if not specified.
      </td>
      <td>
        <code>"js": { "Mage": "\\;confidence:50" }</code>
      </td>
    </tr>
    <tr>
      <td><code>version</code></td>
      <td>
        Gets the version number from a pattern match using a special
        syntax.
      </td>
      <td>
        <code>"scripts": "jquery-([0-9.]+)\.js\\;version:\\1"</code>
      </td>
    </tr>
  </tbody>
</table>

### Version syntax

Application version information can be obtained from a pattern using a capture group. A condition can be evaluated using the ternary operator (`?:`).


<table>
  <thead>
    <tr>
      <th>Example</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>\\1</code></td>
      <td>Returns the first match.</td>
    </tr>
    <tr>
      <td><code>\\1?a:</code></td>
      <td>
        Returns a if the first match contains a value, nothing
        otherwise.
      </td>
    </tr>
    <tr>
      <td><code>\\1?a:b</code></td>
      <td>
        Returns a if the first match contains a value, b otherwise.
      </td>
    </tr>
    <tr>
      <td><code>\\1?:b</code></td>
      <td>
        Returns nothing if the first match contains a value, b
        otherwise.
      </td>
    </tr>
    <tr>
      <td><code>foo\\1</code></td>
      <td>
        Returns foo with the first match appended.
      </td>
    </tr>
  </tbody>
</table>
