'use strict'

function toArray(value) {
  return Array.isArray(value) ? value : [value]
}

const Wappalyzer = {
  technologies: [],
  categories: [],

  slugify: (string) =>
    string
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/(?:^-|-$)/g, ''),

  getTechnology: (name) =>
    Wappalyzer.technologies.find(({ name: _name }) => name === _name),

  getCategory: (id) => Wappalyzer.categories.find(({ id: _id }) => id === _id),

  /**
   * Resolve promises for implied technology.
   * @param {Array} detections
   */
  resolve(detections = []) {
    const resolved = detections.reduce((resolved, { technology }) => {
      if (
        resolved.findIndex(
          ({ technology: { name } }) => name === technology.name
        ) === -1
      ) {
        let version = ''
        let confidence = 0

        detections
          .filter(({ technology }) => technology)
          .forEach(
            ({ technology: { name }, pattern, version: _version = '' }) => {
              if (name === technology.name) {
                confidence = Math.min(100, confidence + pattern.confidence)
                version =
                  _version.length > version.length && _version.length <= 10
                    ? _version
                    : version
              }
            }
          )

        resolved.push({ technology, confidence, version })
      }

      return resolved
    }, [])

    Wappalyzer.resolveExcludes(resolved)
    Wappalyzer.resolveImplies(resolved)

    const priority = ({ technology: { categories } }) =>
      categories.reduce(
        (max, id) => Math.max(max, Wappalyzer.getCategory(id).priority),
        0
      )

    return resolved
      .sort((a, b) => (priority(a) > priority(b) ? 1 : -1))
      .map(
        ({
          technology: { name, slug, categories, icon, website, cpe },
          confidence,
          version,
        }) => ({
          name,
          slug,
          categories: categories.map((id) => Wappalyzer.getCategory(id)),
          confidence,
          version,
          icon,
          website,
          cpe,
        })
      )
  },

  /**
   * Resolve promises for version of technology.
   * @param {Promise} resolved
   * @param match
   */
  resolveVersion({ version, regex }, match) {
    let resolved = version

    if (version) {
      const matches = regex.exec(match)

      if (matches) {
        matches.forEach((match, index) => {
          // Parse ternary operator
          const ternary = new RegExp(`\\\\${index}\\?([^:]+):(.*)$`).exec(
            version
          )

          if (ternary && ternary.length === 3) {
            resolved = version.replace(
              ternary[0],
              match ? ternary[1] : ternary[2]
            )
          }

          // Replace back references
          resolved = resolved
            .trim()
            .replace(new RegExp(`\\\\${index}`, 'g'), match || '')
        })
      }
    }

    return resolved
  },

  /**
   * Resolve promises for excluded technology.
   * @param {Promise} resolved
   */
  resolveExcludes(resolved) {
    resolved.forEach(({ technology }) => {
      technology.excludes.forEach(({ name }) => {
        const excluded = Wappalyzer.getTechnology(name)

        if (!excluded) {
          throw new Error(`Excluded technology does not exist: ${name}`)
        }

        let index

        do {
          index = resolved.findIndex(
            ({ technology: { name } }) => name === excluded.name
          )

          if (index !== -1) {
            resolved.splice(index, 1)
          }
        } while (index !== -1)
      })
    })
  },

  /**
   * Resolve promises for implied technology.
   * @param {Promise} resolved
   */
  resolveImplies(resolved) {
    let done = false

    while (resolved.length && !done) {
      resolved.forEach(({ technology, confidence }) => {
        done = true

        technology.implies.forEach(({ name, confidence: _confidence }) => {
          const implied = Wappalyzer.getTechnology(name)

          if (!implied) {
            throw new Error(`Implied technology does not exist: ${name}`)
          }

          if (
            resolved.findIndex(
              ({ technology: { name } }) => name === implied.name
            ) === -1
          ) {
            resolved.push({
              technology: implied,
              confidence: Math.min(confidence, _confidence),
              version: '',
            })

            done = false
          }
        })
      })
    }
  },

  /**
   * Initialize analyzation.
   * @param {*} param0
   */
  analyze({
    url,
    xhr,
    html,
    css,
    robots,
    meta,
    headers,
    dns,
    certIssuer,
    cookies,
    scripts,
  }) {
    const oo = Wappalyzer.analyzeOneToOne
    const om = Wappalyzer.analyzeOneToMany
    const mm = Wappalyzer.analyzeManyToMany

    const flatten = (array) => Array.prototype.concat.apply([], array)

    try {
      const detections = flatten(
        Wappalyzer.technologies.map((technology) =>
          flatten([
            oo(technology, 'url', url),
            oo(technology, 'xhr', xhr),
            oo(technology, 'html', html),
            oo(technology, 'css', css),
            oo(technology, 'robots', robots),
            oo(technology, 'certIssuer', certIssuer),
            om(technology, 'scripts', scripts),
            mm(technology, 'cookies', cookies),
            mm(technology, 'meta', meta),
            mm(technology, 'headers', headers),
            mm(technology, 'dns', dns),
          ])
        )
      ).filter((technology) => technology)

      return detections
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  },

  /**
   * Extract technologies from data collected.
   * @param {object} data
   */
  setTechnologies(data) {
    const transform = Wappalyzer.transformPatterns

    Wappalyzer.technologies = Object.keys(data).reduce((technologies, name) => {
      const {
        cats,
        url,
        xhr,
        dom,
        html,
        css,
        robots,
        meta,
        headers,
        dns,
        certIssuer,
        cookies,
        scripts,
        js,
        implies,
        excludes,
        icon,
        website,
        cpe,
      } = data[name]

      technologies.push({
        name,
        categories: cats || [],
        slug: Wappalyzer.slugify(name),
        url: transform(url),
        xhr: transform(xhr),
        headers: transform(headers),
        dns: transform(dns),
        cookies: transform(cookies),
        dom: transform(
          typeof dom === 'string' || Array.isArray(dom)
            ? toArray(dom).reduce(
                (dom, selector) => ({
                  ...dom,
                  [selector]: { exists: '' },
                }),
                {}
              )
            : dom,
          false,
          false
        ),
        html: transform(html),
        css: transform(css),
        certIssuer: transform(certIssuer),
        robots: transform(robots),
        meta: transform(meta),
        scripts: transform(scripts),
        js: transform(js, true),
        implies: transform(implies).map(({ value, confidence }) => ({
          name: value,
          confidence,
        })),
        excludes: transform(excludes).map(({ value }) => ({
          name: value,
        })),
        icon: icon || 'default.svg',
        website: website || null,
        cpe: cpe || null,
      })

      return technologies
    }, [])
  },

  /**
   * Assign categories for data.
   * @param {Object} data
   */
  setCategories(data) {
    Wappalyzer.categories = Object.keys(data)
      .reduce((categories, id) => {
        const category = data[id]

        categories.push({
          id: parseInt(id, 10),
          slug: Wappalyzer.slugify(category.name),
          ...category,
        })

        return categories
      }, [])
      .sort(({ priority: a }, { priority: b }) => (a > b ? -1 : 0))
  },

  /**
   * Transform patterns for internal use.
   * @param {string|array} patterns
   * @param {boolean} caseSensitive
   */
  transformPatterns(patterns, caseSensitive = false, isRegex = true) {
    if (!patterns) {
      return []
    }

    if (typeof patterns === 'string' || Array.isArray(patterns)) {
      patterns = { main: patterns }
    }

    const parsed = Object.keys(patterns).reduce((parsed, key) => {
      parsed[caseSensitive ? key : key.toLowerCase()] = toArray(
        patterns[key]
      ).map((pattern) => Wappalyzer.parsePattern(pattern, isRegex))

      return parsed
    }, {})

    return 'main' in parsed ? parsed.main : parsed
  },

  /**
   * Extract information from regex pattern.
   * @param {string|object} pattern
   */
  parsePattern(pattern, isRegex = true) {
    if (typeof pattern === 'object') {
      return Object.keys(pattern).reduce(
        (parsed, key) => ({
          ...parsed,
          [key]: Wappalyzer.parsePattern(pattern[key]),
        }),
        {}
      )
    } else {
      const { value, regex, confidence, version } = pattern
        .split('\\;')
        .reduce((attrs, attr, i) => {
          if (i) {
            // Key value pairs
            attr = attr.split(':')

            if (attr.length > 1) {
              attrs[attr.shift()] = attr.join(':')
            }
          } else {
            attrs.value = attr

            // Escape slashes in regular expression
            attrs.regex = new RegExp(
              isRegex ? attr.replace(/\//g, '\\/') : '',
              'i'
            )
          }

          return attrs
        }, {})

      return {
        value,
        regex,
        confidence: parseInt(confidence || 100, 10),
        version: version || '',
      }
    }
  },

  /**
   * @todo describe
   * @param {Object} technology
   * @param {String} type
   * @param {String} value
   */
  analyzeOneToOne(technology, type, value) {
    return technology[type].reduce((technologies, pattern) => {
      if (pattern.regex.test(value)) {
        technologies.push({
          technology,
          pattern,
          version: Wappalyzer.resolveVersion(pattern, value),
        })
      }

      return technologies
    }, [])
  },

  /**
   * @todo update
   * @param {Object} technology
   * @param {String} type
   * @param {Array} items
   */
  analyzeOneToMany(technology, type, items = []) {
    return items.reduce((technologies, value) => {
      const patterns = technology[type] || []

      patterns.forEach((pattern) => {
        if (pattern.regex.test(value)) {
          technologies.push({
            technology,
            pattern,
            version: Wappalyzer.resolveVersion(pattern, value),
          })
        }
      })

      return technologies
    }, [])
  },

  /**
   *
   * @param {Object} technology
   * @param {string} types
   * @param {Array} items
   */
  analyzeManyToMany(technology, types, items = {}) {
    const [type, ...subtypes] = types.split('.')

    return Object.keys(technology[type]).reduce((technologies, key) => {
      const patterns = technology[type][key] || []
      const values = items[key] || []

      patterns.forEach((_pattern) => {
        const pattern = (subtypes || []).reduce(
          (pattern, subtype) => pattern[subtype] || {},
          _pattern
        )

        values.forEach((value) => {
          if (pattern.regex.test(value)) {
            technologies.push({
              technology,
              pattern,
              version: Wappalyzer.resolveVersion(pattern, value),
            })
          }
        })
      })

      return technologies
    }, [])
  },
}

if (typeof module !== 'undefined') {
  module.exports = Wappalyzer
}
