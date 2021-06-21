'use strict'
/* eslint-env browser */
/* globals chrome, Utils */

const { agent, open, i18n, getOption, setOption, promisify, sendMessage } =
  Utils

const baseUrl = 'https://www.wappalyzer.com'
const utm = '?utm_source=popup&utm_medium=extension&utm_campaign=wappalyzer'

const footers = [
  {
    heading: 'Generate sales leads',
    body: 'Find new prospects by the technologies they use. Reach out to customers of Shopify, Magento, Salesforce and others.',
    buttonText: 'Create a lead list',
    buttonLink: `${baseUrl}/lists/${utm}`,
  },
  {
    heading: 'Connect Wappalyzer to your CRM',
    body: 'See the technology stacks of your leads without leaving your CRM. Connect to HubSpot, Pipedrive and many others.',
    buttonText: 'See all apps',
    buttonLink: `${baseUrl}/apps/${utm}`,
  },
  {
    heading: 'Enrich your data with tech stacks',
    body: 'Upload a list of websites to get a report of the technologies in use, such as CMS or ecommerce platforms.',
    buttonText: 'Upload a list',
    buttonLink: `${baseUrl}/lookup/${utm}#bulk`,
  },
  {
    heading: 'Automate technology lookups',
    body: 'Our APIs provide instant access to website technology stacks, contact details and social media profiles.',
    buttonText: 'Compare APIs',
    buttonLink: `${baseUrl}/api/${utm}`,
  },
  {
    heading: 'Wappalyzer for businesses',
    body: 'Sign up for a plan to get monthly credits to spend on any product, including lead lists and technology lookups.',
    buttonText: 'Compare plans',
    buttonLink: `${baseUrl}/pricing/${utm}`,
  },
]

function setDisabledDomain(enabled) {
  if (enabled) {
    document
      .querySelector('.header__switch--enabled')
      .classList.add('header__switch--hidden')
    document
      .querySelector('.header__switch--disabled')
      .classList.remove('header__switch--hidden')
  } else {
    document
      .querySelector('.header__switch--enabled')
      .classList.remove('header__switch--hidden')
    document
      .querySelector('.header__switch--disabled')
      .classList.add('header__switch--hidden')
  }
}

