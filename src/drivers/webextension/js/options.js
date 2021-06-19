'use strict'
/* eslint-env browser */
/* globals Utils, chrome */

const { agent, i18n, getOption, setOption } = Utils

const Options = {
  /**
   * Initialise options
   */
  async init() {
    const termsAccepted =
      agent === 'chrome' || (await getOption('termsAccepted', false))

    ;[
      ['upgradeMessage', true],
      ['dynamicIcon', false],
      ['badge', true],
      ['tracking', true],
      ['showCached', true],
      ['apiKey', ''],
    ].map(async ([option, defaultValue]) => {
      const el = document
        .querySelector(
          `[data-i18n="option${
            option.charAt(0).toUpperCase() + option.slice(1)
          }"]`
        )
        .parentNode.querySelector('input')

      if (el.type === 'checkbox') {
        el.checked =
          !!(await getOption(option, defaultValue)) &&
          (option !== 'tracking' || termsAccepted)

        el.addEventListener('click', async () => {
          await setOption(option, !!el.checked)
        })
      } else if (el.type === 'password') {
        el.value = await getOption(option, defaultValue)
      }
    })

    document
      .querySelector('[data-i18n="optionApiKey"]')
      .parentNode.querySelector('input')
      .addEventListener(
        'input',
        async (event) => await setOption('apiKey', event.target.value)
      )

    document
      .querySelector('.options__cache')
      .addEventListener('click', () => Options.driver('clearCache'))

    i18n()
  },

  driver(func, args, callback) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          source: 'content.js',
          func,
          args: args ? (Array.isArray(args) ? args : [args]) : [],
        },
        (response) => {
          chrome.runtime.lastError
            ? reject(new Error(chrome.runtime.lastError.message))
            : resolve(response)
        }
      )
    })
  },
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  Options.init()
} else {
  document.addEventListener('DOMContentLoaded', Options.init)
}