const Popup = {
  /**
   * Initialise popup
   */
  async init() {
    // Templates
    Popup.templates = Array.from(
      document.querySelectorAll('[data-template]')
    ).reduce((templates, template) => {
      templates[template.dataset.template] = template.cloneNode(true)

      template.remove()

      return templates
    }, {})

    // Disabled domains
    const dynamicIcon = await getOption('dynamicIcon', false)

    if (dynamicIcon) {
      document.querySelector('body').classList.add('dynamic-icon')
    }

    // Disabled domains
    let disabledDomains = await getOption('disabledDomains', [])

    // Dark mode
    const theme = await getOption('theme', 'light')

    if (theme === 'dark') {
      document.querySelector('body').classList.add('dark')
      document
        .querySelector('.header__theme--light')
        .classList.remove('header__icon--hidden')
      document
        .querySelector('.header__theme--dark')
        .classList.add('header__icon--hidden')
    }

    // Terms
    const termsAccepted =
      agent === 'chrome' || (await getOption('termsAccepted', false))

    if (termsAccepted) {
      document.querySelector('.terms').classList.add('terms--hidden')
      document.querySelector('.empty').classList.remove('empty--hidden')

      Popup.onGetDetections(await Popup.driver('getDetections'))
    } else {
      document.querySelector('.terms').classList.remove('terms--hidden')
      document.querySelector('.detections').classList.add('detections--hidden')
      document.querySelector('.empty').classList.add('empty--hidden')
      document.querySelector('.footer').classList.add('footer--hidden')
      document.querySelector('.tab--pro').classList.add('tab--disabled')

      document
        .querySelector('.terms__button--accept')
        .addEventListener('click', async () => {
          await setOption('termsAccepted', true)
          await setOption('tracking', true)

          document.querySelector('.terms').classList.add('terms--hidden')
          document.querySelector('.empty').classList.remove('empty--hidden')
          document.querySelector('.footer').classList.remove('footer--hidden')
          document.querySelector('.tab--pro').classList.remove('tab--disabled')

          Popup.onGetDetections(await Popup.driver('getDetections'))
        })

      document
        .querySelector('.terms__button--decline')
        .addEventListener('click', async () => {
          await setOption('termsAccepted', true)
          await setOption('tracking', false)

          document.querySelector('.terms').classList.add('terms--hidden')
          document.querySelector('.empty').classList.remove('empty--hidden')
          document.querySelector('.footer').classList.remove('footer--hidden')
          document.querySelector('.tab--pro').classList.remove('tab--disabled')

          Popup.onGetDetections(await Popup.driver('getDetections'))
        })
    }

    let url

    const tabs = await promisify(chrome.tabs, 'query', {
      active: true,
      currentWindow: true,
    })

    if (tabs && tabs.length) {
      ;[{ url }] = tabs

      if (url.startsWith('http')) {
        const { hostname } = new URL(url)

        setDisabledDomain(disabledDomains.includes(hostname))

        document
          .querySelector('.header__switch--disabled')
          .addEventListener('click', async () => {
            disabledDomains = disabledDomains.filter(
              (_hostname) => _hostname !== hostname
            )

            await setOption('disabledDomains', disabledDomains)

            setDisabledDomain(false)

            Popup.onGetDetections(await Popup.driver('getDetections'))
          })

        document
          .querySelector('.header__switch--enabled')
          .addEventListener('click', async () => {
            disabledDomains.push(hostname)

            await setOption('disabledDomains', disabledDomains)

            setDisabledDomain(true)

            Popup.onGetDetections(await Popup.driver('getDetections'))
          })
      } else {
        for (const el of document.querySelectorAll('.header__switch')) {
          el.classList.add('header__switch--hidden')
        }

        document.querySelector('.tab--pro').classList.add('tab--disabled')
      }
    }

    // PRO configuration
    const apiKey = document.querySelector('.pro-configure__apikey')

    apiKey.value = await getOption('apiKey', '')

    document
      .querySelector('.pro-configure__save')
      .addEventListener('click', async (event) => {
        await setOption(
          'apiKey',
          document.querySelector('.pro-configure__apikey').value
        )

        await Popup.getPro(url)
      })

    // Header
    document
      .querySelector('.header__settings')
      .addEventListener('click', () => chrome.runtime.openOptionsPage())

    // Theme
    const body = document.querySelector('body')
    const dark = document.querySelector('.header__theme--dark')
    const light = document.querySelector('.header__theme--light')

    document.querySelectorAll('.header__theme').forEach((el) =>
      el.addEventListener('click', async () => {
        const theme = await getOption('theme', 'light')

        body.classList[theme === 'dark' ? 'remove' : 'add']('dark')
        body.classList[theme === 'dark' ? 'add' : 'remove']('light')
        dark.classList[theme === 'dark' ? 'remove' : 'add'](
          'header__icon--hidden'
        )
        light.classList[theme === 'dark' ? 'add' : 'remove'](
          'header__icon--hidden'
        )

        await setOption('theme', theme === 'dark' ? 'light' : 'dark')
      })
    )

    // Tabs
    const tabHeadings = Array.from(document.querySelectorAll('.tab'))
    const tabItems = Array.from(document.querySelectorAll('.tab-item'))
    const credits = document.querySelector('.credits')

    tabHeadings.forEach((tab, index) => {
      tab.addEventListener('click', async () => {
        tabHeadings.forEach((tab) => tab.classList.remove('tab--active'))
        tabItems.forEach((item) => item.classList.add('tab-item--hidden'))

        tab.classList.add('tab--active')
        tabItems[index].classList.remove('tab-item--hidden')

        credits.classList.add('credits--hidden')

        if (tab.classList.contains('tab--pro')) {
          await Popup.getPro(url)
        }
      })
    })

    // Footer
    const item =
      footers[
        Math.round(Math.random())
          ? 0
          : Math.round(Math.random() * (footers.length - 1))
      ]

    document.querySelector('.footer__heading-text').textContent = item.heading
    document.querySelector('.footer__content-body').textContent = item.body
    document.querySelector('.footer .button__text').textContent =
      item.buttonText
    document.querySelector('.footer .button__link').href = item.buttonLink

    const collapseFooter = await getOption('collapseFooter', false)

    const footer = document.querySelector('.footer')
    const footerClose = document.querySelector('.footer__toggle--close')
    const footerOpen = document.querySelector('.footer__toggle--open')

    if (collapseFooter) {
      footer.classList.add('footer--collapsed')
      footerClose.classList.add('footer__toggle--hidden')
      footerOpen.classList.remove('footer__toggle--hidden')
    }

    document
      .querySelector('.footer__heading')
      .addEventListener('click', async () => {
        const collapsed = footer.classList.contains('footer--collapsed')

        footer.classList[collapsed ? 'remove' : 'add']('footer--collapsed')
        footerClose.classList[collapsed ? 'remove' : 'add'](
          'footer__toggle--hidden'
        )
        footerOpen.classList[collapsed ? 'add' : 'remove'](
          'footer__toggle--hidden'
        )

        await setOption('collapseFooter', !collapsed)
      })

    Array.from(document.querySelectorAll('a')).forEach((a) =>
      a.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopImmediatePropagation()

        open(a.href)

        return false
      })
    )

    // Apply internationalization
    i18n()
  },

  driver(func, args) {
    return sendMessage('popup.js', func, args)
  },

  /**
   * Log debug messages to the console
   * @param {String} message
   */
  log(message) {
    Popup.driver('log', message)
  },

  /**
   * Group technologies into categories
   * @param {Object} technologies
   */
  categorise(technologies) {
    return Object.values(
      technologies
        .filter(({ confidence }) => confidence >= 50)
        .reduce((categories, technology) => {
          technology.categories.forEach((category) => {
            categories[category.id] = categories[category.id] || {
              ...category,
              technologies: [],
            }

            categories[category.id].technologies.push(technology)
          })

          return categories
        }, {})
    )
  },

  /**
   * Callback for getDetection listener
   * @param {Array} detections
   */
  async onGetDetections(detections = []) {
    detections = (detections || [])
      .filter(({ confidence }) => confidence >= 50)
      .filter(({ slug }) => slug !== 'cart-functionality')

    if (!detections || !detections.length) {
      document.querySelector('.empty').classList.remove('empty--hidden')
      document.querySelector('.detections').classList.add('detections--hidden')

      return
    }

    document.querySelector('.empty').classList.add('empty--hidden')

    const el = document.querySelector('.detections')

    el.classList.remove('detections--hidden')

    while (el.firstChild) {
      el.removeChild(detections.lastChild)
    }

    const pinnedCategory = await getOption('pinnedCategory')

    const categorised = Popup.categorise(detections)

    categorised.forEach(({ id, name, slug: categorySlug, technologies }) => {
      const categoryNode = Popup.templates.category.cloneNode(true)

      const link = categoryNode.querySelector('.category__link')

      link.href = `https://www.wappalyzer.com/technologies/${categorySlug}/?utm_source=popup&utm_medium=extension&utm_campaign=wappalyzer`
      link.dataset.i18n = `categoryName${id}`

      const pins = categoryNode.querySelectorAll('.category__pin')

      if (pinnedCategory === id) {
        pins.forEach((pin) => pin.classList.add('category__pin--active'))
      }

      pins.forEach((pin) =>
        pin.addEventListener('click', async () => {
          const pinnedCategory = await getOption('pinnedCategory')

          Array.from(
            document.querySelectorAll('.category__pin--active')
          ).forEach((pin) => pin.classList.remove('category__pin--active'))

          if (pinnedCategory === id) {
            await setOption('pinnedCategory', null)
          } else {
            await setOption('pinnedCategory', id)

            pins.forEach((pin) => pin.classList.add('category__pin--active'))
          }
        })
      )

      technologies.forEach(
        ({ name, slug, confidence, version, icon, website }) => {
          const technologyNode = Popup.templates.technology.cloneNode(true)

          const image = technologyNode.querySelector('.technology__icon img')

          image.src = `../images/icons/${icon}`

          const link = technologyNode.querySelector('.technology__link')
          const linkText = technologyNode.querySelector('.technology__name')

          link.href = `https://www.wappalyzer.com/technologies/${categorySlug}/${slug}/?utm_source=popup&utm_medium=extension&utm_campaign=wappalyzer`
          linkText.textContent = name

          const confidenceNode = technologyNode.querySelector(
            '.technology__confidence'
          )

          if (confidence < 100) {
            confidenceNode.textContent = `${confidence}% sure`
          } else {
            confidenceNode.remove()
          }

          const versionNode = technologyNode.querySelector(
            '.technology__version'
          )

          if (version) {
            versionNode.textContent = version
          } else {
            versionNode.remove()
          }

          categoryNode
            .querySelector('.technologies')
            .appendChild(technologyNode)
        }
      )

      document.querySelector('.detections').appendChild(categoryNode)
    })

    if (categorised.length === 1) {
      document
        .querySelector('.detections')
        .appendChild(Popup.templates.category.cloneNode(true))
    }

    Array.from(document.querySelectorAll('a')).forEach((a) =>
      a.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopImmediatePropagation()

        open(a.href)

        return false
      })
    )

    i18n()
  },

  /**
   * Show company and contact details
   * @param {String} url
   */
  async getPro(url) {
    const apiKey = await getOption('apiKey', '')

    const el = {
      loading: document.querySelector('.loading'),
      panels: document.querySelector('.panels'),
      empty: document.querySelector('.pro-empty'),
      crawl: document.querySelector('.pro-crawl'),
      error: document.querySelector('.pro-error'),
      errorMessage: document.querySelector('.pro-error__message'),
      configure: document.querySelector('.pro-configure'),
      credits: document.querySelector('.credits'),
      creditsRemaining: document.querySelector('.credits__remaining'),
    }

    el.error.classList.add('pro-error--hidden')

    if (apiKey) {
      el.loading.classList.remove('loading--hidden')
      el.configure.classList.add('pro-configure--hidden')
    } else {
      el.loading.classList.add('loading--hidden')
      el.configure.classList.remove('pro-configure--hidden')

      return
    }

    el.panels.classList.add('panels--hidden')
    el.empty.classList.add('pro-empty--hidden')
    el.crawl.classList.add('pro-crawl--hidden')
    el.error.classList.add('pro-error--hidden')

    while (el.panels.lastElementChild) {
      el.panels.removeChild(el.panels.lastElementChild)
    }

    try {
      const response = await fetch(
        `https://api.wappalyzer.com/pro/v2/${encodeURIComponent(url)}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const error = new Error()

        error.data = data
        error.response = response

        throw error
      }

      const { attributes, creditsRemaining, crawl } = data

      el.creditsRemaining.textContent = parseInt(
        creditsRemaining || 0,
        10
      ).toLocaleString()

      el.credits.classList.remove('credits--hidden')

      el.loading.classList.add('loading--hidden')

      if (crawl) {
        document
          .querySelector('.pro-crawl')
          .classList.remove('pro-crawl--hidden')

        return
      }

      if (!Object.keys(attributes).length) {
        el.empty.classList.remove('pro-empty--hidden')

        return
      }

      Object.keys(attributes).forEach((set) => {
        const panel = document.createElement('div')
        const header = document.createElement('div')
        const content = document.createElement('div')
        const table = document.createElement('table')

        panel.classList.add('panel')
        header.classList.add('panel__header')
        content.classList.add('panel__content')

        header.setAttribute(
          'data-i18n',
          `set${set.charAt(0).toUpperCase() + set.slice(1)}`
        )

        Object.keys(attributes[set]).forEach((key) => {
          const value = attributes[set][key]

          const tr = document.createElement('tr')

          const th = document.createElement('th')
          const td = document.createElement('td')

          th.setAttribute(
            'data-i18n',
            `attribute${
              key.charAt(0).toUpperCase() + key.slice(1).replace('.', '_')
            }`
          )

          if (Array.isArray(value)) {
            value.forEach((value) => {
              const div = document.createElement('div')

              if (typeof value === 'object') {
                const a = document.createElement('a')

                a.href = value.to
                a.textContent = value.text

                if (
                  ['social', 'keywords'].includes(set) ||
                  ['phone', 'email'].includes(key)
                ) {
                  a.classList.add('chip')

                  td.appendChild(a)
                } else {
                  div.appendChild(a)
                  td.appendChild(div)
                }
              } else if (key === 'employees') {
                const [name, title] = value.split(' -- ')

                const strong = document.createElement('strong')
                const span = document.createElement('span')

                strong.textContent = name
                span.textContent = title

                div.appendChild(strong)
                div.appendChild(span)
                td.appendChild(div)
              } else {
                div.textContent = value
                td.appendChild(div)
              }
            })
          } else if (key === 'companyName') {
            const strong = document.createElement('strong')

            strong.textContent = value

            td.appendChild(strong)
          } else {
            td.textContent = value
          }

          if (key !== 'keywords') {
            tr.appendChild(th)
          }

          tr.appendChild(td)
          table.appendChild(tr)
        })

        content.appendChild(table)

        panel.appendChild(header)
        panel.appendChild(content)
        el.panels.appendChild(panel)
      })

      el.panels.classList.remove('panels--hidden')
    } catch (error) {
      Popup.log(error.data)

      // eslint-disable-next-line
      console.log(error)

      el.errorMessage.textContent = `Sorry, something went wrong${
        error.response ? ` (${error.response.status})` : ''
      }. Please try again later.`

      if (error.response) {
        if (error.response.status === 403) {
          el.errorMessage.textContent =
            typeof error.data === 'string'
              ? error.data
              : 'No access. Please check your API key.'

          el.configure.classList.remove('pro-configure--hidden')
        } else if (error.response.status === 429) {
          el.errorMessage.textContent =
            'Too many requests. Please try again in a few seconds.'
        } else if (
          error.response.status === 400 &&
          typeof error.data === 'string'
        ) {
          el.errorMessage.textContent = error.data
        }
      }

      el.loading.classList.add('loading--hidden')
      el.error.classList.remove('pro-error--hidden')
    }

    Array.from(document.querySelectorAll('.panels a')).forEach((a) =>
      a.addEventListener('click', (event) => {
        event.preventDefault()

        open(a.href)

        return false
      })
    )

    i18n()
  },
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  Popup.init()
} else {
  document.addEventListener('DOMContentLoaded', Popup.init)
}
